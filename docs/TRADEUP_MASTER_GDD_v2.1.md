# TRADEUP: ZERO TO HOME
## Master Game Design Document + Implementation Contract — v2.1
**Studio Nostos • Monetization-Locked Production Candidate • 04.09.2026**


---

<!-- PAGE 1 -->

# 01. TRADEUP: ZERO TO HOME
> Mihenk’ten sonraki ana proje • Monetization-Locked Production Candidate • v2.1

> Fırsatı gör. Değeri doğrula. Nakit yarat. Kendi yolunla evine ulaş.

| Belge | Durum |
| --- | --- |
| Sahibi | Studio Nostos / Alper |
| Belge türü | Master Game Design Document + Implementation Contract |
| Sürüm | v2.1 • Monetization & Production Lock • 04.09.2026 |
| Öncelik | Mihenk sonrası büyük ana proje |
| Platform | iOS + Android • dikey 9:16 • tek elle oynanabilir |
| Repo anlık görüntüsü | ouzhaanttnn-afk/TradeUp-Zero-to-Home • main @ 7cf94c5 |

## Belgenin yetkisi
> **[KİLİTLİ] Belgenin yetkisi:** Bu sürüm, önceki TradeUp / Al-Sat GDD’leriyle çeliştiği yerde onları geçersiz kılar. Kod, ekonomi, UX, içerik ve yayın kararlarında tek gerçek kaynak olarak kullanılacaktır.


---

<!-- PAGE 2 -->

# 02. Belge Kontrolü ve Karar Dili
> Bu belge yalnız fikir kataloğu değildir; ürünün ne olacağını, ne olmayacağını ve hangi koşullarda “hazır” sayılacağını bağlayan üretim sözleşmesidir.

| Etiket | Anlam | Uygulama |
| --- | --- | --- |
| KİLİTLİ | Değişmez ürün kararı | Kod ve içerik buna uymadan teslim kabul edilmez. |
| HİPOTEZ | Oyuncu verisiyle doğrulanacak karar | Soft launch öncesi ölçüm planı ve başarı ölçütü gerekir. |
| DENEY | A/B veya kontrollü prototip | Sonuç alınana kadar ana döngüye kalıcı bağlanmaz. |
| ERTELENDİ | Doğru fikir, yanlış zaman | Vertical slice veya soft launch kapsamını büyütemez. |
| YASAK | Ürün kimliğine zarar veren çözüm | Hızlı teslim gerekçesiyle dahi uygulanmaz. |

## Tek cümlelik oyun
> **[KİLİTLİ] Tek cümlelik oyun:** Oyuncu, sürekli değişen ikinci el pazarında eksik bilgiyi okuyup aynı ürüne ait ilanları karşılaştırır; iki teklif hakkıyla pazarlık eder, satın aldığı ürüne bilgi ve hazırlık ekleyerek değer yaratır, nakdini korur ve gerçek işlemlerinden oluşan kişisel bir servet hikâyesiyle kendi evine ulaşır.

v2.1, v2.0’ın karar derinliği ve ekonomik doğruluk omurgasını korur; buna ek olarak gerçek para ürünlerini, rewarded reklam yerleşimlerini, entitlement akışını, mağaza/politika guardrail’lerini ve üretim dondurma protokolünü kilitler. Bu nedenle kodlama sırasında yeni mekanik kararı alınmaz; yalnız belgeye uyumlu bug düzeltmesi ve tanımlı aralıkta sayısal kalibrasyon yapılır.

## Belgeyi okuma kuralı
- Her ekonomik hareket append-only işlem günlüğüyle izlenir; oyuncu varlığı sessizce yok olmaz.
- Her görünür buton çalışır. Sahte filtre, ölü sekme, TODO alanı veya yalnızca gösteriş için sayaç bulunmaz.
- Final görsel asset eksikliği gameplay’i durdurmaz; manifest, placeholder ve fallback zorunludur.
- Runtime yapay zekâ, para veya oyun sonucunun hakemi değildir; deterministik motor tek otoritedir.
- v2.1 tasarım dondurması sonrası kodlama sırasında yeni gameplay, IAP veya reklam mekaniği eklenmez; belirsizlikte daha az avantajlı ve daha az müdahaleci çözüm uygulanır.


---

<!-- PAGE 3 -->

# 03. Belge Haritası
> Sayfa numaraları sabittir; her sayfa ayrı bir tasarım/üretim sözleşmesi olarak okunabilir.

| s. | Bölüm | s. | Bölüm |
| --- | --- | --- | --- |
| 4 | Yönetici özeti ve ürün tezi | 26 | Satış ilanı ve çıkış stratejisi |
| 5 | TradeUp nedir / değildir | 27 | Alıcı teklifleri ve satış pazarlığı |
| 6 | Oyuncu fantezisi ve hedef kitle | 28 | Uzmanlık ve bilgi ilerlemesi |
| 7 | Ar-Ge yöntemi ve rakip sentezi | 29 | Kişisel kariyer zaman çizgisi |
| 8 | Pazardaki boşluk ve konumlandırma | 30 | Progression: erişim genişlemesi |
| 9 | Tasarım sütunları | 31 | Ev hedefi, final ve post-game |
| 10 | Oturum modeli | 32 | Pazar olayları ve live ops |
| 11 | Çekirdek döngüler | 33 | Retention: görev değil merak |
| 12 | Karar atomu | 34–37 | Monetizasyon, IAP, rewarded ve üretim kilidi |
| 13 | Pazar dünya modeli | 38 | Mobil bilgi mimarisi |
| 14 | İlan yaşam döngüsü ve NPC yarışı | 39 | Pazar / karşılaştırma / detay UX |
| 15 | Arz, talep ve likidite | 40 | Takip / portföy / yolculuk UX |
| 16 | Ürün ontolojisi | 41 | FTUE ve ilk 30 dakika |
| 17 | Kanıt ve inceleme sistemi | 42 | Erişilebilirlik, haptik, ses |
| 18 | Kondisyon, kusur ve adalet | 43 | İçerik kapsamı düzeltmesi |
| 19 | Değerleme motoru | 44 | Asset Bible ve içerik şablonu |
| 20 | Muhasebe ve ekonomi değişmezleri | 45 | Teknik mimari |
| 21 | Nakit, servet, likidite ve recovery | 46 | Veri şemaları ve state machine |
| 22 | Satın alma pazarlığı: iki hak | 47 | Save, offline, determinizm |
| 23 | Satıcı arketipleri ve baskı | 48 | Analitik, deneyler, kalite kapıları |
| 24 | Sahiplik ve hazırlık sistemi | 49 | Mevcut prototip audit + Mihenk sonrası yol |
| 25 | Envanterden değer yaratma | 50 | Definition of Done + master direktif |

## Öncelik sırası
> **[KİLİTLİ] Öncelik sırası:** Ekonomik doğruluk → karar derinliği → ilk oturum → aktif pazar → retention → monetizasyon → içerik ölçeği. Bu sıra tersine çevrilmez.


---

<!-- PAGE 4 -->

# 04. Yönetici Özeti: TradeUp’ın Ürün Tezi
> TradeUp’ın başarı ihtimali, ikinci el ürün sayısından değil oyuncunun “ben bunu gördüm ve doğru okudum” diyebilmesinden doğar.

Pek çok al-sat simülasyonu dükkân yürütme, araç sürme, depo açma veya 3D ortamda eşya taşıma üzerinden haz üretir. TradeUp aynı fanteziyi daha sıkı bir mobil çekirdeğe indirger: oyuncu birkaç saniye içinde ilanı tarar, benzerleriyle kıyaslar, bilgi eksikliğini tartar ve nakdini bağlayıp bağlamayacağına karar verir. Bu yüzden oyunun ana fiili “satın almak” değil, **fırsatı okumaktır**.

| Katman | Oyuncunun sorusu | Sistemin cevabı |
| --- | --- | --- |
| Gör | Bu ilan neden farklı? | Aynı family’den yoğun ilan havuzu ve okunabilir sinyaller |
| Doğrula | Ucuz mu, yoksa sorunlu mu? | Kanıt, inceleme, kondisyon ve risk güveni |
| Finanse et | Paramı buna bağlamalı mıyım? | Nakit–servet ayrımı, likidite, hızlı çıkış |
| Pazarlık et | Ne kadar risk alabilirim? | Tam iki oyuncu teklifi ve satıcı davranışı |
| Değer ekle | Ben bu ürünü nasıl daha iyi satarım? | Temizle, test et, tamamla, doğru listele |
| Çık | Şimdi mi satayım, bekleyeyim mi? | Alıcı talebi, piyasa ısısı, fiyat stratejisi |
| Hatırla | Bu serveti nasıl kurdum? | Gerçek işlemlerden dinamik kariyer zaman çizgisi |

## North Star
> **[KİLİTLİ] North Star:** TradeUp, dükkân dekorasyon oyunu veya boşta para basan idle oyun değildir. “Fırsat okuryazarlığı” üzerine kurulu, kısa oturumlu fakat uzun vadede öğrenilen bir pazar simülasyonudur.

Ürün stratejisi, 24 derin ProductFamily ile çalışan kusursuz vertical slice’ı; yüzlerce yüzeysel family barındıran kırılgan build’e tercih eder. İçerik, motorun kalitesini kanıtladıktan sonra çoğalır.


---

<!-- PAGE 5 -->

# 05. TradeUp Nedir, Ne Değildir?
> Sınırlar net olmazsa proje; idle, tycoon, kart oyunu ve ilan uygulaması arasında kimlik kaybeder.

| TradeUp budur | TradeUp bu değildir |
| --- | --- |
| Canlı ilanlar arasında göreli değer okuma oyunu | Tek butonla al–bekle–sat idle döngüsü |
| Bilgi eksikliği ve zaman baskısı arasında seçim | Gerçek değeri her an açık eden hesap makinesi |
| Nakit ve varlık likiditesini yönetme | Serveti tek sayıdan ibaret coin sayacı |
| Az sayıda güçlü, anlaşılır aksiyon | Her kategoriye ayrı mini oyun yığını |
| Gerçek işlemlerden oluşan kişisel kariyer | Herkese aynı Defter → Telefon → Araba yolu |
| Dikey, tek elle, 2–20 dakikalık oturumlar | 3D açık dünya / sürüş / fizik simülasyonu |
| Özgün, markasız, data-driven ürün evreni | Gerçek marka ve piyasa fiyatına bağımlı kopya |
| Bilgi/hız kolaylığı sunan isteğe bağlı reklam | Reklam izleyerek doğrudan para üretme |

## Kimlik koruma yasakları
- YASAK: Ürün adına göre gameplay if/else zinciri. Telefon, gitar, koltuk ve otomobil aynı attribute/evidence/valuation motorunu kullanır.
- YASAK: Oyuncuyu tek “doğru” kategoriye zorlayan seviye merdiveni. Açılan dünya büyür; eski pazar kapanmaz.
- YASAK: Oyuncunun bilmediği kusur yüzünden karşı koyma imkânı olmadan servetini silmek.
- YASAK: Sürekli kırmızı sayaç, konfeti, coin yağmuru ve casino benzeri yoğun FOMO.
- YASAK: Oyuncunun gerçek kararını anlamsızlaştıran ücretsiz, sınırsız market refresh.

## Başarı cümlesi
> **[KİLİTLİ] Başarı cümlesi:** Bir oturum sonunda oyuncu yalnızca “param arttı” değil, “öteki ilanlardaki detayı fark ettim, satıcıyı doğru okudum ve o yüzden kâr ettim” diyebilmelidir.


---

<!-- PAGE 6 -->

# 06. Oyuncu Fantezisi ve Hedef Kitle
> Oyuncu; şanslı kumarbaz değil, zamanla keskinleşen bir pazar gözü olmak ister.

| Duygu | İç ses | Sistem karşılığı |
| --- | --- | --- |
| Keşif | Bu neden diğerlerinden ucuz? | Yoğun aynı-family ilanları, sıra dışı kombinasyonlar |
| Zekâ | Detayı ben fark ettim. | Kanıtlar, uzmanlık, karşılaştırma |
| Gerilim | Beklersem başkası alacak. | Sinyalli NPC rekabeti ve ilan ömrü |
| Kontrol | Riskimi ben seçtim. | İnceleme, teklif, hazırlık, fiyat stratejisi |
| Tatmin | Bu kâr benim kararımın sonucu. | Kâr ayrıştırması ve işlem özeti |
| Kimlik | Ben teknoloji değil müzik ekipmanıyla büyüdüm. | Dinamik kategori profili ve timeline |
| Yolculuk | İlk defterden kendi evime geldim. | Kişiselleştirilmiş ev finali |

Birincil hedef kitle; ekonomi ve simülasyon fantezisini seven fakat uzun 3D oturumlara ayıracak zamanı olmayan mobil oyuncudur. İkincil kitle; ikinci el pazarını, koleksiyonculuğu, teknoloji fiyatlarını veya “ucuz bul–değer kat–sat” içeriklerini izlemekten hoşlanan oyuncudur. Oyun gerçek ticaret eğitimi veya yatırım tavsiyesi değildir; fakat nedensel düşünme, karşılaştırma ve likidite kavramlarını doğal biçimde hissettirir.

## Hedef deneyim ilkeleri
- Giriş bariyeri: İlk işlem için finans bilgisi gerekmez; sinyaller günlük dille anlatılır.
- Ustalık bariyeri: İyi oyuncu yüzdeleri ezberlemek yerine kanıt, hız ve sermaye bağlama maliyetini birlikte okur.
- Oturum esnekliği: İki dakikada teklif kontrolü yapılabilir; yirmi dakikada birkaç kategori taranabilir.
- Yaş dili: Temiz, yetişkin ve premium; çocuk oyunu gibi coin patlamaları veya ağır finans jargonu yoktur.

## Ana motivasyon testi
> **[HİPOTEZ] Ana motivasyon testi:** İlk 15 dakikada oyuncuların çoğu aynı family’den en az iki ilanı karşılaştırıyorsa, ürünün “fırsat okuma” tezi anlaşılmış kabul edilir. Sadece en ucuz karta basılıyorsa tasarım başarısızdır.


---

<!-- PAGE 7 -->

# 07. Ar-Ge Yöntemi ve Rakip Sentezi
> Rakiplerden özellik kopyalanmaz; hangi oyuncu duygusunu nasıl ürettikleri ayrıştırılır.

| Referans kümesi | Güçlü taraf | TradeUp’a alınan ders | Kopyalanmayan yük |
| --- | --- | --- | --- |
| Pazarlık / rehinci simülasyonları | Satıcı kişiliği, değer belirsizliği | Karşı taraf davranışı anlaşılır ve tutarlı olmalı | Uzun diyalog ağaçları ve masaüstü ağırlığı |
| Araç al-sat simülasyonları | İnceleme, kusur, nominal büyük kâr | Kusur doğrulama ve maliyet tabanı güçlü his verir | Sürüş, 3D tamir ve açık dünya |
| Depo / açık artırma oyunları | Gizli değer ve “hazine” anı | Nadir ama okunabilir sürprizler | Tamamen şansa dayalı kutu açma |
| Mobil açık artırma oyunları | Kısa oturum, net hedef | Dikey hızlı karar ve geri dönüş | Enerji duvarı, agresif sayaç, pay-to-win |
| İlan uygulaması alışkanlıkları | Tarama, filtre, favori, fiyat kıyası | Tanıdık bilgi mimarisi | Gerçek uygulama kadar kuru ve oyunsuz görünüm |

