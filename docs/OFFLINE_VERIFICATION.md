# Çevrimdışı açılış doğrulaması

## Durum: açık kalite kapısı

Derleme artık oyun kodu, stil dosyaları, ürün görselleri ve uygulama ikonlarını
service worker ön yükleme listesine ekler. Önbellek kimliği derleme dosyalarına
ve worker içeriğine bağlıdır. Eksik indirme kurulumun başarılı sayılmasını engeller.

## 2026-09-05 denemesi

- Yayın derlemesi yerel önizleme sunucusunda açıldı.
- İlk defter satışı yapıldı; ekranda 420 TL nakit ve üç ilan görüldü.
- Sunucu durduruldu ve sayfa yeniden açıldı.
- Uygulama içi tarayıcıda ve bağlı Chrome oturumunda HTML geldi, oyun arayüzü gelmedi.
- Tarayıcı bağlantısından alınan hata listesi boştu; bunun kök nedeni henüz doğrulanmadı.
- Bu nedenle gerçek çevrimdışı açılış ve yeniden yükleme sonrası kayıt korunması
  başarılı kabul edilmez. Otomatik worker testleri bu manuel testi ikame etmez.

## Sonraki doğrulama

Bağımsız tarayıcı oturumunda service worker kurulum/aktivasyon durumu ve Cache
Storage içindeki kod dosyaları incelenmeli; ilk indirme tamamlandıktan sonra
ağ kapatılıp yeniden yükleme denenmelidir. Nakit, ilanlar, ürün görselleri ve
sekmeler kontrol edilmelidir. Android WebView doğrulaması ayrı bir kapıdır.
