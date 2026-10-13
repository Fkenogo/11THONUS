import { describe, expect, it, vi } from "vitest";
import {
  createCameraQrScanner,
  parseQrReference,
  type QrScanHandlers,
  type QrScannerEnvironment,
} from "./qrScanner";

function fakeTrack() {
  return { stop: vi.fn() };
}

function fakeStream() {
  const track = fakeTrack();
  return { stream: { getTracks: () => [track] } as unknown as MediaStream, track };
}

function fakeVideo() {
  const video = {
    srcObject: null as unknown,
    muted: false,
    videoWidth: 640,
    videoHeight: 480,
    setAttribute: vi.fn(),
    play: vi.fn(async () => undefined),
  };
  return video as unknown as HTMLVideoElement & typeof video;
}

function handlers() {
  const h = {
    onReady: vi.fn(),
    onResult: vi.fn(),
    onForeignCode: vi.fn(),
    onFailure: vi.fn(),
  };
  return h satisfies QrScanHandlers;
}

/** A manual scheduler: ticks run only when the test advances them, so no real timers are involved. */
function manualClock() {
  let pending: (() => void) | null = null;
  return {
    setTimeout: (callback: () => void) => {
      pending = callback;
      return 1;
    },
    clearTimeout: () => {
      pending = null;
    },
    async tick() {
      const run = pending;
      pending = null;
      run?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    hasPending: () => pending !== null,
  };
}

async function flush() {
  for (let i = 0; i < 6; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}

function env(
  overrides: Partial<QrScannerEnvironment> & { clock?: ReturnType<typeof manualClock> } = {},
) {
  const clock = overrides.clock ?? manualClock();
  const base: QrScannerEnvironment = {
    mediaDevices: { getUserMedia: vi.fn() },
    isSecureContext: true,
    barcodeDetector: undefined,
    loadJsQr: async () => () => null,
    createCanvas: () => ({
      width: 0,
      height: 0,
      getContext: (() => ({
        drawImage: vi.fn(),
        getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      })) as never,
    }),
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    ...overrides,
  };
  return { environment: base, clock };
}

describe("parseQrReference (untrusted scan output)", () => {
  it("accepts an opaque token and trims it", () => {
    expect(parseQrReference("  qr_Ab-9  ")).toBe("qr_Ab-9");
  });
  it.each(["", "   ", "https://evil.example/x", "WIFI:S:x;;", "has space", "a/b", "x".repeat(257)])(
    "rejects %j",
    (value) => {
      expect(parseQrReference(value)).toBeNull();
    },
  );
});

describe("createCameraQrScanner — capability detection", () => {
  it("is unsupported without getUserMedia", () => {
    const { environment } = env({ mediaDevices: undefined });
    expect(createCameraQrScanner(environment).isSupported()).toBe(false);
  });
  it("is unsupported outside a secure context", () => {
    const { environment } = env({ isSecureContext: false });
    expect(createCameraQrScanner(environment).isSupported()).toBe(false);
  });
  it("is supported with getUserMedia in a secure context", () => {
    const { environment } = env();
    expect(createCameraQrScanner(environment).isSupported()).toBe(true);
  });
});

describe("createCameraQrScanner — permission and device failures", () => {
  it.each([
    ["NotAllowedError", "permission_denied"],
    ["SecurityError", "permission_denied"],
    ["NotFoundError", "no_camera"],
    ["OverconstrainedError", "no_camera"],
    ["AbortError", "failed"],
  ] as const)("%s → %s, with no stream left open", async (name, expected) => {
    const getUserMedia = vi.fn(async () => {
      throw Object.assign(new Error("x"), { name });
    });
    const { environment } = env({ mediaDevices: { getUserMedia } });
    const h = handlers();
    createCameraQrScanner(environment).start(fakeVideo(), h);
    await flush();
    expect(h.onFailure).toHaveBeenCalledWith(expected);
    expect(h.onReady).not.toHaveBeenCalled();
  });
});

describe("createCameraQrScanner — native BarcodeDetector path", () => {
  it("decodes a valid reference, reports it once and stops every camera track", async () => {
    const { stream, track } = fakeStream();
    const detect = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ rawValue: "https://not-ours.example" }])
      .mockResolvedValue([{ rawValue: "qrRef_123" }]);
    class FakeDetector {
      static getSupportedFormats = async () => ["qr_code", "code_128"];
      detect = detect;
    }
    const clock = manualClock();
    const { environment } = env({
      clock,
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
      barcodeDetector: FakeDetector as never,
    });
    const video = fakeVideo();
    const h = handlers();
    createCameraQrScanner(environment).start(video, h);
    await flush();
    expect(h.onReady).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBe(stream);
    expect(track.stop).not.toHaveBeenCalled();

    await clock.tick(); // nothing found
    await clock.tick(); // foreign code ignored, keeps scanning
    expect(h.onForeignCode).toHaveBeenCalledTimes(1);
    expect(h.onResult).not.toHaveBeenCalled();
    expect(clock.hasPending()).toBe(true);

    await clock.tick(); // valid code
    expect(h.onResult).toHaveBeenCalledTimes(1);
    expect(h.onResult).toHaveBeenCalledWith("qrRef_123");
    expect(track.stop).toHaveBeenCalledTimes(1); // camera closed after success
    expect(video.srcObject).toBeNull();
    expect(clock.hasPending()).toBe(false); // loop ended
  });
});