Sentez sonucu: Pazar oyunlarının ortak hazzı “değerin herkese aynı anda görünmemesi”dir. TradeUp bunu 3D emek yerine bilgi emeklerine çevirir. Oyuncu fotoğrafları okur, satıcı iddiasını doğrular, benzer ilanları kıyaslar ve ne kadar belirsizliğe para bağlayacağını seçer. Böylece üretim bütçesi devasa ortamlar yerine sistem derinliği ve okunaklı asset çeşitliliğine gider.

## Rakiplerden ayrışma
> **[KİLİTLİ] Rakiplerden ayrışma:** TradeUp’ın beyaz alanı: masaüstü simülasyonlarının değerleme ve pazarlık derinliğini, mobil ilan akışının tek elle hızına taşıyan “market intelligence” deneyimi.

## Ar-Ge filtresi
- Benchmark metriği indirme sayısı değil; kararın neden anlaşılır olduğu, geri bildirimin ne kadar net olduğu ve oyuncunun ne kadar erken ustalık hissettiğidir.
- Her rakip mekanik, üretim maliyeti / karar derinliği / mobil ergonomi üçgeninde değerlendirilir.
- Gerçek marka, gerçek fiyat API’si ve telifli ürün görseli stratejik bağımlılık yapılmaz.


---

<!-- PAGE 8 -->

# 08. Pazardaki Boşluk ve Konumlandırma
> “İkinci el simulator” tek başına yeterli vaat değildir; oyuncunun alacağı özgün haz açıkça söylenmelidir.

| Eksen | Düşük uç | TradeUp konumu | Yüksek uç |
| --- | --- | --- | --- |
| Oturum | Idle kontrol | 2–20 dk aktif karar | Uzun masaüstü seansı |
| Sunum | Kuru ilan listesi | Premium oyunlaştırılmış pazar | 3D açık dünya |
| Derinlik | En ucuzu al | Kanıt + kıyas + likidite | Ağır muhasebe simülasyonu |
| İlerleme | Sabit ürün basamakları | Kişisel kategori yolu | Sandbox hedef yokluğu |
| Monetizasyon | Zorunlu reklam | İsteğe bağlı kolaylık | Tek seferlik premium |

> Store vaadi: “Aynı ürüne ait ilanları karşılaştır. Kusuru fark et. İki teklifte anlaş. Ürüne değer kat ve kendi ticaret hikâyenle evine ulaş.”

Görsel konumlandırma; ilan uygulamasının okunabilirliğini, premium tycoon oyununun duygusal geri bildirimiyle birleştirir. Arayüz finans paneli kadar soğuk, casino kadar parlak olmayacaktır. Ürün görselleri okunabilir, sinyaller sakin, kâr anı ise güçlü fakat kısa olacaktır.

## Pazarlama ile tasarımın ortak zemini
- Bir ekran görüntüsünde oyuncu; ürün, fiyat, kondisyon, fırsat sinyali ve nakit gerilimini üç saniyede anlamalıdır.
- Bir 15 saniyelik Shorts reklamında “yanlış ilanı seçersen zarar / detayı fark edersen kâr” çatışması anlatılabilmelidir.
- Oyun adı ve alt başlık lokalize edilebilir; “Zero to Home” ana yolculuğu korur.
- Studio Nostos içerik motoru için her işlem, kısa video hikâyesine dönüşebilecek net bir sebep–sonuç taşımalıdır.

## Viral anlatılabilirlik
> **[HİPOTEZ] Viral anlatılabilirlik:** En iyi organik içerik formatı “üç ilan göster → izleyici hangisini seçer → gizli detayı aç → sonucu göster” olacaktır. Bu format vertical slice testlerinde oynanış kadar erken denenir.


---

<!-- PAGE 9 -->

# 09. Tasarım Sütunları
> Her yeni özellik bu sütunlardan en az birini güçlendirmeli; hiçbirini güçlendirmiyorsa kapsam dışıdır.

| Sütun | Tanım | Başarısızlık işareti |
| --- | --- | --- |
| 1. Karşılaştırılabilir pazar | Aynı family’den yeterli ilan vardır; değer göreli okunur. | Her ürün tek kart olarak görünür. |
| 2. Bilgi asimetrisi | Oyuncu değeri doğrudan değil kanıtlarla tahmin eder. | Fair value açık sayı olur. |
| 3. Likidite gerilimi | Servet ile satın alma gücü farklıdır. | Her varlık anında aynı değerden nakde döner. |
| 4. Kısa fakat gerçek karar | Aksiyon az, sonuç nedenseldir. | Buton seçimi kozmetik kalır. |
| 5. Kişisel yolculuk | Oyuncunun kategori ve işlem geçmişi görünür. | Herkes aynı milestone ikonlarını görür. |
| 6. Adil belirsizlik | Risk sinyalli ve karşı oyunludur. | Gizli zararın önceden hiçbir işareti yoktur. |
| 7. Sistem önce içerik | Yeni family data ile eklenir. | Her ürün yeni kod ve UI ister. |

## Özellik kabul testi
> **[KİLİTLİ] Özellik kabul testi:** Yeni bir özellik oyuncuya yalnız daha fazla basılacak buton ekliyorsa reddedilir. Oyuncunun bilgi, zaman, nakit veya çıkış kararı arasında yeni ve anlaşılır bir gerilim yaratmalıdır.

Sütunlar arasında öncelik çatışması olduğunda adalet ve ekonomik doğruluk kazanır. Örneğin daha dramatik bir sürpriz, oyuncunun okuyamadığı rastgele kusur üzerinden geliyorsa kullanılmaz. Daha hızlı monetizasyon, nakit basarak çekirdek ekonomiyi anlamsızlaştırıyorsa kullanılmaz. Daha çok family, karşılaştırma yoğunluğunu düşürüyorsa eklenmez.

## Çatışma çözme kuralları
- Core loop’un dışındaki meta sistemler, oyuncuyu pazara geri götürür; pazardan uzak ayrı bir oyun kurmaz.
- İlerleme bonusu “daha çok para” değil, daha iyi araç ve daha doğru bilgi verir.
- Kaybetme anı öğretici olmalı; utandıran, kilitleyen veya reklam dayatan ceza olmamalıdır.


---

<!-- PAGE 10 -->

# 10. Oturum Modeli
> TradeUp hem iki dakikalık kontrolü hem yirmi dakikalık pazar avını destekler; iki deneyim aynı economy clock üzerinde yaşar.

| Oturum | Süre | Tipik amaç | Zorunlu UX |
| --- | --- | --- | --- |
| Hızlı kontrol | 2–4 dk | Alıcı teklifini gör, fırsat alarmını kontrol et, satış kapat | Tek bakışta durum, az modal, hızlı geri dönüş |
| Fırsat avı | 6–12 dk | Bir family tarayıp 1–2 işlem yap | Kıyas, inceleme, pazarlık akıcı |
| Aktif ticaret | 12–25 dk | Birden çok kategori, hazırlık ve ilan yönetimi | Filtre, portföy ve event görünürlüğü |
| Dönüş oturumu | 1–5 dk | Offline özeti, satış sonuçları, yeni pazar | Şeffaf zaman özeti ve tek CTA |

Pazar, oyuncu uygulamadayken ve uzaktayken aynı kurallarla ilerler; fakat offline simülasyon fırsatların tamamını silip oyuncuyu cezalandırmaz. Hızlı kontrol oyuncuyu gereksiz menü temizliğine zorlamaz. Uzun oturum ise sınırsız ücretsiz yenileme üzerinden değil, farklı family’leri okuyup sermaye dağıtma üzerinden derinleşir.

## Oturum ergonomisi
- Ana CTA’lar ekranın alt %60’ında ve tek başparmak erişiminde kalır.
- Bir işlemde zorunlu modal sayısı en fazla ikidir: karar ve onay/sonuç.
- Oyuncu uygulamayı kapatırken açık pazarlık, reserved asset ve buyer offer state’i kaybolmaz.
- İlk 20 aktif oyun dakikası ve ilk tamamlanmış satış öncesinde reklam teklifi veya IAP promosyonu gösterilmez; ayar menüsündeki mağaza erişimi inceleme amacıyla açık kalabilir.
- Her oturum “bugün yapılacaklar” listesiyle değil, pazarın yarattığı doğal fırsatlarla başlar.

## Oturum kalite eşiği
> **[HİPOTEZ] Oturum kalite eşiği:** Aktif ticaret oturumunun en az yarısında oyuncu iki veya daha fazla farklı karar türü kullanmalıdır: kıyas, inceleme, pazarlık, hazırlık ya da çıkış. Sadece yenile–al döngüsü baskınsa pazar derinliği çalışmıyordur.


---

<!-- PAGE 11 -->

# 11. Çekirdek Döngüler
> Döngüler birbiri üstüne biner; ayrı menülerde kopuk mini oyunlara dönüşmez.

## Mikro döngü: bir işlem
1. İlanı gör: fiyat, kondisyon, satıcı ve ilgi sinyallerini tara.
2. Karşılaştır: aynı ProductFamily’den 2–5 ilanı yan yana değil, mobil stacked cards ile kıyasla.
3. Doğrula: ücretsiz kanıtları oku; gerekirse zaman veya küçük maliyet karşılığı inceleme yap.
4. Karar ver: hemen al, tam iki teklif hakkıyla pazarlık et, takip et veya bırak.
5. Sahip ol: asset portföye girer; maliyet tabanı ve sahiplik state’i kaydedilir.
6. Değer ekle: temizle, test et, aksesuar tamamla ya da olduğu gibi tut.
7. Listele: hızlı, dengeli, premium veya manuel fiyat stratejisi seç.
8. Teklifi yönet: alıcıyı kabul et, bir karşı teklif yap ya da bekle.
9. Kârı gerçekleştir: satış tamamlandığında net kâr hesaplanır ve kariyer olayı üretilir.

| Zaman ölçeği | Döngü |
| --- | --- |
| 30 saniye | Kartı oku → detay/kıyas → takip veya geç |
| 3–8 dakika | Fırsatı doğrula → pazarlık → satın al |
| 10–20 dakika | Portföy hazırla → listele → yeni nakitle ikinci fırsat |
| 1–3 gün | Kategori uzmanlığı ve saved search davranışı oluşur |
| 10–60 saat | Kişisel ticaret yolu, servet eşikleri ve ilk ev |
| Post-game | Yeni bölge, atölye/office ve daha büyük hedefler |

## Core loop bütünlüğü
> **[KİLİTLİ] Core loop bütünlüğü:** Buy → ownership → preparation → player listing → buyer offer → completed sale zinciri çalışmadan yeni kategori, event, reklam yerleşimi veya post-game geliştirilmez.


---

<!-- PAGE 12 -->

# 12. Karar Atomu: Gör → Kıyasla → Doğrula → Bağlan
> TradeUp’ın tekrar oynanabilir en küçük birimi tek ilan değil, ilanlar arasındaki karar gerilimidir.

| Aşama | Oyuncunun girdisi | Gizli motor | Geri bildirim |
| --- | --- | --- | --- |
| Gör | Feed tarama | Spawn ağırlıkları, ilan yaşı, pazar ısısı | Sakin fırsat/ilgi sinyali |
| Kıyasla | 2–5 ilan seçimi | Normalize attribute ve değer bandı | Fark satırları ve güven düzeyi |
| Doğrula | Kanıt/inceleme seçimi | Hidden attribute reveal + confidence | Ne öğrendi, ne hâlâ belirsiz |
| Bağlan | Nakit ve teklif kararı | Seller floor, NPC hazard, opportunity cost | Sonuç ve neden özeti |

Oyuncu her ilanda bütün bilgiyi toplamak zorunda değildir. Daha fazla doğrulama, daha doğru karar sağlar fakat zaman geçirir ve fırsatın başkasına gitme riskini yükseltir. Bu gerilim açıkça sinyallenir; oyun asla “incelediğin için ilanı gizlice sattım” demez. İnceleme başlamadan önce tahmini süre ve rekabet baskısı görünür.

## Geçerli oyun stilleri
- Hızlı oyuncu, yüksek belirsizlikte daha çok fırsat yakalar fakat hata payı taşır.
- Temkinli oyuncu, daha az işlem yapar fakat maliyet tabanını daha iyi korur.
- Uzman oyuncu, aynı bilgiye daha az süre/maliyetle ulaşır; otomatik kâr bonusu almaz.
- Nakit sıkışık oyuncu, iyi fırsatı görse bile portföyden çıkış planı yapmadan bağlanamaz.

## Nedensellik kartı
> **[KİLİTLİ] Nedensellik kartı:** Her satın alma ve satıştan sonra tek satırlık neden özeti gösterilir: “Kârın %45’i pazarlıktan, %30’u hazırlıktan, %25’i piyasa hareketinden geldi.” Oyuncu neyi doğru yaptığını öğrenir.


---

<!-- PAGE 13 -->

# 13. Pazar Dünya Modeli
> Feed bir içerik listesi değil; giriş, yaşlanma, talep ve çıkışları olan simüle edilmiş pazardır.

| Katman | Sorumluluk | Örnek değişkenler |
| --- | --- | --- |
| Global market | Ekonomi temposu ve eventler | supplyIndex, demandIndex, volatility, season |
| Category market | Kategoriye özel ısı ve likidite | trend, averageDaysToSell, buyerDepth |
| ProductFamily | Referans değer ve tipik özellikler | baseValue, depreciation, rarity, defectPool |
| ItemInstance | Tekil ürün gerçeği | condition, evidence, accessories, defects |
| Listing | Satıcının sunduğu fırsat | askingPrice, urgency, claims, age, competition |
| Player listing | Oyuncunun çıkış denemesi | bookCost, askingPrice, proofQuality, visibility |

Pazar tam yenileme butonuyla sıfırlanmaz. İlanlar akışa kademeli gelir, yaşlanır, teklif alır, NPC’ye satılır veya süresi dolarak çıkar. Oyuncu “Pazarı tara” aksiyonuyla yeni bir örneklem açabilir; bu aksiyon oyun zamanı ilerletir ve eski ilanların yaşamını sürdürür. Rewarded refresh de aynı dünyayı yok etmez; sadece yakındaki yeni ilanların görünürlüğünü artırır.

## Simülasyon ilkeleri
- Aynı ProductFamily için vertical slice’ta tipik 8–16 aktif ilan hedeflenir.
- Recent-repeat suppression, aynı variant/condition kombinasyonunun üst üste gelmesini azaltır; family yoğunluğunu yok etmez.
- Her ilan stable ID, seed, createdAtGameTime ve lifecycle state taşır.
- Gerçek saat yalnız offline delta için adaptörden gelir; domain motoru doğrudan Date.now çağırmaz.
- Pazar eventleri config ile eklenir; engine kodunda kategori adına özel branch açılmaz.

## Sahte canlılık
> **[YASAK] Sahte canlılık:** Her “yenile” basışında yepyeni 24 kart üretip önceki pazarı unutmak canlı pazar değildir. İlanların geçmişi ve kaderi state içinde yaşamalıdır.


---

<!-- PAGE 14 -->

# 14. İlan Yaşam Döngüsü ve NPC Yarışı
> FOMO, görünmez zar atışından değil okunabilir rekabetten gelir.

