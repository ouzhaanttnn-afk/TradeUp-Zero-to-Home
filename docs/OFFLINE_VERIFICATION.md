# Çevrimdışı açılış doğrulaması

## Durum: bağımsız Chrome çevrimdışı testi geçti

Derleme artık oyun kodu, stil dosyaları, ürün görselleri ve uygulama ikonlarını
service worker ön yükleme listesine ekler. Önbellek kimliği derleme dosyalarına
ve worker içeriğine bağlıdır. Eksik indirme kurulumun başarılı sayılmasını engeller.

## 2026-09-05 denemesi

- Yayın derlemesi yerel önizleme sunucusunda açıldı.
- İlk defter satışı yapıldı; ekranda 420 TL nakit ve üç ilan görüldü.
- Sunucu durduruldu ve sayfa yeniden açıldı.
- Uygulama içi tarayıcıda ve bağlı Chrome oturumunda HTML geldi, oyun arayüzü gelmedi.
- Tarayıcı bağlantısından alınan hata listesi boştu; bunun kök nedeni henüz doğrulanmadı.
- İlk denemeler başarısızdı; aşağıdaki bağımsız test kök nedeni belirledi ve düzeltmeyi doğruladı.

## Kök neden ve doğrulanan düzeltme

Önbellek kurulumu tamamlanıyordu. Ancak sunucunun `Vary: Origin` başlığı,
ön yükleme istekleri ile modül/stil isteklerinin eşleşmesini engelliyordu.
Yalnız aynı origin isteklerini kabul eden worker, çevrimdışı önbellek aramasında
`ignoreVary: true` kullanır. Dış kaynak istekleri yakalanmaz.

`pnpm test:offline` yayın derlemesi oluşturur ve ayrı, geçici Chrome profiliyle:

- İlk yüklemede service worker aktivasyonunu ve önbellekteki kod dosyalarını kontrol eder.
- Başlangıç defterini satar; 420 TL'nin IndexedDB'ye yazıldığını bekler.
- Ağı kapatır, sayfayı yeniden yükler ve nakit ile işlem günlüğünü karşılaştırır.
- İlan detayını açar, ürün görsellerinin yüklendiğini ve JavaScript hatası olmadığını denetler.

Test sonucu: başarılı. Test için bilgisayarda Chrome kurulu olmalıdır.
Hatalarda iz kaydı ve ekran görüntüsü `test-results/` altında tutulur; bunlar Git'e eklenmez.
Bu doğrulama Android WebView, iOS veya gerçek cihaz testinin yerine geçmez.
