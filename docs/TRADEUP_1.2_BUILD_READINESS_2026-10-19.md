# TradeUp 1.2 — 19 Ekim uygulama ve doğrulama

## 21 Ekim 2026 — App Review teslimi

Kullanıcı son TestFlight paketini incelemeye göndermeyi açıkça istedi; nomination korunur. Aşağıdaki tamamlanmış teslim, bu belgedeki önceki no-App-Review kısıtını yalnız bu gönderim için geçersiz kılar.

- Canlı TestFlight kontrolünde en yeni paket **1.2.0 (48)**; mevcut Betatest grubu, 1 kurulum / 2 oturum görüldü. Yeni native build veya upload yapılmadı.
- 1.2.0 sürüm kaydı oluşturuldu, build 48 bağlandı, Türkçe yenilikler ve İngilizce inceleme rehberi güncellendi. **Manually release this version** seçili; otomatik yayın açılmadı. Mevcut beş iPhone mağaza görseli korundu.
- Uygulama ve üç Game Center leaderboard tek başvuruda gönderildi: **361da923-c718-4c53-843f-5c4dd86bfd46**. Apple UI **21 Ekim 2026 22:21**, **Items Submitted (4)** ve dört öğenin tamamı için **Waiting for Review** gösterdi. [Canlı başvuru](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/361da923-c718-4c53-843f-5c4dd86bfd46).
- Ekran kanıtı: ignored `release-artifacts/app-review-1.2.0-48-waiting-2026-10-21.png`. Bu gönderim onayıdır; Apple kabulü veya mağaza yayını değildir.
- App Privacy'de mevcut yedi SDK veri tipi ve takip beyanı olmayan yapı kontrol edildi; bu tur etiket değiştirilmedi. Game Center Apple üzerinden çalışır; kendi sunucumuza profil/skor yükleme eklenmedi. [Apple açıklaması](https://developer.apple.com/app-store/app-privacy-details/): Apple'ın topladığı verilerden geliştirici sorumlu değildir; geliştiricinin ayrıca topladığı veriler açıklanmalıdır. Fiziksel cihaz testleri yapılmış gibi sunulmadı.
- Kullanıcının ayrı onayıyla canlı gizlilik sayfasına mevcut Game Center ve yerel paylaşım açıklaması eklendi; `nostoscomp@gmail.com` korundu. Yalnız `public/privacy.html` değişen `bb16682ccd23dbf76af4f2cc2db1438c1361eecd`, `codex/legal-privacy-2026-10-21` dalından yayımlandı. Ebeveyn, önceki canlı `5929c89c1b909c45eb94e092acd8ba0d5b2100d2`; diğer kaynak dosyaları için `git diff --exit-code` geçti.
- Vercel üretim deployment **dpl_5382JK4H1igXpw9aAGHnmxaXr5uZ**, **READY**, doğru üretim alan adı bağlı; canlı sayfada yeni bölüm doğrulandı. Kaynak farkı yalnız gizlilik HTML'i; web oyunu kaynak kodu, bağımlılıklar, destek ve app-ads dosyaları değişmedi. Üretim build yaklaşık 15 saniyede tamamlandı. Main merge veya native CI tetiklenmedi.
- Uzak main **142caa35a3e4483303f4fcfbb82fd47bc7a4783e** ve uygulama dalı **d97d3d8654c685d07558fc11f446d8396c8cd997** korundu. Nomination tarihi/içeriği değiştirilmedi. Bu tur uygulama kodu değişmedi; 19 Ekim test ve imzalı build sonuçları yeniden çalıştırılmış gibi raporlanmaz.
- Önceki `.p8` yolu artık yoktu; anahtar aranmadı veya yeniden üretilmedi. Gönderim oturumu açık resmi Apple arayüzünden tamamlandı. İlk Git credential-manager push beklediği için iptal edildi; mevcut `gh` keyring kimliğiyle yalnız legal dal pushlandı. Token/anahtar dışarı yazılmadı. Geçici indeks silindi.

Dal: `codex/first-home-polish`. Kullanıcı önerileri ve Game Center barındırmalı Top 100 kurulumu kapsamında. Kullanıcı 19 Ekim'de yalnız bu dalı pushlama ve ücretsiz kotada tek IPA-only Codemagic build onayı verdi; metin seçimi düzeltmesinden sonra devam etmeyi yeniden onayladı. Main, mevcut App Review ve nomination korunur. Merge, TestFlight/App Store upload, ücretli build veya yayın yetkisi yoktur.