## Zorunlu state machine
```text
MARKET_LISTING
DRAFT → ACTIVE → WATCHED | NEGOTIATING
ACTIVE/WATCHED/NEGOTIATING → SOLD_TO_PLAYER | SOLD_TO_NPC | EXPIRED | WITHDRAWN

OWNED_ASSET
IN_INVENTORY → PREPARING → READY → LISTED → RESERVED → SOLD_PENDING → SOLD_COMPLETE
LISTED/RESERVED → IN_INVENTORY   (iptal / süre dolumu)
```

| Risk seviyesi | UI sinyali | Tipik davranış |
| --- | --- | --- |
| Düşük | İlgi sakin | Pahalı veya düşük likiditeli ilan uzun yaşar |
| Orta | Birkaç kişi inceliyor | Normal ilan makul sürede kapanabilir |
| Yüksek | İlgi artıyor | İyi fırsat kısa süre içinde NPC’ye gidebilir |
| Kritik | Başka teklif var | Son inceleme/pazarlık kararı gerçek zaman baskısı taşır |

NPC hazard; fiyat/fair ratio, family likiditesi, pazar talebi, satıcı aciliyeti, ilan yaşı ve rakip yoğunluğundan türetilir. Aynı state + aynı seed + aynı oyuncu aksiyon dizisi aynı sonucu üretir. Oyuncu bir sheet açtığı için yapay olarak korunmaz; fakat ilk oturum soft-protection, kritik ilanı okunamayacak kadar hızlı kaybettirmez.

## Adil rekabet sözleşmesi
- Pazarlık sırasında satıcı counter verdiyse ilan “reserved” değildir; rakip riski seller archetype’a göre sürebilir.
- Bir ilan NPC’ye gittiğinde kart fade olur, neden sinyali kalır ve benzer ilan shortcut’ı sunulur.
- Missed log yalnız anlamlı fırsatları kaydeder; her kaybolan kart için kırmızı bildirim üretmez.
- Offline dönüşte en iyi fırsatların tamamı silinmez; cap ve koruma örneklemi uygulanır.


---

<!-- PAGE 15 -->

# 15. Arz, Talep, Trend ve Likidite
> Değer ile satılma hızı aynı şey değildir; oyuncu nominal kârı bekleme maliyetiyle birlikte okur.

| Kavram | Tanım | Oyuncuya gösterim |
| --- | --- | --- |
| Referans değer | Family + variant için merkez fiyat | Uzmanlığa göre geniş/dar tahmin bandı |
| Talep | O fiyat civarında alıcı isteği | Sakin / dengeli / canlı / aşırı sıcak |
| Arz | Benzer ürün yoğunluğu | Az / normal / yoğun |
| Likidite | Makul fiyattan nakde dönüş hızı | Yavaş / orta / hızlı |
| Volatilite | Kısa dönem değer oynaklığı | Stabil / hareketli / riskli |
| Trend | Zaman içindeki yön | Düşüş / yatay / yükseliş; kesin grafik değil |

Yüksek biletli ürünlerde yüzde marjı küçülürken nominal kâr büyüyebilir; küçük ürünlerde hızlı dönüş yüksek yıllıklaştırılmış verim üretse de oyuncu bunu finans ekranı gibi görmez. TradeUp’ın dili “Bu ürün %8 daha pahalı fakat iki kat hızlı satılıyor” gibi karar cümleleridir.

## Motor davranışı
- Demand, buyer offer arrival rate’i etkiler; fair value’yu tek başına belirlemez.
- Liquidity, quick-sale discount’ini ve listing time-to-offer’ını etkiler.
- Supply yoğunluğu, premium asking price’ın kabul süresini uzatır.
- Trend, family referans değerini kademeli değiştirir; bir event ile servet bir anda yarıya inmez.
- Market history, Lv0’da gizli; uzmanlık arttıkça özet çizgi ve güven aralığı açılır.

## Karar okunabilirliği
> **[HİPOTEZ] Karar okunabilirliği:** Oyuncuların “en yüksek kâr” yerine farklı likidite stratejileri seçmesi, ekonominin tek doğru cevaba düşmediğini gösterir. Portföy dağılımı telemetride izlenir.


---

<!-- PAGE 16 -->

# 16. Ürün Ontolojisi ve Data-Driven İçerik
> Yeni içerik, motoru değiştirmeden yalnız veri ve asset sözleşmesiyle oyuna girebilmelidir.

## Hiyerarşi
```text
Category
  └─ ProductFamily
       ├─ VariantDefinition
       ├─ AttributeDefinition[]
       ├─ EvidenceDefinition[]
       ├─ DefectPool[]
       └─ AssetKey / OverlaySupport
            └─ ItemInstance
                 └─ Listing / OwnedAsset / PlayerListing
```

| Veri tipi | Örnek alanlar | Hard-code yasağı |
| --- | --- | --- |
| Category | id, displayName, expertiseCurve, attributeLayout | UI kategori adına göre özel ekran yazmaz |
| ProductFamily | baseValue, demand, liquidity, rarity, assetKey | Telefon/gitar branch’i yok |
| AttributeDef | type, unit, valueCurve, revealRule, formatter | Özellik satırı data’dan render olur |
| EvidenceDef | claimType, reliability, inspectionAction | Kanıt mantığı family verisiyle gelir |
| DefectDef | severity, valuePenalty, riskSignal, overlayKey | Kusur özel kod değil config’tir |
| VariantDef | valueFactor, ageCurve, compatibility | Model farkı veriyle çözülür |

Attribute motoru sayısal, kategorik, boolean, tarih ve range tiplerini destekler. Her attribute; oyuncuya görünen etiket, birim, değerleme etkisi, görünürlük seviyesi ve karşılaştırma önceliği taşır. Böylece otomobilde kilometre, telefonda pil sağlığı, saatte servis geçmişi, mobilyada ölçü aynı generic karşılaştırma katmanında işlenir.

## İçerik kabul kriteri
> **[KİLİTLİ] İçerik kabul kriteri:** Yeni ProductFamily eklemek için engine dosyası veya React component değiştirmek gerekiyorsa mimari başarısızdır. Kabul edilen değişiklikler: data schema’ya uygun config, lokalizasyon, asset manifest kaydı ve test fixture.


---

<!-- PAGE 17 -->

# 17. Kanıt ve İnceleme Sistemi
> Ucuz görünen ürün ile gerçek fırsat arasındaki fark, okunabilir kanıt zincirinden doğar.

| Kanıt durumu | Anlam | Örnek gösterim |
| --- | --- | --- |
| Görünür | Fotoğraftan veya ilandan doğrudan okunur | Ekran çizik, kutu var, renk |
| Satıcı iddiası | Doğrulanmamış beyan | “Pil yeni değişti” |
| Şüpheli | Çelişki veya eksik bilgi var | Fotoğraf/model bilgisi tutmuyor |
| Kontrol edildi | Basit inceleme ile doğruluk arttı | Pil testi yapıldı |
| Doğrulandı | Yüksek güvenli sonuç | Seri/model ve fonksiyon raporu uyumlu |
| Bilinmiyor | Hâlâ belirsiz | İç parça durumu |

| Aksiyon | Maliyet | Kazanç | Risk |
| --- | --- | --- | --- |
| Fotoğrafları incele | Ücretsiz / anlık | Görsel ipucu ve çelişki | Düşük |
| Satıcıya sor | Kısa oyun zamanı | Yeni iddia / satıcı tepkisi | İlan yaşlanır |
| Hızlı test | Zaman veya küçük ücret | 1–2 kritik attribute açılır | Rakip baskısı |
| Uzman raporu | Daha yüksek ücret / sınırlı | Dar değer bandı + kusur güveni | Fırsat maliyeti |

Her family için “kritik karar kanıtları” tanımlanır. Oyuncuya yirmi özellik dökmek yerine, değer ve risk üzerinde en etkili üç ila beş unsur öne çıkarılır. Uzmanlık, kanıt sonucunu daha güvenilir ve hızlı kılar; doğrulanmamış bilgiyi sihirli biçimde görünür yapmaz.

## Bilgi–zaman takası
> **[KİLİTLİ] Bilgi–zaman takası:** İnceleme daha iyi bilgi verir fakat pazar zamanını ilerletir. Bu takas, TradeUp’ın ana gerilimidir; reklam izlemek uzmanlık yerine geçemez, yalnız bir inceleme süresini hızlandırabilir.


---

<!-- PAGE 18 -->

# 18. Kondisyon, Kusur ve Adalet
> Belirsizlik oyuncuyu düşündürmeli; “oyun beni kandırdı” hissi yaratmamalıdır.

| Katman | Tanım | Değer etkisi |
| --- | --- | --- |
| Kozmetik kondisyon | Çizik, leke, yüzey aşınması | Görünür ve çoğunlukla doğrusal |
| Fonksiyon durumu | Çalışma kalitesi, pil, mekanik performans | Testle doğrulanır; daha yüksek etki |
| Eksik aksesuar | Kutu, kablo, kapak, kontrolcü | Tamamlama maliyeti ve likidite etkisi |
| Gizli kusur | İlk bakışta kesinleşmeyen risk | Daima bir risk sinyali veya kanıt yolu taşır |
| Nadir özellik | İmzalı, özel baskı, düşük üretim | Doğrulanırsa premium; sahte sürpriz yok |

## Fairness guardrail’leri
- Gizli kusur yalnız `riskSignal > 0` ise spawn olabilir; tamamen işaretsiz büyük zarar yasaktır.
- İlk 60 dakikada tek kusurun servetin %25’inden fazlasını silmesine izin verilmez.
- Defect severity, maksimum değer cezası ve hangi incelemeyle açılacağı data’da tanımlıdır.
- Oyuncu kusuru satın aldıktan sonra öğrenirse sonuç ekranı hangi işareti kaçırdığını veya neden kaçınılmaz belirsizlik olduğunu açıklar.
- Kusurlu ürün recovery’ye dönüşebilir: dürüst düşük fiyat, parça/aksesuar tamamlayarak çıkış veya kontrollü quick sale.

Kondisyon yüzdesi tek başına tüm değeri anlatmaz. %90 kozmetik durumda fakat kritik fonksiyon kusurlu bir ürün; %72 durumda tam çalışan üründen daha riskli olabilir. UI, “kondisyon” ile “doğrulama güveni”ni ayrı gösterir.

## Kırmızı kutu sürprizi
> **[YASAK] Kırmızı kutu sürprizi:** Satıştan sonra rastgele “ürün aslında sahteydi, tüm paran gitti” sonucu yoktur. Yüksek etkili sahtecilik/arıza, önceki kanıtlarda karşı oynanabilir bir iz bırakmalıdır.


---

<!-- PAGE 19 -->

# 19. Değerleme Motoru
> Motor gerçek değeri bilir; oyuncu yalnız uzmanlığı ve kanıt kalitesi kadarını tahmin eder.

## Temel formül sözleşmesi
```text
referenceValue = baseValue × trend × variant × age × season
instanceFairValue = referenceValue × conditionCurve × attributeFactor
                  × accessoryFactor × defectPenalty × rarityPremium
listingAsk = instanceFairValue × sellerKnowledge × urgency × noise × riskBias
playerEstimateBand = f(expertise, evidenceConfidence, marketHistory)
```

| Kural | Gerekçe |
| --- | --- |
| Paralar integer minor-unit olarak tutulur | Float hatası ve tutarsız yuvarlama engellenir. |
| Fair value production UI’da görünmez | Karşılaştırma oyunu hesap makinesine dönüşmez. |
| Tahmin bandı asimetrik olabilir | Riskli üründe aşağı yönlü belirsizlik daha büyüktür. |
| Yüksek bilette yüzde marj sıkışır | Nominal kâr büyürken ekonomi patlamaz. |
| Trend kademeli ve cap’li ilerler | Bir event tek başına serveti silmez. |
| Satıcı fiyatı fair value’dan türetilir ama hata yapabilir | Gerçek fırsat ve pahalı ilan birlikte oluşur. |

Değerleme; oyuncuya doğru cevabı değil güven aralığını verir. Aynı ürün için düşük uzmanlıkta “₺5.500–₺8.300” gibi geniş band, yüksek uzmanlık ve doğrulanmış kanıtta daha dar band görünür. Piyasa geçmişi, son satışların örneklemini sunar; motorun gizli merkezini ifşa etmez.

## Tek kaynak
> **[KİLİTLİ] Tek kaynak:** Satın alma, quick sale, buyer offer, net worth ve career stat’leri aynı valuation service’i kullanır. Ekranlar kendi fiyat formülünü yazamaz.


---

<!-- PAGE 20 -->

# 20. Muhasebe ve Ekonomi Değişmezleri
> Para hatası yalnız bug değildir; oyuncunun bütün kararlarını anlamsızlaştıran güven kırılmasıdır.

## Kanonik muhasebe
```text
bookCost = purchasePrice + preparationCost + inspectionCost + transparentFees
realizedProfit = completedSaleProceeds - bookCost
netWorth = cash + conservativeMarkToMarket(allOwnedAssets) - liabilities
liquidAssets = cash + executableQuickSaleValue

OWNERSHIP RULE: Inventory, Preparing, Listed, Reserved ve SoldPending state’leri
hâlâ oyuncu varlığıdır; yalnız SoldComplete sahipliği kapatır.
```

| Invariant | Zorunlu test |
| --- | --- |
| Varlık listelenince servetten düşmez | Inventory → Listed geçişinde netWorth yalnız piyasa hareketi kadar değişir. |
| Kâr alış maliyetinden hesaplanır | Buyer offer − askingPrice kullanımı yasaktır. |
| Tek işlem bir kez uygulanır | transactionId idempotent; çift callback para basmaz. |
| Nakit eksiye düşmez | Atomic purchase check + commit. |
| Asset iki state’te aynı anda bulunmaz | Ownership state machine uniqueness. |
| İptal edilen ilan asset’i geri verir | Listed → Inventory kayıpsız. |
| Save/load toplamları korur | Journal reconciliation testi. |

Her ekonomik aksiyon `TransactionJournalEntry` üretir: purchase, preparation, fee, listing, reservation, sale, refund, reward. UI’daki bakiye ve raporlar state üzerinde serbest hesaplar yazmak yerine bu kayıtlarla uzlaştırılır. Böylece yanlış kâr, kaybolan ürün ve iki kez verilen reward erken yakalanır.

## Mevcut prototip düzeltmesi
> **[P0] Mevcut prototip düzeltmesi:** Şu an aktif ilana çıkan ürün servet hesabından kayboluyor ve buyer offer satış kârı ilan fiyatına göre hesaplanıyor. v2.1 implementasyonunun ilk işi unified OwnedAsset + cost basis + journal düzeltmesidir.


---

<!-- PAGE 21 -->

# 21. Nakit, Servet, Likidite ve Recovery
> Yüksek servet her zaman yeni fırsatı finanse edebilmek demek değildir; gerilim burada doğar.

| Cash / net worth | Durum | Oyuncuya mesaj | Sistem davranışı |
| --- | --- | --- | --- |
| %25+ | Sağlıklı | Fırsat sermayen güçlü | Normal pazar |
| %10–25 | Dikkat | Nakit payın düşüyor | Çıkış önerileri görünür |
| %5–10 | Sıkışık | Servetin ürünlere bağlı | Quick sale ve teklif süreleri öne çıkar |
| <%5 | Kilitli | Yeni fırsatı finanse etmek zor | Recovery shortcut; ceza yok |

