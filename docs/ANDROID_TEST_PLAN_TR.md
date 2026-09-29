# TradeUp Android — ilk cihaz testi

İlk dağıtım Play **iç test** kanalına yapılır. Bu liste production onayı değildir.
Mevcut test paketinde Google Play satın almaları kapalı, reklam kimlikleri demodur.
iOS'taki satın alımlar Android'e aktarılmış sayılmaz.

## Test kaydı

Her rapora telefon modeli, Android sürümü, Android System WebView sürümü,
uygulama sürümü/build kodu ve soruna giden kısa adımları yaz.
Şifre, ödeme bilgisi veya satın alma tokenı paylaşma.

Hata varsa mümkünse ekran kaydı al; telefon bildirimlerini ve kişisel bilgileri gizle.
Uygulamayı kaldırma/veri temizleme ilerlemeyi siler. Temiz kurulum yalnız
kaybını kabul ettiğin test kaydı üzerinde yapılmalıdır.

## Mevcut paketle yapılacaklar

| Kontrol | Beklenen |
| --- | --- |
| İlk açılış | TradeUp açılışı; ad ve üç ücretsiz avatar; profil sonrası başlangıç akışı |
| İlk satış | Başlangıç satışı tamamlanır; ekran ve kayıt aynı nakdi gösterir |
| Alım ve pazarlık | Nakit eksiye düşmez; iki teklif hakkı aşılmaz; yetersiz nakit açık anlatılır |
| İlan verme / kaldırma | Ürün kaybolmaz veya çoğalmaz; ilandan kaldırınca portföye döner |
| Satış | Gelen teklifi kabul/reddet çalışır; ödeme ve kâr yalnız bir kez uygulanır |
| Geri hareketi / tuşu | Önce pencere kapanır; sonra Pazar'a dönülür; Pazar'dan uygulama arka plana geçer |
| Arka plana al / geri dön | Kaydedilmiş nakit, ürünler ve profil korunur; ekran kullanılabilir kalır |
| Uygulamayı kapat / tekrar aç | Kayıt yüklenir; ilk açılış profili tekrar zorlanmaz |
| Uçak modu | Temel oyun devam eder; reklam/mağaza hatası oyunu kilitlemez |
| Ekran ve klavye | Üçlü ürün dizilimi, modal alt eylemleri, gezinme ve ad alanı sistem çubukları/klavye altında kalmaz |
| Erişilebilirlik | Büyük yazıda eylemler erişilebilir; azaltılmış hareket ve haptik kapatma ayarları uygulanır |
| Görsel çeşitlilik | Uzun ürün adları, büyük fiyatlar, farklı temalar ve eksik görsel durumu taşma oluşturmaz |

En az bir düşük/orta sınıf gerçek telefon ve gesture / üç düğmeli gezinme
kontrol edilmeli. Tablet ve katlanır ekran ayrıca denenmeli; Android 16 büyük
ekranlarda portre kilidini her durumda uygulamaz.

## Play ürünleri bağlandıktan sonra — ayrı zorunlu tur

Google Play lisans test hesabı ve test ödeme araçları kullanılır; gerçek ücret
ödeyerek test yapılmaz. Her altı SKU için sonuçlar ayrı kaydedilir.

- Fiyat ve para birimi cihaz mağazasından gelir.
- Satın alma iptali hak vermez; bekleyen ödeme tamamlanmadan hak açılmaz.
- Başarılı ve doğrulanmış ödeme yalnız bir kez hak verir.
- Yeniden başlatma ve geri yükleme doğru ürünleri bulur.
- Ağ/sorgu hatası daha önce doğrulanmış hakları kendiliğinden silmez.
- İade/iptal yalnız ilgili hakkı kaldırır; Premium iptali tekil kozmetik sahipliğini silmez.
- Reklamsız paket kozmetik açmaz. Premium bütün kozmetikleri ve reklamsız hakları içerir.
- Reklamsız kullanım oyun içi hak sınırını, bekleme süresini veya ekonomik sonucu değiştirmez.

Reklam testi de ayrıdır: izin reddi, offline, reklam bulunmaması, yarıda kapatma,
tamamlanma ve yinelenen callback. Ödül yalnız doğrulanmış tamamlanmada bir kez
verilir. Android'de otomatik 30-ticaret reklamı bu paketin kapsamında değildir.

Tüm yayın engelleri: [Android hazırlığı](ANDROID_RELEASE_READINESS.md).
