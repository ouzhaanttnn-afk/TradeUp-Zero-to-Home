# TradeUp 1.1.1 (45) — 15 Ekim 2026

## Kullanıcı yetkisi ve sürüm kararı

Kullanıcı yeni build'in TestFlight'a yüklenmesini ve App Review'a gönderilmesini
istedi. Önceki yalnız-IPA / Apple'a yükleme yapmama talimatı bu işlem için
değişti; main'e merge ve otomatik mağaza yayını yapılmadı.

Canlı Apple sorgusu ve App Store Connect ekranı, **1.1.0 (43)** sürümünün
`READY_FOR_SALE` / `Ready for Distribution` olduğunu gösterdi. Bu nedenle
1.1.0 (44) yeniden aynı mağaza sürümüne gönderilmedi; aynı düzeltmeler için
marketing version **1.1.1**, benzersiz build **45** kullanıldı. Oynanış,
ekonomi, ürünler, satın alma fiyatları ve görseller değiştirilmedi.

## Derleme, yükleme ve TestFlight

- Kaynak: `42cfe932253b6d9f8c1720e5406014f27a0e87ab`, dal
  `codex/market-scout-privacy-release`.
- Codemagic: [6ad05d59546ce6236ceebd78](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ad05d59546ce6236ceebd78).
  Mevcut ücretsiz M2 kotasında tek native derleme/yükleme; toplam **4m 2s**.
- `pnpm test`, lint, TypeScript/production build, iOS sync ve native gizlilik
  kontrolleri workflow içinde başarılı. Yerelde sürüm/CI testleri **9/9** geçti;
  eski reklam-kapalı beklentisi onaylanan üretim yapılandırmasına uyarlandı.
- Apple yükleyici sonucu: **UPLOAD SUCCEEDED with no errors**.
- Apple build/delivery ID: `6c885dbe-3782-431a-891c-b6d89794bb98`.
- Apple API: **1.1.1 (45), VALID, APP_STORE_ELIGIBLE**.
- Mevcut **Betatest** grubu build 45'i içeriyor; `internalBuildState`:
  **IN_BETA_TESTING**. Yeni testçi/grup eklenmedi. Harici beta başvurusu açılmadı.
- İndirilen dosya:
  `C:/Users/Gaming/Desktop/TRADEUP/release-artifacts/TradeUp-1.1.1-45.ipa`.
- SHA-256:
  `5fc3282b7b0024f14d1c37cdca0c40981333984f51ff32cb130929a68aa7fd69`.
- Yerel IPA incelemesi: production reklamları **true**, test reklamları **false**;
  bundle `com.tradeup.zerotohome`, doğru sürüm/build, imza/profil dosyaları,
  ATT açıklama anahtarının yokluğu ve Firebase varsayılanları doğrulandı.
  Bu, yeni bir gerçek iPhone/iPad reklam veya StoreKit testi yerine geçmez.

## App Review sonucu

- Yeni Apple sürüm ID: `ce25e725-628a-44d8-a12a-db3c4c9ef789`.
- Build **45** bağlandı. Türkçe yenilikler, güncel reklam/UMP/ATT'siz akışı
  anlatan inceleme notları ve **nostoscomp@gmail.com** inceleme iletişimi kaydedildi.
- Mevcut altı kalıcı satın alma ürünü API'de **APPROVED**; tekrar gönderilmedi.
  Mevcut App Privacy etiketi yedi SDK veri türünü içeriyor; takip etiketi
  görünmüyor. Gizlilik beyanı bu çalışmada değiştirilmedi.
- [Başvuru 5ed2e65e-1a94-47bc-8072-cc369595d41c](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/5ed2e65e-1a94-47bc-8072-cc369595d41c)
  **15 Ekim 2026 08:05:22 (Europe/Istanbul)** tarihinde gönderildi.
- Apple ekranı: **Items Submitted (1): iOS App 1.1.1 (45), Waiting for Review**.
  API de `WAITING_FOR_REVIEW` ve doğru build ilişkisini doğruladı.
- Yayın türü **MANUAL**. Onaylanmış, yayımlanmış veya cihazda yeni test yapılmış
  sayılmaz. Yayımdaki 1.1.0 sürümü kaldırılmadı.
- Kanıt: `release-artifacts/app-review-1.1.1-45-waiting.png`.

## Kullanıcının ayrıca onayladığı yalnız üç dosyalık site yayını

Kullanıcı gizlilik, destek ve app-ads.txt dosyalarının canlıda güncellenmesini
ayrıca onayladı; web oyunu kodunun değiştirilmesine veya main merge'üne izin
verilmedi. Üretimdeki `142caa35a3e4483303f4fcfbb82fd47bc7a4783e` temelinden
`codex/legal-only-2026-10-15` dalı oluşturuldu. Commit
`5929c89c1b909c45eb94e092acd8ba0d5b2100d2` tam olarak yalnız şunları değiştiriyor:

- `public/privacy.html`
- `public/support.html`
- `public/app-ads.txt`

Vercel'in bağlı araç erişimi projeyi göstermedi; mevcut açık ve yetkili tarayıcı
oturumu kullanıldı. Yeni token, hesap, ücretli abonelik veya erişim izni açılmadı.

### Deploy sonucu

- URL: [mevcut canlı site](https://trade-up-zero-to-home.vercel.app/).
- Target: **production**, durum **READY**, framework Vite.
- [Production deployment 68KwqpVvYfg2FMCZbxNvyJzNEiTw](https://vercel.com/ouzhaanttnn-9387/trade-up-zero-to-home/68KwqpVvYfg2FMCZbxNvyJzNEiTw),
  kaynak `5929c89`, build **19s**, mevcut Hobby proje.
- Main dalı birleştirilmedi. Üretim kaynağı yalnız üç dosyalık daldır.
- Canlı üç dosya HTTP **200**; her birinin içeriği onaylanan Git kaynağıyla
  birebir eşleşiyor. Gizlilik/destek yeni e-postayı içeriyor; eski e-posta yok.
- `app-ads.txt` Content-Type: **text/plain; charset=utf-8**. Satır:
  `google.com, pub-4229088811556918, DIRECT, f08c47fec0942fa0`.
- Web oyununun index HTML'i ve altı JS/CSS giriş dosyasının SHA-256 özetleri
  yayın öncesiyle **birebir aynı**. Web oynanış/arayüz kodu değişmedi.
- Statik HTTP kontrolleri başarılı. Ayrı runtime-log/drain taraması yapılmadı;
  kalıcı izleme veya arka plan hizmeti eklenmedi.
- Kanıt: `release-artifacts/legal-only-production.png`.

AdMob'un dosyayı yeniden taraması/hesap doğrulaması ve bölgesel UMP mesajlarının
yayıncı hesabındaki durumu ayrıca kontrol edilmelidir. HTTP 200, AdMob'un dosyayı
şimdiden doğruladığı veya her cihazda reklam dolumu olacağı anlamına gelmez.

Ponytail yaklaşımıyla mevcut build araçları/SDK'lar kullanıldı; yeni bağımlılık,
asset veya sürekli işlem eklenmedi. Omni kullanılmadı.