## Likidite araçları
- Cash satın alma gücüdür; net worth satın alma izni vermez.
- Quick sale, fair value altı fakat anında ve şeffaf executable değerdir; ürün kategorisine göre discount değişir.
- Oyuncu iyi fırsat için mevcut ilanını fiyat düşürerek hızlandırabilir; otomatik satış yapılmaz.
- Hard bankruptcy yoktur. Oyuncu tamamen sıkışırsa düşük değerli recovery işi/ürünü açılır; kariyer hikâyesi silinmez.
- Görünmez soft pity, yalnız normal iyi fırsat yoğunluğunu hafifçe artırır; ultra fırsat garantilemez.

Recovery, oyuncuyu reklam izlemeye veya kaydı sıfırlamaya zorlamaz. “Küçük eşya bul”, “portföyden hızlı çık” ve “aktif ilanı revize et” gibi oyun içi yollar sunar. Negatif cash, faizli borç ve sert kredi sistemi vertical slice kapsamı dışındadır; borç eklenecekse ayrı risk modeli ve adalet testi gerekir.

## Kaybetme ilkesi
> **[KİLİTLİ] Kaybetme ilkesi:** Oyuncu kötü alış yüzünden yavaşlayabilir; oyunu oynayamaz hale gelmez. Recovery, hatayı silmez ama yeni doğru karar için kapıyı açık tutar.


---

<!-- PAGE 22 -->

# 22. Satın Alma Pazarlığı: Tam İki Hak
> İki teklif, mobil hız ile gerçek risk arasında oyunun imza ritmidir.

## Kanonik akış
1. Oyuncu “Pazarlık et”e basar; arayüz ● ● gösterir.
2. Birinci oyuncu teklifi gönderilir ve bir hak tüketilir: ● ○.
3. Satıcı kabul, ret veya karşı teklif üretir. Satıcının cevabı ayrıca hak tüketmez.
4. Karşı teklif doğrudan kabul edilirse işlem tamamlanır; ek oyuncu hakkı harcanmaz.
5. Oyuncu karşı teklifi kabul etmeyip yeni fiyat sunarsa ikinci ve son hakkını kullanır: ○ ○.
6. Son teklif reddedilirse görüşme kapanır. Reklam, IAP, premium lisans veya başka bir sistem ek oyuncu teklifi vermez.

| Teklif modu | Davranış | UI dili |
| --- | --- | --- |
| Agresif | Düşük fiyat, düşük kabul, yüksek fırsat marjı | “Yüksek risk” |
| Dengeli | Floor’a makul yaklaşım | “Önerilen” değil “Dengeli” |
| Güvenli | İlanı kaçırmama odaklı | “Kabul ihtimali daha yüksek” |
| Manuel | Oyuncu slider/sayıyla fiyat seçer | FTUE sonrası açılır |

Kesin kabul yüzdesi gösterilmez. Uzmanlık ve satıcı okuması “düşük / orta / yüksek güven” sinyali verir. Teklif sonucu; teklif/floor oranı, urgency, patience, seller knowledge, competitor pressure, offer index ve seed’den türetilir.

## İki hakkın bütünlüğü
> **[KİLİTLİ] İki hakkın bütünlüğü:** Satın alma pazarlığı daima iki oyuncu teklifiyle sınırlıdır. `NEGOTIATION_RETRY` placement’ı kaldırılmıştır; gerçek para, reklam, günlük ödül veya premium lisans bu sınırı genişletemez.


---

<!-- PAGE 23 -->

# 23. Satıcı Arketipleri ve Rekabet Baskısı
> Arketip oyuncuya ezberlenecek renk değil, okunacak davranış paterni sunar.

| Arketip | Motivasyon | Fiyat / sabır | Risk |
| --- | --- | --- | --- |
| Acilci | Bugün nakit ister | Daha düşük floor, kısa sabır | Rakibe hızlı satabilir |
| Piyasacı | Değeri bilir | Dar pazarlık alanı | Fırsat az, güven yüksek |
| Bilgisiz | Değeri yanlış tahmin eder | Çok ucuz veya çok pahalı olabilir | Kanıt çelişkisi |
| Duygusal | Ürüne bağlı | İndirim zor, counter sık | Süre uzar |
| Tüccar | Hızlı devir ve marj | Keskin, tutarlı fiyat | İyi ilanı bekletmez |
| Riskli | Sorunu saklayabilir | Cazip fiyat | Yüksek evidence ihtiyacı |
| Toplu satıcı | Lot çıkarır | Bundle indirimi | Sermaye bağlama |

Arketip ismi doğrudan her ilanda yazmak zorunda değildir. Oyuncu profil parçalarından, mesaj tonundan, ilan kalitesinden ve geçmiş güven skorundan davranışı çıkarır. Düşük uzmanlıkta yalnız “Aceleci görünüyor”; yüksek uzmanlıkta “fiyatı biliyor, pazarlık alanı dar” gibi daha doğru sinyal açılır.

## Davranış tasarımı
- Seller trust, hidden floor değildir; iddia doğruluğu ve işlem davranışı geçmişidir.
- Arketip, her seferinde aynı sonucu vermez; dağılımı ve karar mantığını şekillendirir.
- Pazarlık ekranında uzun metin sohbeti yoktur; kısa cümleler ve davranış feedback’i vardır.
- Rakip baskısı seller archetype + listing heat ile birlikte görünür; rastgele kapanış hissi azaltılır.

## Satıcı hafızası
> **[DENEY] Satıcı hafızası:** Soft launch sonrasında tekrar karşılaşılan güvenilir satıcılar ve ilişki geçmişi test edilebilir. Fiyat bonusu değil, daha güvenilir kanıt ve erken ilan erişimi vermelidir.


---

<!-- PAGE 24 -->

# 24. Sahiplik ve Hazırlık Sistemi
> Oyuncu yalnız fiyat farkından değil, ürüne doğru bilgiyi ve sunumu ekleyerek de değer yaratır.

| OwnedAsset state | Oyuncu aksiyonu | Net worth durumu |
| --- | --- | --- |
| IN_INVENTORY | Tut, incele, hazırlık seç | Conservative mark-to-market |
| PREPARING | Aksiyon süresini bekle/bitir | Asset hâlâ oyuncuya ait |
| READY | Listeleme stratejisi seç | Güncel doğrulanmış değer |
| LISTED | Fiyatı revize et, geri çek | Servette sayılmaya devam eder |
| RESERVED | Alıcı süreci / onay | Cash değildir; asset olarak sayılır |
| SOLD_PENDING | Atomic settlement | Çift sayım engellenir |
| SOLD_COMPLETE | Kariyer ve kâr kaydı | Asset çıkar, cash girer |

Hazırlık aksiyonları family’nin desteklediği veri üzerinden gelir; her ürün için ayrı mini oyun yazılmaz. Vertical slice üç aksiyonla başlar: **Temizle**, **Test Et**, **Tamamla**. Bunlar ürünün gerçek durumunu aşan sihirli kalite üretmez; yalnız kozmetik kondisyonu sınırlı yükseltir, güveni artırır veya eksik aksesuarı giderir.

## Hazırlık guardrail’leri
- Her aksiyon öncesi maliyet, süre, maksimum olası değer etkisi ve likidite etkisi görünür.
- Hazırlık cost basis’e eklenir; satış kârı bu maliyeti düşer.
- Aynı asset’e sonsuz temizlik/servis spam’i yapılamaz; action cap ve diminishing returns vardır.
- Hazırlık sonucu deterministiktir veya aralık açıkça belirtilir; rastgele coin sink değildir.
- Oyuncu ürünü hiç hazırlamadan da satabilir; sistem zorunlu bekleme duvarı değildir.

## Değer yaratma fantezisi
> **[KİLİTLİ] Değer yaratma fantezisi:** TradeUp’ın orta oyun derinliği yalnız “daha ucuza al” değildir. Oyuncu kanıt kalitesini ve satış sunumunu iyileştirerek ölçülebilir değer yaratabilmelidir.


---

<!-- PAGE 25 -->

# 25. Envanterden Değer Yaratma
> Hazırlık, fırsatın ikinci yarısıdır: doğru ürünü almak kadar doğru çıkışa hazırlamak da ustalık ister.

| Aksiyon | Etkisi | Cap / bedel | Örnek |
| --- | --- | --- | --- |
| Temizle | Kozmetik condition ve listing appeal | Family cap; zaman + küçük maliyet | Leke/aşınma görünümü azalır |
| Test et | Evidence confidence ve buyer trust | Kritik attribute sayısı sınırlı | Pil/fonksiyon raporu |
| Tamamla | Accessory factor ve likidite | Aksesuar bulunabilirliği + maliyet | Kablo, kutu, kapak |
| Hafif servis | Fonksiyon riskini düşürür | Soft launch; başarısızlık aralığı şeffaf | Kayış/pil/ayar |
| Bundle | Lot satışı ve ticket size | Post-alpha; sermaye bağlar | Plak + pikap aksesuarı |

Oyuncu aksiyon seçerken “değer artışı” kadar “satılma hızı”nı da görür. Bir kabloyu tamamlamak fiyatı yalnız %3 artırabilir fakat alıcı havuzunu belirgin genişletebilir. Bu, nominal kâr ile likidite arasında ikinci bir karar katmanı oluşturur.

## Sonuç ve geri bildirim
- ValueAddedBreakdown; pazarlık kazancı, hazırlık katkısı, piyasa hareketi ve ücretleri ayrı raporlar.
- Hazırlık slot sayısı progression aracı olabilir; doğrudan kâr çarpanı olmaz.
- Oyuncu yanlış aksiyon seçerse tamamen boşa gitmez; evidence veya appeal üzerinde küçük etkisi kalır.
- Kategori uzmanlığı, hangi aksiyonun daha verimli olduğunu daha doğru tahmin eder.
- Hazırlık tamamlanınca asset görselinde uygun overlay/badge değişir; gameplay data ile senkron kalır.

## Vertical slice doğrulaması
> **[HİPOTEZ] Vertical slice doğrulaması:** Hazırlık kullanan oyuncuların yalnız bekleme süresi değil, karar çeşitliliği ve ürünle bağ hissi artmalıdır. Kullanım yüksek fakat kâr etkisi anlaşılmıyorsa UI; kullanım düşükse maliyet/yarar dengesi yeniden çalışılır.


---

<!-- PAGE 26 -->

# 26. Satış İlanı ve Çıkış Stratejisi
> Satın almak fırsatın yarısıdır; kâr ancak doğru çıkış tamamlandığında gerçektir.

| Strateji | Fiyat davranışı | Teklif hızı | Kullanım |
| --- | --- | --- | --- |
| Hızlı nakit | Executable quick-sale bandı | Anlık / çok hızlı | Yeni fırsatı finanse et |
| Dengeli | Tahmini fair bandı civarı | Orta | Varsayılan çıkış |
| Premium | Üst band + kanıt kalitesi | Yavaş | Nadir/iyi hazırlanmış ürün |
| Manuel | Oyuncu tam fiyat seçer | Motor tahmin verir | FTUE sonrası kontrol |

Player listing; original ownedAssetId, bookCost, askingPrice, evidenceSummary, preparationSummary, visibility, createdAtGameTime ve lifecycle state taşır. Owned asset başka bir collection’a kopyalanıp kaybolmaz; tek kimlik state değiştirir.

## İlan yaşam kalitesi
- Fiyat önerisi kesin “doğru fiyat” değildir; beklenen ilk teklif süresi ve tahmini buyer depth ile sunulur.
- İlanı çok sık fiyat değiştirmek küçük visibility/credibility maliyeti doğurabilir; oyuncu spam yapmaz.
- İlan geri çekilince asset envantere döner ve history korunur.
- Listing quality, final asset güzelliği değil kanıt tamlığı, açıklık ve hazırlık durumundan türetilir.
- Satılmayan ürünün nedeni görünür: fiyat yüksek, talep düşük, kanıt zayıf veya pazar arzı yoğun.

## Quick sale şeffaflığı
> **[KİLİTLİ] Quick sale şeffaflığı:** Hızlı satış otomatik “zarar tuzağı” değildir. Oyuncu onaydan önce satış geliri, book cost, net kâr/zarar ve kaybettiği tahmini premiumu görür.

Alıcı bulmak için ayrı “Piyasayı ilerlet” spam butonu kullanılmaz. Dünya clock’u, oturum aksiyonları ve offline delta ile ilerler. Oyuncu görünürlüğü artırabilir fakat tüm marketi her basışta yeniden yaratamaz.


---

<!-- PAGE 27 -->

# 27. Alıcı Teklifleri ve Satış Pazarlığı
> Alıcı tarafı, satın alma pazarlığını kopyalamaz; çıkış stratejisini tamamlayan daha kısa bir ritimdir.

| Alıcı tipi | Davranış | Teklif eğilimi |
| --- | --- | --- |
| Hızlı alıcı | Bugün teslim ister | Düşük–orta teklif, hızlı kapanış |
| Kalite arayan | Kanıt ve kondisyon önemser | İyi hazırlanmış ürüne premium |
| Pazarlıkçı | İlk teklifi düşük açar | Bir counter alanı |
| Koleksiyoncu | Nadir attribute arar | Doğrulanmış rarity’ye yüksek ödeme |
| Riskten kaçınan | Belirsiz üründen uzak durur | Evidence eksikse teklif vermez |
| Toplu alıcı | Bundle/lot hedefler | Adet karşılığı indirim |

Vertical slice satış tarafında üç aksiyon kullanır: **Kabul et**, **Bir karşı teklif yap**, **Reddet/bekle**. Bir counter sonrası alıcı kabul eder, çekilir veya son fiyat sunar; uzun mesaj zinciri yoktur. Buyer offer expiry gerçek oyun zamanıdır ve save/load sonrası korunur.

## Settlement kuralları
- Teklif tutarı listing askingPrice’tan değil fair value, buyer motive, evidence quality, demand ve seed’den türetilir.
- Kâr her zaman original bookCost üzerinden hesaplanır.
- Aynı buyer adı/teklifi spam üretmez; buyer history ve cooldown vardır.
- Nadiren askingPrice üstü acil alıcı gelebilir; rarity/demand ile gerekçelenir.
- Reserved state sırasında başka buyer offer çifte satış yaratamaz.

## Gelişmiş müşteri ilişkisi
> **[ERTELENDİ] Gelişmiş müşteri ilişkisi:** Tekrarlayan müşteriler, güven puanı ve özel siparişler ancak çekirdek buyer offer verisi güçlü retention gösterirse post-soft-launch kapsamına alınır.


---

<!-- PAGE 28 -->

# 28. Uzmanlık ve Bilgi İlerlemesi
> Uzmanlık oyuncunun yerine karar vermez; aynı pazarı daha net okumasını sağlar.

| Seviye | Bilgi görünürlüğü | Araç |
| --- | --- | --- |
| Lv0 | Fiyat + temel görünen özellik | Geniş “belirsiz” band |
| Lv1–2 | Basit fırsat ve likidite sinyali | Temel compare highlight |
| Lv3–5 | Daha dar değer bandı, risk yoğunluğu | Saved search ve trend özeti |
| Lv6–8 | Kanıt güveni ve kusur ihtimali | Daha hızlı test / daha iyi action forecast |
| Lv9–10 | Uzman tahmini ve kritik attribute önceliği | Portföy analizi; otomatik alım yok |

