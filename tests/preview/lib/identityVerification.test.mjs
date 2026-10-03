import test from "node:test";
import assert from "node:assert/strict";
import { verifyPreviewAccounts } from "./identityVerification.mjs";

test("preview account integrity checks every manifest identity against Auth credentials", async () => {
  const attempts = [];
  const identities = [
    { key: "owner_bella", email: "grace.owner@preview.example.test" },
    { key: "manager_bella", email: "manager@example.test" },
    { key: "staff_bella", email: "staff@example.test" },
    { key: "customer_amina", email: "customer@example.test" },
  ];

  const failures = await verifyPreviewAccounts(identities, "preview-password", async (args) => {
    attempts.push(args.email);
    if (args.email === identities[2].email) throw new Error("INVALID_PASSWORD");
  });

  assert.deepEqual(attempts, identities.map((identity) => identity.email));
  assert.deepEqual(failures, ["staff_bella"]);
});

test("a healthy preview account manifest has no authentication failures", async () => {
  const failures = await verifyPreviewAccounts(
    [{ key: "owner_bella", email: "grace.owner@preview.example.test" }],
    "preview-password",
    async () => ({ idToken: "token" }),
  );
  assert.deepEqual(failures, []);
});
