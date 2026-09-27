# TradeUp iOS Release Readiness

## 27 Eylül 2026 güncel durum

- Yerel kalite kapısı: 385 birim testi, lint, production build ve tam Playwright taraması (37 başarılı, 1 isteğe bağlı görsel üretimi atlandı) geçti. 320 ve 430 pikselde büyütülen ürün görselleriyle 3×3 pazar düzeni doğrulandı. Rehberli ilk satın alma akışını bekleyen eski testler, güncel serbest pazar ve 50 erken oyun tarama kuralına göre yenilendi.
- App Store Connect'te iOS 1.0.1 **(35)** TestFlight build'i işlenmiş, **Ready to Submit** ve Betatest grubuna bağlı (3 testçi). Ancak mevcut reddedilmiş 1.0.1 dağıtım başvurusu hâlâ eski build **14**'e bağlı; 35 App Review'a gönderilmedi. Önceki red, iPad Air 11 inçte cihaz uyumluluğuydu; yeni build iPhone hedefli.
- Ürün görseli ölçeği ve güncel mağaza görseli kaynağını içeren `1441065` commit'i için iOS 1.0.1 **(36)** [TestFlight iş akışı](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/36339975398) başarıyla tamamlandı; imzalı IPA Apple'a yüklendi. Son kontrol sırasında 36 henüz TestFlight build listesinde görünmüyordu: Apple işlemesi, testçi erişimi ve gerçek cihaz smoke testi doğrulanmadan hazır sayılmaz. App Review'a gönderilmedi.
- Altı GDD v2.2 kalıcı IAP kaydı mevcut. Premium **Ready for Review**, diğer beşi **Prepare for Submission**. ABD taban fiyatları tek tek doğrulandı: Premium $4.99; Reklamsız, Gece Pazarı ve Atölye $1.99; Ev Stilleri ve Canlı Avatarlar $2.99. Reklamsız ürününün Türkçe mağaza metni ayarlandı. Ev Stilleri ve Canlı Avatarlar ürünlerinin eksik 175 bölge erişimi de tamamlandı; Atölye ve Gece Pazarı zaten tüm bölgelerde. Beş yeni üründe inceleme ekran görüntüsü yok; gerçek TestFlight satın alma/kozmetik ekranlarından alınmış görseller olmadan incelemeye hazır sayılmıyorlar.
- App Privacy etiketi, build 34 IPA içindeki Google Mobile Ads ve User Messaging Platform `PrivacyInfo.xcprivacy` bildirimleriyle karşılaştırılıp **7 veri türü** (yaklaşık konum, cihaz kimliği, ürün etkileşimi, reklam verisi, çökme, performans, diğer tanılama) olarak 27 Eylül'de Apple'da yayımlandı. Cihaz kimliği SDK bildirimi uyarınca takip kapsamındadır. Ancak build 34 `Info.plist` içinde ATT açıklaması yok; gerçek cihazdaki takip izni ve reklam veri akışı doğrulanmadan bu build App Review'a sunulmamalı.
- Takip izni için iOS açıklaması ve ilk reklamdan önce izin durumu denetimi build 35'e girdi; izin akışı hata verirse reklam atlanır, oyun/satış engellenmez. IPA'da açıklama anahtarı doğrulandı. Gerçek cihazda izin ekranı, reklam iptali ve satın alma smoke testi yine tamamlanmalıdır.
- `privacy.html` ve `support.html` canlı HTTPS adresleri 27 Eylül'de dış ağdan HTTP 200 döndürdü. Bu erişim denetimi, gizlilik metni ile Apple veri beyanının içerik olarak uyumlu olduğu anlamına gelmez.
- Mevcut App Review başvurusu unresolved/rejected durumunda; Apple bu başvuruya yeni IAP eklenmesine izin vermiyor. Mevcut başvuruyu güncel TestFlight build'i ve Premium ile yeniden sunmak ya da mevcut başvuruyu sonlandırıp altı IAP hazırlandıktan sonra yeni başvuru açmak ayrı yayın kararı gerektirir. İki seçenekten hiçbiri henüz uygulanmadı; manuel yayın ayarı korunuyor.
- [12 Ekim 2026 tarihli App Launch adaylığı](https://appstoreconnect.apple.com/apps/6811362281/distribution/nominations/edit/b68b21ef-11c6-442a-b317-aee75325d2a3), **Featuring Nominations → Submitted (1)** altında görünüyor (son güncelleme 23 Eylül). Bu Apple editörlerinin öne çıkarma değerlendirmesidir; App Review onayı, yayın randevusu veya 12 Ekim'de otomatik yayın taahhüdü değildir. Adaylıkta iPhone ile iPad birlikte seçili; güncel iPhone hedefli build ile iPad seçimi uyumsuz. “Helpful Details” metni `1TradeUp` yazım hatasıyla başlıyor. Bu alanlar Apple'da düzeltilene kadar açık takip maddesidir.
- Mevcut 1.0.1 App Store sayfasında hâlâ dört eski 6.5 inç iPhone ekran görüntüsü ve build **14** bulunuyor. Güncel arayüzden üretilen beş açıklamalı 1284×2778 görsel [`store-assets/ios/iphone-6.5-story-v101/`](../store-assets/ios/iphone-6.5-story-v101/) konumunda hazırlandı; ilk üç kare pazar, portföy ve ev yolculuğunu gösteriyor. Bunlar henüz Apple'a yüklenmedi. 13 inç iPad görseli de yerelde güncellendi; iPad desteği kapalı kalacaksa App Store'a yüklenmesi gerekmiyor.

## Önceki tarihsel kayıtlar

## Repository tarafında tamamlananlar

- Capacitor iOS 8.5.1 projesi `ios/App` altında oluşturuldu.
- Bundle kimliği `com.tradeup.zerotohome`, uygulama adı `TradeUp` olarak ayarlandı.
- iPhone ve iPad yalnız portre yönünde çalışacak şekilde sınırlandı.
- Safe-area, dinamik viewport, iOS klavye yakınlaştırması, kaydırma ve dokunma davranışları cilalandı.
- Türkçe belge dili, iOS standalone meta alanları, Apple touch icon, marka AppIcon ve özel launch görseli eklendi.
- `pnpm cap:sync:ios` komutu eklendi ve güncel production build iOS projesine başarıyla senkronlandı.
- Unit, lint, production build ve 320–430 px tarayıcı kalite kapıları geçiyor.

## 19 Eylül 2026 denetimi

- Önceki iOS 1.0 (13) inceleme başvurusu kaldırıldı. TradeUp iOS **1.0.1 (14)** ve `tradeup_premium_lifetime`, 19 Eylül 2026 23:58 (Türkiye saati) itibarıyla aynı [yeni inceleme başvurusunda](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/eef19a40-c8f2-477e-ae49-b61650b23d11) **Waiting for Review** durumunda. Onay sonrası yayın manuel seçili; henüz mağazada yayımlanmış değildir.
- 1.0.1 için dört açıklamalı iPhone mağaza görseli pazar, portföy, ev yolculuğu ve profil sırasıyla yüklendi. İlk üç görsel kurulum sayfasında kullanılacak.
- Uygulama fiyatı ücretsiz, dağıtım 175 bölgede ayarlı. 13 inç iPad ekran görüntüsü eklendi. Test edilmemiş Mac ve Vision Pro dağıtımı kapatıldı. Premium fiyatı ABD'de $4.99, Apple'ın otomatik Türkiye karşılığı ₺249,99.
- Diğer dört GDD ürünü (`tradeup_theme_night_market`, `tradeup_theme_workshop`, `tradeup_home_styles_01`, `tradeup_animated_avatars_01`) henüz App Store Connect'te oluşturulup incelemeye gönderilmedi; bu başvurunun parçası değildir. Bunlar canlı satın almaya hazır sayılmamalı.
- App Store inceleme iletişim bilgileri kullanıcının onayıyla girildi. App Privacy beyanı yayımlanmış ve "Data Not Collected" gösteriyor; üretim reklamları açılmadan önce SDK'nın gerçek veri akışıyla tekrar mutabakat zorunlu.

- Son başarılı iOS arşivleme, imzalı IPA dışa aktarma ve App Store Connect yükleme iş akışı: [GitHub Actions #35468044444](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/35468044444), `f909df9` commit'i. Bu, gerçek cihazda StoreKit/AdMob testi veya App Store inceleme onayı değildir.
- GitHub üretim dağıtımı Vercel'e bağlıdır. App Store Connect'e şu sabit URL'ler girilmeli: `https://trade-up-zero-to-home.vercel.app/privacy.html` (gizlilik) ve `https://trade-up-zero-to-home.vercel.app/support.html` (destek). Bu URL'lerin dış ağdan erişimi yayın öncesi tekrar doğrulanmalıdır.
- Gizlilik, kullanım koşulları ve destek sayfaları uygulamanın Profil ve Ayarlar ekranından erişilebilir.
- iOS StoreKit 2 köprüsü ve beş kalıcı ürünün mağaza fiyatı/satın alma/geri yükleme akışı bağlandı. Hak yalnız StoreKit'in güncel doğrulanmış entitlement listesinde işlem görüldüğünde veriliyor; eksik/iade edilmiş hak geri alınıyor. Web ve Android satın alma kapalı. App Store Connect'te beş ürün kaydı ve gerçek cihazda sandbox testi tamamlanmadan canlı satış hazır sayılmaz.
- iOS AdMob köprüsü, dört ödüllü reklam birimi ve her 30 tamamlanmış ticaret sonrası tek geçiş reklamı kodda var; yayın reklamı çevre değişkeniyle kapalı. Testte resmi test birimi kullanılıyor. Google Mobile Ads SDK olası veri toplama türleri için gizlilik metni ve App Store veri beyanı birbirine uygun tutulmalı.
- 19 Eylül onaylı erken oyun kuralında ilk 30 tamamlanmış pazar ticaretine kadar tarama sınırı 50, sonrasında 25. Yeni kayıt 50 hakla başlar; mevcut kayıt hakkını korur ve 30. satışta fazlası 25'e indirilir. Kayıt geçişi, hak yenilenmesi ve eşik birim testlerinden geçiyor; satış sonrası kaydın gerçek cihazda kalması yine doğrulanmalı.
- Güncel ilk oturumda rehber aşamalar kaldırıldığı hâlde bazı eski `firstSession.e2e.ts` ve `mobile.e2e.ts` senaryoları bu adımları bekliyor. Bu testler yeni kullanıcı akışına göre yenilenmeden tam tarayıcı kalite kapısı yeşil değil.

## İnceleme sonrası ve yayından önce kalanlar

1. Apple'ın inceleme sonucunu izle; onay gelmeden sürümü yayımlanmış sayma. Manuel yayın seçimi korunur.
2. Kalan dört kalıcı ürünü App Store Connect'te oluşturup fiyat, yerelleştirme ve inceleme görselleriyle ayrı incelemeye gönder.
3. Gerçek iPhone'da sandbox satın alma, geri yükleme, iptal/iade, reklam izinleri, çevrimdışı kayıt, safe-area ve düşük bellek smoke testlerini tamamla.
4. Üretim reklamları etkinleşirse App Privacy beyanını AdMob SDK'nın gerçek veri akışıyla uyumlu hâle getir.
5. Eski ilk oturum adımlarını bekleyen tarayıcı e2e senaryolarını güncelle ve tam tarayıcı kalite kapısını yeniden çalıştır.

Üretim reklam ve IAP anahtarları yayın kalitesinden önce repository'ye yazılmaz; Xcode/CI secret alanlarında tutulur.
