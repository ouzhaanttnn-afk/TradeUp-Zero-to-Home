# TradeUp — 23 Ekim 2026 UMP/ATT gizlilik düzeltmesi

## Kapsam ve gerçek durum

### Güncel teslim kararı

Kullanıcı kalan işleri tamamlama ve TestFlight yükleme onayı verdi. Eski
ATT'siz binary'leri etkilememek için AdMob IDFA taslağı **yayımlanmaz**. Yeni
binary'de UMP tamamlandıktan ve reklam isteğine izin verdikten sonra ATT hâlâ
`notDetermined` ise yerel Apple sistem istemi çağrılır. UMP'nin önceden
sonuçlandırdığı ATT kararı tekrar sorulmaz. İstek bitmeden SDK/ad load başlamaz;
istek sonuçsuz kalırsa fail-closed çalışır, sonraki kullanıcı eylemi deneyebilir.
Native çağrı main queue ve aktif uygulama kontrolüyle yapılır. Bu, ilk
UMP-only taslağının uzaktan aktivasyon bağımlılığını kaldırır.

Güncel yükleme yetkisi yalnız TestFlight'tır; App Review gönderimi, nomination,
main ve mağaza yayını değişmez. Fiziksel cihaz testi yapılmış gibi sunulmaz.
Gizlilik sayfası yalnız mevcut canlı kaynak üzerine tek dosya değişikliğiyle
yayımlanabilir; web oyununun güncellenmesine izin verilmiş sayılmaz.

- Ret: 1.2.0 (48), Guideline 5.1.2(i), başvuru
  `361da923-c718-4c53-843f-5c4dd86bfd46`. Apple, GDPR ekranının takip anlattığını
  ancak ATT izni istenmediğini bildirdi.
- Kullanıcı Mihenk'teki UMP + ATT yaklaşımına geçişi onayladı. Çalışma dalı
  `codex/first-home-polish`; main, nomination, mevcut başvuru korunur.
- İlk kod düzeltme onayı upload içermiyordu; sonraki açık kullanıcı talebiyle
  ücretsiz kotadaki TestFlight teslimi ve gizlilik sayfası düzeltmesi onaylandı.
  App Review mesajı/gönderimi ve ücretli build hâlâ kapsam dışıdır.

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
3. UMP formu mevcutsa `loadAndPresentIfRequired` tamamlanır. Sonrasında yalnız
   UMP reklam istemeye izin veriyorsa ve ATT hâlâ belirsizse yerel sistem istemi
   çağrılır. Var olan Apple kararı tekrar sorulmaz; ATT, UMP amaçlarını geçersiz
   kılmaz ve reklam kişiselleştirmesini açmaz. AdMob IDFA taslağı kapalı kalır.
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
- Yeni yerel ATT yolu uzaktaki IDFA mesajının yayınına bağlı değildir. Fiziksel
  cihaz kontrolü olmadan Apple'a "cihazda doğrulandı" yazma.
- Gizlilik sayfası mevcut canlı commit `bb16682` üzerine yalnız
  `public/privacy.html` değiştirilerek yayımlandı. Yeni kaynak `da013d8`, dal
  `codex/legal-privacy-att-2026-10-23`; diğer tüm kaynak dosyaları birebir aynı.
  Production deployment `dpl_7pkRkjEvk8yaohpm4uUBodZpiodr`, READY, 17 saniye.
  `https://trade-up-zero-to-home.vercel.app/privacy.html` HTTP 200; 23 Ekim tarihi,
  yerel ATT sırası ve `nostoscomp@gmail.com` doğrulandı; eski ATT istemez iddiası yok.
  Main, web oyunu kaynakları ve diğer uygulamalar değiştirilmedi.
- App Store Connect App Privacy bu tur değiştirilmedi. Mevcut yedi veri türünü
  koruyarak SDK privacy manifest/raporu ve gerçek akışla tekrar değerlendir:
  Device ID (izinli IDFA), Advertising Data ve Product Interaction'ın üçüncü taraf
  reklam/ölçüm kullanımı; coarse location ve diagnostics/performance kapsamı.
  ATT kabul eden kullanıcılar için şirketler arası reklam ölçümü varsa ilgili
  veri türlerini tracking olarak açıkla. Tek başına ATT anahtarı eklemek bütün
  veri türlerini tracking olarak işaretlemeyi veya no-collection demeyi gerektirmez.
