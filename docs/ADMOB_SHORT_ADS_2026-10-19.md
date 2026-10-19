# TradeUp — daha kısa reklam deneyimi

19 Ekim 2026. Kullanıcı aynı reklam içindeki ikinci bölümden şikâyet etti ve “Ad pods” ile “yüksek etkileşimli reklamlar” seçeneklerinin kapatılmasını açıkça onayladı. Gelir/doluluk azalabileceği işlemden önce belirtildi.

## Canlı AdMob değişiklikleri

- Yalnız TradeUp iOS app `ca-app-pub-4229088811556918~1245306004`.
- Uygulama ayarlarında yüksek etkileşimli reklamlar AÇIK bulundu; kapatıldı, Kaydet ve kapalı durumun “etkinleştirmek için açın” açıklaması doğrulandı.
- MARKET_SCOUT `4710266110`: Ad pods/Reklam kapsülleri kapatıldı; kaydedilmiş tür `Video | Etkileşimli`.
- FAST_INSPECTION `1694441725`: aynı şekilde kapatıldı; yeniden açılışta `Video | Etkileşimli` doğrulandı.
- FAST_PREPARATION `6609313327`: kapatıldı; kaydedilmiş tür doğrulandı.
- LISTING_REACH `4992979324`: kapatıldı; kaydedilmiş tür doğrulandı.
- Etkileşimli reklam kutusu ayrıca değiştirilmedi. Yeni reklam birimi, sıklık limiti, eBGBM tabanı, ödül miktarı, kişiselleştirme veya ödeme ayarı değiştirilmedi. Diğer uygulamalara dokunulmadı.

Ekran kanıtları (yerel/ignored):

- `release-artifacts/admob-short-ads-disabled-2026-10-19.jpg`
- `release-artifacts/admob-market-scout-no-pods-2026-10-19.jpg`
- `release-artifacts/admob-fast-inspection-no-pods-2026-10-19.jpg`
- `release-artifacts/admob-listing-reach-no-pods-2026-10-19.jpg`

Bu, uygulama kodunda iki kez show çağrısı yapıldığının kanıtı değildir: kullanıcı aynı reklam içindeki ikinci bölüm olduğunu netleştirdi. Kodda eski ödül/callback ve 30 ticaret kuralı korunur. Testlerde gerçek gösterim/tıklama veya reklam geliri oluşturulmadı.

Google'ın standart AdMob Network deneyiminde high-engagement kapalıyken ödüllü atlama/ödül eşiği en fazla 30 saniye, geçiş atlama eşiği en fazla 5 saniye olarak anlatılır. Bunlar bütün reklamın tam kapanış süresi garantisi değildir; normal bitiş kartı/etkileşimli biçim kalabilir. Partner bidding üzerindeki kapsam farklıdır. Ayar yayılımı ve önbellekteki eski reklam nedeniyle hemen her gösterimin değiştiği iddia edilmez. Bu canlı ayar değişikliği yeni uygulama build'i gerektirmez; kod ön yüklemesi ise yeni build gerektirir.

Kaynaklar: [yüksek etkileşimli reklamlar](https://support.google.com/admob/answer/15525707?hl=en), [ödüllü reklam kapsülleri](https://support.google.com/admob/answer/7372450?hl=en).
