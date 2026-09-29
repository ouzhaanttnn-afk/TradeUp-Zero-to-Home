# TradeUp 1.0.2 — 29 Eylül yeniden gönderim paketi

Apple uygulama: `6811362281` · Bundle: `com.tradeup.zerotohome`.
Reddedilen yapı: **1.0.2 (39)**. Yeni yapı, iOS TestFlight workflow'unun yeni
çalışma numarasını alır. Aynı 39 numarasını tekrar seçme.

Hazır yeni binary: **1.0.2 (40)**, kaynak `a7506da`.
[İmzalama ve Apple yüklemesi başarılı](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/36600452788).
Apple işlemesi tamamlanıp TestFlight'ta doğrulandıktan sonra bu build seçilmeli.
App Review'a yeniden gönderilmedi.

## İki ana seçenek, altı mağaza ürünü

| Ürün | StoreKit kimliği | Apple kaydı | Yeni arayüzde erişim |
| --- | --- | --- | --- |
| Reklamsız | `tradeup_no_ads_lifetime` | `6816529061` | Mağaza ana paketleri |
| TradeUp Premium | `tradeup_premium_lifetime` | `6813979228` | Mağaza ana paketleri |
| Gece Pazarı | `tradeup_theme_night_market` | `6816426206` | Görsel paketler açılır bölümü |
| Atölye | `tradeup_theme_workshop` | `6816426237` | Görsel paketler açılır bölümü |
| Ev Stilleri | `tradeup_home_styles_01` | `6816426146` | Görsel paketler açılır bölümü |
| Canlı Avatarlar | `tradeup_animated_avatars_01` | `6816426344` | Görsel paketler açılır bölümü |

Premium hepsinin kullanımını kapsar; Reklamsız kozmetik açmaz. Tekil haklar
korunur. Satın alma, yalnız gerçek StoreKit fiyatı ve kullanılabilir ürün
metadata'sı varsa etkindir. Mağaza fiyatının gelmesi **Apple incelemesine
gönderildiğini veya onaylandığını kanıtlamaz**.

## Apple oturumu açılınca yapılacaklar

1. Ret mesajı, mevcut başvuru ve beş ürünlü taslağın güncel durumunu yeniden oku.
2. Gerekirse reddedilen başvuruyu sonlandırıp uygulama, Premium ve diğer beş
   ürünü tek taslakta birleştir. Uygulama/ürün kayıtlarını silme. Birleştirme
   tamamlanmadan yeniden gönderme.
3. Altı ürünün her birinde fiyat, bölge erişimi, yerelleştirme ve ilgili güncel
   inceleme görselini kontrol et. Görselleri yeni TestFlight/Simulator yapısının
   gerçek ekranlarından al; yapay fiyat veya satın alınmış hak üretme.
4. Sürümün Media Manager ekranında **bütün boyutları ve dilleri** kontrol et.
   Apple izin veriyorsa eski isteğe bağlı iPad medyasını kaldır; gerekli
   iPad boyutlarına gerçek native çekim yükle. Yalnız iPhone sekmesini
   güncellemek yeterli değildir. Eski `ipad-13/01-canli-pazar.png` kullanılamaz.
5. Yeni build'i seç, notları güncelle. Son başvuru listesinde **7 öğe**
   (1 uygulama + 6 IAP) göründüğünü doğrula. Yayınlama manuel kalsın.
6. Gönderimden sonra aynı 7 öğenin durumu ile yeni build numarasını doğrula.

## Görsel kaynakları

`pnpm assets:store:ios` güncel web arayüzünden iPhone boyutlu önizlemeleri
üretir. `node scripts/render-store-story.mjs` mevcut görsel dili koruyan
açıklamalı mağaza karelerini üretir. İlk üçü Pazar, Portföy ve Yolculuk'tur.

`iphone-6.5/06-premium-inceleme.png` ve `07-kozmetik-inceleme.png` yeni
mağaza düzeninin **tarayıcı önizlemeleridir**. Native StoreKit çalışmadığından
fiyat yerine kullanılamama durumu gösterirler. Bunlar güncel TestFlight IAP
kanıtı yerine yüklenmemeli; cihaz çekiminin tasarım referansıdır.

## İnceleme açıklamasına eklenecek güncel bölüm

Only submit the following after the new binary and all six IAPs are attached:

> This resubmission addresses the September 29 review of version 1.0.2 (39).
> Please review the newly attached build. All six permanent in-app purchases
> are included in this submission. Open the shopping bag or Settings >
> Satın Almalar & Görünüm. The two main options are Reklamsız (ad-free use
> only) and TradeUp Premium (ad-free use plus all cosmetics). Expand Görsel
> paketler to access the four individual cosmetic purchases. Existing owners
> see their unlocked rights instead of duplicate purchase buttons. Prices are
> supplied by StoreKit; Restore Purchases remains accessible. Gameplay limits
> and the in-game economy are unchanged by either package.

Only state that iPad screenshots were corrected **after** verifying the new
native rendering and every relevant Media Manager slot. Do not claim that
iPhone-only targeting removes the requirement for iPad compatibility.
