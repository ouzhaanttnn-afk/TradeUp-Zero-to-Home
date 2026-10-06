import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

// App Store Connect build checks for the GitHub iOS release workflow.
// Mirrors Codemagic's guard: never archive or upload a reused build number.
const API = "https://api.appstoreconnect.apple.com/v1";

export const parseBuildNumber = (value) => {
  if (!/^[1-9][0-9]*$/.test(String(value ?? "")))
    throw new Error(`Invalid Apple build number: ${value}`);
  return Number(value);
};

export const latestBuildNumber = (builds) =>
  builds.reduce((latest, build) => {
    const version = build?.attributes?.version;
    return /^[0-9]+$/.test(version ?? "")
      ? Math.max(latest, Number(version))
      : latest;
  }, 0);

export const assertUnusedBuildNumber = (requested, builds) => {
  const latest = latestBuildNumber(builds);
  if (requested <= latest)
    throw new Error(
      `Build ${requested} is not above the latest App Store Connect build ${latest}.`,
    );
  return latest;
};

export const createToken = (
  keyId,
  issuerId,
  privateKeyPem,
  now = Date.now(),
) => {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const issuedAt = Math.floor(now / 1000);
  const input = `${encode({ alg: "ES256", kid: keyId, typ: "JWT" })}.${encode({
    iss: issuerId,
    iat: issuedAt,
    exp: issuedAt + 600,
    aud: "appstoreconnect-v1",
  })}`;
  const signature = sign("sha256", Buffer.from(input), {
    key: createPrivateKey(privateKeyPem),
    dsaEncoding: "ieee-p1363",
  });
  return `${input}.${signature.toString("base64url")}`;
};

const fetchBuilds = async (token, url) => {
  // token is a factory: each request gets a fresh 10-minute JWT.
  const builds = [];
  for (let next = url; next;) {
    const response = await fetch(next, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!response.ok)
      throw new Error(`App Store Connect request failed: ${response.status}`);
    const body = await response.json();
    builds.push(...body.data);
    next = body.links?.next;
  }
  return builds;
};

const main = async () => {
  const [command, rawBuild] = process.argv.slice(2);
  const build = parseBuildNumber(rawBuild);
  const appId = process.env.APP_STORE_APPLE_ID;
  const privateKey = readFileSync(
    process.env.APP_STORE_CONNECT_API_KEY_PATH,
    "utf8",
  );
  const token = () =>
    createToken(
      process.env.APP_STORE_CONNECT_KEY_ID,
      process.env.APP_STORE_CONNECT_ISSUER_ID,
      privateKey,
    );
  const fields = "fields[builds]=version,processingState";
  if (command === "guard") {
    const latest = assertUnusedBuildNumber(
      build,
      await fetchBuilds(
        token,
        `${API}/builds?filter[app]=${appId}&limit=200&${fields}`,
      ),
    );
    console.log(
      `Build ${build} is unused; latest App Store Connect build is ${latest}.`,
    );
    return;
  }
  if (command === "wait") {
    const version = process.env.EXPECTED_MARKETING_VERSION;
    const url = `${API}/builds?filter[app]=${appId}&filter[version]=${build}&filter[preReleaseVersion.version]=${version}&${fields}`;
    // Apple usually lists an upload within minutes; processing may take longer.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const [found] = await fetchBuilds(token, url);
      const state = found?.attributes?.processingState;
      console.log(`${version} (${build}): ${state ?? "not listed yet"}`);
      if (state === "VALID") return;
      if (state === "FAILED" || state === "INVALID")
        throw new Error(`Apple processing ended as ${state}.`);
      await new Promise((resolve) => setTimeout(resolve, 30_000));
    }
    console.log("Upload accepted; Apple processing is still running.");
    return;
  }
  throw new Error(`Unknown command: ${command}`);
};

if (process.argv[1]?.endsWith("asc-build.mjs")) await main();