## Kazanım modeli
- İlan açmak küçük XP; compare ve inceleme anlamlı XP; satın alma orta; tamamlanmış satış yüksek XP verir.
- Aynı family spam’i diminishing returns alır; kategori içi çeşitlilik teşvik edilir.
- Zararlı alış öğrenme XP’si verir; oyuncu yalnız kazanırken ilerlemez.
- Expertise ekonomik fiyat çarpanı veya gizli kabul bonusu değildir.
- Kategori seviyeleri ayrı, genel market literacy hesabı ayrıdır.

Uzmanlık UI’sı ayrı bir skill tree kalabalığına dönüşmez. Oyuncu yeni bir bilgi aracını açtığında pazar ekranında doğrudan görür. Örneğin Lv3 sonrası “Likidite: Hızlı”, Lv6 sonrası “Bu satıcının iddiasında çelişki olasılığı orta” gibi gerçek karar sinyalleri gelir.

## Araç aç, kâr çarpanı açma
> **[KİLİTLİ] Araç aç, kâr çarpanı açma:** Progression, oyuncuyu daha zengin olduğu için otomatik daha iyi tüccar yapmaz. Daha iyi karşılaştırma, doğrulama ve portföy araçları verir; sonuç hâlâ karara bağlıdır.


---

<!-- PAGE 29 -->

# 29. Kişisel Kariyer Zaman Çizgisi
> Servet yolculuğu önceden yazılmaz; oyuncunun gerçek işlem geçmişinden seçilir.

| CareerEvent | Oluşma kuralı |
| --- | --- |
| FIRST_SALE | İlk tamamlanmış gerçek satış |
| FIRST_PROFITABLE_SALE | İlk pozitif realized profit |
| BEST_FLIP_UPDATED | Yeni nominal veya yüzdesel kâr rekoru |
| VALUE_ADDED_RECORD | Hazırlık katkısı yeni rekor |
| WEALTH_MILESTONE | Config: 10K, 100K, 1M… |
| EXPERTISE_MILESTONE | Kategori uzmanlığı eşiği |
| FIRST_HIGH_TICKET_TRADE | Config threshold üstü işlem |
| DOMINANT_CATEGORY_CHANGED | Gerçek kâr dağılımına göre kategori kimliği |
| HOME_PROGRESS | %25 / %50 / %75 / %90 |
| HOME_PURCHASE | İlk ev işlemi tamamlandı |

Her trade timeline’a girmez. Sistem, anlamlı olayları append-only biçimde kaydeder; eski olayları yeni içerik geldi diye sessizce yeniden yazmaz. Event kartı family assetKey, buy/sell price, realized profit, value-added breakdown ve wealthAtEvent taşıyabilir.

## Kişiselleştirme kuralları
- Sabit Defter → Kulaklık → Telefon → Araba ikon zinciri yasaktır.
- Oyuncu gitar, mobilya veya koleksiyon rotasıyla aynı eşiklere ulaşabilir.
- Dominant category yalnız kimlik ve sunum üretir; gizli bonus vermez.
- Timeline filtresi: İlkler, Rekorlar, Eşikler, Ev Yolculuğu.
- Milestone feedback kısa, premium ve kişisel; sürekli konfeti yoktur.

## Oyuncunun kanıtı
> **[KİLİTLİ] Oyuncunun kanıtı:** Ev finalinde gösterilecek hikâye, gerçekten yapılmış işlemlerden üretilmelidir. Kodda sabit başarı montajı oynatmak kabul edilmez.


---

<!-- PAGE 30 -->

# 30. Progression: Ürün Merdiveni Değil, Erişim Genişlemesi
> Oyuncu hangi ürünle büyüyeceğine karar verir; oyun yalnız yeni pazarları ve araçları açar.

| Aşama | Servet / yeterlilik | Yeni erişim örneği | Eski dünya |
| --- | --- | --- | --- |
| Başlangıç | 0–1K | Küçük eşya, temel compare | Tam erişim |
| Mikro tüccar | 1K–10K | Ses, ev, moda; saved search | Açık kalır |
| İkinci el avcısı | 10K–75K | Telefon, oyun, bilgisayar; test | Açık kalır |
| Çoklu kategori | 75K–250K | Kamera, müzik, mobility; çoklu hazırlık | Açık kalır |
| Büyük bilet | 250K–1M | Motosiklet, premium koleksiyon | Açık kalır |
| Sermayedar | 1M–3M+ | Otomobil ve yüksek değerli lot | Açık kalır |
| Ev hedefi | Config | Emlak satın alma seçimi | Açık kalır |

Unlock yalnız net worth’e bağlanmaz; temel sistemleri kullanmış olma ve doğrulanmış işlem sayısı da gerekebilir. Böylece tek ultra şanslı satış oyuncuyu anlamadığı yüksek biletli pazara fırlatmaz. Ancak bu koşullar grind duvarı değildir; oyuncuya hangi becerinin eksik olduğu açıkça söylenir.

## Progression ergonomisi
- Düşük fiyatlı fırsatlar late-game’de de ekonomik olarak anlamlı kalır: hızlı likidite, bundle veya koleksiyon değeri.
- Kategori içerikleri servete göre kapanmaz; yalnız yüksek riskli segmentler açılır.
- Progress bar ana ekranda baskın görev oku olmaz; ev hedefi küçük, kalıcı ve sakin görünür.
- Yeni araç açıldığında kısa uygulamalı öğretim verilir; sekiz menü aynı anda açılmaz.

## Sabit rota
> **[YASAK] Sabit rota:** Kod veya UI “şimdi kulaklık, sonra telefon, sonra araba” öneremez. Tavsiye yalnız oyuncunun mevcut nakdi, uzmanlığı ve takip ettiği pazar üzerinden dinamik olabilir.


---

<!-- PAGE 31 -->

# 31. Ev Hedefi, Final Anı ve Post‑Game
> Ev, para sink’i değil; oyuncunun gerçek kararlarının görünür sonucu olan duygusal finaldir.

Home goal locale/economy config ile tanımlanır; prototip Türkiye paketi için 3.500.000 TL yalnız başlangıç kalibrasyonudur. Ev ekranı, oyunun başında dev bir uzak hedef olarak oyuncuyu ezmez. İlk kârlı satış ve temel döngü öğrenildikten sonra açılır.

| Eşik | Sunum |
| --- | --- |
| %25 | Sakin milestone kartı; “yol başladı” |
| %50 | Ev silueti ve kalan tutar daha görünür |
| %75 | Kariyerden seçilen ilk üç önemli işlem |
| %90 | Kalan nakit + likidite planı; acele ettiren reklam yok |
| %100 | Ev satın alma kararı; 3–5 sn kişisel final sekansı |

## Final sözleşmesi
- Ev satın alma için cash gerekir; envanter değeri otomatik nakde çevrilmez.
- Final sekansında başlangıç defteri, en çok kâr edilen family veya ilk büyük flip gibi gerçek assetler görünür.
- Home purchase gameplay’i kapatmaz; oyuncu pazara ve timeline’a devam eder.
- Post-game seçenekleri: daha iyi ev, küçük atölye/office, yeni şehir, koleksiyon vitrini. Hepsi ERTELENDİ statüsündedir.
- Ev görseli mağaza IAP’siyle gerçek hedefin önüne geçmez.

## Kişisel final
> **[KİLİTLİ] Kişisel final:** Final montajı careerEvents ve owned history’den türetilir. Oyuncunun hiç ticaretini yapmadığı telefon/araba asset’i başarı sembolü olarak zorla gösterilmez.


---

<!-- PAGE 32 -->

# 32. Pazar Olayları ve Live Ops
> Live ops içerik ekler; oyuncunun temel ekonomisini keyfî biçimde bozmaz.

| Event | Etki | Counterplay |
| --- | --- | --- |
| Yeni model çıktı | Önceki variant değeri kademeli düşer | Trend uyarısı, hızlı çıkış |
| Turnuva / oyun lansmanı | Konsol ve aksesuar demand artar | Saved search ve stok planı |
| Sezon değişimi | Mobility/ev kategorilerinde talep kayar | Kategori çeşitlendirme |
| Koleksiyon hype | Nadir family kısa süre premium | Authenticity evidence gerekir |
| Piyasa sakinliği | Fırsat ve buyer depth azalır | Likidite odaklı fiyatlama |
| Taşınma dönemi | Mobilya arzı artar, fiyat dağılır | Toplu fırsat / depolama kararı |

## Live ops guardrail’leri
- Event config; start/end, affected tags, multipliers, player messaging, caps ve seed taşır.
- İlk saatlerde yüksek volatilite event’i yoktur.
- Bir event, tek tick’te family değerini güvenli cap’in dışına itemez.
- Event duyurusu “şimdi al” emri değil, gözlem sinyalidir.
- Geçmiş event etkileri market history’de açıklanabilir kalır.

Live ops takvimi, geliştirici üretim borcunu gizlemek için sürekli event yağdırmaz. Bir event; yeni karar, farklı pazar dağılımı veya oyuncunun mevcut portföyüne yeni anlam katmıyorsa kullanılmaz. Sadece “%20 daha fazla fiyat” event’i tekrar hissini hızlandırır.

## Sosyal ortak pazar
> **[ERTELENDİ] Sosyal ortak pazar:** Global event, leaderboard veya oyuncular arası pazar; server authoritative ekonomi ve anti-cheat gerektirir. Single-player çekirdek retention kanıtlanmadan kapsam dışıdır.


---

<!-- PAGE 33 -->

# 33. Retention: Görev Listesi Değil Merak
> Oyuncu her gün kırmızı rozet temizlemek için değil, bugün pazarda ne olduğuna bakmak için dönmelidir.

| Dönüş nedeni | Sistem | Kaçınılan kötü örnek |
| --- | --- | --- |
| Yeni fırsat | Saved search / watchlist sinyali | Saat başı spam push |
| Çıkış sonucu | Buyer offer ve listing özeti | Sahte “müşteri bekliyor” bildirimi |
| Pazar değişimi | Trend/event ve arz kayması | Her gün aynı ödül takvimi |
| Kariyer ilerlemesi | Rekor, milestone, home progress | Zorunlu günlük streak kaybı |
| Ustalık | Yeni bilgi aracı ve kategori sinyali | Sadece XP bar doldurma |

Görevler varsa “3 reklam izle” veya “10 rastgele ürün al” şeklinde olmaz. Pazar öğrenmesini teşvik eder: iki ilanı karşılaştır, bir claim’i doğrula, portföy likiditesini %10 üstüne çıkar. Görev ödülü sınırlı bilgi/hız kolaylığı veya kozmetik olabilir; ekonomi para basmaz.

## Geri dönüş etiği
- Push opt-in ve seyrektir: saved search eşleşmesi, buyer offer sonu, hazırlık tamamlanması.
- Streak kırılması oyuncunun kalıcı ilerlemesini silmez.
- Günlük sistem core loop’u ikame etmez; oyuncu takvim açmadan oynayabilir.
- Offline özet, “sen yokken şu kadar para bastın” değil, hangi ilanların ne olduğunun şeffaf raporudur.
- Sezon sistemi ancak içerik ve retention verisi doğrulandıktan sonra eklenir.

## Retention sinyali
> **[HİPOTEZ] Retention sinyali:** D7 oyuncularının en az iki farklı kategoriye bakması ve bir saved search/takip davranışı göstermesi, pazar merakının oluştuğunu gösterir. Yalnız ödül toplamak için açılan oturumlar başarı sayılmaz.


---

<!-- PAGE 34 -->

# 34. Monetizasyon Sözleşmesi: İş Modeli ve Satılabilir Ürünler
> Gelir, oyuncunun pazar zekâsını veya ekonomik sonucunu satmaz. TradeUp para karşılığı yalnız reklam zamanını kaldırır ve oyunun sunumunu kişiselleştirir.

| Alan | v1.0 kilitli karar |
| --- | --- |
| Dağıtım | Ücretsiz indirilebilir; ev finali ödeme yapmadan ulaşılabilir. |
| Reklam | Yalnız açık kullanıcı seçimiyle standart rewarded video. Banner, interstitial, app-open ve rewarded-interstitial yoktur. |
| IAP tipi | Yalnız kalıcı, geri yüklenebilir non-consumable ürünler. |
| Abonelik | v1.0’da yoktur; canlı içerik yükümlülüğü kanıtlanmadan eklenmez. |
| Premium para / consumable | Yoktur. Satın alınabilir coin, bilet, enerji, cash veya tekrar kullanılabilir booster bulunmaz. |
| Paid power | Yoktur. Daha iyi fiyat, daha yüksek teklif, garanti fırsat, ek pazarlık hakkı ve kategori/uzmanlık avantajı satılmaz. |
| Fiyat gösterimi | Arayüz fiyatı mağaza metadata’sından okur; TRY veya başka para birimi uygulamada hard-code edilmez. |

## v1.0 IAP ürün kataloğu
| Product ID | Mağaza tipi | Hedef taban fiyat* | Kalıcı entitlement | İçerik |
| --- | --- | ---: | --- | --- |
| `tradeup_premium_lifetime` | Non-consumable | USD 4.99 eşdeğeri | `premium_lifetime` | Uygun rewarded haklarını video izlemeden kullanma; aynı cap/cooldown/sonuç. Özel Obsidian Ledger arayüz teması, kurucu rozeti ve iki alternatif uygulama ikonu. |
| `tradeup_theme_night_market` | Non-consumable | USD 1.99 eşdeğeri | `theme_night_market` | Gece Pazarı uygulama kabuğu, portföy zemini, satış damgaları ve uyumlu ses/haptik sunumu. |
| `tradeup_theme_workshop` | Non-consumable | USD 1.99 eşdeğeri | `theme_workshop` | Endüstriyel Atölye kabuğu, portföy zemini, işlem kartı çerçeveleri ve satış damgaları. |
| `tradeup_home_styles_01` | Non-consumable | USD 2.99 eşdeğeri | `home_styles_01` | Ev satın alındığında seçilebilen üç iç mekân stili, timeline zemini ve final sunum varyasyonları. Ev ilerlemesine para eklemez. |

\* Mağaza, bölgesel fiyatı ve vergiyi kendi sisteminden gösterir. Bu rakamlar v1.0 ürün konumlandırmasını kilitler; kod fiyat yazmaz.

## Kozmetik bütünlük
- Ücretli temalar yalnız uygulama kabuğu, portföy alanı, milestone sunumu, profil ve ev görünümünü değiştirir.
- Ürün fotoğrafı, kozmetik kondisyon, çatlak/kir overlay’i, risk rengi, evidence badge’i ve fiyat sinyali ücretli temayla değiştirilemez. Ticari karar okunabilirliği herkes için aynıdır.
- Ücretli içerik oyuncuya daha temiz ürün, daha yüksek condition puanı veya ücretsiz hazırlık sağlamaz.

## Gerçek para ile satılması yasak olanlar
> **[YASAK] Ekonomi satışı:** Cash/coin paketi, başlangıç sermayesi, borç silme, garantili sıcak ilan, item pack, kategori açma, expertise XP, seller floor düşürme, ek teklif hakkı, garanti alıcı, hazırlık başarı artışı, loot box/gacha, rastgele kozmetik kutu, battle pass ve abonelik v1.0 ürün kataloğuna giremez.


