# Satın alma akışı kontrolü — 5 Eylül 2026

GDD v2.1 §36, §38 ve §39 kapsamındaki erişim ve geri bildirim düzeltmesi.
Yeni mekanik, ekonomi ayarı veya ilk oturumu atlama eklenmedi.

## Değişiklikler

- İlk karşılaştırma, ürün kontrolü ve pazarlık aynı sabit alt işlem alanında sırayla görünür.
- Karşılaştırma açılınca iki ilan kartının başlangıcına kaydırılır. İnceleme seçenekleri altta erişilebilir kalır.
- İlk inceleme tamamlanınca karşılaştırma kapanır; pazarlık ve işlem sonucu görünür. Satın alma kendiliğinden başlatılmaz.
- İnceleme ve satın alma girişiminin sonucu ürün penceresinin içinde gösterilir. Başka ilana geçince eski geri bildirim temizlenir.
- Son teklif uyarısı gösterilir. Kapanmış görüşmenin teklif düğmesi kullanılamaz; haklar yenilenmez.
- İlk oturum dışındaki mevcut liste fiyatıyla satın alma yolu korunur.

## Doğrulama

`pnpm test`, `pnpm lint`, `pnpm build` ve `pnpm exec playwright test` çalıştırılır.

5 Eylül sonucu: 218 birim/entegrasyon testi ve 11 tarayıcı senaryosu geçti; lint ve production build başarılı.

- İlk oturumun iki gerçek ürün seçimi; 320×640 büyük yazı, 390×844 büyük yazı ve 430×844 normal yazı.
- İlk adımlarda doğrudan satın alma/pazarlık kapıları, düğmelerin tam görünürlüğü, karşılaştırmada iki ilan, envanter ve ilana geçiş.
- İlanı geri çekme, yeniden listeleme, satış ve kayıt yükleme sonrasında nakit, maliyet ve kâr mutabakatı.
- İki teklifi reddeden özel test ilanında son hak uyarısı, pencere içi yanıt, üçüncü teklifi engelleme ve yeniden yüklemede kapalı görüşmenin korunması.
- Mevcut alıcı bekleme, eksik görsel, azaltılmış hareket, dokunsal geri bildirim ayarı ve çevrimdışı kayıt senaryoları.

Ekran görüntüleri test çalıştırıldığında `test-results/` altında üretilir; bu klasör sürüm kontrolüne alınmaz.
Kontroller masaüstü Chrome'un telefon boyutlu görünümündedir. Gerçek iOS/Android cihaz testi veya oyuncuların karar süresinde ölçülmüş iyileşme yerine geçmez.

## Bütçe erişimi düzeltmesi

- İlan fiyatı nakdi aştığında bütçeye uygun mevcut pazarlık teklifi artık gizlenmez.
- Teklif, karşı teklif ve doğrudan alım için gerçek tutar, alış sonrası kalan nakit veya eksik tutar gösterilir. Ödenemeyen seçenekler açıklamayla devre dışıdır.
- Tüm mevcut seçenekler bütçeyi aşıyorsa en düşük eksik tutar ve envantere geçiş sunulur. Kapalı pazarlık yeni teklif seçeneği sayılmaz; kayıtlı karşı teklif mevcut kurallarıyla korunur.
- Teklif tutarı önizlemesi ve işlem, aynı mevcut yuvarlama hesabını kullanır. Oranlar, satıcı yanıtı, iki hak sınırı ve ilk oturum kapıları değişmedi. İşlem katmanındaki yetersiz nakit ve yeniden deneme korumaları korunur.
- Ek testler: 8 bütçe/yuvarlama testi; 320×640 büyük yazıda bütçeye uygun pazarlıkla alım, tam nakitle karşı teklif kabulü, yetersiz nakitte envantere geçiş. Alım sonrası kayıt yenilemede nakit, maliyet ve işlem günlüğü doğrulanır.

Güncel doğrulama: 226 test ve 14 tarayıcı senaryosu; lint ve production build başarılı.

## Hazırlıktan ilana geçiş

- İlk ürünün hazırlık ekranındaki tekrar eden büyük rehber, oyuncu doğru ekrandayken gösterilmez; seçeneklerin üstündeki kısa yönlendirme yeterlidir.
- Üç hazırlık seçeneği ücret, süre ve tüm görünür etkileri korunarak kompakt satırlara dönüştürüldü. 320×640 büyük yazıda üç seçenek aynı ekranda görülebilir.
- Ürün hazır olduğunda dengeli ilan fiyatı ile güncel toplam harcama aynı “Sıradaki adım” alanında gösterilir; ana ilan düğmesi diğer isteğe bağlı hazırlıkların üstündedir.
- Portföyde hedef ürüne geçiş kartı ekranın başına getirir ve odağı korur. Hazırlık türü, maliyeti, süresi, sonucu ve ilan fiyatı hesabı değişmedi.

## Satış sonucu ve yeni fırsat

- Oyuncu bir alıcı teklifini kabul ettiğinde boş `İlanlarım` ekranında kalmaz. Son satış sonucu işlem günlüğündeki tamamlanmış `SALE` kaydından gösterilir.
- Hesaba giren tutar, o satıştaki toplam harcama, işaretli net kâr/zarar ve güncel nakit tek kartta görünür. Güncel ürün değeri veya ilan fiyatı geçmiş maliyet yerine kullanılmaz.
- “Yeni fırsatlara bak” ana düğmesi doğrudan Pazara döner. İlk oturumun tamamlanma rehberi sonuç kartını tekrarlamaz.
- Sonuç ekran okuyucuya mesaj olarak duyurulur; içindeki devam düğmesi mesajın parçası değildir. 320×640 büyük yazıda sonuç ve devam düğmesi görünürlük testiyle korunur.
