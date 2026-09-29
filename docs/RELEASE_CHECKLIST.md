# Mağaza Yayın Kontrol Listesi

- [x] Production web build
- [x] Seed'li pazar ve deterministik pazarlık testleri
- [x] Sürümlü IndexedDB kayıt ve offline clamp
- [x] Android Capacitor projesi
- [x] Native haptik ve App lifecycle bağımlılıkları
- [x] Özgün ikon ve ürün assetleri
- [x] PWA manifesti ve offline cache
- [x] Yayıncı adı, destek e-postası ve gizlilik/destek sayfası kaynakları hazır
- [ ] Gizlilik ve destek URL'lerinin dış ağdan açıldığını doğrula; App Store Connect'e gir
- [ ] App Privacy veri beyanını mevcut AdMob SDK davranışıyla eşleştir
- [ ] StoreKit satın alma/geri yükleme ve altı ürünün sandbox testi
- [ ] Android upload keystore ve Play App Signing
- [ ] Google Play Console uygulama kaydı ve içerik derecelendirmesi
- [ ] Apple Developer hesabı, bundle kaydı ve iOS platformunun macOS üzerinde eklenmesi
- [ ] Gerçek cihazlarda düşük/orta/yüksek performans testi
- [ ] Store ekran görüntüleri ve 1024×500 feature graphic
- [ ] Kapalı test kullanıcıları ve crash-free oturum ölçümü
- [ ] Ekonomi/retention dengelemesi için en az bir playtest turu

İmzalama anahtarları, şifreler ve geliştirici hesap tokenları repoya kesinlikle eklenmemelidir.

## 29 Eylül reddi sonrası zorunlu App Review kontrolü

- [ ] Yeni imzalı binary yüklendi; sürüm 1.0.2 ve seçilen build 39'dan büyük.
- [ ] Altı SKU'nun fiyat/bölge/yerelleştirme ve güncel inceleme görselleri tamam.
- [ ] Başvurunun son öğe listesinde uygulama sürümüyle **altı IAP birlikte** görünüyor (toplam 7 öğe). Ayrı taslak veya yalnız `Ready for Review` durumunu gönderildi sayma.
- [ ] Media Manager'da her boyut ve dil denetlendi; eski 13 inç iPad görseli kalmadı. Gerekli iPad görseli yeni native build'den alındı.
- [ ] İnceleme notu, iki ana paket ve açılır dört tekil kozmetik ürünün erişim yolunu açıklıyor.
- [ ] Son gönderimden sonra doğru yeni build ve altı IAP için `Waiting for Review` doğrulandı; yayın manuel.

Ürün kimlikleri ve başvuru adımları: [29 Eylül yeniden gönderim paketi](APP_REVIEW_RESUBMISSION_2026-09-29.md).