describe("createCameraQrScanner — jsqr fallback path (no BarcodeDetector)", () => {
  it("lazy-loads the decoder and decodes frames from a canvas", async () => {
    const { stream, track } = fakeStream();
    const loadJsQr = vi.fn(async () => (() => ({ data: "qrFromJsQr" })) as never);
    const clock = manualClock();
    const { environment } = env({
      clock,
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
      loadJsQr,
    });
    const h = handlers();
    createCameraQrScanner(environment).start(fakeVideo(), h);
    await flush();
    expect(loadJsQr).toHaveBeenCalledTimes(1);
    await clock.tick();
    expect(h.onResult).toHaveBeenCalledWith("qrFromJsQr");
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("reports a failure (and holds no stream) when the fallback decoder cannot load", async () => {
    const { stream, track } = fakeStream();
    const { environment } = env({
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
      loadJsQr: async () => {
        throw new Error("chunk failed");
      },
    });
    const h = handlers();
    createCameraQrScanner(environment).start(fakeVideo(), h);
    await flush();
    expect(h.onFailure).toHaveBeenCalledWith("failed");
    expect(track.stop).toHaveBeenCalled();
  });
});

describe("createCameraQrScanner — cancel", () => {
  it("stop() while scanning closes the camera and ends the loop", async () => {
    const { stream, track } = fakeStream();
    const clock = manualClock();
    const { environment } = env({
      clock,
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
    });
    const h = handlers();
    const session = createCameraQrScanner(environment).start(fakeVideo(), h);
    await flush();
    session.stop();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(clock.hasPending()).toBe(false);
    await clock.tick();
    expect(h.onResult).not.toHaveBeenCalled();
  });

  it("stop() while the camera is still opening never leaves a live stream", async () => {
    const { stream, track } = fakeStream();
    let resolveMedia: (s: MediaStream) => void = () => undefined;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveMedia = resolve;
        }),
    );
    const { environment } = env({ mediaDevices: { getUserMedia } });
    const h = handlers();
    const session = createCameraQrScanner(environment).start(fakeVideo(), h);
    session.stop(); // user cancelled before the permission prompt resolved
    resolveMedia(stream);
    await flush();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(h.onReady).not.toHaveBeenCalled();
    expect(h.onFailure).not.toHaveBeenCalled();
  });

  it("a stop() after a permission failure is harmless", async () => {
    const getUserMedia = vi.fn(async () => {
      throw Object.assign(new Error("x"), { name: "NotAllowedError" });
    });
    const { environment } = env({ mediaDevices: { getUserMedia } });
    const h = handlers();
    const session = createCameraQrScanner(environment).start(fakeVideo(), h);
    await flush();
    expect(() => session.stop()).not.toThrow();
  });
});
