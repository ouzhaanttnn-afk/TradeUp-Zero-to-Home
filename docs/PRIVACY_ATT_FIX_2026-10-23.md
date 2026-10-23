# TradeUp — 23 Ekim 2026 UMP/ATT gizlilik düzeltmesi

## Kapsam ve gerçek durum

- Ret: 1.2.0 (48), Guideline 5.1.2(i), başvuru
  `361da923-c718-4c53-843f-5c4dd86bfd46`. Apple, GDPR ekranının takip anlattığını
  ancak ATT izni istenmediğini bildirdi.
- Kullanıcı Mihenk'teki UMP + ATT yaklaşımına geçişi onayladı. Çalışma dalı
  `codex/first-home-polish`; main, nomination, mevcut başvuru korunur.
- Bu çalışma yeni native build/upload, App Review mesajı/gönderimi, public web
  deployment veya ücretli CI çalıştırma izni değildir.

## Doğrulanan kök nedenler

1. TradeUp binary kaynağı ATT framework desteğini ve usage description'ı özellikle
   kaldırıyordu. AdMob'da yalnız Mihenk'e bağlı yayımlanmış IDFA mesajı bulundu
   (`eeb1ed1bd1173208`, 4 Eylül); TradeUp'a bağlı IDFA mesajı yoktu.
2. JS yalnız GDPR `REQUIRED` ise `showConsentForm` çağırıyordu. Oysa IDFA mesajı
   GDPR `NOT_REQUIRED` veya daha önce `OBTAINED` iken de sunulabilir.
3. `npa: true` tek başına bütün SDK veri kullanımının takip dışı olduğunu ispatlamaz.
   Eski statik ATT-free kontrolü bölgesel, gerçek cihaz form testinin yerine geçmez.

## Uygulanan akış

1. Reklam servisi kapalıysa hiçbir native reklam/UMP çağrısı yoktur.
2. UMP izin bilgisi güncellenir. iOS ATT durumu yalnız okunur.
3. UMP formu mevcutsa `loadAndPresentIfRequired` tamamlanır: uygun bölgesel GDPR
   akışını ve yayımlanmış IDFA mesajı üzerinden Apple ATT penceresini UMP yönetir.
   JS ayrıca ATT istemi çağırmaz; UMP/GDPR kararını aşan ikinci bir istem yoktur.
4. Mobile Ads ancak form tamamlandıktan ve UMP `canRequestAds` ile
   `NOT_REQUIRED`/`OBTAINED` döndürdükten sonra başlatılır. Form veya durum okuma
   hatasında reklam kapalı kalır; temel oyun çalışır, sonraki eylem tekrar deneyebilir.
5. ATT reddi/restriction, UMP'nin izin verdiği NPA/limited reklam yolunu kilitlemez.
   Her iki format `npa: true`; yayıncı birinci taraf ID ve kişiselleştirme kapalıdır.
   IDFA gönderimi için Apple yetkilendirmesini Google SDK uygular.
6. Apple Ayarlar'daki ATT değişikliği hazır reklam slotunu geçersiz kılar. Değişmeyen
   izin tercihlerinde UMP kontrolü hazır reklamı gereksiz yere yeniden yükletmez.
7. +25, kapasite, ödül callback/idempotency, geçiş reklam eşikleri ve IAP hakları
   değişmedi. İzin verme eylemi ödül kazandırmaz; yalnız tamamlanan uygun reklam
   mevcut ödül akışını tetikler. Firebase AnalyticsWithoutAdIdSupport ve tüm
   mevcut opt-in/advertising-storage kapalı varsayımları korunur.

Native patch pnpm lockfile ile sabitlendi; framework linki ve Türkçe/İngilizce
InfoPlist.strings kaynakları eklendi. Eski ATT'yi yasaklayan test/archive/IPA
kontrolleri yeni açık izin sözleşmesini denetleyecek şekilde güncellendi.

## AdMob ve dağıtım kapıları — bitmiş gibi sunulmayacak

- TradeUp'a özel Türkçe varsayılan + İngilizce IDFA taslağı hazırlandı; canlıda
  yayımlanmadı. Mihenk mesajı ve diğer uygulamalar değiştirilmedi.
  Mesaj kimliği `e9fdc4f931e73287`; liste adı `Adsız IDFA açıklayıcı mesajı`, bağlı
  uygulama yalnız TradeUp: Zero to Home, Apple ID `6811362281`. Taslak durumu
  kaydettikten sonra listede, Türkçe ve İngilizce metinler yeniden açılarak doğrulandı.
- IDFA mesajı aynı AdMob app ID'yi kullanan eski binary'leri etkileyebilir.
  Eski ATT'siz paketlerin davranışı doğrulanmadan yayın anahtarını açma.
  UMP'nin eksik usage description bulunan eski sürümü güvenle atladığı
  doğrulanmalı; mümkünse mesajın sürüm hedeflemesi kullanılmalı. Bu doğrulama
  yoksa geçiş için ayrı AdMob iOS app ID / reklam birimi göçü ayrıca planlanır;
  bu çalışmada kimlik veya gelir ayarı değişmedi.
- Yeni paket ile mesajın gerçek eşleşmesi ve yayını olmadan Apple'a
  "ATT sorunu çözüldü / cihazda doğrulandı" yazma.
- Canlı privacy.html değişmedi; yerel kaynak yeni akışı açıklıyor. E-posta
  `nostoscomp@gmail.com` korunur. Yayın zamanı yeni binary ile eşleştirilmeli.
