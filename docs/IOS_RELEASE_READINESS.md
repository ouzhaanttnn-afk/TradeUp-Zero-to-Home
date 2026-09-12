# TradeUp iOS Release Readiness

## Repository tarafında tamamlananlar

- Capacitor iOS 8.5.1 projesi `ios/App` altında oluşturuldu.
- Bundle kimliği `com.tradeup.zerotohome`, uygulama adı `TradeUp` olarak ayarlandı.
- iPhone ve iPad yalnız portre yönünde çalışacak şekilde sınırlandı.
- Safe-area, dinamik viewport, iOS klavye yakınlaştırması, kaydırma ve dokunma davranışları cilalandı.
- Türkçe belge dili, iOS standalone meta alanları, Apple touch icon, marka AppIcon ve özel launch görseli eklendi.
- `pnpm cap:sync:ios` komutu eklendi ve güncel production build iOS projesine başarıyla senkronlandı.
- Unit, lint, production build ve 320–430 px tarayıcı kalite kapıları geçiyor.

## Mac/Xcode üzerinde yayın öncesi kalanlar

1. Apple Developer Team ve signing profilini Xcode target'ına bağla.
2. App Store Connect'te aynı bundle kimliğiyle uygulama kaydı oluştur.
3. Gerçek iPhone'da billing, rewarded reklam, çevrimdışı kayıt, safe-area ve düşük bellek smoke testlerini çalıştır.
4. Gizlilik beyanları, yaş derecelendirmesi, mağaza metinleri ve ekran görüntülerini tamamla.
5. Release archive al, TestFlight'a gönder ve önce internal beta kalite kapısından geçir.

Üretim reklam ve IAP anahtarları yayın kalitesinden önce repository'ye yazılmaz; Xcode/CI secret alanlarında tutulur.
