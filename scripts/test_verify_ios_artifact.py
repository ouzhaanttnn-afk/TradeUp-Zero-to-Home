"""Synthetic structural-verifier regression tests; not a real signing test."""
import copy
import json
import plistlib
import subprocess
import sys
import tempfile
import unittest
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

VERIFIER = Path(__file__).with_name("verify-ios-artifact.py")
APP_IDENTIFIER = "8X6KZC5R23.com.tradeup.zerotohome"


class ArtifactVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.entitlements = {
            "com.apple.developer.game-center": True,
            "application-identifier": APP_IDENTIFIER,
            "get-task-allow": False,
        }
        self.profile = {
            "Entitlements": copy.deepcopy(self.entitlements),
            "TeamIdentifier": ["8X6KZC5R23"],
            "ExpirationDate": datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=30),
            "UUID": "synthetic-test-profile",
            "Name": "Synthetic fixture - not a real signature",
        }

    def run_verifier(self, ads=None):
        info = {
            "CFBundleIdentifier": "com.tradeup.zerotohome",
            "CFBundleShortVersionString": "1.2.0",
            "CFBundleVersion": "48",
        }
        for key in ["FIREBASE_ANALYTICS_COLLECTION_ENABLED", "GOOGLE_ANALYTICS_IDFV_COLLECTION_ENABLED",
                    "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE", "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA",
                    "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS"]:
            info[key] = False
        ipa = self.root / "fixture.ipa"
        signed = self.root / "signed.plist"
        signed.write_bytes(plistlib.dumps(self.entitlements))
        with zipfile.ZipFile(ipa, "w") as archive:
            prefix = "Payload/App.app/"
            archive.writestr(prefix + "Info.plist", plistlib.dumps(info))
            archive.writestr(prefix + "embedded.mobileprovision", b"synthetic-CMS-prefix" + plistlib.dumps(self.profile) + b"suffix")
            archive.writestr(prefix + "_CodeSignature/CodeResources", b"synthetic")
            archive.writestr(prefix + "public/release-ad-config.json", json.dumps(ads or {"testEnabled": False, "productionEnabled": True}))
        return subprocess.run([sys.executable, str(VERIFIER), str(ipa), "--build", "48", "--version", "1.2.0",
                               "--ads", "production", "--signed-entitlements", str(signed)], capture_output=True, text=True)

    def test_valid_structural_payload(self):
        result = self.run_verifier()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)["signing"]["gameCenter"])

    def test_missing_signed_game_center(self):
        self.entitlements.pop("com.apple.developer.game-center")
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Missing signed Game Center", result.stderr)

    def test_profile_must_allow_game_center(self):
        self.profile["Entitlements"].pop("com.apple.developer.game-center")
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Profile does not permit Game Center", result.stderr)

    def test_wrong_signed_app(self):
        self.entitlements["application-identifier"] = "8X6KZC5R23.com.other.app"
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Wrong signed application identifier", result.stderr)

    def test_expired_profile(self):
        self.profile["ExpirationDate"] = datetime(2020, 1, 1)
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Signing profile expired", result.stderr)

    def test_development_signature_rejected(self):
        self.entitlements["get-task-allow"] = True
        result = self.run_verifier()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Development signing", result.stderr)

    def test_production_flags_not_silently_changed(self):
        result = self.run_verifier({"testEnabled": True, "productionEnabled": False})
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
