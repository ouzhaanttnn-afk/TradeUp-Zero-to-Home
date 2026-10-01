# TradeUp 1.0.4 — 1 Ekim 2026 yeniden gönderimi

Uygulama: `6811362281` · Bundle: `com.tradeup.zerotohome`.

Kullanıcı 1.0.4 olarak yeniden yüklemeyi ve Apple incelemesine göndermeyi
açıkça istedi. Yeni gönderim inceleme sürecini baştan başlatır; sürüm numarası
değişikliği incelemeyi hızlandırma garantisi değildir.

## Binary hazırlığı

- iOS Debug ve Release sürümü `1.0.4`; build numarası yeni workflow çalışmasından `41`.
- Kaynak: `04e72d73a40b2361228e8117269e66af983d9b65`.
- [iOS build 41 çalışması](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/36807475532).
- Yerelde 401 birim testi, lint, production build ve iOS sync geçti.
- Playwright: 37 akış geçti; isteğe bağlı mağaza görseli üretimi atlandı.
  Yeni native cihaz veya StoreKit satın alma testi yapılmış sayılmaz.
- Workflow kaynak kontrolü, arşivleme, imzalı IPA, Apple doğrulama ve yükleme
  adımları başarılı. Apple işlemesi tamamlandı; TestFlight'ta 1.0.4 (41)
  `Ready to Submit` ve mevcut `Betatest` grubuna bağlı (3 davet).
- İndirilen imzalı IPA içindeki gerçek bilgiler: `com.tradeup.zerotohome`,
  sürüm `1.0.4`, build `41`, cihaz ailesi `[1]`, minimum iOS `15.0`.
  IPA SHA-256: `76E4D849A70D9B54E2C316D2067CD5E368D59BE382AB05F25EF3F1F010C12CCA`.
- Bu çalışma yalnız iOS sürüm numarası ve sürüm doğrulama testini değiştirdi;
  oynanış, ekonomi, reklam davranışı, ürün fiyatları ve Android sürümü değişmedi.

## Apple gönderim sonucu

- **1 Ekim 2026, 06:03 (Türkiye)**: Apple `7 Items Submitted` ile gönderimi
  kabul etti. [Yeni başvuru: `5e2b1215-1abe-42a6-8403-c39540502061`](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/5e2b1215-1abe-42a6-8403-c39540502061).
- Canlı başvuru detayında uygulama **1.0.4 (41)** ve aşağıdaki altı IAP'ın
  her biri **Waiting for Review** olarak doğrulandı:
  - `tradeup_no_ads_lifetime` — Reklamsız
  - `tradeup_premium_lifetime` — Premium
  - `tradeup_theme_night_market` — Gece Pazarı
  - `tradeup_theme_workshop` — Atölye
  - `tradeup_home_styles_01` — Ev Stilleri
  - `tradeup_animated_avatars_01` — Canlı Avatarlar
- Eski `527443fc-6288-4b9f-b5f9-e342b348985c` başvurusu ancak yeni build
  işlendikten sonra geri çekildi. Uygulama ve altı IAP önce `Developer Rejected`
  durumuna döndü, ardından yeni tek başvuruya eklendi. Hiçbir uygulama veya IAP
  ürün kaydı silinmedi.
- İnceleme notları 1.0.4 (41) için güncellendi; mevcut beş iPhone mağaza
  görseli, IAP inceleme görselleri, fiyatlar ve bölge erişimleri korundu.
  Önceden kaldırılmış eski iPad görselleri tekrar yüklenmedi.
- **Manually release this version** seçimi korundu. İncelemeye gönderim
  onay veya mağazada yayın anlamına gelmez; Apple sonucu bekleniyor.
- Canlı gönderim kanıtı yerelde `test-results/app-review-1.0.4-build41.png`
  olarak kaydedildi (Git dışında).