---

<!-- PAGE 35 -->

# 34A. Rewarded Reklam Yerleşimleri ve Kesin Limitler
> Rewarded reklam oyuncunun doğal olarak beklediği bir işlemi hızlandırır veya standart pazar örneklemini genişletir; sonucu iyileştirmez.

## Global uygunluk ve frekans
| Kural | Kilitli değer |
| --- | --- |
| İlk görünme | `firstSaleComplete = true` ve `lifetimeActivePlayMinutes >= 20` |
| Rolling 24 saat global cap | 8 tamamlanmış reward |
| Oturum cap | 4 tamamlanmış reward |
| Global cooldown | 90 saniye; yalnız başarıyla uygulanan reward sonrası başlar |
| Aynı ekrandaki CTA | En fazla 1 rewarded CTA |
| Otomatik gösterim | Asla yok; CTA açık video simgesi ve ödül açıklaması taşır |
| Premium davranışı | Aynı placement, aynı sonuç, aynı cap/cooldown; video yerine `Premium hakkını kullan` |
| Cap hesabı | Takvim gece yarısı değil rolling 24 saat transaction ledger’ı; saat geri alma cap’i sıfırlamaz |

## v1.0 placement matrisi
| Placement ID | Göründüğü bağlam | Kesin ödül | Placement sınırı | Değiştirmediği şey |
| --- | --- | --- | --- | --- |
| `MARKET_SCOUT` | En az 8 ilan incelendiğinde veya aktif feed 8’in altına düştüğünde | Normal spawn dağılımından 4 yeni ilan arrival queue’ya eklenir | 2 / rolling 24s; oturumda 1 | İlanların fair value, rarity, hot-deal olasılığı ve NPC ömrü bias almaz; mevcut pazar silinmez |
| `FAST_INSPECTION` | Sonucu önceden üretilmiş aktif incelemede kalan süre >45 sn | İnceleme süresi şimdi tamamlanır | 3 / rolling 24s; aynı listing/asset için 1 | Evidence sonucu, confidence artışı, kusur ve değer hesabı değişmez |
| `FAST_PREPARATION` | Maliyeti ödenmiş hazırlıkta kalan süre >60 sn | Temizle / Tamamla / Hafif servis süresi şimdi biter | 3 / rolling 24s; aynı action instance için 1 | Maliyet, condition cap, accessory sonucu, başarı/arıza sonucu değişmez |
| `LISTING_REACH` | Oyuncu ilanı en az 5 oyun dakikası aktif ve henüz teklif almamışsa | Aynı buyer algoritmasıyla 1 ek exposure roll planlanır | 2 / rolling 24s; listing lifecycle başına 1 | Teklif garantisi, teklif tutarı, buyer bütçesi ve satış olasılığına gizli bonus yok |

Global cap placement cap’lerinin toplamından önce uygulanır. Oyuncu aynı gün bütün placement limitlerini tüketemezse hak devretmez ve birikmez.

## Bilinçli olarak kaldırılan placement’lar
- `NEGOTIATION_RETRY`: YASAK. Oyunun imzası olan iki oyuncu teklifini bozar ve düşük teklif spam’ini teşvik eder.
- `SECOND_OPINION`: YASAK. Reklam karşılığı daha doğru değer okuması satmak uzmanlık fantezisini zayıflatır.
- `DIRECT_CASH`, `DISCOUNT`, `GUARANTEED_BUYER`, `HOT_LISTING`: YASAK. Ekonomik sonucu doğrudan üretir.
- Offer sonrası “kaybı telafi et”, kaçan ilanı geri getir veya final anını hızlandır placement’ı yoktur.

## CTA dili
| Ücretsiz kullanıcı | Premium kullanıcı |
| --- | --- |
| “Yakındaki ilanları tara • Video” | “Premium tarama hakkını kullan” |
| “İncelemeyi şimdi bitir • Video” | “İncelemeyi şimdi bitir” |
| “Hazırlığı şimdi bitir • Video” | “Hazırlığı şimdi bitir” |
| “İlanı bir kez öne çıkar • Video” | “Premium erişim hakkını kullan” |


---

<!-- PAGE 36 -->

# 34B. IAP, Entitlement ve Reklam İşlem Akışı
> Satın alma ve reward işlemleri UI callback’i değil, doğrulanan ve tekrar uygulanamayan transaction’lardır.

## Mağaza UX sözleşmesi
- Mağaza her zaman **Ayarlar → Satın Almalar ve Görünüm** altında erişilebilir; böylece inceleme ve restore yolu gizlenmez.
- Yolculuk/Portföy içindeki kozmetik kısayollar ilk satıştan sonra açılır. İlk 20 aktif dakikada satın alma promosyon kartı gösterilmez.
- `tradeup_premium_lifetime` tanıtımı ancak oyuncu üçüncü rewarded videoyu tamamladığında veya 120 aktif oyun dakikasına ulaştığında bir kez gösterilebilir; tekrar gösterim en erken 7 rolling gün sonra ve yalnız kullanıcı kapattıysa mümkündür.
- Kayıp, zarar, missed opportunity, düşük cash, recovery, reddedilen pazarlık veya ev finali sonrasında IAP teklifi gösterilmez.
- “İndirim”, “son şans”, sayaç veya karşılaştırmalı eski fiyat yalnız mağaza metadata’sında gerçek bir fiyat değişimi varsa gösterilir. Sahte indirim ve yapay aciliyet yoktur.
- Satın alma butonu mağaza fiyatı yüklenmeden aktif olmaz. Sabit metinle tahmini fiyat gösterilmez.
- `Satın Almaları Geri Yükle` ve `Gizlilik Seçenekleri` ayarlarda görünür ve erişilebilirdir.

## Purchase state machine
```text
UNAVAILABLE -> AVAILABLE -> PURCHASE_STARTED -> PENDING
PENDING -> VERIFIED -> ENTITLEMENT_GRANTED -> ACKNOWLEDGED
PENDING -> CANCELLED | FAILED
OWNED -> RESTORED | REVOKED | REFUNDED
```

## Reward state machine
```text
ELIGIBLE -> REQUESTED -> AD_LOADED -> AD_STARTED -> USER_EARNED -> APPLIED
ELIGIBLE -> PREMIUM_CLAIMED -> APPLIED
REQUESTED/AD_LOADED/AD_STARTED -> CANCELLED | FAILED
```

| Durum | Zorunlu davranış |
| --- | --- |
| Ad load başarısız | Reward verilmez, cap/cooldown tüketilmez, normal bekleme yolu çalışmaya devam eder; iki ardışık failure sonrası placement oturum boyunca gizlenir. |
| Kullanıcı erken kapattı | Provider `userEarnedReward` üretmediyse reward yoktur; ceza ve tekrar pop-up yoktur. |
| Callback iki kez geldi | Aynı `rewardTransactionId` ikinci kez uygulanmaz. |
| Ad tamamlandı, yerel callback kayıp | SSV doğrulaması varsa sonradan idempotent uygulanır; yoksa reward verilmez ve olay destek/telemetriye yazılır. |
| IAP pending | Entitlement verilmez; “Ödeme beklemede” gösterilir ve app resume’da yeniden sorgulanır. |
| IAP restore | Store’dan doğrulanan kalıcı entitlement yeniden kurulur; yerel save tek otorite değildir. |
| Refund / revoke | İlgili kozmetik/premium entitlement sonraki doğrulamada kaldırılır; geçmiş gameplay kârı veya kariyer olayı geriye dönük silinmez. |
| Offline | Önceden doğrulanmış entitlement cache’ten çalışır; yeni satın alma/restore ve reklam isteği internet gerektirir. |

## Entitlement sınırları
- Tüm v1.0 ürünleri non-consumable’dır; consume edilmez ve yeniden satın alınamaz.
- iOS ve Android satın alımları v1.0’da mağaza hesabına bağlıdır; kullanıcı hesabı olmadığı için çapraz platform entitlement vaadi verilmez.
- Premium kullanıcının video atlaması ayrı ödül üretmez; yalnız `RewardActionService` kaynağını `ad` yerine `premium` yapar.
- Premium günlük hak sayısını, market spawn kalitesini veya hazırlık sonucunu artırmaz.


---

<!-- PAGE 37 -->

# 34C. Teknik, Gizlilik, Politika ve Üretim Dondurması
> Monetizasyon kodu sağlayıcıya bağımlı olabilir; gameplay sonucu sağlayıcının callback mantığına gömülemez.

## v1.0 sağlayıcı ve gizlilik kararı
| Alan | Kilitli uygulama |
| --- | --- |
| Reklam sağlayıcısı | AdMob rewarded video; v1.0’da mediation yok. Provider adapter değiştirilebilir fakat placement davranışı değişmez. |
| Yasak formatlar | Banner, interstitial, app-open, rewarded-interstitial ve otomatik açılan tam ekran reklam. |
| IAP | iOS StoreKit / Android Google Play Billing üzerinden `BillingAdapter`; dijital içerik için harici checkout veya lisans anahtarı yok. |
| Consent | İlgili bölgelerde UMP/CMP sonucu alınmadan reklam isteği yapılmaz; ayarlarda privacy options entry point bulunur. |
| ATT | Tracking izni reddedildiğinde gameplay ve reward uygunluğu kilitlenmez. İzin yoksa izin verilen non-personalized/limited ad yolu kullanılır veya reklam gösterilmez. Tracking izni karşılığında ödül verilmez. |
| Audience | Pazarlama ve Play Console hedef kitlesi 13+; çocuklara yönelik sunum yapılmaz. Ad içeriği mağaza yaş derecelendirmesine uygun sınırlandırılır. |
| Test | Development/sandbox build yalnız resmi test ad unit ve sandbox IAP kullanır; production kimlikleri ayrı config’tir. |

## Monetizasyon config’i
| Parametre | v1.0 default | Veri sonrası izin verilen kalibrasyon zarfı |
| --- | ---: | --- |
| Rolling 24s global reward cap | 8 | 6–8 |
| Session reward cap | 4 | 3–4 |
| Global cooldown | 90 sn | 90–180 sn |
| MARKET_SCOUT listing sayısı | 4 | 3–5; standard spawn bias’ı değişmez |
| Premium fiyatı | USD 4.99 eşdeğeri | Store console’da en fazla ±1 fiyat katmanı; entitlement değişmez |
| Kozmetik paket fiyatı | USD 1.99 / 2.99 eşdeğeri | Store console’da en fazla ±1 fiyat katmanı |

Default değerler Codex’in uygulayacağı kesin başlangıç değerleridir. Kalibrasyon zarfı yalnız soft-launch verisiyle config/store console üzerinden kullanılabilir; yeni ekran, reward türü, entitlement veya ekonomi kuralı eklemek için kullanılamaz.

## Üretim dondurma protokolü
> **[KİLİTLİ] v2.1 tasarım dondurması:** Bu belge onaylandıktan sonra v1.0 yayınlanana kadar yeni gameplay, reklam placement’ı, IAP türü, premium para, görev sistemi, pazarlık hakkı veya ekonomi katmanı eklenmez. Kodlama sırasında yalnız aşağıdaki değişiklik sınıfları kabul edilir:

1. Belgedeki davranışı doğru uygulamayan bug’ın düzeltilmesi.
2. Crash, veri kaybı, erişilebilirlik, mağaza reddi veya güvenlik sorununun giderilmesi.
3. Tablo üzerindeki kalibrasyon zarfında config değeri ayarı.
4. Kopya/lokalizasyon, asset kalitesi, performans ve SDK sürüm uyumluluğu.

Belirsizlik veya çelişkide varsayılan karar: **reklamı gösterme, satın alma avantajı verme, ekonomiyi değiştirme ve daha basit yolu uygula.** Ertelenmiş fikirler backlog’a yazılır; çalışan build’e sessizce eklenmez. “Devam” komutu yalnız sıradaki iş paketini başlatır, tasarımı yeniden açmaz.

## Politika ve monetizasyon aktivasyon kapısı
Dijital ürünler yalnız StoreKit / Google Play Billing ile satılır. Restore, mağaza inceleme görünürlüğü, privacy options, test ad unit ve sandbox satın alma akışları release checklist’in zorunlu maddeleridir. Tracking/consent reddi gameplay’i veya reward uygunluğunu kilitlemez; reklam isteği izin durumuna göre sınırlı çalışır ya da yapılmaz.

> **[KİLİTLİ] Aktivasyon kapısı:** Billing, entitlement, consent ve rewarded adapter’ları test edilmeden production reklamı açılmaz. Şartlar: ekonomi invariant’lerinde sıfır hata, crash-free sessions ≥%99,5, FTUE ≥%70 ve reklamsız çekirdek döngünün doğrulanması. Zayıf retention reklamla maskelenmez; mağaza uyumu gameplay avantajı doğurmaz.


---

<!-- PAGE 38 -->

# 35. Mobil Bilgi Mimarisi
> v2.1, mevcut dört ekranı daha tutarlı bir dört sekmeli yapıya dönüştürür.

| Alt sekme | İçerik | Ana CTA |
| --- | --- | --- |
| Pazar | Canlı feed, arama, filtre, market heat | İlanı aç / kıyasla |
| Takip | Saved search, favoriler, watchlist, fırsat geçmişi | Takibi yönet |
| Portföy | Envanter + Hazırlık + İlanlarım segmentleri | Hazırla / listele / çık |
| Yolculuk | Cash, net worth, kâr, expertise, timeline, home | Analiz et / hedefi gör |

Envanter ve İlanlarımın ayrı alt sekmeler olması, aynı varlığın sahiplik state’lerini iki ayrı dünya gibi gösteriyordu. Portföy altında segmentlenmeleri; asset’in envanterden ilana geçerken kaybolmamasını hem zihinsel hem teknik olarak destekler. Arama/favoriler ise “Takip” sekmesinde gerçek geri dönüş nedeni oluşturur.

## Ergonomi ilkeleri
- Üst özet: Nakit, tahmini net servet ve küçük ev progress; hiçbir zaman tek sayıda birleştirilmez.
- Pazar kartı: ürün, fiyat, family, kondisyon, kanıt güveni, likidite/ilgi ve yaş.
- Ana ekran chips yalnız işlevsel olduğunda görünür; placeholder filtre yoktur.
- Sheet’ler safe-area, klavye ve 320–430 CSS px aralığında yatay taşmasız çalışır.
- Birincil CTA en sağ/alt; ikincil aksiyonlar daha düşük görsel ağırlıkta.

## Dört sekme kararı
> **[KİLİTLİ] Dört sekme kararı:** Pazar • Takip • Portföy • Yolculuk. “İlanlarım” Portföy içinde segmenttir; “Ara/Favoriler” Takip’e dönüşür. Bu yapı vertical slice’ın source of truth’udur.


---

<!-- PAGE 39 -->

# 36. Pazar, Karşılaştırma ve Ürün Detayı UX
> Oyuncu bir fırsatı üç ekranda anlayabilmeli: feed sinyali, compare farkı, detay kanıtı.

