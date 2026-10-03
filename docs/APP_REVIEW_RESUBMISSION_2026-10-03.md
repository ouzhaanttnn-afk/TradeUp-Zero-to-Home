# TradeUp 1.1.0 — 3 Ekim 2026 hazırlığı

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
  İmzalı IPA / Apple işlemesi / App Review henüz doğrulanmadı.
- Yeni build işlenmeden 1.0.4 (41) ve altı IAP'ın mevcut başvurusu geri çekilmez.
  App/IAP kayıtları silinmez; mağaza yayını manuel kalır.

## Yeni inceleme notu taslağı

TradeUp: Zero to Home is a single-player, offline-capable trading simulation.
The player buys and prepares second-hand items, negotiates with simulated NPCs,
lists owned items for sale, and progresses toward purchasing a home.
There is no account registration, login, user-to-user marketplace, or
user-generated content. Player names and avatars are local profile settings.

Version 1.1.0 adds 24 illustrated middle/advanced item families and fixes
rewarded-ad cancellation and usage-limit handling. Economic calculations,
negotiation rights and purchase entitlements remain unchanged.

All six non-consumable products must accompany this submission:
tradeup_no_ads_lifetime, tradeup_premium_lifetime, tradeup_theme_night_market,
tradeup_theme_workshop, tradeup_home_styles_01, tradeup_animated_avatars_01.
Open the shopping-bag button or Profile and Settings > Purchases & Appearance.
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