- Windows'ta Xcode/native simulator yoktur; mevcut ücretsiz Codemagic iş akışı
  kullanılır. CI'nin salt-okunur Apple kontrolü seçilen build numarasının son
  TestFlight numarasından büyük olmasını zorunlu tutar. Son bilinen build 48'dir.

## Fiziksel cihaz kabul testi

### Canlı Apple beyanı kontrolü — 23 Ekim

App Privacy ekranı yeniden okundu: yayımlanmış etiket 7 tür içeriyor ve
"Data Used to Track You" bölümü yok. Privacy Policy URL doğru adreste.
Mevcut App Review kaydı hâlâ build 48 ve manuel yayın durumunda; değiştirilmedi.

Yeni build için beyan eşleştirmesi:

| Veri türü | Mevcut bağlantı | Yeni build kontrolü |
| --- | --- | --- |
| Device ID | Kimliğe bağlı; reklam/analitik | ATT izinli IDFA'nın üçüncü taraf reklam ölçümünde kullanımını tracking olarak beyan et. |
| Advertising Data | Kimliğe bağlı; reklam/analitik | SDK raporuyla IDFA'ya bağlanan gösterim/etkileşim ölçümünün tracking kapsamını doğrula. |
| Product Interaction | Kimliğe bağlı; reklam/analitik/işlev | AdMob etkileşimleri ile ayrı opt-in, ad-ID'siz Firebase olaylarını ayır; reklam ölçümündeki çapraz-uygulama bağını doğrula. |
| Coarse Location | Kimliğe bağlı; reklam/analitik/işlev | IP kaynaklı yaklaşık konum; izinli ölçümle ilişkilendirme varsa tracking beyanına dahil et. GPS izni eklenmedi. |
| Crash Data | Kimliğe bağlı değil; analitik | Non-user crash log sözleşmesini koru; IDFA var diye otomatik tracking işaretleme. |
| Performance Data | Kimliğe bağlı değil; reklam/analitik/işlev | Google'ın user-associated performance tanımını archive privacy raporuyla karşılaştır; gerekirse linked yanıtını düzelt. |
| Other Diagnostic Data | Kimliğe bağlı değil; reklam/analitik | Teknik teşhis kapsamını SDK raporuyla doğrula. |

Bu tablo yayınlanmış yeni etiket değildir. Google'ın genel SDK kılavuzu tek başına
tüm veri türlerinin tracking cevabını belirlemez. İmzalı paket/cihaz raporunu
görmeden tüm türleri topluca tracking veya no-collection olarak değiştirme.
App Review'a yeniden gönderimden önce bu eşleştirmeyi tamamla; TestFlight
yüklemesi App Review'un tamamlandığı anlamına gelmez.

Testler geliştirici/test cihazında yalnız Google test reklam kimlikleriyle yapılır;
gerçek reklam geliri veya geçerli reklama tıklama oluşturulmaz. Kullanıcının
mevcut oyunu silinmez; yeni/ayrı test cihazı veya yedekli test kurulumu kullanılır.

