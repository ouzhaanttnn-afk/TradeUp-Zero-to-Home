import { describe, expect, it } from "vitest";
import {
  localizeProduct,
  localizeCategory,
  localizeHome,
  localizeAvatar,
  localizePreparation,
  localizeSeller,
  localizeSignal,
  localizeEvidence,
  localizeAttribute,
  localizeNotice,
  formatMoney,
  currencySymbol,
  t,
} from "./index";
import { money, signedMoney } from "../game";
import { listingAgeLabel } from "../ui/marketCard";

describe("i18n localization suite", () => {
  describe("currency and money formatting (1 USD = 50 TRY rate)", () => {
    it("formats Turkish Lira correctly in 'tr' locale", () => {
      expect(money(10_000, "tr")).toBe("₺100");
      expect(formatMoney(10_000, "tr")).toBe("₺100");
      expect(money(110_000, "tr")).toBe("₺1.100");
      expect(money(0, "tr")).toBe("₺0");
      expect(signedMoney(5_000, "tr")).toBe("+₺50");
      expect(signedMoney(-5_000, "tr")).toBe("-₺50");
      expect(currencySymbol("tr")).toBe("₺");
      expect(t("nav.market")).toBeDefined();
    });

    it("formats US Dollar correctly in 'en' locale at fixed 1 USD = 50 TRY (5,000 minor units)", () => {
      // 5,000 minor = 50 TRY = $1.00
      expect(money(5_000, "en")).toBe("$1");
      // 10,000 minor = 100 TRY = $2.00
      expect(money(10_000, "en")).toBe("$2");
      // 12,000 minor = 120 TRY = $2.40
      expect(money(12_000, "en")).toBe("$2.40");
      // 100,000 minor = 1,000 TRY = $20.00
      expect(money(100_000, "en")).toBe("$20");
      // 5,000,000 minor = 50,000 TRY = $1,000.00
      expect(money(5_000_000, "en")).toBe("$1,000");
      // Signed money
      expect(signedMoney(10_000, "en")).toBe("+$2");
      expect(signedMoney(-12_000, "en")).toBe("-$2.40");
      expect(signedMoney(0, "en")).toBe("±$0");
      expect(currencySymbol("en")).toBe("$");
    });

    it("formats US Dollar correctly in 'de' and 'es' locales", () => {
      expect(money(10_000, "de")).toBe("$2");
      expect(money(12_000, "es")).toBe("$2.40");
      expect(currencySymbol("de")).toBe("$");
      expect(currencySymbol("es")).toBe("$");
    });
  });

  describe("product family translations", () => {
    it("translates by family ID across languages", () => {
      expect(localizeProduct("notebook", "Deri Kapaklı Defter", "en")).toBe(
        "Leather Journal Box Set",
      );
      expect(localizeProduct("notebook", "Deri Kapaklı Defter", "de")).toBe(
        "Leder-Notizbuch im Schuber",
      );
      expect(localizeProduct("notebook", "Deri Kapaklı Defter", "es")).toBe(
        "Cuaderno en caja de cuero",
      );
      expect(localizeProduct("notebook", "Deri Kapaklı Kutu Defteri", "tr")).toBe(
        "Deri Kapaklı Kutu Defteri",
      );
    });

    it("translates by Turkish product name lookup across languages", () => {
      expect(localizeProduct("Koleksiyonluk Klasik Plak", "Koleksiyonluk Klasik Plak", "en")).toBe(
        "Collectible Classic Vinyl",
      );
      expect(localizeProduct("Elektro Gitar", "Elektro Gitar", "en")).toBe(
        "Electric Guitar",
      );
      expect(localizeProduct("Elektro Gitar", "Elektro Gitar", "de")).toBe(
        "E-Gitarre",
      );
      expect(localizeProduct("Elektro Gitar", "Elektro Gitar", "es")).toBe(
        "Guitarra eléctrica",
      );
    });

    it("gracefully falls back to defaultName if unknown ID", () => {
      expect(localizeProduct("unknown_product_id", "Default Widget", "en")).toBe(
        "Default Widget",
      );
    });
  });

  describe("homes localization", () => {
    it("localizes home options across languages", () => {
      const enHome = localizeHome(
        "garden_edge",
        "Bahçeli Başlangıç Evi",
        "Şehir çeperi",
        "Sakin sokak",
        "en",
      );
      expect(enHome.name).toBe("Starter Garden Home");
      expect(enHome.location).toBe("City outskirts");

      const deHome = localizeHome(
        "coastal_villa",
        "Sahil Yamaç Villası",
        "Deniz manzarası",
        "Manzaralı",
        "de",
      );
      expect(deHome.name).toBe("Küsten-Hangvilla");
      expect(deHome.location).toBe("Meerblick");

      const esHome = localizeHome(
        "stone_courtyard",
        "Taş Avlulu Ev",
        "Tarihi doku",
        "Restore edilmiş",
        "es",
      );
      expect(esHome.name).toBe("Casa con Patio de Piedra");
      expect(esHome.location).toBe("Casco histórico");
    });
  });

  describe("avatars localization", () => {
    it("localizes avatar names and roles across languages", () => {
      const enAvatar = localizeAvatar("pazar-kasifi", "Pazar Kaşifi", "Fırsat avcısı", "en");
      expect(enAvatar.name).toBe("Market Scout");
      expect(enAvatar.role).toBe("Bargain Hunter");

      const deAvatar = localizeAvatar("atolye-ustasi", "Atölye Ustası", "Ürün yenileyici", "de");
      expect(deAvatar.name).toBe("Werkstatt-Meister");
      expect(deAvatar.role).toBe("Restaurierungs-Spezialist");

      const esAvatar = localizeAvatar("koleksiyon-uzmani", "Koleksiyon Uzmanı", "Detay", "es");
      expect(esAvatar.name).toBe("Experto Coleccionista");
    });
  });

  describe("categories, preparations, sellers, and signals", () => {
    it("localizes categories", () => {
      expect(localizeCategory("Küçük Eşya", "en")).toBe("Small Goods");
      expect(localizeCategory("Küçük Eşya", "de")).toBe("Kleinartikel");
      expect(localizeCategory("Küçük Eşya", "es")).toBe("Artículos pequeños");
      expect(localizeCategory("Küçük Eşya", "tr")).toBe("Küçük Eşya");
    });

    it("localizes preparation actions", () => {
      expect(localizePreparation("CLEAN", "Temizle", "en")).toBe("Clean");
      expect(localizePreparation("TEST", "Test et", "de")).toBe("Testen");
      expect(localizePreparation("RESTORE", "Bakım yap", "es")).toBe("Restaurar");
    });

    it("localizes sellers", () => {
      expect(localizeSeller("urgent", "Acilci", "en")).toBe("Urgent");
      expect(localizeSeller("expert", "Piyasacı", "de")).toBe("Markt-Profi");
      expect(localizeSeller("emotional", "Duygusal", "es")).toBe("Sentimental");
    });

    it("localizes market signals", () => {
      expect(localizeSignal("Sıcak fırsat", "en")).toBe("Hot Deal");
      expect(localizeSignal("İyi fiyat", "de")).toBe("Guter Preis");
      expect(localizeSignal("Pahalı", "es")).toBe("Caro");
    });

    it("localizes listing age label", () => {
      expect(listingAgeLabel(0, 0, "en")).toBe("New");
      expect(listingAgeLabel(0, 15, "en")).toBe("15m");
      expect(listingAgeLabel(0, 120, "en")).toBe("2h");

      expect(listingAgeLabel(0, 0, "de")).toBe("Neu");
      expect(listingAgeLabel(0, 15, "de")).toBe("15 Min.");
      expect(listingAgeLabel(0, 120, "de")).toBe("2 Std.");

      expect(listingAgeLabel(0, 0, "tr")).toBe("Yeni");
      expect(listingAgeLabel(0, 15, "tr")).toBe("15 dk");
      expect(listingAgeLabel(0, 120, "tr")).toBe("2 sa");
    });
  });

  describe("evidence, attributes, and notices localization", () => {
    it("localizes evidence labels across languages", () => {
      expect(localizeEvidence("Kapak izi", "en")).toBe("Cover mark");
      expect(localizeEvidence("Eksik sayfa", "de")).toBe("Fehlende Seite");
      expect(localizeEvidence("Batarya sağlık testi", "es")).toBe("Prueba de salud de batería");
      expect(localizeEvidence("Kapak izi", "tr")).toBe("Kapak izi");
    });

    it("localizes attribute labels across languages", () => {
      expect(localizeAttribute("Kapak", "en")).toBe("Cover");
      expect(localizeAttribute("Sayfa", "de")).toBe("Seiten");
      expect(localizeAttribute("Orijinallik", "es")).toBe("Autenticidad");
      expect(localizeAttribute("Kapak", "tr")).toBe("Kapak");
    });

    it("localizes notices across languages including dynamic patterns", () => {
      expect(localizeNotice("Piyasa canlı. İyi fırsatlar beklemez.", "en")).toBe(
        "Market is live. Good deals don't wait.",
      );
      expect(localizeNotice("25 yenileme hakkın geri doldu.", "en")).toBe(
        "25 scan credits restored.",
      );
      expect(localizeNotice("25 yenileme hakkın geri doldu.", "de")).toBe(
        "25 Scan-Credits wieder aufgeladen.",
      );
      expect(localizeNotice("Ses seviyesi kapalı olarak ayarlandı.", "en")).toBe(
        "Sound level set to Off.",
      );
      expect(localizeNotice("Bu ürün zaten satın alındı.", "es")).toBe(
        "Este producto ya fue comprado.",
      );
    });
  });
});
