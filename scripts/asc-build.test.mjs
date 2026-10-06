import { generateKeyPairSync, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertUnusedBuildNumber,
  createToken,
  latestBuildNumber,
  parseBuildNumber,
} from "./asc-build.mjs";

const build = (version) => ({ attributes: { version } });

describe("App Store Connect build guard", () => {
  it("accepts only positive integer build numbers", () => {
    expect(parseBuildNumber("43")).toBe(43);
    for (const value of ["", "0", "042", "43.1", "abc", undefined])
      expect(() => parseBuildNumber(value)).toThrow();
  });

  it("compares Apple build versions numerically", () => {
    expect(latestBuildNumber([build("9"), build("42"), build("100")])).toBe(
      100,
    );
    expect(latestBuildNumber([build("1.0"), build(undefined)])).toBe(0);
  });

  it("rejects a reused or lower build number", () => {
    const builds = [build("41"), build("42")];
    expect(() => assertUnusedBuildNumber(42, builds)).toThrow(/not above/);
    expect(() => assertUnusedBuildNumber(41, builds)).toThrow(/not above/);
    expect(assertUnusedBuildNumber(43, builds)).toBe(42);
  });

  it("signs a short-lived ES256 App Store Connect token", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    const pem = privateKey.export({ format: "pem", type: "pkcs8" });
    const token = createToken("KEY123", "issuer", pem, 1_000_000);
    const [header, payload, signature] = token.split(".");
    const decode = (part) => JSON.parse(Buffer.from(part, "base64url"));
    expect(decode(header)).toEqual({ alg: "ES256", kid: "KEY123", typ: "JWT" });
    expect(decode(payload)).toEqual({
      iss: "issuer",
      iat: 1000,
      exp: 1600,
      aud: "appstoreconnect-v1",
    });
    expect(
      verify(
        "sha256",
        Buffer.from(`${header}.${payload}`),
        { key: publicKey, dsaEncoding: "ieee-p1363" },
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
  });

  it("keeps the GitHub iOS release on an unused build without ATT", () => {
    const workflow = readFileSync(
      new URL("../.github/workflows/ios-testflight.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain(
      "TRADEUP_IOS_BUILD_NUMBER: ${{ inputs.build_number || github.run_number }}",
    );
    expect(workflow).toContain(
      'node scripts/asc-build.mjs guard "$TRADEUP_IOS_BUILD_NUMBER"',
    );
    expect(workflow).toContain(
      'CURRENT_PROJECT_VERSION="$TRADEUP_IOS_BUILD_NUMBER"',
    );
    expect(workflow).not.toContain(
      'CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER"',
    );
    expect(
      workflow.match(/Print :NSUserTrackingUsageDescription/g),
    ).toHaveLength(2);
    expect(workflow).toContain("EXPECTED_MARKETING_VERSION: 1.1.0");
    expect(workflow).toContain("VITE_ADMOB_PRODUCTION_ENABLED: 'false'");
    expect(workflow).toContain("VITE_ADMOB_TEST_ENABLED: 'false'");
    expect(workflow).not.toMatch(/submit|reviewSubmission|appStoreVersion/i);
  });
});
