# TradeUp 1.1.0 — 3 Ekim 2026 gönderim kaydı

Uygulama `6811362281`, bundle `com.tradeup.zerotohome`. Kullanıcı 1.1.0 düzeltme,
24 orta/ileri ürün ve yeniden App Review gönderimini açıkça istedi; mevcut
TradeUp Apple API/imzalama dosyalarının Codemagic'e aktarımını ayrıca onayladı.

## Doğrulanan hazırlık

- 24 özgün görselli aile, toplam 237; GDD v2.2 ekonomi ve fiyatlandırma korunur.
- Rewarded erken kapanma, gerçek zaman limitleri ve ilan başına kullanım düzeltildi.
- 425 birim testi, lint, build ve iOS sync başarılı. 40 farklı Playwright akışı
  başarılı; değişen privacy capability sonrası odak testi yeniden çalıştırıldı.
  İsteğe bağlı mağaza görseli üretimi atlandı. Bunlar yeni native cihaz testi değildir.
- Mevcut API, sertifika/profil Codemagic'e bağlandı; GitHub'a yalnız yeni TradeUp
  kapsamı eklendi. Diğer uygulamanın mevcut erişimi korunur. Secret repo'ya yazılmaz.
- [Codemagic build](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ac0aab47394575b200aa465):
  ücretsiz M2, kaynak `0b90cde7f60062f54d9d04a6d6c0a59a59839875`, input build 42.
  İlk deneme, builder'da mevcut pnpm shim'iyle `npm EEXIST` çakışmasında durdu;
  kaynak testleri veya arşivleme başlamadı, Apple'a binary yüklenmedi.
  Sabit pnpm sürümü yalnız geçici builder makinesinde kurulacak şekilde düzeltildi.
  [Düzeltilmiş ikinci deneme](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ac0ab7f7394575b200aa489)
  `bee39f2497fe9e18d9f38c89b36fe1a059cf22cc` kaynağından 3 dk 57 sn'de tamamlandı:
  kaynak doğrulama, signing, archive/export ve publishing başarılı.
  İndirilen `App.ipa` içinden `com.tradeup.zerotohome`, `1.1.0`, build `42`,
  cihaz ailesi `[1]` ve minimum iOS `15.0` doğrulandı. Web payload'ında test
  reklam kimliği yok. SHA-256:
  `fcbdec5310bad5675b7be7aa3195cb3d2ac843488225914d3358c9737ad0c6a2`.
  Apple işlemesi tamamlandı: TestFlight `1.1.0 (42)` için `Ready to Submit`
  gösteriyor. İşlenme doğrulandıktan sonra eski başvuru geri çekildi.
- Eski başvuru `5e2b1215-1abe-42a6-8403-c39540502061` Apple'da `Removed`;
  App/IAP kayıtları silinmedi. Sürüm 1.1.0, build 42 ve güncel inceleme notları
  kaydedildi. Beş iPhone görseli korunur; 13 inç iPad alanında görsel yok.
  Reklam sunumuna ilişkin eski mağaza açıklaması bu binary ile tutarlı olacak
  şekilde düzeltildi. Manuel yayın seçeneği seçili.

## Apple'a gönderilen başvuru

- [Yeni App Review başvurusu](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/9def22c5-a2ac-4acd-ac66-1cdc8c83d1a8)
  3 Ekim 2026 10:35 (GMT+3) tarihinde gönderildi; ID
  `9def22c5-a2ac-4acd-ac66-1cdc8c83d1a8`.
- Apple detay ekranında `Items Submitted (7)` ve `Waiting for Review`
  doğrulandı: iOS `1.1.0 (42)` ve aşağıdaki altı non-consumable ürünün her biri
  `Waiting for Review` durumunda. Bu gönderim doğrulamasıdır; Apple onayı veya
  mağaza yayını değildir.
- Paketler: `tradeup_no_ads_lifetime`, `tradeup_premium_lifetime`,
  `tradeup_theme_night_market`, `tradeup_theme_workshop`,
  `tradeup_home_styles_01`, `tradeup_animated_avatars_01`.
- Toplu IAP ekleme işlemi bir ürünü ekleyip kalan beşinde genel
  `Something went wrong. Try again.` uyarısı verdi. Ürün kayıtları/ücretleri
  değiştirilmeden, kalanlar tek tek aynı taslağa eklendi; gönderim öncesinde
  altı ürünün adı ve yedi öğelik toplam ayrıca doğrulandı.
- Yayınlama manuel kalır. Test reklamları da production reklamları da bu
  binary'de kapalı; production kalite kapısı henüz tamamlanmış sayılmaz.

Yerel kanıt ekranı:
`C:/Users/Gaming/AppData/Local/Temp/tradeup-110-review-submitted.jpg`.

## Gönderilen inceleme notları

APP REVIEW GUIDE — TradeUp: Zero to Home, iOS 1.1.0 (42)

TradeUp: Zero to Home is a single-player, offline-capable trading simulation.
The player buys and prepares second-hand items, negotiates with simulated NPCs,
lists owned items for sale, and progresses toward purchasing a home.
There is no account registration, login, user-to-user marketplace, or
user-generated content. Player names and avatars are local profile settings.

Version 1.1.0 adds 24 illustrated middle/advanced item families and fixes
rewarded-ad cancellation and usage-limit handling. Economic calculations,
negotiation rights and purchase entitlements remain unchanged.

All six non-consumable products are included in the submission:
tradeup_no_ads_lifetime, tradeup_premium_lifetime, tradeup_theme_night_market,
tradeup_theme_workshop, tradeup_home_styles_01, tradeup_animated_avatars_01.
Open the shopping-bag button or Profile and Settings > Purchases & Appearance.
On a clean install, enter a 1–20 character name, select a free avatar, and tap
Kariyere başla. Pazar is the market; Portföy holds owned items and listings;
Radar shows market insights and Yolculuk shows the career and home journey.
No Ads and Premium are the two main choices; the four standalone cosmetics
are available in the expandable Visual Packs section. Restore Purchases is
provided in the same sheet. Prices and entitlements come from StoreKit.

Premium includes ad-free use and all four cosmetic packs. No Ads includes
ad-free use only. Existing standalone ownership is preserved. Neither package
grants cash, better market items, extra negotiation attempts or higher reward
caps. Verified ad-free users use the same capped action path without video.

Ad serving is disabled in this binary while the production quality gate
remains pending. It does not request Google test ads, consent or ATT. Normal
market flow and preparation remain usable; unavailable video-ad controls are
not displayed. The Google Mobile Ads SDK is included, but is not initialized
by this configuration. Firebase Analytics collection is off by default and
requires the player's explicit Settings opt-in. No local player name, prices
or item/profile identifiers are sent in the analytics events.

The native target is portrait iPhone. Existing iPhone screenshots describe the
game in use. No browser capture is represented as a native iPad test or capture.
Publication must remain manual after approval.