- App Store Connect App Privacy bu tur değiştirilmedi. Mevcut yedi veri türünü
  koruyarak SDK privacy manifest/raporu ve gerçek akışla tekrar değerlendir:
  Device ID (izinli IDFA), Advertising Data ve Product Interaction'ın üçüncü taraf
  reklam/ölçüm kullanımı; coarse location ve diagnostics/performance kapsamı.
  ATT kabul eden kullanıcılar için şirketler arası reklam ölçümü varsa ilgili
  veri türlerini tracking olarak açıkla. Tek başına ATT anahtarı eklemek bütün
  veri türlerini tracking olarak işaretlemeyi veya no-collection demeyi gerektirmez.
- Windows'ta Xcode/native simulator olmadığı için imzalı IPA üretilmedi. Yeni
  build numarası henüz ayrılmadı; sonraki CI öncesi Apple'daki en yüksek numara
  okunup ondan büyük bir sayı seçilmeli. Son bilinen build 48'dir.

## Fiziksel cihaz kabul testi

Testler geliştirici/test cihazında yalnız Google test reklam kimlikleriyle yapılır;
gerçek reklam geliri veya geçerli reklama tıklama oluşturulmaz. Kullanıcının
mevcut oyunu silinmez; yeni/ayrı test cihazı veya yedekli test kurulumu kullanılır.

- iPhone + iPad, EEA ve EEA dışı test geography (yalnız test cihazı/build'inde).
- İlk kurulum: UMP → uygun olduğunda IDFA açıklaması → Apple ATT; önce ad load yok.
- ATT Allow, Deny, Restricted/global tracking-off; karar verilmişken yeniden
  açılışta ikinci istem yok. GDPR amaçlarını reddetme, izin vermeyi geri alma.
- Reddetme durumunda UMP izin veriyorsa test rewarded ve test interstitial
  açılır; completed → +25, cancel/error/no-fill → ödül yok. Oyun akışı sürer.
- Ayarlardan ATT iptali ve UMP privacy options sonrasında eski reklam kullanılmaz.
- Ağ/UMP hata, arka plan/ön plan dönüşü, eski save ve Premium/No Ads hakları.
- Firebase analitik kapalı/açık tercihi ATT'den bağımsız kalır; ATT kabulü
  Firebase reklam tanımlayıcısı veya advertising-storage iznini açmaz.
- App Privacy Report/Ad Inspector ve SDK archive privacy raporu, IDFA/TCF
  sinyalleriyle birlikte kontrol edilir. Statik/unit test sonucu bunun yerine geçmez.

## İnceleme notu taslağı — henüz gönderilmedi

Use only after the corresponding physical checks and message publication:

> This update supports Apple's App Tracking Transparency through Google's UMP
> IDFA consent flow. On a fresh eligible installation, the flow is presented at
> startup during advertising-consent setup, before Mobile Ads initialization or
> any ad loading. In regulated regions, UMP handles regional consent before an
> eligible ATT request. Users who decline tracking retain gameplay and purchase
> rights; eligible non-personalized ads and their normal completion rewards remain
> available. ATT is not requested a second time after an existing decision, and
> device/region restrictions may suppress the prompt. Advertising privacy options
> remain available in Profile & Settings. Firebase analytics is separately opt-in
> and remains configured without advertising-identifier support.

Attach a physical-device recording and exact tested build/device/OS/region results
before using these notes. Do not assert these runtime checks already happened.

## Yerel doğrulama ve çıktı

- Son unit/integration turunda **80 dosya / 524 test** geçti. Lint,
  TypeScript ve production Vite build geçti. Ekonomi/journal ve native-adapter
  entegrasyonu, ATT reddi mock'unda earned → +25, cancel/no-fill → 0 sonucunu
  doğruladı. Bu gerçek cihaz veya gerçek reklam gösterimi testi değildir.
- Signed-IPA verifier'ın 8 sentetik regression testi geçti; bu gerçek imza veya
  fiziksel ATT testi değildir. Sistem Python'u bulunmadığından kurulum yapılmadı;
  mevcut Codex bundled Python kullanıldı.
- Native pnpm patch çevrimdışı mevcut önbellekten uygulandı: sıfır indirme.
- Production web payload `dist/`, native kopyası `ios/App/App/public/`.
  Her ikisinin release-ad-config.json sonucu:
  `{"testEnabled":false,"productionEnabled":true}`. Hiç gerçek reklam açılmadı.
- `pnpm cap:sync:ios`, native UMP/ATT + Firebase privacy kontrolü ve
  `check-review-ad-config` geçti. Son paket kontrolü demo reklam kimliği içermiyor.
- Yerel rapor ve kontroller, imzalı `.ipa` veya TestFlight/App Review teslimatı
  anlamına gelmez. Windows'ta native derleme yapılmadı, CI tetiklenmedi.
- Ekran kanıtı:
  `C:/Users/Gaming/Documents/Codex/2026-10-13/files-mentioned-by-the-user-codex/output/tradeup-att-2026-10-23/admob-idfa-draft.jpg`.

## Birincil kaynaklar

- [Google — UMP IDFA/ATT](https://developers.google.com/admob/ios/privacy/idfa)
- [Google — GDPR/UMP ve ATT sıralaması](https://developers.google.com/admob/ios/privacy/gdpr)
- [Google — SDK veri beyanı](https://developers.google.com/admob/ios/privacy/data-disclosure)
- [Apple — kullanıcı gizliliği ve ATT](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple — App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