| Ekran | Zorunlu içerik | Kaçınılacak |
| --- | --- | --- |
| Market feed | Fiyat, condition, evidence confidence, heat, yaş | Her kartta 12 badge |
| Compare | 2–5 stacked card; yalnız farklılaşan satırlar vurgulu | Yatay geniş tablo |
| Product detail | Estimate band, claim/evidence, seller, liquidity, similar listings | Gizli fair value sayısı |
| Offer sheet | ● ● hak, preset/manual, cash sonrası bakiye, risk | Uzun sohbet ve kesin yüzde |
| Result | Neden, cost basis etkisi, sonraki aksiyon | Sadece “Başarılı!” konfeti |

Compare ekranı, aynı family ilanlarını normalize eder. Örneğin pil sağlığı, kutu, kondisyon, seller trust, tahmini band, likidite ve risk satırları aynı sırada görünür. İki ilan arasında aynı olan düşük önemdeki satırlar collapse edilir; farklar şekil + metinle vurgulanır.

## State-by-state UX
- Cash yetersizse CTA sessiz disabled olmaz: eksik tutar + “Portföyden çıkış planla” shortcut gösterir.
- İlan NPC’ye satıldıysa sheet kapanıp kullanıcıyı boş ekrana atmaz; benzer ilanlara devam eder.
- Son teklif öncesi ● ○ ve “Bu teklif reddedilirse görüşme kapanır” metni zorunludur.
- Loading skeleton kullanılır; fake spinner veya sahte gecikme yoktur.
- Eksik asset, kategori fallback’iyle layout’u korur.

## Compare başarı ölçütü
> **[HİPOTEZ] Compare başarı ölçütü:** Compare kullanan oyuncunun satın alma sonrası pişmanlık/zarar oranı düşmeli fakat karar süresi aşırı uzamamalıdır. Hedef “daha çok ekran” değil daha iyi karar kalitesidir.


---

<!-- PAGE 40 -->

# 37. Takip, Portföy ve Yolculuk UX
> Meta ekranlar pazardan kopuk dashboard değil, bir sonraki doğru karara götüren araçlardır.

| Alan | Ana modül | Kritik boş/uyarı state’i |
| --- | --- | --- |
| Takip | Saved searches, watchlist, missed opportunities | Takip yok → tek family seçerek başla |
| Envanter | Owned cards, book cost, estimate, evidence | Boş → pazar/recovery shortcut |
| Hazırlık | Action queue, süre, maliyet, beklenen etki | Slot dolu → plan değiştir |
| İlanlarım | Asking, views/interest, buyer offers, reason | Teklif yok → fiyat/kanıt nedeni |
| Yolculuk | Cash/net worth/profit/liquidity/timeline/home | Negatif kâr → öğretici breakdown |

Portföy kartı “Alış ₺X · Değer ₺Y” gibi iki sayıdan ibaret kalmaz. Book cost, tahmini çıkış bandı, kanıt güveni, likidite ve current state görülür. Bir asset listelenince aynı kart İlanlarım segmentine geçer; kullanıcı varlığın kaybolduğunu hissetmez.

## Bilgi hiyerarşisi
- Takip alarmı family + max price + min condition + evidence preference taşıyabilir.
- Missed opportunity log, oyuncuyu utandırmaz; “neden kaçtı / benzeri şimdi var mı?” sunar.
- Yolculuk ekranında realized profit ile unrealized estimate ayrı gösterilir.
- Timeline son beş olayla sınırlı değildir; anlamlı event grupları ve filtre vardır.
- Reset kariyer butonu ayarlar içinde ikincil ve çift onaylıdır; ana başarı ekranında kırmızı CTA olmaz.

## Servet görünümü
> **[KİLİTLİ] Servet görünümü:** Nakit, net worth, portföy market value, book cost ve realized profit farklı kavramlardır. UI bunları tek “servet” sayısında eritmez.


---

<!-- PAGE 41 -->

# 38. FTUE ve İlk 30 Dakika
> Öğretim, menü turu değil; oyuncuya bir fırsatı neden seçtiğini yaşatan kontrollü işlem zinciridir.

| Dakika | Olay | Öğretilen |
| --- | --- | --- |
| 0–2 | Eski deftere gerçek buyer offer gelir | Cash 0, ilk satış, realized profit |
| 2–5 | Üç küçük ilan; ikisi aynı family | Fiyat tek başına yetmez, compare |
| 5–8 | Bir claim şüpheli; hızlı inceleme | Evidence ve belirsizlik |
| 8–11 | İki haklı ilk pazarlık | ● ● ritmi ve counter |
| 11–16 | Asset portföye girer; temizle/test et | Book cost ve value-added |
| 16–22 | Dengeli fiyatla listele; buyer offer | Satış ve net kâr |
| 22–27 | İyi fırsat cash’ten biraz pahalı | Likidite ve çıkış planı |
| 27–30 | Uzmanlık Lv1 + ev hedefi açılır | Uzun dönem yön, rota özgürlüğü |

## FTUE guardrail’leri
- İlk satın alma oyuncunun gerçek seçimi olur; tek zorunlu kart yoktur.
- İlk zarar, öğretmek için zorla yaptırılmaz. Kontrollü ama gerçek risk vardır.
- İlk 20 aktif oyun dakikası ve ilk tamamlanmış satış öncesinde rewarded CTA veya IAP promosyonu yoktur.
- İlk fırsat NPC’ye kaçırma, oyuncu sistemi anladıktan sonra sinyalli biçimde gerçekleşir; scripted cezaya dönüşmez.
- Her öğretim yalnız ihtiyaç anında görünür ve tekrar kapatılabilir.

## İlk oturum kapısı
> **[HİPOTEZ] İlk oturum kapısı:** Median ilk kârlı satış ≤ 8–12 dakika; FTUE completion ≥ %70; ilk 15 dakikada compare kullanımı ≥ %60. Bunlar garanti değil soft-launch karar eşikleridir.


---

<!-- PAGE 42 -->

# 39. Erişilebilirlik, Haptik, Ses ve Mikro Geri Bildirim
> Premium his; daha çok efekt değil, doğru olayda doğru ağırlık demektir.

| Olay | Haptik | Ses/animasyon |
| --- | --- | --- |
| Offer slider tick | Çok hafif | Kuru, kısa tick |
| Teklif gönder | Light | Mesaj çıkışı; bloklama yok |
| Satın alma | Medium | Kısa confirmation |
| Kârlı satış | Success | Net profit count-up; 1 sn civarı |
| Zararlı satış | Warning | Sessiz, öğretici; utandırma yok |
| İlan kaçtı | Warning light | Kart fade + sebep |
| Milestone / ev | Strong success | Kısa kişisel sahne |

## Zorunlu erişilebilirlik
- Minimum dokunma hedefi 44×44 CSS px; birincil CTA’lar başparmak alanında.
- Renk tek başına bilgi taşımaz; ikon, şekil ve metin etiketi eşlik eder.
- Reduced motion, haptics off ve ses seviyeleri ayarlardan erişilebilir.
- Dinamik metin büyümesinde kritik fiyat/CTA taşmaz; 320 px viewport test edilir.
- Kâr/zarar yalnız yeşil/kırmızı değil +/− işareti ve metinle gösterilir.
- Ekran okuyucu label’ları; ürün adı, fiyat, durum ve CTA niyetini açıklar.

Ses assetleri GDD’de semantic event hook olarak tanımlanır; gameplay ses dosyasına bağlı değildir. Haptik web’de güvenli fallback ile çalışır. Animasyon hiçbir ekonomik state değişimini geciktirmez; uygulama arka plana giderse settlement tamamlanır ve save edilir.

## Sakin premium
> **[KİLİTLİ] Sakin premium:** Sürekli glow, coin rain, ekran sallama ve yüksek ses yoktur. Büyük feedback yalnız oyuncunun gerçek, nadir ve anlamlı kariyer anlarına ayrılır.


---

<!-- PAGE 43 -->

# 40. İçerik Kapsamı Düzeltmesi
> v1.0’daki yüzlerce family hedefi uzun vade içindir; v2.1 kaliteyi kanıtlamadan içerik şişirmeyi durdurur.

| Faz | Kategori | ProductFamily | Same-family ilan | Amaç |
| --- | --- | --- | --- | --- |
| R&D vertical slice | 6 | 24 | 8–16 | Karar atomunu doğrula |
| Internal alpha | 8 | 60 | 8–20 | İlk 3–5 saat tekrarını test et |
| Soft launch | 10–12 | 100–120 | Retention ve ekonomi kalibrasyonu |
| 1.0 | 14+ | 180–220 | Tam ev yolculuğu ve içerik çeşitliliği |
| Uzun vade | 18+ | 300+ | Telemetriyle talep gören alanlara ölçek |

Vertical slice önerilen kategoriler: Küçük Eşya, Ses, Ev/Yaşam, Oyun, Müzik, Telefon. Her kategori dört hero family içerir; family başına kondisyon, variant, aksesuar, claim, seller ve defect kombinasyonlarıyla çok sayıda gerçek ilan oluşur. Amaç 24 resim değil 24 öğrenilebilir pazar üretmektir.

## İçerik üretim kapısı
- Bir family ancak en az üç anlamlı attribute, iki risk/kanıt yolu ve birden fazla çıkış stratejisi taşıyorsa eklenir.
- Yeni family, aynı-family listing density’yi düşürüyorsa ertelenir.
- Araç ve emlak assetleri core loop doğrulanmadan production darboğazı yapılamaz.
- Telemetri; görüntülenme, compare, satın alma, zarar, hazırlık ve satış süresine göre asset önceliği belirler.
- İçerik sayısı store materyalinde gerçek gameplay derinliği kanıtlanmadan ana pazarlama vaadi olmaz.

## 24 derin family
> **[KİLİTLİ] 24 derin family:** İlk ciddi üretim hedefi 24 family’nin eksiksiz kanıt–kıyas–pazarlık–hazırlık–satış döngüsüdür. 120 family bu temel tamamlanmadan ilerleme sayılmaz.


---

<!-- PAGE 44 -->

# 41. Asset Bible ve ProductFamily Üretim Şablonu
> Görsel sistem, küçük thumbnail’da okunur durum farkı ve data ile birebir eşleşme üzerine kurulur.

| Katman | Sözleşme | Örnek key |
| --- | --- | --- |
| Base product | Özgün, logosuz, nötr perspektif | prd_phone_nova_x1_black |
| Condition overlay | Modüler çizik/kir/aşınma | ovr_cond_scratched_screen |
| Defect overlay | Kritik hasar işareti | ovr_def_cracked_lens |
| Accessory badge | Kutu/kablo/eksik parça | bdg_acc_no_box |
| Evidence badge | Claim / checked / verified | bdg_evd_verified |
| Category fallback | Eksik assette stabil siluet | fb_phone |

## Teslim paketi
```text
ProductFamily content pack
- family.json            baseValue, demand, liquidity, attributes
- evidence.json          claim/reveal/verification rules
- defects.json           severity, penalty, overlays, counterplay
- variants.json          value/age/compatibility factors
- localization.tr.json   name, attribute labels, seller copy
- assetManifest.json     base + overlays + fallback
- fixtures.json          deterministic QA cases
```

## Görsel üretim kuralları
- Dosya adları lowercase snake_case; gameplay gerçek dosya yolunu bilmez, yalnız assetKey kullanır.
- Condition farkı thumbnail boyutunda metin okumadan seçilebilir; renk tek başına kullanılmaz.
- Base + overlay önceliklidir; geometri gerçekten değişiyorsa full variant üretilir.
- Görsel, kanıt state’iyle çelişmez. Doğrulanmamış kusur açık şekilde çizilmez; yalnız risk işareti kullanılır.
- Manifest eksikliği crash değil deterministic fallback üretir.

## Asset sırası
> **[KİLİTLİ] Asset sırası:** Manifest + placeholder → 24 hero family → condition/evidence overlays → soft-launch talebine göre genişleme. Final asset beklemek gameplay blocker değildir.


---

<!-- PAGE 45 -->

# 42. Teknik Mimari
> Domain motoru React, Capacitor, reklam SDK’sı ve gerçek saatten bağımsız saf TypeScript olarak kalır.

## Önerilen repository sözleşmesi
```text
src/
  domain/          pricing, market, negotiation, ownership, ledger, progression, monetizationPolicy
  application/     commands, transactions, use-cases, selectors, rewardAction, entitlementSync
  data/            categories, families, sellers, events, progression, monetizationConfig, storeProducts
  infrastructure/  persistence, clock, rng, analytics, ads, billing, consent, haptics, audio
  ui/              screens, components, sheets, state presenters, store, rewardedCta
  assets/          manifest, placeholders, overlays, paidThemes
  tests/            fixtures, unit, property, integration, billing-sandbox, ad-sandbox, e2e
```

| Katman | Kural |
| --- | --- |
| domain | Saf TS; React/Date.now/localStorage/SDK import etmez. |
| application | Atomic command + transaction orchestration. |
| data | Zod ile doğrulanan versioned config. |
| infrastructure | Clock/RNG/persistence/ad/billing/consent/analytics adapter’ları; provider sonucu application transaction’ına çevrilir. |
| ui | Selector üzerinden state okur; fiyat formülü yazmaz. |
| tests | Seed fixture ve ekonomi invariant’leri. |

## Mimari guardrail’ler
- Zustand yalnız uygulama state orkestrasyonu için kullanılır; domain gerçeği store’a gömülmez.
- IndexedDB schema version + açık migration chain taşır.
- Remote config yalnız cap, pacing ve event data’sını değiştirir; yeni kodu gizlice etkinleştirmez.
- Analytics provider değiştirilebilir; gameplay callback sonucuna bağımlı değildir.
- `RewardedAdAdapter` yalnız ad lifecycle event’i verir; ödül miktarı ve uygunluk `MonetizationPolicy` tarafından belirlenir.
- `BillingAdapter` fiyat metadata’sı, purchase/restore/revoke event’i verir; entitlement local save’den doğrudan üretilemez.
- Production’da AdMob mediation kapalıdır; yeni network eklemek mekanik değil altyapı değişikliğidir ve privacy review gerektirir.
- Capacitor lifecycle save/resume ve haptics adapter üzerinden yürür.

## Pure engine
> **[KİLİTLİ] Pure engine:** Aynı seed, gameTime, config ve command dizisi; web, test ve native’de aynı ekonomik sonucu üretmelidir.


---

<!-- PAGE 46 -->

# 43. Veri Şemaları, Komutlar ve State Machine
> Şema, gerçek ürün çeşitliliğini desteklerken ekonomik kimliği tekilleştirir.

## Zorunlu minimum
```text
type OwnedAsset = {
  id: AssetId; familyId: FamilyId; instance: ItemInstance;
  state: OwnershipState; purchasePriceMinor: number;
  preparationCostMinor: number; inspectionCostMinor: number;
  bookCostMinor: number; acquiredAtGameMin: number;
  currentListingId?: ListingId;
};

type TransactionJournalEntry = {
  id: TransactionId; kind: TransactionKind; gameTime: number;
  assetId?: AssetId; cashDeltaMinor: number;
  costBasisDeltaMinor: number; metadata: Record<string, unknown>;
};

type EntitlementState = {
  productId: StoreProductId; entitlementId: EntitlementId;
  status: "PENDING" | "OWNED" | "REVOKED";
  platform: "ios" | "android"; verifiedAt?: number;
};

type RewardActionTransaction = {
  id: TransactionId; placementId: RewardPlacementId;
  source: "ad" | "premium"; status: RewardStatus;
  requestedAt: number; appliedAt?: number; targetId?: string;
};

type MonetizationUsage = {
  rollingRewardTimestamps: number[]; sessionRewardCount: number;
  placementUsage: Record<RewardPlacementId, number[]>;
};
```