- iPhone + iPad, EEA ve EEA dışı test geography (yalnız test cihazı/build'inde).
- İlk kurulum: UMP → uygun olduğunda yerel Apple ATT; önce ad load yok.
  UMP ATT'yi zaten sonuçlandırmışsa yerel istem tekrarlanmaz.
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

Use only after the corresponding physical checks (the remote IDFA draft stays off):

> This update supports Apple's App Tracking Transparency after Google's UMP
> regional consent flow. On a fresh eligible installation, the flow is presented at
> startup during advertising-consent setup, before Mobile Ads initialization or
> any ad loading. In regulated regions, UMP handles regional consent before an
> eligible local ATT request if the Apple decision remains undetermined. Users who decline tracking retain gameplay and purchase
> rights; eligible non-personalized ads and their normal completion rewards remain
> available. ATT is not requested a second time after an existing decision, and
> device/region restrictions may suppress the prompt. Advertising privacy options
> remain available in Profile & Settings. Firebase analytics is separately opt-in
> and remains configured without advertising-identifier support.

Attach a physical-device recording and exact tested build/device/OS/region results
before using these notes. Do not assert these runtime checks already happened.

## Yerel doğrulama ve çıktı

### 23 Ekim TestFlight teslimi

- Kaynak commit `16ecb58a7058c51f13221b2f2d7b3b99649ad142` feature dalına pushlandı.
- Apple TestFlight ekranında en yeni numara 48 olarak yeniden doğrulandı;
  tek ücretsiz Codemagic işi 49 girdisiyle 22:17 GMT+3'te başlatıldı.
- İş `6adbb2b04a72334e32e48176`, workflow `tradeup-ios-testflight`, Mac mini M2.
  Kota ekranı 304 / 500 ücretsiz macOS dakikası gösterdi; abonelik açılmadı.
- İş URL: https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6adbb2b04a72334e32e48176
- İş **FINISHED**, süre **4m 22s**; release-source test/lint/build, native privacy,
  gerçek archive codesign ve IPA verifier kapılarının tümü geçti.
- Apple uploader sonucu **UPLOAD SUCCEEDED with no errors**, 22:21 GMT+3;
  Delivery UUID `4837f3e7-a224-405a-a87b-4cbb683aa020`. TestFlight Build Uploads
  ekranında **1.2.0 (49), Processing** olarak görüldü.
- İmzalı paket Codemagic Artifacts bölümünde `App.ipa` (**22.00 MB**);
  sunucu yolu `/Users/builder/clone/build/ios/ipa/App.ipa`. Aynı işin
  `TradeUp-Zero-to-Home_8_artifacts.zip` çıktısı verifier ve entitlement raporlarını
  içerir. Chrome yerel IPA indirmesini `ERR_BLOCKED_BY_CLIENT` ile engelledi;
  güvenlik koruması değiştirilmedi, yerel dosya/ikinci doğrulama varmış gibi sunulmaz.
- Apple işleme tamamlandı. **1.2.0 (49)** build detayında **Betatest / Internal / 3**
  erişimi doğrulandı; yeni tester/grup eklenmedi. İlk listedeki "Ready to Submit"
  dış Beta Review durumudur; mevcut internal grup bu build'e erişebiliyor.
- "What to Test" Türkçe izin, ret, yeniden açılış, +25/cancel, eski kayıt/IAP ve
  ayrı Firebase tercih kontrolüyle kaydedildi; Save yeniden disabled oldu.
- TestFlight: https://appstoreconnect.apple.com/apps/6811362281/testflight/ios/4837f3e7-a224-405a-a87b-4cbb683aa020
- TestFlight erişim/not kanıtı:
  `C:/Users/Gaming/Documents/Codex/2026-10-13/files-mentioned-by-the-user-codex/output/tradeup-att-2026-10-23/testflight-49-ready.jpg`.
- Canlı destek ve app-ads.txt ayrıca HTTP 200; destek e-postası
  `nostoscomp@gmail.com`, yayıncı `pub-4229088811556918` doğrulandı. Bu iki
  dosya bu tur değiştirilmedi. AdMob mesaj taslağı kapalı; fiziksel cihaz ATT
  kontrolü ve yeni sürüm App Privacy eşleştirmesi inceleme öncesi kabul kapılarıdır.
- Apple yükleme kanıtı:
  `C:/Users/Gaming/Documents/Codex/2026-10-13/files-mentioned-by-the-user-codex/output/tradeup-att-2026-10-23/testflight-upload-succeeded-49.jpg`.
- Canlı gizlilik yayın kanıtı:
  `C:/Users/Gaming/Documents/Codex/2026-10-13/files-mentioned-by-the-user-codex/output/tradeup-att-2026-10-23/privacy-live-20261023.jpg`.

- Son unit/integration turunda **80 dosya / 530 test** geçti. Lint,
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
  anlamına gelmez. Windows'ta native derleme yapılmadı. Yetkili tek ücretsiz
  TestFlight CI işinin sonucu ayrıca kaydedilir; App Review gönderimi yapılmaz.
- Ekran kanıtı:
  `C:/Users/Gaming/Documents/Codex/2026-10-13/files-mentioned-by-the-user-codex/output/tradeup-att-2026-10-23/admob-idfa-draft.jpg`.

## Birincil kaynaklar

- [Google — UMP IDFA/ATT](https://developers.google.com/admob/ios/privacy/idfa)
- [Google — GDPR/UMP ve ATT sıralaması](https://developers.google.com/admob/ios/privacy/gdpr)
- [Google — SDK veri beyanı](https://developers.google.com/admob/ios/privacy/data-disclosure)
- [Apple — kullanıcı gizliliği ve ATT](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple — App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
