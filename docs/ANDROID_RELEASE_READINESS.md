# Android / Google Play hazırlığı — 29 Eylül 2026

## Bu paketin amacı

**İç test için hazırlık; production/yayın hazır beyanı değildir.** iOS 1.0.2 (40) incelemesi ve Apple satın alma kayıtları bu çalışma kapsamında değiştirilmez.

- Paket: `com.tradeup.zerotohome` (sonunda `.ios` veya `.android` yok).
- Android sürümü: `1.0.2`; `versionCode` her yeni Android Actions çalışmasında `github.run_number` olur. Daha önce Play'e yüklenen bir kod tekrar kullanılamaz; workflow sayacı sıfırlanırsa önce sürümleme stratejisi güncellenmelidir.
- Min SDK 24, target/compile SDK 36, Java 21, AGP 8.13.0.
- Google Play Billing bağımlılığı 8.3.0; **Android satın alma adaptörü henüz bağlı değildir**. Sadece SDK'nın projede bulunması ödeme desteği değildir.
- İmzalı AAB üretimi mevcut upload anahtarıyla çalışır. Anahtarı yenileme; parola veya anahtar içeriğini repoya/sohbete koyma. Play App Signing kaydı hesap açıldıktan sonra yapılır.

## Hesap açılmadan hazırlananlar

- TradeUp ikonlu koyu native açılış; Capacitor'ın beyaz örnek ekranı kullanılmaz.
- Telefonlarda portre tercihi, koyu yüzeylerde okunaklı sistem çubukları.
- Android Geri: açık pencereyi kapat → Pazar'a dön → uygulamayı arka plana al.
- Android Firebase veri toplama native seviyede kapalıdır; yapılandırma dosyası sonradan eklenmesi tek başına açmaz.
- Yerel kayıt, izin ve satın alma önbelleğinin otomatik bulut/cihaz aktarımı kapalıdır. İlerleme cihazda kalır; kaldırma veya veri temizleme kaydı siler.
- Test reklamları Google'ın resmi Android örnek kimliklerini kullanır. Canlı reklamlar kapalıdır. GDD'deki otomatik 30-ticaret reklamı iOS'a özeldir; Android'e eklenmez.
- CI: test/lint/web build, Android lint, imzalı AAB ve Android 16 emülatöründe temiz kurulum, ilk satış, muhasebe mutabakatı, dört sekme, gerçek Geri tuşu, arka plan/geri dönüş, yeniden Activity oluşturma testleri.
- Yerel gizlilik/kullanım sayfaları Android test sürümünün mevcut sınırlarını açıklar.

CI kanıtı yalnız ilgili çalışma başarılıysa geçerlidir. Emülatör testi fiziksel Android cihaz veya Play Billing testi yerine geçmez. Native test `debug` WebView üzerinden koşar; dağıtılan `release` AAB'nin Play kurulumu ayrıca test edilmelidir.

## Yarın Play hesabı açılınca

