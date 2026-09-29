# TradeUp 1.0.2 — 29 Eylül yeniden gönderim paketi

Apple uygulama: `6811362281` · Bundle: `com.tradeup.zerotohome`.
Reddedilen yapı: **1.0.2 (39)**. Yeni yapı, iOS TestFlight workflow'unun yeni
çalışma numarasını alır. Aynı 39 numarasını tekrar seçme.

Hazır yeni binary: **1.0.2 (40)**, kaynak `a7506da`.
[İmzalama ve Apple yüklemesi başarılı](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/36600452788).
Apple işlemesi tamamlandı; TestFlight'ta build 40 ve Betatest grubu doğrulandı.

## Tamamlanan gönderim — 29 Eylül 2026, 20:09 (Türkiye)

- Kullanıcının açık işlem onayıyla eski reddedilmiş başvuru
  `eef19a40-c8f2-477e-ae49-b61650b23d11` kapatıldı; Apple durumu `Removed`.
  Uygulama ve satın alma ürün kayıtları silinmedi.
- **1.0.2 (40) ve altı IAP aynı başvuruda gönderildi.**
  [Başvuru 527443fc-6288-4b9f-b5f9-e342b348985c](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/527443fc-6288-4b9f-b5f9-e342b348985c)
  sonuç ekranında `Items Submitted (7)` gösteriyor; yedi öğenin her biri
  **Waiting for Review**. Ayrı bekleyen IAP taslağı kalmadı.
- Sürümün build 39 bağlantısı kaldırılıp build 40 seçildi. Yayınlama
  **manuel**; bu işlem App Store yayını veya Apple onayı değildir.
- Tek yerelleştirme Türkçe. Eski 13 inç iPad görseli kaldırıldı; diğer dört
  iPad boyutundaki miras kullanımları da boşaldı. Eski dosya yerel tarihsel
  klasörde korunur. Build 40 seçilip sürüm kaydedildikten sonra Apple yalnız
  iPhone medya alanlarını gösterdi ve iPad görseli istemeden gönderimi kabul
  etti. Bu, iPad uyumluluğunun cihazda test edildiği anlamına gelmez.
- Beş mevcut açıklamalı iPhone görseli korundu. Diğer altı iPhone boyutunun
  aynı 6.5 inç Türkçe görsellerini kullandığı doğrulandı. Yeni native iPad
  çekimi üretilmedi veya yüklenmedi.
- Altı üründe inceleme görseli ve yerelleştirme mevcut; bölge erişimi ve fiyat
  çizelgeleri korundu. Önceden yüklenmiş IAP görselleri tarayıcı arayüzü
  referanslarıdır, yeni native StoreKit testi değildir. Yeni native satın
  alma testi yapıldığı iddia edilmedi.
- Premium inceleme açıklamasındaki eski kapsam düzeltildi. Sürüm notlarında
  iki ana paket, dört tekil kozmetiğin `Görsel paketler` erişimi, geri yükleme
  ve iPad medyasına gerçekten yapılan işlem açıklandı; “iPhone-only olduğu
  için iPad sorunu geçersiz” iddiası kaldırıldı.
- Bu adım yalnız Apple başvurusu ve durum belgelerini değiştirdi. Oyun kodu,
  ekonomi, fiyatlar ve build 40 binary'si değiştirilmedi; önceki 394 birim /
  38 Playwright, lint ve build sonuçları yeni test çalışması olarak sunulmaz.

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

## Uygulanan gönderim kontrol listesi (tarihsel plan)

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
