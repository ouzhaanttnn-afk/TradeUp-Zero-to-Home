# TradeUp iOS Release Readiness

## Repository tarafında tamamlananlar

- Capacitor iOS 8.5.1 projesi `ios/App` altında oluşturuldu.
- Bundle kimliği `com.tradeup.zerotohome`, uygulama adı `TradeUp` olarak ayarlandı.
- iPhone ve iPad yalnız portre yönünde çalışacak şekilde sınırlandı.
- Safe-area, dinamik viewport, iOS klavye yakınlaştırması, kaydırma ve dokunma davranışları cilalandı.
- Türkçe belge dili, iOS standalone meta alanları, Apple touch icon, marka AppIcon ve özel launch görseli eklendi.
- `pnpm cap:sync:ios` komutu eklendi ve güncel production build iOS projesine başarıyla senkronlandı.
- Unit, lint, production build ve 320–430 px tarayıcı kalite kapıları geçiyor.

## 19 Eylül 2026 denetimi

- Son başarılı iOS arşivleme, imzalı IPA dışa aktarma ve App Store Connect yükleme iş akışı: [GitHub Actions #35461822510](https://github.com/ouzhaanttnn-afk/TradeUp-Zero-to-Home/actions/runs/35461822510), `a90d36a` commit'i. Bu, gerçek cihazda StoreKit/AdMob testi veya App Store inceleme onayı değildir.
- GitHub üretim dağıtımı Vercel'e bağlıdır. App Store Connect'e şu sabit URL'ler girilmeli: `https://trade-up-zero-to-home.vercel.app/privacy.html` (gizlilik) ve `https://trade-up-zero-to-home.vercel.app/support.html` (destek). Bu URL'lerin dış ağdan erişimi yayın öncesi tekrar doğrulanmalıdır.
- Gizlilik, kullanım koşulları ve destek sayfaları uygulamanın Profil ve Ayarlar ekranından erişilebilir.
- iOS StoreKit 2 köprüsü ve beş kalıcı ürünün mağaza fiyatı/satın alma/geri yükleme akışı bağlandı. Hak yalnız StoreKit'in güncel doğrulanmış entitlement listesinde işlem görüldüğünde veriliyor; eksik/iade edilmiş hak geri alınıyor. Web ve Android satın alma kapalı. App Store Connect'te beş ürün kaydı ve gerçek cihazda sandbox testi tamamlanmadan canlı satış hazır sayılmaz.
- iOS AdMob köprüsü, dört ödüllü reklam birimi ve her 30 tamamlanmış ticaret sonrası tek geçiş reklamı kodda var; yayın reklamı çevre değişkeniyle kapalı. Testte resmi test birimi kullanılıyor. Google Mobile Ads SDK olası veri toplama türleri için gizlilik metni ve App Store veri beyanı birbirine uygun tutulmalı.
- 19 Eylül onaylı erken oyun kuralında ilk 30 tamamlanmış pazar ticaretine kadar tarama sınırı 50, sonrasında 25. Yeni kayıt 50 hakla başlar; mevcut kayıt hakkını korur ve 30. satışta fazlası 25'e indirilir. Kayıt geçişi, hak yenilenmesi ve eşik birim testlerinden geçiyor; satış sonrası kaydın gerçek cihazda kalması yine doğrulanmalı.
- Güncel ilk oturumda rehber aşamalar kaldırıldığı hâlde bazı eski `firstSession.e2e.ts` ve `mobile.e2e.ts` senaryoları bu adımları bekliyor. Bu testler yeni kullanıcı akışına göre yenilenmeden tam tarayıcı kalite kapısı yeşil değil.

## Mac/Xcode ve App Store Connect üzerinde yayın öncesi kalanlar

1. Apple Developer Team ve signing profilini Xcode target'ına bağla.
2. App Store Connect'te aynı bundle kimliğiyle uygulama kaydı oluştur.
3. Xcode target'ına In-App Purchase capability ekle; beş ürünün App Store Connect kayıtlarını oluştur; gerçek iPhone'da sandbox satın alma, geri yükleme, iptal ve iade akışlarını doğrula.
4. Gerçek iPhone'da ödüllü reklam izni, çevrimdışı kayıt, safe-area ve düşük bellek smoke testlerini çalıştır.
5. App Privacy veri beyanını AdMob SDK davranışına göre doldur; yaş derecelendirmesi, mağaza metinleri ve ekran görüntülerini tamamla.
6. Son `main` sürümünden yeni bir release archive al, TestFlight internal beta turunu tamamla, ardından App Review'a gönder.

Üretim reklam ve IAP anahtarları yayın kalitesinden önce repository'ye yazılmaz; Xcode/CI secret alanlarında tutulur.