Güncel teslim onayı: kullanıcı son olarak `Teste gönder` diyerek yalnız TestFlight yüklemesini onayladı. Bu teslim için önceki no-upload sınırı kalktı; main merge, App Review ve mağaza yayını hâlâ yasak. Hedef 1.2.0 (48), Apple'daki son build 47 olarak tekrar okundu. Codemagic'te `tradeup_game_center_distribution_20261019` profilinin mevcut `tradeup_distribution` sertifikasıyla eşleştiği doğrulandı. TestFlight workflow'u aynı Game Center imza/paket kontrollerini yüklemeden önce çalıştırır; yalnız mevcut iç `Betatest` grubuna erişim hazırlanır, yeni davet veya halka açık link yoktur.

## Tamamlanan TestFlight teslimi

19 Ekim 2026: **1.2.0 (48)** Apple'da `VALID`, iç test durumu `IN_BETA_TESTING`. App Store Connect build kimliği `e99c28b5-6fb2-445e-ad64-9f66db33b8a4`. Mevcut iç `Betatest` grubu (`184db05f-f055-434c-969d-97bdffadd54d`, 3 testçi) bu build'e otomatik erişti; `GET /betaGroups/{id}/builds` ile 48 doğrulandı ve UI'da Build 48 / Betatest / 3 görüldü. Grup veya yeni davet oluşturulmadı. `GET /builds/{id}/betaGroups` ilişkisi GET_RELATED desteklemediği için 403 verdi; izin yükseltmeden, resmi ters ilişki okuması kullanıldı.

- [Başarılı Codemagic build 7](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ad6517e7550aed8109037e7), kaynak `eeb008ad914a8eb6f71deeada8c9c4df2aad795c`, yalnız `codex/first-home-polish`.
- Native archive/export, `codesign --verify --deep --strict`, signed Game Center entitlement / IPA profil doğrulaması geçti. IPA bulut artifact'ı `App.ipa`, 22.00 MB. Altool `UPLOAD SUCCEEDED with no errors` dedi; delivery UUID yukarıdaki build kimliğiyle aynı. Yerel imzalı IPA indirilmedi; yerel `dist` web çıktısı IPA diye sunulmaz.
- Türkçe TestFlight test notları oluşturuldu: `4945c732-5971-4251-85dd-673df63f3f7f`. Emlak/Evim, isteğe bağlı üç Game Center listesi, ilk ev paylaşımı, metin seçimi ve kayıt devamı testleri anlatılır.
- TestFlight iOS liste ekranındaki `Ready to Submit` metni dış beta inceleme seçeneğidir; API iç test durumu `IN_BETA_TESTING` ve mevcut 3 testçi erişimi doğrulandı. Dış Beta Review / App Review gönderilmedi, mağazada yayınlanmadı. Mevcut 1.1.2 mağaza sürümü ve nomination korunur.
- Başarılı yükleme ekran kanıtı: ignored `release-artifacts/testflight-48-upload-succeeded-2026-10-19.png`. Apple sayfası screenshot çağrısı zaman aşımına uğradı; Apple erişimi API + canlı DOM ile doğrulandı, olmayan ekran görüntüsü kanıtı iddia edilmez.
- Tek ek build, kullanıcının açık onayıyla mevcut ücretsiz M2 kotasında çalıştı; ücretli abonelik/servis açılmadı. Main uzak SHA `142caa35a3e4483303f4fcfbb82fd47bc7a4783e` olarak korundu. Fiziksel cihaz Game Center/paylaşım/reklam testleri hâlâ testçinin yapacağı çalışma zamanı kapılarıdır.

## Uygulananlar