| Command | Atomic sonuç |
| --- | --- |
| SUBMIT_BUY_OFFER | Hak azalt, seller response üret, state persist et |
| ACCEPT_SELLER_COUNTER | Cash check + ownership transfer + journal |
| START_PREPARATION | Maliyet ayır, asset PREPARING yap |
| COMPLETE_PREPARATION | Evidence/condition güncelle, cost basis koru |
| CREATE_PLAYER_LISTING | Asset LISTED; identity korunur |
| ACCEPT_BUYER_OFFER | Settlement; asset SOLD_COMPLETE; cash + profit |
| REQUEST_REWARDED_ACTION | Uygunluk + cap + target precondition kontrolü; reward payload precompute |
| APPLY_REWARDED_RESULT | Provider/premium kaynağından idempotent placement transaction |
| PURCHASE_STORE_PRODUCT | Store akışını başlat; client-side entitlement verme |
| SYNC_ENTITLEMENTS | Verified purchase/restore/revoke event’ini state’e uygula |
| RESTORE_PURCHASES | Store hesabındaki non-consumable ürünleri yeniden sorgula |

## Komut sözleşmesi
- Her command precondition, deterministic result ve failure reason döndürür.
- UI doğrudan array splice yapamaz; application command kullanır.
- Schema’da kritik alanlar `any` olamaz; discriminated union kullanılır.
- State migration eski career events ve transaction history’yi yeniden yazmaz.
- Config validation başarısızsa son geçerli data paketi veya fallback yüklenir.
- Reward uygunluğu rolling 24 saat ledger’ından hesaplanır; UI sayaç azaltamaz veya reward payload seçemez.
- Product ID, entitlement ID ve placement ID enum/validated config ile tanımlanır; string typo sessiz entitlement üretmez.

## Kimlik sürekliliği
> **[KİLİTLİ] Kimlik sürekliliği:** Bir ürün market listing’den owned asset’e ve player listing’e geçerken yeni rastgele kimliklerle kopyalanmaz. Kaynak item/asset lineage izlenebilir kalır.


---

<!-- PAGE 47 -->

# 44. Save, Offline, Determinizm ve Güvenlik
> Oyuncu telefonu kapattığında dünya ilerler; fakat state kaybı, saat hilesi veya çift ödül ekonomiyi bozmaz.

| Konu | Sözleşme |
| --- | --- |
| Save | Kritik transaction sonrası atomic persist; schema version zorunlu |
| Migration | v1→v2→v3 açık fonksiyon zinciri; fallback + backup |
| Clock | Injected TimeProvider; negatif/aşırı delta clamp |
| Offline 0–15 dk | Yakın gerçek aging; active offers simüle |
| 15 dk–4 saat | Azalan katsayı; fırsatların tümü silinmez |
| 4+ saat | Effective cap + representative market rebuild |
| Reward callback | `rewardTransactionId` idempotent; duplicate ignore; cap yalnız APPLIED olduğunda tüketilir |
| Reward cap clock | Rolling 24 saat ledger; backward clock reset sağlamaz |
| IAP entitlement | Store/provider doğrulaması; local save tek başına ownership kanıtı değildir |
| Consent | UMP/ATT sonucu cache edilebilir fakat her launch güncellenir; izin olmadan ad request yok |
| Debug | Seed, fair value, journal inspect; production’da gizli |

Offline dönüş özeti; hangi player listing’in teklif aldığı, hangi market listing’in kapandığı, hangi hazırlığın tamamlandığı ve market trend’in ne kadar değiştiğini açıklar. “Sen yokken ₺X kazandın” diye açıklamasız cash eklenmez.

## Dayanıklılık testleri
- App background olduğunda açık command yarıda kalmaz; commit öncesi/sonrası net sınır vardır.
- Clock ileri alma, maksimum delta ve monotonic game time ile sınırlandırılır.
- Save bozulursa sessiz reset yerine recoverable backup ve kullanıcıya anlaşılır hata sunulur.
- Cloud sync ERTELENDİ; eklenirse conflict resolution transaction journal üzerinden yapılır.
- PII minimum tutulur; gameplay offline çalışır, analitik opt-out davranışı tasarlanır.
- Önceden doğrulanmış premium/kozmetik entitlement offline kullanılabilir; refund/revoke bir sonraki store sync’inde uygulanır.
- Ad no-fill, consent denial veya ağ yokluğu normal timer ve pazar akışını bozmaz; reward CTA gizlenir veya pasif açıklama gösterir.

## Deterministik replay
> **[KİLİTLİ] Deterministik replay:** Ekonomi bug’ı raporlandığında seed + config version + command log ile aynı oturum yeniden üretilebilmelidir.


---

<!-- PAGE 48 -->

# 45. Analitik, Deneyler ve Kalite Kapıları
> Veri, oyuncunun ne kadar para kazandığını değil neden karar verdiğini ölçmelidir.

| Funnel / event | Ana soru |
| --- | --- |
| listing_impression → listing_open | Kart okunuyor mu? |
| listing_open → compare_started | Göreli değer tezi anlaşılıyor mu? |
| compare → evidence_action | Belirsizlik anlamlı mı? |
| offer_submitted → purchase_complete | Pazarlık okunabilir mi? |
| purchase → preparation | Değer ekleme çekici mi? |
| listing_created → buyer_offer | Çıkış temposu doğru mu? |
| sale_complete | Kâr kaynağı ve likidite dengesi |
| opportunity_lost | FOMO adil mi, aşırı mı? |
| career_timeline_opened | Kişisel hikâye değerli mi? |
| rewarded_opportunity_shown → rewarded_started → reward_applied | Placement isteğe bağlı, anlaşılır ve teknik olarak güvenli mi? |
| rewarded_load_failed / closed_early | No-fill veya UX sürtünmesi ne kadar? |
| premium_claim_used | Premium aynı reward yolunu doğru kullanıyor mu? |
| store_viewed → purchase_started → purchase_completed | IAP değeri ve mağaza açıklığı |
| purchase_restored / entitlement_revoked | Restore ve refund doğruluğu |

| Soft-launch kapısı | Minimum karar eşiği |
| --- | --- |
| Ekonomi bütünlüğü | 0 invariant ihlali; journal reconciliation %100 |
| Stabilite | Crash-free sessions ≥ %99,5 |
| FTUE | Completion ≥ %70; median first profit ≤ 12 dk |
| Karar tezi | İlk 15 dk compare kullanımı ≥ %60 |
| Retention hipotezi | D1 ≥ %30; D7 ≥ %10 |
| Ad baskısı | İlk 20 dk / ilk satış öncesi 0 CTA; reklamsız core tamamlanabilir; zorunlu reklam 0 |
| Reward güvenliği | Duplicate reward 0; cap/target ihlali 0; no-fill core loop’u durdurmaz |
| IAP güvenliği | Sandbox purchase/restore/revoke senaryoları %100 geçer; local save ile sahte entitlement yok |

Bu eşikler sektör garantisi değil, Studio Nostos’un karar kapılarıdır. Örneklem küçükse mağaza ölçeği kararı verilmez. Testler: compare varsayılanı, home reveal zamanı, NPC pressure, evidence maliyeti, hazırlık aksiyonu sayısı ve sayfa 37’deki monetizasyon config zarfı. Monetizasyon türü veya placement seti A/B testiyle değiştirilmez; aynı anda birden çok çekirdek değişken değiştirilmez.

## Tarih değil kapı
> **[KİLİTLİ] Tarih değil kapı:** Mihenk’ten 7–14 gün sonra otomatik mağaza çıkışı yoktur. Bu sayfadaki ekonomi, FTUE, karar ve stabilite kapıları geçilmeden TradeUp soft launch yapılmaz.


---

<!-- PAGE 49 -->

# 46. Mevcut Prototip Audit’i ve Mihenk Sonrası Yol
> Repo değerli bir temel taşıyor; fakat “store-ready” değil, araştırma prototipi seviyesindedir.

| Mevcut güçlü temel | Kritik açık / borç |
| --- | --- |
| React + TypeScript + Vite + Capacitor kabuğu | Domain tek game.ts içinde; data hard-coded |
| Seed’li listing üretimi ve temel 2 hak pazarlık | Date.now engine içinde; aktif NPC race eksik |
| Zustand + IndexedDB + haptics | Migration zinciri zayıf, Zod alanları any |
| Market, Inventory, Listings, Wealth ekranları | Compare/Takip/FTUE yok; bazı chips ölü |
| Player listing ve buyer offer akışı | Listed asset net worth’ten düşüyor |
| Realized profit alanı | Buyer sale kârı asking price’a göre yanlış |
| Dört temel unit test | Ledger, lifecycle, UI/e2e ve migration testleri eksik |

## Uygulama sırası
1. P0 — Ekonomi bütünlüğü: unified OwnedAsset, book cost, journal, net worth, settlement testleri.
2. P0 — Deterministik dünya: injected clock, lifecycle tick, aktif NPC hazard, incremental arrivals.
3. P1 — Karar vertical slice: compare, evidence/inspection, 24 deep family, preparation actions.
4. P1 — İlk oturum: scripted başlangıç defteri, gerçek seçim, pazarlık, listeleme ve ilk kâr.
5. P2 — Meta: expertise, Takip, career timeline, home reveal ve analytics event contract.
6. P3 — Monetizasyon foundation: Billing/entitlement/consent/rewarded adapter, dört placement ve dört non-consumable SKU; sandbox/test kimlikleriyle tamamlanır, production serving kalite kapısından sonra feature flag ile açılır.
7. P4 — İçerik ölçeği: yalnız vertical slice ve monetizasyon güvenliği testleri geçtikten sonra data/asset family genişlemesi.

## Mihenk’ten aktarılacaklar
> **[KİLİTLİ] Mihenk’ten aktarılacaklar:** TradeUp, Mihenk’in UI’sını veya ekonomisini kopyalamaz. Crash takibi, onboarding ölçümü, rewarded idempotency, purchase/restore/revoke testleri, consent akışı, store operasyonu, release checklist ve gerçek oyuncu verisi disiplinini devralır.


---

<!-- PAGE 50 -->

# 47. Definition of Done ve Master Implementation Direktifi
> TradeUp ancak aşağıdaki davranışlar tek build’de ve testlerle doğrulandığında vertical slice kabul edilir.

## Kabul kontrol listesi
- 24 ProductFamily yalnız data + localization + assetKey ile spawn olur; ürün adına özel gameplay kodu yoktur.
- Aynı family’den en az 10 farklı listing eşzamanlı üretilebilir ve Compare’da normalize edilir.
- Kanıt/inceleme, estimate confidence’ı deterministik biçimde değiştirir; yüksek etkili kusur counterplay taşır.
- Buy negotiation tam iki oyuncu hakkıyla çalışır; seller counter ek hak tüketmez; reklam/IAP ile retry yoktur; iki teklif sınırı sabittir.
- Market listing aktif oturumda NPC’ye satılabilir; risk önceden sinyallenir ve replay edilebilir.
- OwnedAsset Inventory → Preparing → Listed → Reserved → SoldComplete zincirinde kimliğini ve cost basis’ini korur.
- Listelenen ürün net worth’ten kaybolmaz; sale profit = proceeds − bookCost; çift settlement mümkün değildir.
- Quick sale öncesi net kâr/zarar görünür; cash yetersiz state’i neden ve recovery shortcut gösterir.
- FTUE ilk gerçek compare, evidence, iki haklı pazarlık, hazırlık, listing ve buyer sale döngüsünü tamamlatır.
- Pazar • Takip • Portföy • Yolculuk ekranlarında ölü kontrol, TODO veya sahte loading yoktur.
- Save/load/migration/offline sonrası cash, owned assets, listings, negotiations, journal ve careerEvents korunur.
- 320–430 px portrait, text scaling, reduced motion, haptics off ve missing asset fallback testleri geçer.
- Core engine invariant testleri, integration core loop ve WebView smoke testleri yeşildir.
- Yalnız `MARKET_SCOUT`, `FAST_INSPECTION`, `FAST_PREPARATION` ve `LISTING_REACH` rewarded placement’ları vardır; iki teklif kuralını veya fair value bilgisini değiştiren reklam yoktur.
- Rewarded CTA ilk 20 aktif dakika ve ilk satış öncesi görünmez; rolling 24s cap=8, session cap=4 ve 90 sn cooldown testlerle doğrulanır.
- Premium entitlement aynı reward payload/cap yolunu videosuz kullanır; daha fazla hak, daha iyi sonuç veya market bias üretmez.
- Dört non-consumable SKU store metadata’sından fiyatlanır; purchase, pending, cancel, restore, refund/revoke ve offline entitlement senaryoları geçer.
- ATT/consent reddi gameplay’i kilitlemez; izin/consent olmadan ad request yapılmaz ve normal bekleme yolu çalışır.
- Ücretli tema ürün kondisyonunu, defect/evidence overlay’ini, risk sinyalini veya ekonomik sonucu değiştirmez.
- Production build’de test ad unit, sandbox product ID, sahte indirim, hard-coded mağaza fiyatı ve harici dijital checkout bulunmaz.
- Soft launch; sayfa 48’deki kalite kapıları geçmeden takvim gerekçesiyle başlatılmaz.

> MASTER DIRECTIVE: Bu v2.1 belgeyi tek source of truth kabul et. Önce ekonomik gerçeği ve deterministik pazarı düzelt; ardından Compare + Evidence + tam iki haklı pazarlık + Preparation + Sale zincirini 24 derin family ile tamamla. Sonra yalnız sayfa 34–37’de tanımlı dört rewarded placement’ı, dört non-consumable SKU’yu, entitlement/consent/restore akışını aynen uygula. Yeni mekanik, ekstra teklif, premium para, cash pack, zorunlu reklam, ikinci görüş, garantili fırsat veya görünmez büyük kusur icat etme. Asset eksikliğini blocker yapma. Her fazda testleri çalıştır; Definition of Done geçmeden build’i tamamlandı sayma. Kullanıcının “devam” komutu sıradaki faza geçiştir, tasarımı yeniden açma.

| R&D referansları | Kullanım amacı |
| --- | --- |
| Dealer’s Life 2 | Pazarlık, satıcı davranışı, değer belirsizliği |
| Car For Sale Simulator 2023 | İnceleme, kusur, al-sat fantezisi |
| Storage Hunter / auction-sim kümesi | Gizli değer ve fırsat heyecanı |
| Bid Wars / mobil auction kümesi | Kısa oturum ve okunaklı karar |
| Mevcut TradeUp repo + v1.0 GDD | Teknik gerçek, kilitli kararlar ve gap audit |

## v2.1 karar özeti
> **[BELGE SONU] v2.1 karar özeti:** TradeUp; karşılaştırma, kanıt, likidite, tam iki teklif ve değer ekleme üzerinden oyuncunun kendi ticaret hikâyesini kurduğu mobil pazar simülasyonudur. Gelir modeli, yalnız açıkça seçilen zaman kolaylıkları ve karar okunabilirliğini bozmayan kalıcı kozmetiklerden oluşur; bu belge sonrası v1.0’a kadar mekanik tasarım dondurulmuştur.
