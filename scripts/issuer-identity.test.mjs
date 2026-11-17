import { test } from "node:test";
import assert from "node:assert/strict";
import { assertIssuerAddress, loadVerifiedIssuer, issuerConfig } from "./issuer-identity.mjs";
test("operator signer must match official candidate", () => {
  assert.equal(issuerConfig.publicAddress, "DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k");
  assert.doesNotThrow(() => assertIssuerAddress("DUPoMPmu5Hbsh1RNHuc2VMV3GVCZkj8ZEZbybk5fRh4k"));
  assert.throws(() => assertIssuerAddress("11111111111111111111111111111111"), /Signing wallet/);
});
test("public configuration does not prove ownership", () => {
  assert.throws(() => loadVerifiedIssuer(), /external issuer/);
});
