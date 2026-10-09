# Founder Preview — Physical-Phone Access (temporary)

**Purpose.** Let a real phone use the *existing* local Founder Preview over HTTPS (touch, safe area,
keyboard, camera, two-device QR). Temporary, reversible, Access-gated. Product behaviour is unchanged.

## Architecture

```
phone ──HTTPS──▶ Cloudflare (Access) ──named tunnel──▶ 127.0.0.1:28111  phone proxy (loopback only)
                                                         ├─ /                 production web bundle (.preview/phone-dist)
                                                         ├─ /identitytoolkit… , /securetoken…   allow-listed Auth client routes → 127.0.0.1:28101
                                                         └─ /__fn/<callable>  allow-listed callables → 127.0.0.1:28102/demo-11thonus/europe-west1/<callable>
```

- One HTTPS origin. The web app is built with `VITE_FIREBASE_PREVIEW_ORIGIN=https://<host>`:
  Auth uses `connectAuthEmulator(origin)`; Functions use the Firebase SDK's own custom-domain overload
  (`getFunctions(app, origin + "/__fn")`) — the SDK still attaches tokens and decodes envelopes. Unset ⇒ unchanged.
- Everything else is denied: Emulator UI/Hub, Firestore, Storage, PostgreSQL, Auth `/emulator/*`, Auth admin
  (`/v1/projects/*`, `Bearer owner`), non-allow-listed callables, other localhost ports (Host pinning → 421).
  Allow-lists live in `tests/preview/phone/config.mjs`; the decision logic is `policy.mjs` (unit-tested).
- The tunnel's only origin is the proxy. The tunnel/Access layer is separate from Firebase Authentication.

## One-time Cloudflare setup (Founder)

```bash
cloudflared tunnel login                     # authorises a zone; writes ~/.cloudflared/cert.pem
```

Then, with `<host>` = a temporary hostname in that zone (e.g. `phone-preview.<zone>`) and `<tunnel>` a tunnel name:

```bash
cloudflared tunnel create <tunnel>
cloudflared tunnel route dns <tunnel> <host>
```

Create a Cloudflare Access *self-hosted application* for `<host>` (Zero Trust → Access → Applications) with one
**Allow** policy limited to the reviewer e-mail address(es) (One-time PIN or Google). Record the application name,
hostname, policy name and allowed identities below. Never commit identities or tokens.

## Run

```bash
pnpm preview:start                           # canonical Docker/PostgreSQL + emulators (+ dev web on :28109)
pnpm preview:reset && pnpm preview:verify && pnpm preview:counter-checks && pnpm preview:status
pnpm preview:phone build --host <host>       # hermetic production bundle (isolated env dir) bound to <host>
pnpm preview:phone start --host <host>       # loopback proxy; refuses unless the canonical owned preview is up and the bundle matches <host>
pnpm preview:phone verify                    # allow-list + negative exposure checks (local)
pnpm preview:phone tunnel --name <tunnel>    # named tunnel → proxy only; success is reported only once the edge connection is registered
CF_ACCESS_CLIENT_ID=… CF_ACCESS_CLIENT_SECRET=… \
  pnpm preview:phone verify --base https://<host> --host <host>   # same checks over the public hostname
```

The public check needs a Cloudflare Access **service token** (Zero Trust → Access → Service Auth), added to the
Access policy as a *Service Auth* rule. Pass it only through the two environment variables above; never commit it.
Without them the verifier refuses to run against a non-loopback origin (`--no-access` overrides for an origin that
is intentionally not behind Access).

**Verifier safety.** The verifier first sends one GET to `/__phone-preview/identity` and aborts unless the target
proves it is the phone proxy (marker headers + bundle bound to `--host`). Only then does it send the negative probes
(which include DELETE/PUT), and it accepts a denial only when the *proxy* produced it
(`x-phone-preview-decision: deny`), never an arbitrary 4xx from an emulator.

**Hermetic build.** The phone bundle is built with Vite pointed at a generated env dir containing only the pinned
preview variables; `apps/web/.env*` files and inherited `VITE_*` variables (App Check keys, observability, real
Firebase config, Google/Phone flags) are never read.

## Diagnostics (local only)

```bash
pnpm preview:phone status
tail -f .preview/logs/phone-proxy-access.log   # every request: allow/deny + reason (denied calls are logged)
tail -f .preview/logs/phone-tunnel.log         # cloudflared
tail -f .preview/logs/emulators.log            # Functions/Auth emulator
tail -f .preview/logs/web.log
```

## Shutdown / reversal

```bash
pnpm preview:phone stop                      # stops tunnel + proxy (emulators/PostgreSQL untouched)
pnpm preview:stop                            # optional: stop the preview
cloudflared tunnel cleanup <tunnel> && cloudflared tunnel delete <tunnel>
# Zero Trust → Access → Applications: delete the application; DNS: delete the CNAME for <host>
rm -rf .preview/phone-dist
```

Delete only the resources recorded below.

## Resources created (fill in when created)

| Resource | Name / id |
| --- | --- |
| Tunnel | |
| DNS CNAME | |
| Access application / policy | |
