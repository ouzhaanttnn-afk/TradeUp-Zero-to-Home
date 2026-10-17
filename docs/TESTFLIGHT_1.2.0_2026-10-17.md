# TradeUp 1.2.0 geliştirme betası — TestFlight

17 Ekim 2026. Kullanıcı “teste yükle” ve “Devam” diyerek mevcut uygulama paketinin TestFlight'a yüklenmesini istedi. Bu yetki App Review, mağaza yayını, main merge veya ücretli build aboneliği değildir.

- Kaynak: `codex/first-home-polish`; özellik paketi `2cd8274`.
- Paket: 1.2.0; planlanan build 47. Apple'daki son build 46 olarak canlı TestFlight ekranında görüldü. CI ayrıca son numarayı Apple API'sinden kontrol edip çakışmada durur.
- 1.1.2 (46) mağaza incelemesi değiştirilmez. Mevcut altı satın alma ve üretim reklam izinleri korunur.
- Codemagic ücretsiz M2 kotası: işlem öncesi 204/500 dakika kullanılmış. Yalnız bir native build hedeflenir; yeni ödeme/abonelik yok.
- Yalnız native test dalında `git.deploymentEnabled=false` ile Vercel otomatik dağıtımı engellenir; main veya diğer dallar etkilenmez. Resmi dayanak: https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled
- 1.2 tamamlanmış release değildir: paylaşım kartı/native paylaşım, tam fiziksel cihaz QA ve editoryal paket henüz bitmedi; global Top100 ayrıca 1.3 kapsamıdır. Ayrıntı: `TRADEUP_1.2_IMPLEMENTATION_PROGRESS_2026-10-17.md`.

## Durum

- 76 dosyada **496 test**, lint, TypeScript ve production build başarılı. Üretim reklam flag'i true, test flag'i false; demo kimliği ve ATT'siz native gizlilik kontrolü geçti.
- Kaynak dalı pushlandı; derlenen commit `edb46dcbb677ff63b545da9960d5c0fdc146faf1`. Main merge edilmedi.
- [Codemagic build 6ad37d847550aed8108f949c](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ad37d847550aed8108f949c) **17 Ekim 2026 16:52 Europe/Istanbul** tarihinde ücretsiz Mac mini M2 üzerinde başlatıldı. TestFlight-only workflow ve doğru kaynak commit'i build ekranında doğrulandı.
- Tek native build **3m 53s** içinde tamamlandı. Arşiv/imza, IPA sürüm/bundle/build ve reklam/gizlilik artifact kontrolleri CI'da başarılı. IPA boyutu 23.038.769 bayt; Codemagic artifact bölümünde saklanıyor.
- Apple yükleyicisi **UPLOAD SUCCEEDED with no errors** bildirdi. Delivery UUID: `2d68d13c-8fea-4d13-985d-47e057916a60`. Bu yükleme App Review gönderimi değildir.
- Yükleme kanıtı: `release-artifacts/testflight-47-upload-success.jpg`. Artifact-only indirme API'si yetkili oturum istedi; tarayıcı indirmesinde client engeli görüldü. Bu nedenle yerel IPA dosyası veya yerel SHA kontrolü yapılmış gibi gösterilmez; bulut artifact doğrulaması başarılıdır. Yeniden build açılmadı.
- Apple işlemesi tamamlandı: TestFlight'ta **1.2.0 (47)** ve **Betatest** grubu bağlantısı (3 davet) canlı ekranda doğrulandı. İç test erişimi hazır; harici test için görünen “Ready to Submit” durumu App Review gönderildiği anlamına gelmez.
- İsteğe bağlı test notlarını kaydetmeden Apple oturumu sona erdi; notlar güncellenmiş gibi raporlanmaz. Mevcut App Review başvurusu değiştirilmedi.

## Cihaz testinde bakılacaklar

1. Oyunu silmeden güncelle; mevcut para, ürünler, Premium/Reklamsız ve yerel isim korunsun.
2. Pazar başlık/fiyatları, dört tema, uzun ürün görselleri, tek bildirim ve bilgi penceresi.
3. Avatar önizle → İptal; önizle → Kullan; kilitli portre → mağaza. Üç ücretsiz + üç Premium.
4. Mağazada Reklamsız/Premium ana kartları; sahip olunan hakta ikinci satın alma yok; kapalı tema/ev stili açılımları ve geri yükleme.
5. Ev al → kalıcı kayıt → kişisel final → devam → Yolculuk'tan tekrar aç → uygulamayı kapat/aç. İlk ev bilgisi sonraki işlemlerde değişmesin.

Ana kariyerde eski kaydı geri alabilecek bir oyun içi downgrade yolu yoktur. Save 22 ile kaydettikten sonra eski binary/save 21'e dönmeye çalışma; yeni beta ana kaydı migration ile korur, eski uygulamanın yeni formatı okuduğu varsayılmaz.