1. Hesap kimlik/cihaz doğrulamasını bitir. Uygulamayı ücretsiz **Oyun / Simülasyon**, bu paket kimliğiyle oluştur; ilk dağıtım iç test olsun.
2. Play App Signing'i etkinleştir; hazırlanan imzalı AAB'yi iç test kanalına yükle. Play'in SDK, izin ve 16 KB kontrollerini incele.
3. Aşağıdaki altı kalıcı ürünü oluştur ve lisans test kullanıcılarını ekle. Arayüzde iki ana paket, dört tekil kozmetik alt bölümde kalır. Gerçek fiyat mağaza metadata'sından gelir.
4. Android Billing adaptörünü güvenli doğrulama/acknowledgement ile bağla ve test et. **Bu bir kod işi olarak da açık; yalnız konsola ürün eklemek yetmez.** Mevcut native-purchases Android sorgusu bazı hatalarda boş sonuç döndürüyor; bunu “tüm haklar iptal edildi” saymak yasak. Pending ödeme hak vermez; kesinti/offline önceden doğrulanmış hakları silmez. Doğrulamadan token/log veya UI callback'iyle hak verme.
5. Firebase'de aynı proje altında ayrı Android uygulamasını `com.tradeup.zerotohome` olarak kaydet; Android `google-services.json` dosyasını al. iOS plist'i Android dosyası yerine kullanma. Analitik izin yolu test edilmeden native kapıyı açma.
6. AdMob'da ayrı Android uygulaması ve dört rewarded yerleşimi oluştur. iOS reklam kimliklerini kopyalama. UMP, izin reddi, offline, no-fill ve ödülün bir kez uygulanmasını doğrula; kalite kapısı geçmeden canlı reklam açma.
7. Gerçek Android telefonundan Play iç test kurulumu yap: alım, satış, pazarlık, kapat/aç, ses/haptik, büyük yazı, azaltılmış hareket, klavye, çentik, üç tuş/gesture navigation. Altı ürün için satın alma, iptal, pending, yeniden yükleme/restore ve iade testlerini tamamla.
8. Destek/gizlilik URL'lerini kontrol et; Data Safety, reklam içerir, içerik derecelendirmesi ve 13+ hedef kitle beyanlarını gerçek SDK davranışına göre doldur. “Veri toplanmıyor” beyanını otomatik seçme: test reklamı bile SDK iletişimi içerebilir.
9. Son Android sürümünün gerçek ekran görüntülerini çek; iPhone çerçeveli/iPad eski görsellerini kullanma. 512×512 ikon `public/icon-512.png` içinde hazır; 1024×500 feature graphic ayrıca hazırlanmalı. Emülatör testinin görüntüleri QA kanıtıdır; satın alma bağlantısı eksik ekranı yayın görseli sayma. Türkçe konsol taslağı: [Google Play metinleri](GOOGLE_PLAY_LISTING_TR.md).

## Kalıcı Google Play ürünleri

| Product ID | İçerik | GDD taban fiyatı |
| --- | --- | --- |
| `tradeup_no_ads_lifetime` | Yalnız reklamsız haklar | USD 1.99 eşdeğeri |
| `tradeup_premium_lifetime` | Reklamsız + bütün kozmetik paketler | USD 4.99 eşdeğeri |
| `tradeup_theme_night_market` | Gece Pazarı teması | USD 1.99 eşdeğeri |
| `tradeup_theme_workshop` | Atölye teması | USD 1.99 eşdeğeri |
| `tradeup_home_styles_01` | Üç ek ev iç mekân stili | USD 2.99 eşdeğeri |
| `tradeup_animated_avatars_01` | Üç canlı avatar | USD 2.99 eşdeğeri |

Abonelik veya tüketilebilir ürün açılmaz. Apple satın alımı Android hakkı değildir; cihazlar arası oyun kaydı/mağazalar arası entitlement vaat edilmez.

## Google'ın yayın kapısı

Yeni **kişisel** hesaplarda production erişimi için en az **12 kişinin kesintisiz 14 gün kapalı teste katılması** ve ardından production erişim başvurusu gerekebilir. İç test bu süreyi karşılamaz; hesap tipinin konsoldaki gerekliliklerini esas al. Bu nedenle hesabın yarın açılması, oyunun yarın herkese yayınlanacağı anlamına gelmez.

Kaynaklar (29 Eylül 2026 kontrolü):

- [Hedef API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [AAB ve Play App Signing](https://developer.android.com/studio/publish/upload-bundle)
- [Yeni kişisel hesap test şartları](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Billing güvenliği](https://developer.android.com/google/play/billing/security) ve [testi](https://developer.android.com/google/play/billing/test)
- [Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [16 KB uyumluluk](https://developer.android.com/guide/practices/page-sizes)

## Yayından önce açık kalemler

- [ ] Play hesabı / paket kaydı / Play App Signing / iç test kurulumu
- [ ] Android Billing kod bağlantısı + doğrulama + altı SKU Play lisans testleri
- [ ] Android AdMob kimlikleri + UMP + rewarded cihaz testi; production kalite kapısı
- [ ] Android Firebase kaydı + açık rıza yolu (veya kapalı analitikle bilinçli yayın kararı)
- [ ] Son AAB manifest/SDK/16 KB denetimi; native `.so` varsa ELF ve ZIP hizalama
- [ ] Fiziksel cihaz, eski WebView, büyük yazı, tablet ve katlanır ekran doğrulaması
- [ ] Android'e ait güncel mağaza görselleri / feature graphic / beyanlar
- [ ] Gerekiyorsa 12 kişi / 14 gün kapalı test ve production erişimi

Bu maddeler kapanmadan **production gönderimi yok**.
