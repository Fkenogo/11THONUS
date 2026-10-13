/**
 * Camera QR capture for the Staff Counter (`EA-BL-001-CORR-002-B`, D2).
 *
 * Privacy/security posture (binding):
 *  - camera frames never leave the browser: frames are decoded in-page (native `BarcodeDetector`,
 *    or `jsqr` on a canvas) and are never uploaded, stored or logged;
 *  - the camera is used only while the scanner is open: `stop()` stops every track and detaches the
 *    stream, and the scanner stops itself after the first valid code;
 *  - the decoded text is UNTRUSTED input. Only a value shaped like an 11thONUS opaque QR reference is
 *    accepted here (anything else — a URL, a Wi-Fi code — is ignored), and even an accepted value is
 *    then validated by the server's own artifact resolution at record time.
 *
 * Capability: native `BarcodeDetector` where the browser has it (Chromium); otherwise `jsqr`, loaded
 * lazily so supporting browsers never download it (Safari/iOS has no `BarcodeDetector`). With no
 * `getUserMedia`/secure context at all the scanner reports unsupported and the Counter falls back to
 * Loyalty Number entry.
 */

export type QrScanFailure = "permission_denied" | "no_camera" | "failed";

export type QrScanHandlers = {
  /** The camera is streaming and frames are being decoded. */
  onReady: () => void;
  /** A valid customer QR reference was decoded; the scanner has already stopped. */
  onResult: (qrReference: string) => void;
  /** A QR code was seen but is not an 11thONUS customer code (scanning continues). */
  onForeignCode?: () => void;
  onFailure: (failure: QrScanFailure) => void;
};

export type QrScanSession = { stop: () => void };

export type QrScanner = {
  isSupported: () => boolean;
  /** Opens the camera on `video` and begins decoding. `stop()` is safe at any moment, including while opening. */
  start: (video: HTMLVideoElement, handlers: QrScanHandlers) => QrScanSession;
};

/** Mirrors the server's opaque QR reference grammar (`createQrReference`): letters, digits, `_`, `-`. */
const QR_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

export function parseQrReference(raw: string): string | null {
  const trimmed = raw.trim();
  return QR_REFERENCE_PATTERN.test(trimmed) ? trimmed : null;
}

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorCtor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};
type JsQr = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: "dontInvert" },
) => { data: string } | null;

export type QrScannerEnvironment = {
  readonly mediaDevices: Pick<MediaDevices, "getUserMedia"> | undefined;
  readonly isSecureContext: boolean;
  readonly barcodeDetector: BarcodeDetectorCtor | undefined;
  readonly loadJsQr: () => Promise<JsQr>;
  readonly createCanvas: () => {
    getContext: HTMLCanvasElement["getContext"];
    width: number;
    height: number;
  };
  readonly setTimeout: (callback: () => void, ms: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
};

export function browserScannerEnvironment(): QrScannerEnvironment {
  return {
    mediaDevices: typeof navigator === "undefined" ? undefined : navigator.mediaDevices,
    isSecureContext: typeof window === "undefined" ? false : window.isSecureContext !== false,
    barcodeDetector:
      typeof globalThis === "undefined"
        ? undefined
        : (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector,
    loadJsQr: async () => (await import("jsqr")).default as JsQr,
    createCanvas: () => document.createElement("canvas"),
    setTimeout: (callback, ms) => window.setTimeout(callback, ms),
    clearTimeout: (handle) => window.clearTimeout(handle as number),
  };
}

const SCAN_INTERVAL_MS = 150;
const MAX_FRAME_EDGE = 480;

function failureFor(error: unknown): QrScanFailure {
  const name = (error as { name?: unknown } | null | undefined)?.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "permission_denied";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "no_camera";
  }
  return "failed";
}

export function createCameraQrScanner(
  env: QrScannerEnvironment = browserScannerEnvironment(),
): QrScanner {
  return {
    isSupported: () => Boolean(env.mediaDevices?.getUserMedia) && env.isSecureContext,

    start: (video, handlers) => {
      let stopped = false;
      let timer: unknown = null;
      let stream: MediaStream | null = null;

      const release = () => {
        if (timer !== null) {
          env.clearTimeout(timer);
          timer = null;
        }
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        video.srcObject = null;
      };
      const stop = () => {
        stopped = true;
        release();
      };
      const fail = (failure: QrScanFailure) => {
        if (stopped) return;
        stop();
        handlers.onFailure(failure);
      };

      void (async () => {
        if (!env.mediaDevices?.getUserMedia || !env.isSecureContext) {
          fail("no_camera");
          return;
        }
        let acquired: MediaStream;
        try {
          acquired = await env.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          });
        } catch (error) {
          fail(failureFor(error));
          return;
        }
        if (stopped) {
          // Cancelled while the permission prompt / camera was opening: never keep the stream.
          acquired.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = acquired;
        try {
          video.srcObject = acquired;
          video.muted = true;
          video.setAttribute("playsinline", "true");
          await video.play();
        } catch {
          fail("failed");
          return;
        }
        if (stopped) return;

        let detector: BarcodeDetectorLike | null = null;
        if (env.barcodeDetector) {
          try {
            const formats = (await env.barcodeDetector.getSupportedFormats?.()) ?? ["qr_code"];
            if (formats.includes("qr_code")) {
              detector = new env.barcodeDetector({ formats: ["qr_code"] });
            }
          } catch {
            detector = null;
          }
        }
        let jsQr: JsQr | null = null;
        if (!detector) {
          try {
            jsQr = await env.loadJsQr();
          } catch {
            fail("failed");
            return;
          }
        }
        if (stopped) return;
        handlers.onReady();

        const decode = async (): Promise<string | null> => {
          if (detector) {
            const codes = await detector.detect(video);
            return codes[0]?.rawValue ?? null;
          }
          const sourceWidth = video.videoWidth;
          const sourceHeight = video.videoHeight;
          if (!sourceWidth || !sourceHeight) return null;
          const scale = Math.min(1, MAX_FRAME_EDGE / Math.max(sourceWidth, sourceHeight));
          const canvas = env.createCanvas();
          canvas.width = Math.max(1, Math.round(sourceWidth * scale));
          canvas.height = Math.max(1, Math.round(sourceHeight * scale));
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) return null;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height);
          return (
            jsQr?.(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" })
              ?.data ?? null
          );
        };

        const tick = async () => {
          if (stopped) return;
          try {
            const raw = await decode();
            if (stopped) return;
            if (raw !== null) {
              const reference = parseQrReference(raw);
              if (reference !== null) {
                stop();
                handlers.onResult(reference);
                return;
              }
              handlers.onForeignCode?.();
            }
          } catch {
            // A single undecodable frame is normal; keep scanning.
          }
          if (!stopped) timer = env.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
        };
        timer = env.setTimeout(() => void tick(), 0);
      })();

      return { stop };
    },
  };
}
