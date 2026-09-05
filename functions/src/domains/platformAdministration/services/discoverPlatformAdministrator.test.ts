import { describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import {
  createPlatformAdministrator,
  type PlatformAdministrator,
} from "../models/platformAdministrator";
import type { PlatformAdministratorStatus } from "../models/platformAdministratorStatus";
import { platformAdministratorConfigMalformedError } from "../models/platformAdministrationErrors";
import {
  discoverPlatformAdministrator,
  type DiscoverPlatformAdministratorDeps,
} from "./discoverPlatformAdministrator";

const now = new Date("2026-09-04T00:00:00.000Z");

/**
 * Fixture: the record `createPlatformAdministrator` produces, with `status`
 * overridden so the test can exercise every lifecycle state the discovery
 * decision must distinguish. There is no `invited`-status constructor by
 * design (`platformAdministrator.ts` header) — the status override is the
 * only way to represent an invited-but-not-yet-activated record here, which
 * is exactly the state the governed lifecycle reserves for a future,
 * separately-authorized invitation command.
 */
function makeAdministrator(status: PlatformAdministratorStatus): PlatformAdministrator {
  return {
    ...createPlatformAdministrator({
      userId: "user_foundation_editor",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      approvedBy: "operator:founder",
      now,
    }),
    status,
  };
}

/**
 * A reader stub that returns the fixture and records the arguments it was
 * called with — proves the service passes through the trusts only the
 * `(db, userId)` pair its caller supplied (never anything client-declared),
 * and that a custom reader can be injected for unit testing without any
 * Firestore dependency.
 */
function stubReaderFor(administrator: PlatformAdministrator | null): {
  deps: DiscoverPlatformAdministratorDeps;
  calls: { userId: string }[];
} {
  const calls: { userId: string }[] = [];
  const getAdministrator = async (_db: Firestore, userId: string) => {
    calls.push({ userId });
    return administrator;
  };
  return { deps: { getAdministrator }, calls };
}

describe("discoverPlatformAdministrator (AUTH-MFA-003A1)", () => {
  it("returns `{ isPlatformAdministrator: false }` when no `platformAdministrators/{userId}` record exists at all", async () => {
    const { deps, calls } = stubReaderFor(null);

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_ordinary_customer",
      deps,
    );

    expect(result).toEqual({ isPlatformAdministrator: false });
    expect(calls).toEqual([{ userId: "user_ordinary_customer" }]);
  });

  it("returns `{ isPlatformAdministrator: true }` only for an `active` administrator record (the sole eligibile lifecycle status)", async () => {
    const { deps } = stubReaderFor(makeAdministrator("active"));

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_foundation_editor",
      deps,
    );

    expect(result).toEqual({ isPlatformAdministrator: true });
  });

  it("returns `{ isPlatformAdministrator: false }` for a suspended administrator", async () => {
    const { deps } = stubReaderFor(makeAdministrator("suspended"));

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_suspended",
      deps,
    );

    expect(result).toEqual({ isPlatformAdministrator: false });
  });

  it("returns `{ isPlatformAdministrator: false }` for a removed (terminal) administrator", async () => {
    const { deps } = stubReaderFor(makeAdministrator("removed"));

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_removed",
      deps,
    );

    expect(result).toEqual({ isPlatformAdministrator: false });
  });

  it("returns `{ isPlatformAdministrator: false }` for an invited-but-not-yet-activated administrator", async () => {
    const { deps } = stubReaderFor(makeAdministrator("invited"));

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_invited",
      deps,
    );

    expect(result).toEqual({ isPlatformAdministrator: false });
  });

  it("fails closed when the stored record is structurally malformed — the fail-closed error propagates, it never becomes `false`", async () => {
    const getAdministrator = async () => {
      throw platformAdministratorConfigMalformedError();
    };

    await expect(
      discoverPlatformAdministrator(null as unknown as Firestore, "user_malformed", {
        getAdministrator,
      }),
    ).rejects.toThrow(platformAdministratorConfigMalformedError());
  });

  it("returns the minimal payload — exactly one key, `isPlatformAdministrator`, never the administrator record itself", async () => {
    const { deps } = stubReaderFor(makeAdministrator("active"));

    const result = await discoverPlatformAdministrator(
      null as unknown as Firestore,
      "user_foundation_editor",
      deps,
    );

    expect(Object.keys(result)).toEqual(["isPlatformAdministrator"]);
  });
});