- Mevcut evler Pazar/Emlak'ta; Tümü'nde en fazla bir ev. Fiyat, keşif süresi, araştırma ve kanonik satın alma muhasebesi değişmedi. Yolculuk satın alma ekranı yerine Pazara yönlendirir.
- Ev detayı büyük görsel/fallback, tam bedel, nakit eksiği ve açık onay sunar. Mevcut ev takas bedeli olmadığı açıkça anlatılır. Modal ana shell'e portal ile açılır: sticky filtre/nav üstüne çıkması doğrulandı.
- Yolculuk'ta kalıcı Evim ve Portföy kısayolu; yükseltmeden bağımsız ilk ev anısı, eski kayıt ve sahiplik korunur.
- İlk ev başarı kartı 1080×1350 PNG cihazda; isim varsayılan kapalı, önizleme, indirme/Web Share. iOS için mevcut köprüde UIKit UIImage paylaşımı; yeni paket, dosya/cache, galeri izni veya paylaşım sunucusu yok. Native paylaşım kodlandı ama fiziksel cihazda henüz doğrulanmadı.
- Game Center köprüsü, iOS launch yolları/entitlement, isteğe bağlı Top 100 paneli ve açık skor gönderme onayı. Üç liste: servet zirvesi, ilk 100 ticaret net kârı, ilk ev bütçesine ticaret. Eski kaydı sıfırlama veya ikinci kariyer zorunluluğu yok. Yerel isim/oyun kaydı yüklenmez. Eksik/uzlaşmayan/sandbox kayıt ve güvenli sayı sınırı kontrolleri var; bunlar sunucu hile doğrulaması değildir.
- Skorlar hesap bağını native tarafta kontrol eder; hesap değişince önceki onayla otomatik gönderilmez. En iyi skor Apple'da tutulur. Game Center, oyun kaydını yedeklemez.
- UMP izni + güncel StoreKit hak kontrolünden sonra tek MARKET_SCOUT reklamı ön yükleme. Hazır slot tekrar indirilmeden kullanılır; placement kimliği, bir saatlik son kullanma, geri saat ve izin değişimi kontrolleri. Yüklemeler seri; erken kapatma/boş reklam ödül vermez. Hazırlık tek başına gösterim veya ödül değildir. +25, 50/25 kapasite, doğal dolum, Premium/Reklamsız, diğer placement ve 30 ticaret kuralı değişmedi.
- Gizlilik metninin yerel kaynağı Game Center ve paylaşım davranışını anlatır; e-posta `nostoscomp@gmail.com`. Canlı web sitesi bu tur yayımlanmadı.
- Yüksek kâr için fiyat/katsayı/oyun temposu değiştirilmedi. Gerçek oyuncu dağılımı ve sayısal öneri ayrı ölçüm/onay kapısıdır. Yeni ürün ailesi/raster üretilmedi; mevcut persona metinleri ve ürün altyapısı korunur.

## Apple ve AdMob'da tamamlanan hazırlık

- Apple'da TradeUp Game Center kaydı, üç classic BEST_SCORE sıralama, her biri tr/en-US başlık ve açıklama, bundle Game Center capability oluşturuldu. Son GET ile üç liste/altı dil kaydı ve IAP + Game Center capability doğrulandı. [Makbuz](APPLE_GAME_CENTER_SETUP_2026-10-19.md).
- Kullanıcı aynı reklam içindeki ikinci bölüm sorununu netleştirip kapatmaya onay verdi. Yüksek etkileşimli reklamlar app düzeyinde; Ad pods dört ödüllü birimde kapatılıp kaydedilmiş türler doğrulandı. Reklamlar veya +25 kapatılmadı. Bu canlı ayar güncelleme gerektirmez; önceden yüklenen yaratıcılar hemen değişmeyebilir. Normal bitiş kartı/etkileşimli biçim kalabilir. [Ayrıntı/kanıt](ADMOB_SHORT_ADS_2026-10-19.md).

## Test kanıtı

