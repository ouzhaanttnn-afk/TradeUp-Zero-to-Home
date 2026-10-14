"""Offline signed-IPA inspection. No Apple network requests or uploads."""
import argparse
import hashlib
import json
import plistlib
import re
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("ipa", type=Path)
parser.add_argument("--build", required=True)
parser.add_argument("--version", default="1.1.0")
parser.add_argument("--ads", choices=["production", "test", "disabled"], default="production")
args = parser.parse_args()
with zipfile.ZipFile(args.ipa) as archive:
    infos = [name for name in archive.namelist() if re.fullmatch(r"Payload/[^/]+\.app/Info.plist", name)]
    assert len(infos) == 1, "Expected exactly one native app"
    app = infos[0].removesuffix("Info.plist")
    info = plistlib.loads(archive.read(infos[0]))
    assert info["CFBundleIdentifier"] == "com.tradeup.zerotohome"
    assert info["CFBundleShortVersionString"] == args.version
    assert str(info["CFBundleVersion"]) == args.build
    assert "NSUserTrackingUsageDescription" not in info
    assert info["FIREBASE_ANALYTICS_COLLECTION_ENABLED"] is False
    for key in ["GOOGLE_ANALYTICS_IDFV_COLLECTION_ENABLED", "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE", "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA", "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS"]:
        assert info[key] is False, key
    assert app + "embedded.mobileprovision" in archive.namelist(), "Missing signing profile"
    assert any(name.startswith(app + "_CodeSignature/") for name in archive.namelist()), "Missing code signature"
    ads = json.loads(archive.read(app + "public/release-ad-config.json"))
    assert ads == {"testEnabled": args.ads == "test", "productionEnabled": args.ads == "production"}, ads
    manifests = {}
    for name in archive.namelist():
        if name.startswith(app) and name.endswith("PrivacyInfo.xcprivacy"):
            privacy = plistlib.loads(archive.read(name))
            manifests[name.removeprefix(app)] = {"tracking": privacy.get("NSPrivacyTracking"), "collectedTypes": [entry.get("NSPrivacyCollectedDataType") for entry in privacy.get("NSPrivacyCollectedDataTypes", [])]}
print(json.dumps({"bundle": info["CFBundleIdentifier"], "version": args.version, "build": args.build, "ads": ads, "sha256": hashlib.sha256(args.ipa.read_bytes()).hexdigest(), "vendorPrivacyManifests": manifests}, indent=2))