- İlk Codemagic TestFlight denemesi `6ad629597550aed8109029d2` (commit `6f9b0eb`, 1m23s) arşiv/imza/yüklemeye geçmeden durdu. Sebep: eski test YAML içinde bundle-based signing metnini arıyordu; profil referansına geçiş sonrası test güncellenmemişti. Test silinmedi: gerçek IPA verifier'ın bundle doğrulaması ve her iki workflow'da eşleşen profil/sertifika + signed Game Center kontrolü test edildi. Son yerel tam tur **79 dosya / 513 test**, lint/TypeScript, üretim build ve **7 Python verifier testi** geçti. Kullanıcı yalnız bir ek ücretsiz TestFlight denemesini açıkça onayladı; aynı 48 numarası henüz Apple'a yüklenmediği için yeniden kullanılabilir.
- Son kullanıcı ekran görüntüsündeki uzun basma/metin seçimi için oyun kökünde `user-select: none` ve iOS `-webkit-touch-callout: none` eklendi; input/textarea/düzenlenebilir alanlar seçilebilir kalır. Ek paket veya dokunma olayını engelleyen JavaScript yok. 512 test, lint/TypeScript ve üretim build geçti; tarayıcı regresyonunda pazar/detay metnini sürükleyerek seçememe + profil adını seçme/düzenleme/kaydetme geçti. İlk test, başlangıç defteri teklifi kabul edilmeden pazar kartı beklediği için başarısızdı; gerçek ilk satış akışı eklenerek 1/1 geçti. Fiziksel iOS uzun basma son kontrolü henüz yapılmadı. Kullanıcının `dur` talebi üzerine push/IPA build başlatılmadı.
- Son tam tur: **79 dosya / 512 birim testi geçti**. Journal/100. ticaret/zarar, yalnız mevcut evin servete dahil olması, yerel veri gizliliği, sandbox/eksik kayıt ve native payload sınırı; ön yükleme/dedup/son kullanım/izin iptali/yanlış placement/no-fill/ad-free regresyonu kapsanır.
- `pnpm lint`, `pnpm exec tsc -b --pretty false`, `pnpm build` geçti. `node scripts/check-native-ad-privacy.mjs` geçti; ATT/IDFA eklenmedi, UMP-before-ads ve ad-ID'siz Analytics korunur.
- Tarayıcı: ilk 8 senaryo (ilk ev satın alma-final-paylaşım PNG-indirme-kayıt-yeniden açma, pazar 320/430 ve yenileme/reklam düğmesi 320/390/430) geçti. Modal portal düzeltmesinden sonra ilk ev akışı 1/1 yeniden geçti.
- Yeni 4 tema/genişlik matrisi 4/4 geçti: Klasik 320, Gece Pazarı 375 büyük yazı, Atölye 390, Obsidyen 430 büyük yazı. Yetersiz nakit, tek/çok ev kartı, yatay taşmama, modal kapatma kontrolünün örtülmemesi, Escape ve odak dönüşü doğrulandı. İlk deneme dört kez yanlış test metni (`nakit eksik` yerine gerçek `Nakit eksiği`) yüzünden başarısızdı; uygulama metni değiştirilmeden test düzeltildi ve dört senaryo geçti.
- Üretim CSS bütçesi yeni stilleri ana pakete ekleyince aşıldı; limit artırılmadan yeni ekranlara lazy CSS ayrıldı ve build geçti. JS/CSS teslim bütçeleri korunur. React kontrolünde lazy panel, effect temizliği, object URL temizliği, çift tık kilidi ve erişilebilir form etiketleri değerlendirildi.

Web çıktı: `C:\Users\Gaming\Desktop\TRADEUP\dist`. Bu imzalı IPA değildir. Yeni Apple build numarası ayrılmadı veya yüklenmedi; geliştirme sürümü 1.2.0 olarak kalır.

## Yayından önce kalanlar

1. Native imza/derleme kapısı TestFlight 48 ile geçti; fiziksel cihaz çalışma zamanı doğrulaması bunun yerine geçmez.
2. Fiziksel iPhone/iPad Game Center sandbox giriş/iptal/hesap değişimi, gerçek top 100/kendi sıra ve skor gönderimi. Bu tur test/üretim skoru gönderilmedi.
3. Fiziksel cihazda test reklamlarıyla soğuk/sıcak açılış gecikmesi ve native paylaş/iptal. Gelir üreten test/tıklama yapılmadı; gecikme süresi ölçülmüş gibi raporlanmaz.
4. %200 metin/VoiceOver/kontrast tam release matrisi, StoreKit restore, son build'e ait gerçek iPhone/iPad mağaza çekimleri. Büyük yazı testi bu tam erişilebilirlik değerlendirmesinin yerine geçmez.
5. Canlı gizlilik kaynağı ve App Privacy beyanının gerçek Game Center veri davranışıyla eşleştirilmesi; yeni sürümün Game Center review bağlantıları. Mevcut başvuru değişmedi; bu blok yayın onayı değildir.

Yeni bağımlılık, raster üretimi, ücretli servis veya arka plan daemon'u yok. Playwright tek worker ile kendi preview süreçlerini açıp kapattı. OmniRoute çağrısı 0; subagent kullanılmadı. Ponytail mevcut motor/asset/köprüyü korumakta; React ve uçtan uca doğrulama becerileri UI güvenliği ve test sınırlarını belirlemekte kullanıldı.
