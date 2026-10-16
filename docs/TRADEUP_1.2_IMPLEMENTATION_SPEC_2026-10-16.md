# TradeUp — İlk Evim: uygulama öncesi şartname

Karar sürümü 1 · 16 Ekim 2026 · Yalnız tasarım ve dokümantasyon

## 0. Belgenin yetkisi ve nasıl kullanılacağı

Kullanıcı, seçeneklerin kodlama sırasında değil önceden kararlaştırılmasını ve GDD sınırlarının bu plan için kaldırılmasını istedi. Bu belge, [araştırma raporundaki](TRADEUP_1.2_PATCH_RESEARCH_PLAN_2026-10-16.md) açık ürün/teknik seçimlerini sonuçlandırır. Mevcut oyun kodu, GDD, AGENTS, bulut servisleri ve Apple başvurusu bu çalışmada değiştirilmedi.

**Karar verilmiş olması, uygulanmış veya cihazda doğrulanmış olması değildir.** Kodlama aşamasında test ve entegrasyon gerekir. Bir kabul testi başarısız olursa burada yazılı düzeltme/erteleme yolu uygulanır; sessizce başka ürün tasarımına geçilmez. Dış servis kullanılamıyorsa alternatif sağlayıcıya kendiliğinden geçilmez.

Değişmez ürün amacı: mevcut al-sat yolculuğunu daha anlaşılır, daha kişisel ve daha iyi sonlanan hale getirmek. Rekabet, bitirmeyi değersizleştirmeyecek; tekrar oynamak zorunlu olmayacak.

### Kesin teslimat sınırı

- **1.2 — İlk Evim:** cila, durum anlatımı, ilk ev anısı, profil/altı avatar, kariyer kartı, paylaşım, ölçüm ve editoryal paket.
- **1.3 — Rekorlar:** bu belgede tasarımı tamamlanan isteğe bağlı global Top 100 ve doğrulanabilir ikinci kariyer. Ayrı yayımlanır; 1.2'yi bekletmez. Bu, koşullara göre kodlarken verilecek karar değil, şimdiden belirlenmiş sürüm ayrımıdır.
- Yeni ürün ailesi, yeni ev, yeni kozmetik SKU, yeni reklam yerleşimi, ekonomik güç veya fiyat değişikliği bu iki pakete dahil değildir.
- Gerçek bulut kurulumu, ücretli servis açılışı, yayın, merge ve Apple başvurusu ayrıca yetkilendirilir. Bugün bunlar yapılmaz.

## 1. Karar kaydı — seçenek bırakılmayan noktalar

| Kimlik | Sabit karar | Gerekçe |
| --- | --- | --- |
| K01 | Mevcut React/TypeScript/Capacitor ve saf domain motoru korunur | Yeniden yazım ciladan uzaklaştırır |
| K02 | Standart görünüm 3 sütun; büyük yazı 2 sütun | Kullanıcının sevdiği yoğunluk ve okunabilirlik birlikte korunur |
| K03 | Altı mevcut avatar iyileştirilir; altı yeni portre üretilmez | 3 ücretsiz + 3 Premium zaten var; kapsam şişirilmez |
| K04 | İlk ev anısı kalıcı snapshot olur | Sonraki ticaret ve ev yükseltmesi geçmişi değiştiremez |
| K05 | Tekrar oynatma baskısı, sezon ve günlük seri yok | Bir kez keyifle bitirmek yeterli |
| K06 | İki liste: İlk Ev Bütçesi ve 100 Ticarette Kâr | Az işlem ve yüksek sonuç ayrı başarılardır |
| K07 | Hedef ₺3.750.000 nakit; ikinci liste tam 100 piyasa ticareti | Aynı sayısal hedefler; ev araştırması skoru etkilemez |
| K08 | Skorlar serbest kariyer başarısıdır; saf/eşit şartlı beceri turnuvası değildir | Seed, strateji ve reklam bekleme farkı vardır |
| K09 | Global sonuç yalnız başlangıçtan sunucuda doğrulanmış kariyerden gelir | Eski yerel kayıttan güvenilir geçmiş uydurulmaz |
| K10 | Mevcut kariyer + en fazla bir isteğe bağlı doğrulanan kariyer yuvası | Mevcut ilerleme silinmez; sınırsız seed avı menüsü açılmaz |
| K11 | iOS kimliği Game Center; özel listeler kendi API'mizde | Kimlik kurtarma ve sunucuda doğrulama; e-posta hesabı zorunluluğu yok |
| K12 | Cloud Run + Firestore; istemci Firestore'a erişmez | Tek doğrulama sınırı; mevcut Firebase ekosistemiyle sınırlı altyapı |
| K13 | Kamuya açık isim sistem tarafından üretilir; yerel isim yüklenmez | Fotoğraf/serbest isim moderasyonu bu sürüme alınmaz |
| K14 | Yerel ödül geciktirilmez; global kayıt SSV/entitlement kanıtını bekleyebilir | Oyuncunun ana akışı global doğrulama yüzünden durmaz |
| K15 | Native paylaşım; cihazda PNG; yeni paylaşım sunucusu yok | Kişisel veri ve bakım yükü az |
| K16 | Yeni ayrıntılı üretim Analytics parametresi yok | Mevcut açık izin ve veri minimizasyonu korunur |
| K17 | 1.2'de ekonomi/teklif hız katsayıları değişmez | Ölçülmemiş hissi iyileştirme diye sayısal denge bozmayız |
| K18 | “Kurucu” yerine “Premium” etiketi | Mevcut kod etiketi Premium sahipliğine bağlı; erken katılımcı ödülü değil |

100 ticaret ve ₺3.750.000 bu şartnamede sabittir. Testler bu sayıları değiştirmek için otomatik yetki vermez. Yeniden ürün kararı gerekirse sürümlü karar değişikliği açılır; yayınlanmış skor tanımı üzerine yazılmaz.

## 2. Kullanıcı yolculuğu ve ekran yerleşimi

### Ana oyun

Açılış → mevcut profil/FTUE → Pazar → ürün detayı → alım/pazarlık → Portföy/ilan → teklif/satış → Yolculuk → ev satın alımı → kişisel final.

Dört ana sekme mevcut uygulamadaki Pazar, Radar, Portföy, Yolculuk olarak kalır. Profil ve Ayarlar aynı üst köşe girişini kullanır. Mağaza kısayolunun konumu değiştirilmez. Sıralama için beşinci sekme veya pazarda yeni büyük panel yok.

### Ekran sözleşmesi

| Ekran | İlk görünen içerik | İkinci seviye içerik | Kapanış/geri |
| --- | --- | --- | --- |
| Pazar | Kompakt bakiye, tek bildirim, mevcut pazar başlığı, filtre, ürünler | Pazar hareketi tek satır özet; dokununca açıklama | Mevcut gezinme |
| Ürün detayı | Tam görsel, isim, fiyat, tek satıcı anlatımı | Değer aralığı, kondisyon/bilgi/hak; kontroller açılır | X, geri, odak önceki ürüne |
| Portföy | Mevcut üç segment ve ürünler | Vitrin özeti açılabilir | Sekme değiştirince segment/scroll korunur |
| Yolculuk | İlk ev durumu, kariyer kartı, Rekorlarım girişi | Ayrıntılı muhasebe ve kariyer hikâyesi kapalı başlar | Mevcut gezinme |
| Profil/Ayarlar | Portre, yerel isim, seviye, üç kısa istatistik | Avatar seçimi ve tercihler | Kaydedilmemiş isim taslağı çıkışta atılır; ekonomik işlem yok |
| Rekorlarım | İki kişisel sonuç ve geçmiş durumu | 1.3'te Global Top 100; kurallar ve katılım | Yolculuk'a aynı scroll konumuna |
| İlk ev finali | Seçili ev, kısa kapanış, dört kişisel bilgi | Paylaşım önizlemesi | Devam et; tekrar Yolculuk'tan açılır |

Pazar hareketinin açılımı satır içi uzun panel değil, kısa bilgi penceresidir. Pazarın ürün listesi bildirim metnine göre yukarı/aşağı oynamaz. Vitrin boşken üç dev boş yuva yerine “Vitrinin · 0/3” satırı vardır; dokunulursa mevcut vitrin açılır.

## 3. Görsel sistemin sabitleri

### Ölçü ve tipografi

- 320–359 CSS px: standartta 3 sütun, 8 px dış boşluk, 6 px kolon aralığı. 360–430 px: 12 px dış boşluk, 6 px kolon aralığı.
- Büyük metin tercihinde bütün genişliklerde 2 sütun. Kritik içerik en az %200 ölçek denetimine girer; kırpma yerine satır/yerleşim büyür. Dokuz ürünü her durumda tek ekrana sığdırma garantisi yok.
- Standart kart: başlık 12 px / 15 px satır yüksekliği / ağırlık 600, en fazla iki satır; fiyat 15 px / 18 px / ağırlık 700; ilgi ve kondisyon 11 px. Büyük metinde sırasıyla 15/18/14 px, kart sabit yüksekliğe zorlanmaz.
- Normal yardımcı yazı 13 px, gövde 15 px, bölüm başlığı 20 px. Kritik fiyat/eylem hiçbir yerde 11 px altına inmez. Bunlar CSS değerleridir; fiziksel cihaz algısı ayrıca doğrulanır.
- Etkileşimli kontrol hedefi en az 44×44 CSS px ve native sunumda en az 44 pt. Küçük rozet bilgi amaçlıdır, ayrı küçük düğme yapılmaz.
- Ürün görseli kartta 4:3 sahne; detayda 16:7 sahne. Görsel `contain` mantığıyla, %8 iç güvenli alanla bütünüyle görünür. Tema sahneye renk verir; ürün rasterına yeşil filtre uygulanmaz.
- Alt menüye içerik gömülmez: içerik sonunda menü yüksekliği + safe-area + 16 px boşluk ayrılır. Modallar iç scroll kullanır; sabit eylem alanı gövdeyi örtmez.

### Kart bilgi hiyerarşisi

Sol üst: tek ilgi rozeti. Sağ üst: kondisyon. Özel/lüks işareti ilgi rozetinin kendi başlangıcına eklenen küçük ikon; bağımsız ikinci katman yok. Kusur göstergesi yalnız görselin sağ altında kalır. İsim ve fiyat görselin altındaki ayrı akıştadır. Kartın tamamı detay açar; metin üstüne görünmez ek eylem konmaz.

### Tema renkleri — semantik hedefler

| Tema | Temel zemin | Panel | Yükseltilmiş panel | Vurgu | Ana yazı |
| --- | --- | --- | --- | --- | --- |
| Klasik | #07130E | #0D2018 | #153126 | #80E8B5 | #F2F7F4 |
| Obsidyen | #0B0F17 | #151C29 | #202B3B | #D1DAF5 | #F4F6FB |
| Gece Pazarı | #101021 | #1B1A31 | #292543 | #BCA7FF | #F6F2FC |
| Atölye | #16110D | #241B14 | #34271C | #E8B76C | #FAF3E9 |

Bu renkler tema sistemi için karardır; mevcut arka plan illüstrasyonları değiştirilmez. Karışan illüstrasyon üstündeki yüzey opaklığı %92; ürün sahnesi %82; gövdeyi taşıyan modal %97. Sadece dekoratif ve okunurluğu etkilemeyen bölgeler daha geçirgen olabilir. Tüm ekranlara aynı semantik panel/border/text token'ları uygulanır; sayfa bazında sabit yeşil fallback yok.

Ekonomik eşiklerdeki mevcut altın parlama hesabı ve arka plan geçişleri korunur. Altın, yalnız mevcut dekoratif ilerleme katmanına uygulanır; temanın panel/yazı anlamını veya durum renklerini değiştirmez. %100 bütçe parlaması, ev sahibi olunduğu anlamına gelmez; gerçek ilk ev kutlaması ayrı olaydır.

Durum renkleri temadan bağımsız anlam taşır: başarı #80E8B5, uyarı #F2CC78, hata #FF9B9B; yanında metin/ikon vardır. Kontrast testi başarısız olursa metin/zemin opaklığı yükseltilir; ana palet değiştirilmez. Küçük metinde hedef en az 4.5:1, büyük metinde 3:1. Renkler bugün ölçülmüş/passed değildir.

### Hareket

Eylem geçişi 160 ms; modal 220 ms; kabul edilmiş pazar yenilemesinde logo oku merkezinden 360° / 600 ms / yumuşak yavaşlama ile döner. Geçersiz tıklama veya reklamı erken kapatma dönüşü tetiklemez. Tekrarlanan yenileme mevcut hareketi yeniden başlatır; animasyon kuyruğu oluşmaz. Azaltılmış harekette dönüş yerine 120 ms vurgu geçişi vardır.

Avatarın yalnız görünür ve seçili portresi hareket eder; avatar listesi ve sıralama satırları statiktir. CSS tabanlı nefes/aura devam eder; video, parçacık motoru ve yeni animasyon kütüphanesi yok. Final kutlaması 1,8 saniye, atlanabilir; azaltılmış harekette 200 ms fade. Satın alma ve kayıt bu animasyonun bitmesine bağlı değildir.

Apple'ın erişilebilirlik rehberi ölçeklenen yazı, kontrast ve azaltılmış hareketi destekler; yukarıdaki tam ölçüler bizim ürün kararımızdır. [Resmi rehber](https://developer.apple.com/design/human-interface-guidelines/accessibility)

## 4. Kısa metinler ve ekonomik durumlar

| Durum | Görünecek metin / davranış |
| --- | --- |
| Premium sahibi | Üst rozet “Premium”; erişilebilir açıklama “Reklamsız haklar ve kozmetik paketler açık.” |
| Henüz ilk kârlı piyasa satışı yok | “İlk kârlı satışını yap.” |
| Ev araştırması kapalı | “Ev araştırması için ilerliyorsun.”; ilerleme servet tahminine dayanıyorsa “Tahmini ilerleme” etiketi |
| Araştırma başladı | “Ev araştırması sürüyor”; mevcut oyun dakikası bilgisi yardımcı satırda |
| Araştırma bütçe eşiği aşıldı | “Araştırma açıldı”; “Evin hazır” veya “Ev alındı” denmez |
| Ev seçildi, nakit yetmiyor | “Bu ev için ₺… nakit eksik.”; Portföy'e mevcut kısa yol |
| Ev seçildi, nakit yeterli, ilan açılmadı | “Bütçen hazır; ev sonucunu bekliyorsun.” |
| Ev alınabilir | “Evi incele”; alış bedeli açık, tek gerçek onay |
| İlk ev alındı | “İlk evin senin”; “Anını görüntüle” |
| İlan aktif, teklif yok | “İlanda · Teklif bekliyor”; tahmini dakika veya garantili satış sözü yok |
| Teklif geldi | “Yeni teklif · ₺…”; mevcut teklif ekranını açar |
| Yenileme hakkı var | Mevcut “Yenile” + hak/kapasite + doğal dolum bilgisi |
| Hak sıfır, reklamlı oyuncu | Aynı düğmede “Reklam izle” / “+25 yenileme”; ayrı büyük panel yok |
| Hak sıfır, doğrulanmış reklamsız hak | Aynı düğmede “+25 yenileme”; video izlenecekmiş gibi yazılmaz |

Yenileme ödülü/faz kapasitesi ve geçiş reklamı davranışı bu paketle yeniden tasarlanmaz. Başarısız reklam ödül vermez, no-fill oynanışı kilitlemez. Bildirim alanı standartta iki satırlık sabit alan taşır; normal oyun mesajı bu alana sığmazsa kısaltılır. Büyük metinde alan ayar değişiminde büyüyebilir, her yeni bildirimde yüksekliği değişmez. Tam metin ayrıntı olarak açılabilir.

## 5. Muhasebe ve sayaç sözlüğü

- **Piyasa ticareti:** başlangıç defteri hariç, piyasadan alınmış varlığın tamamlanmış satışı. Hızlı ve zararına satış dahil.
- **Toplam satış:** hediye dahil tüm tamamlanan satışlar. Gerekirse ayrıntıda gösterilir; ana profil sayacı “Ticaret”tir ve piyasa ticareti kullanır.
- **Piyasa kârı:** yalnız bu piyasa ticaretlerinin kanonik journal kârları toplamı; hazırlık/inceleme/ücret maliyeti dahil. Hediye defterin satışı dahil değil.
- **Nakit:** harcanabilir bakiye. **Tahmini servet:** mevcut tahmin sistemi; sıralamada kullanılmaz.
- **İlk kârlı satış:** kârı sıfırdan büyük ilk piyasa satışı. Hediye defterin geliriyle bu unvan verilmez.
- **En iyi satış:** en yüksek pozitif net kârlı piyasa satışı; eşitlikte journal'da önce kesinleşen. Pozitif satış yoksa “Henüz kârlı satış yok”.
- **Baskın kategori:** piyasa kâr toplamı en yüksek pozitif kategori; eşitlikte sabit kategori kimliği. Hiç pozitif kategori yoksa gösterilmez.

Mevcut muhasebe servisi değiştirilerek paralel hesap motoru kurulmaz. Yeni sunum/snapshot hesapları bu sözlüğü aynı journal ve OwnedAsset kayıtlarıyla uygular. Tutarsız kayıt uydurma sonuç yerine eksik/veri sorunu durumu verir. Para bütün katmanlarda tam sayı kuruş, HTTP'de taşınırken ondalık sayı değil tam sayı metnidir.

## 6. İlk ev snapshot'ı ve final

### Snapshot alanları — veri tasarımı, kod değil

| Alan | Sözleşme |
| --- | --- |
| summaryVersion | 1; ilerideki değişiklik mevcut özetin anlamını değiştirmez |
| careerId, sourceTransactionId | Yerel kariyer ve ilk HOME_PURCHASE kimliği; tekillik bağı |
| homeId, homePriceMinor | İlk alınan ev; sonraki ev değil |
| atGameMin, marketTradeCount | Alışın kesinleştiği an ve o andaki tamamlanan ticaret |
| marketProfitMinor | İlk ev anına kadar kanonik piyasa kârı |
| firstProfitableSale, bestSale | İşlem/varlık/aile/asset kimliği, alış, satış, maliyet, kâr; yok olabilir |
| dominantCategoryId | Pozitif kategori varsa; yoksa boş |
| completeness | COMPLETE veya PARTIAL; eski kayıtta eksik veri açıkça belirtilir |
| origin | LIVE veya RECONSTRUCTED; yerel yeniden kurulum global doğrulama değildir |

İsim, avatar, tema ve dekorasyon tarihi başarı ölçütü değildir; snapshot'a sabitlenmez. Kart yeniden açıldığında oyuncunun güncel görünümü kullanılır; ev, ticaret ve kâr değişmez. Güncel stilin kozmetik sunumu, geçmişte o stile sahip olunduğu iddiası taşımaz.

**Atomik sıra:** ev işlemi → summary hesaplama → aynı save'de kalıcı yazma → final kuyruğa alma. Kayıt başarısızsa “Kaydedilemedi; yeniden dene” gösterilir; ev bedeli ikinci kez alınmaz. Tekrar deneme yeni ekonomi komutu değil aynı state'in kayıt denemesidir. Kayıt başarılana kadar paylaşım açılmaz; ekran kapanıp açıldığında tekrar kesinti sonrası işlem kanıtıyla toparlanır.

### Sunum

Başlık “İlk evin senin.” Ev illüstrasyonu, bir kısa cümle, ticaret sayısı ve piyasa kârı; ardından ilk kârlı satış ve en iyi satış için iki küçük ürün kartı. Aynı işlem ikisiyse tek kartta iki unvan gösterilir. Kâr yoksa boş ürün kartı yaratılmaz.

Alt eylemler “Devam et” ve “Kartımı paylaş”. Hemen ardından yeni büyük hedef, satın alma teklifi veya sıralama katılım modalı açılmaz. 1.3'te dahi sıralama sonucu yalnız finalin küçük isteğe bağlı bağlantısıdır.

## 7. Profil ve altı avatar

Mevcut kimlikler korunur: Pazar Kaşifi, Atölye Ustası, Koleksiyon Uzmanı ücretsiz; Neon Aracı, Altın Vizyoner, Gece Analisti Premium/ilgili tekil paket kapsamında. Yeni görsel üretimi yok; kırpma, çerçeve, seçili durum ve auralar cilalanır.

Profil ilk ekranda: 56 px portre + isim + seviye; altta “Ticaret / En iyi kâr / İlk ev” üçlüsü. Avatarlar ayrı “Avatarını değiştir” açılımında iki sıra üçlü grid; büyük metinde iki sütun. Seçimden sonra önizleme ve “Kullan” eylemi; iptal eski avatarı korur. Kilitli avatar önizlenebilir, “Mağazada gör” mevcut mağazayı açar; doğrudan gizli satın alma başlatmaz.

Yerel isim: mevcut 1–20 karakter sınırı korunur; trim/boşluk birleştirme, boş adı reddetme. Satır kırıcı/kontrol karakteri reddedilir. Global listeye bu alan gönderilmez. Mevcut kayıt isminde migration sırasında sessiz değişiklik yapılmaz.

Premium kaybında sahip olunmayan canlı avatar etkin kalmaz; mevcut ücretsiz varsayılana düşer. Ayrı avatar paketi sahipliği varsa korunur. Reklamsız paket hiçbir kozmetiği açmaz. Bu hesaplar mevcut entitlement servisinden gelir; ayrı UI sahiplik kaydı yaratılmaz.

### Mağazanın sabit düzeni

Mevcut mağaza girişi korunur. Başlık altında iki ana paket kartı: “Reklamsız” ve “Premium”. Standartta yan yana, büyük metinde alt alta; aynı kartta en fazla başlık, iki kısa fayda ve mağazadan gelen gerçek fiyat/owned durumu. Premium'un farkı “Reklamsız + tüm mevcut kozmetikler” cümlesidir. Üçüncü para paketi veya abonelik eklenmez.

Sahip olunan ana kart satın alma düğmesi değil “Açık” durumuna geçer. Premium varsa Reklamsız kartı “Premium'a dahil” der ve tekrar satın alma sunmaz. Kullanıcının doğrudan sahip olduğu tekil paketler, ana kartların altında kapalı “Diğer paketler ve haklarım” alanında korunur; tekil ürünlerin fiyatı/erişimi kaldırılmaz. Ardından temalar ve ev stilleri ayrı açılır bölümde; seçili tema açıkça vurgulanır. Sayfanın altında “Satın alımları geri yükle” ve gizlilik bağlantısı her durumda erişilebilirdir.

Fiyat gelmezse uydurma fiyat ve aktif satın alma yok: “Mağaza fiyatları yüklenemedi” + tek yeniden dene. Bekleyen işlemde ilgili kart disabled, pencere güvenle kapanabilir; sonuç mevcut satın alma durum mekanizmasıyla gelir. Native satın alma ekranını tek açık kullanıcı eylemi başlatır. NoAds→Premium için mağazanın sağlamadığı fark ödemesi/indirim vaat edilmez.

## 8. Paylaşım dosyasının kesin tasarımı

- Cihazda oluşturulan 1080×1350 PNG; hedef en fazla 2 MiB. Yeni bulut upload veya uzaktan font yok.
- Üst %15: TradeUp başlığı + “İlk evim”. Orta %40: alınan ev. Sonraki %30: ticaret ve kâr, iki ürünün küçük görseli. Alt %15: isteğe bağlı isim/portre, kısa ürün adı, “Yerel kariyer özeti” ibaresi.
- “İsmimi göster” varsayılan kapalı; avatar açık. İsim açılırsa önizlemede görünür. Reklam, mağaza fiyatı, gerçek ödeme bilgisi ve cihaz kimliği karta konmaz.
- Sadece ekonomik sonucun kaynak kimlikleri render girdisine geçer; tam save çizim/üçüncü taraf servise gönderilmez.
- Canvas ile üretilir. Native'de Capacitor Share + Cache dosyası, web'de dosya paylaşımı desteklenirse Web Share; desteklenmezse açık “Görseli indir” eylemi. Bu fallback önceden seçilmiştir.
- Dosya bellekte önizlenir; kullanıcı Paylaş'a basmadan native pencere açılmaz. İptal hata bildirimi değildir. Geçici dosya paylaşım tamamlandıktan sonra temizlenir; açılışta 24 saatten eski TradeUp paylaşım cache'i temizlenir, kullanıcı dosyaları silinmez.
- Share ve Filesystem yalnız Capacitor 8 uyumlu resmi paketler olarak bu aşamada eklenir. Cache dışına yazma, fotoğraf galerisi izni veya dosya yöneticisinde kullanıcı belgelerine erişim yok. Filesystem'in gerektirdiği Privacy Manifest bildirimi mevcut manifest'e gerekçesiyle eklenir; uygulamaya ait cache dosya zamanları için C617.1 kullanılır. Bu izin ATT değildir. [Filesystem rehberi](https://capacitorjs.com/docs/apis/filesystem), [Share rehberi](https://capacitorjs.com/docs/apis/share)
- Ürün asset'i yoksa mevcut kategori fallback'i, ev görseli yoksa stilize mevcut ev ikonu; eksik asset paylaşımı kilitlemez.
- PNG kişisel kayıt belgesidir; QR ile “doğrulanmış global skor” iddiası yok. Global skor paylaşımı bu pakette yok.

## 9. Sıralamanın sabit sözleşmesi — 1.3

Liste başlığı “Serbest Kariyer · Top 100”. Kurallar açıklaması: “Sonuçlar kayıtlı oyun kurallarıyla kontrol edilir. Pazar şansı, tercihler ve reklam bekleme süreleri farklı olabilir. Bu liste eşit şartlı veya ödüllü turnuva değildir.”

### İki ölçüt

| Kimlik | Ölçüm ve bitiş | Sıra |
| --- | --- | --- |
| first-home-budget-v1 | Başlangıç ₺420. Harcanabilir nakdin ilk kez en az 375.000.000 kuruş olduğu başarılı ekonomik komut sonrası piyasa ticareti sayısı | Düşük daha iyi |
| profit-100-v1 | Journal sırasına göre ilk 100 piyasa satışının gerçekleşmiş kârı; 100. satış anında dondurulur | Yüksek daha iyi |

Başlangıç defteri her iki ticaret sayacında hariçtir. Nakit hedefi ev alımı öncesinde yakalanır; hedef zaten yakalanmadan satın alma yaptıysa ilgili satın alma öncesi doğrulanmış bakiye de kontrol edilir. Ürün tahmini, ilan fiyatı, envanter book cost'u ve ev değeri nakit hedefi değildir. Sıfır ticaretle hedefe ulaşma, bu başlangıç/ekonomiyle mümkün görünürse skor geçersiz veridir; otomatik kullanıcı banı değil doğrulayıcı alarmıdır.

100 satış kârı negatif olabilir. Skor 64-bit işaretli tam sayı sözleşmesinde; JS safe integer dışı para veya negatif ticaret sayısı reddedilir. Sabit puan aralığıyla meşru yüksek kâr kırpılmaz. Bir komut birden çok satış kesinleştirirse journal eklenme sırası esas alınır; eşik tam 100'de alınır.

**Eşitlik:** aynı ölçüt değeri aynı sıra numarası; sonraki sıra yarışma sıralamasıdır: 1, 1, 3. Fiziksel liste sırası skordan sonra rastgele üretilmiş sabit publicEntryId ile belirlenir. Bu ikincil sıra daha yüksek beceri anlamına gelmez.

Top 100 en fazla 100 satırdır; yüzüncü satırda eşitlik varsa “Aynı sonucu paylaşan başka oyuncular var” notu gösterilir. Kendi satırı listede olmasa da kendi derecesi gösterilir. Kullanıcı başına/ölçüt başına yalnız en iyi kayıt; yeni eşit sonuç öncekinin üzerine yazılmaz. Hafta/sezon sıfırlaması yok. Kural değişince ayrı ruleset; eski liste arşivlenir ve skorlar karıştırılmaz.

Kâra göre birleştirilmiş üçüncü liste, para/ticaret oranı veya ilk kaydolanlar podyumu yok. 1.2'de bu iki ölçüt yalnız yerelde hesaplanır; 1.3'te doğrulanmış ikinci kariyerden gelen sonuç global olabilir.

## 10. İki kariyer yuvası ve eski oyuncular

- `main`: mevcut kariyer ve save; olduğu gibi korunur.
- `verified`: yalnız kullanıcı “Doğrulanan kariyer başlat” derse oluşturulur; yeni ekonomi veya hız değil aynı oyun kuralları. Varsayılan aktif yuvayı kendiliğinden değiştirmez.
- 1.2'de ikinci yuva UI'si yok. 1.3'te Yolculuk → Rekorlar → kurallar/katılım → Game Center → açık veri katılımı → sunucu başlangıcı → ikinci yuva oluşturma.
- Son onay: “Mevcut kariyerin korunur. Yeni kariyer sıralama için başlangıçtan kontrol edilir.” İptal main'e döner; ekonomik etkisi yok.
- Aynı anda tek yuva çalışır; pasif yuvanın dünya/offline ilerleyişi dondurulur. Aktif yuvada mevcut offline kuralları korunur. Aralarında aktarılabilen eşya, para veya yenileme hakkı yok. Kozmetik ve satın alınmış haklar uygulama genelinde geçerlidir.
- Profil istatistikleri ve Yolculuk aktif yuvayı gösterir; başlık altında “Ana kariyer” veya “Doğrulanan kariyer” açıklaması bulunur. Global satır daima verified'dan gelir. Yuva seçimi Profil içindeki tek kompakt alandadır; pazarın üzerine yeni büyük kart eklenmez.
- Yuva değiştirme önce aktif save/outbox'ı atomik kaydeder; başarısızsa değişim iptal edilir. Bekleyen reklam/purchase/ekonomi komutu varken yuva değiştirilemez. Bekleyen callback başlatıldığı careerId'ye bağlıdır.
- Aynı kullanıcı/ruleset için yalnız bir açık sunucu kariyeri. Sırf seed beğenilmedi diye yeniden zar atılmaz. Doğrulanan kariyer ilk ev sonrası da mevcut opsiyonel ev yükseltmeleriyle devam edebilir; 100 ticaret sonucunu bozmaz.
- Tekrar deneme ancak ilk ev VE 100 ticaret hedefi tamamlandıktan sonra oyuncunun ayrı onayıyla; en iyi global sonuç korunur, verified yuvasının önceki yerel özet kartı arşivlenir. Main asla silinmez. Başarısız/sonuçsuz kariyeri bırakmak mümkündür; yeni doğrulanan başlangıç en erken sunucu başlangıcından 24 saat sonra, kullanıcı başına en fazla günde bir. Bu sınır ana kariyer veya oynama hakkını sınırlamaz.
- Yerel main'in eski snapshot'ı, replay'i ve kariyer kartı hiçbir zaman geriye dönük global doğrulanmışa yükseltilmez.
- Başka cihazda aynı kullanıcıyla açık kariyer bulunursa ikinci bir kopya açılmaz. Tamamlanan global sonuç görülebilir; bu sürümde cloud save veya canlı cihazlar arası kariyer taşıma yok. Veri kaybında “sıralamada kaydın var, kariyer bu cihazda yok” açıkça gösterilir.

## 11. Backend ve kimlik — seçilmiş mimari

```text
Yerel motor + IndexedDB (oynama ve para için mevcut otorite)
       │ yalnız açık global katılımda
       ▼
Game Center kimlik kanıtı + App Attest istek kanıtı
       ▼
HTTPS API / Cloud Run (TypeScript, mevcut saf motoru kullanan doğrulayıcı)
       ├─ Firestore: kimlik bağı, koşu/checkpoint, kanıt, sonuç, silme işi
       ├─ AdMob SSV: ödül kanıtı
       └─ App Store işlem doğrulama: reklamsız bypass kanıtı
```

Game Center bu sürümde yalnız kimlik için; Game Center leaderboard servisine paralel ikinci skor yazımı yok. Özel Top 100 kendi API'mizden okunur. Firebase Authentication, anonim hesap, yeni şifre/email girişi, Firestore istemci SDK'sı ve web reCAPTCHA eklenmez. Android global katılım sonraki platform paketi; 1.3 iOS doğrulanan listesine web/Android skorları girmez. Ana oyun platformlar arasında çalışmaya devam eder.

GameKit'in güncel kimlik imzası API'si seçilir; eski deprecated yöntem kullanılmaz. Sunucu Apple imzasını, bundle bağını, timestamp'i ve kullanıcı kimliğini doğrular; istemcinin yolladığı ID'ye tek başına güvenmez. Anahtar URL'si keyfi adrese sunucu isteği yaptırmaz: Apple anahtar yolu/host allowlist'i, HTTPS, redirect kısıtı, boyut ve timeout sınırı uygulanır. [GameKit kimlik doğrulama imzası](https://developer.apple.com/documentation/gamekit/gklocalplayer/fetchitems%28foridentityverificationsignature%3A%29)

Cloud Run için hedef europe-west1, minimum instance 0, ilk beta maksimum 2 instance, concurrency 8; Firestore aynı bölgede yeni skor veritabanı. Mevcut veritabanının yeri farklıysa taşınmaz; proje/bölge kotası bu kuruluma izin vermiyorsa global kurulum durur, sağlayıcı/bölge değiştirilmez. Analytics koleksiyonuna, ayarına veya eski projelere dokunulmaz. Bunlar hizmet sağlayıcının ücretsiz olacağı taahhüdü değil kurulum hedefidir. [Cloud Run sınırları](https://docs.cloud.google.com/run/docs/configuring/max-instances), [Firestore bölgeleri](https://docs.cloud.google.com/firestore/native/docs/locations)

Silme ve saklama görevleri kullanıcının uygulamayı tekrar açmasına bırakılamaz. Tek Cloud Scheduler bakım işi saatte bir OIDC ile yalnız bakım endpoint'ini çağırır; parça parça silme, süre dolumu ve retry checkpoint'lerini yürütür. İstemci bu endpoint'i çağıramaz. Kullanıcı silme isteğinde görünür skor projeksiyonu derhal kapatılır; cache en geç 5 dakika içinde yenilenir. Firestore TTL yalnız bağımsız log belgelerinde yardımcıdır; alt koleksiyonları ve kimlik bağını kendiliğinden sildiği varsayılmaz. Yeni mesaj kuyruğu/ayrı worker filosu yok. Bu zamanlayıcı da maliyet ve kurulum onayına dahildir.

Resmi dayanak: [Scheduler HTTP kimliği](https://docs.cloud.google.com/scheduler/docs/http-target-auth), [Firestore TTL sınırları](https://docs.cloud.google.com/firestore/native/docs/ttl). Bakım işlemleri idempotenttir; aynı işin iki defa çağrılması yeniden skor veya hesap yaratmaz.

### Veri sahipliği

Sunucu, iç playerId üretir; Game Center kimliği yalnız özel kimlik bağında şifreli/sınırlı erişimle durur. Kamuya publicEntryId ve üretilmiş “Tüccar 7K4P2Q” gibi takma ad çıkar. Public ID, Game Center ID'nin açık hash'i değildir. Game Center fotoğrafı, adı, arkadaş listesi ve yerel profil adı alınmaz. Erişim token'ı 15 dakika; yenileme native güvenli depoda ve App Attest anahtarına bağlı, 7 gün; tekrar kimlik doğrulama mümkündür.

Sahiplik ve rank bağlantısı istemci tarafından seçilemez. Başka kullanıcı/koşu kimliğiyle istek reddedilir. Özel veritabanına yalnız Cloud Run service account yazar; admin sorgu/inceleme ayrı en az yetki hesabıdır. Client'tan doğrudan Firestore okuma/yazma kapalıdır.

Yetkisiz farklı cihaz isteği veya çalınmış run kimliği, meşru cihazdaki koşuyu iptal edemez; yalnız o istek reddedilir. LOCAL_ONLY kararı, kendi cihazında doğrulanabilir süre/log bağını gerçekten kaybetmiş kariyere uygulanır. Güvenlik olayı ile kullanıcı kayıt kaybı aynı durum koduna indirgenmez.

İmza/kanıt doğrulayıcıda güncel resmi format ve güvenilir kriptografi kütüphanesi kullanılır; el yapımı şifreleme veya hash'i imza sanma yok. Aynı motor state'inin checkpoint digest'i: UTF-8, sıralı nesne anahtarları, korunmuş dizi sırası, para alanları ondalık tam sayı metni ve normalize edilmiş yalnız deterministik domain alanları. Kullanıcı görünümü/Analytics/gerçek duvar saati state digest'ine katılmaz; zaman yetkisi ayrı lease kanıtındadır. Hash gizli anahtar veya doğruluk kanıtı değil, kabul edilmiş checkpoint eşleştirme aracıdır.

## 12. Veri sözleşmeleri

Alan listeleri kod veya oluşturulmuş veritabanı değildir; uygulamanın uyacağı semantik şemadır.

| Nesne | Zorunlu içerik | Yazma sahibi |
| --- | --- | --- |
| LocalCareerEnvelope | careerId, slot, saveVersion, summaryVersion, engineState, firstHomeSummary, localRecords, verificationState | Yerel atomik persistence |
| RulesetManifest | id, engine/config/content digest, başlangıç tanımı, skor tanımları, zaman ve ödül politikası sürümü | Yayınlanan sunucu artifact'i |
| VerifiedRun | runId, playerId, deviceBinding, rulesetId, seed, serverStartedAt, son kabul edilen sequence/checkpoint, state, bitiş kanıtları | Sunucu |
| CommandEnvelope | runId, sequence, commandId, name, payload, önceki ACK, monotonic elapsed, assertion bağı | Client üretir, sunucu kabul eder |
| TimeLease | leaseId, runId, issuedAt, expiresAt, son gameTime, izinli zaman bütçeleri, sunucu imzası | Sunucu |
| RewardProof | claimId, runId, placementId, commandId, provider transaction veya verified StoreKit entitlement, durum | Sunucu |
| ScoreRecord | playerId, publicEntryId, rulesetId, metricId, tam sayı score, source run/checkpoint, doğrulama zamanı, görünürlük | Doğrulayıcı |
| PublicRow | generatedAlias, avatarId, score, rank, publicEntryId | API projeksiyonu |
| DeletionJob | playerId, requestedAt, işlemler, durum, kısa süreli rastgele receipt | Silme servisi |

Şema versiyonları ve ruleset ayrı kavramlardır. Aktif kaynakta save sürümü 21; 1.2 snapshot migration'ı 22, 1.3 kariyer zarfı 23 olarak planlanır. Uygulama başlayana kadar kaynak sürüm ilerlediyse sıradaki boş sürüm kullanılır; var olan migration üzerine yazılmaz. Bu sürüm çakışması mekanik tasarım değişikliği değildir.

### API operasyonları

| Operasyon | Girdi | Sonuç / yetki |
| --- | --- | --- |
| POST /v1/session/challenge | uygulama ve cihaz bağlama isteği | Tek kullanımlık challenge; kısa ömür ve oran sınırı |
| POST /v1/session | Apple kimlik imzası + challenge/assertion | Session ve gizli playerId; tekrar imza reddedilir |
| GET /v1/rulesets/current | platform ve desteklenen motor | İmzalı uyumlu manifest veya GLOBAL_UNAVAILABLE |
| POST /v1/runs | rulesetId, idempotency key | Tek genesis, seed ve lease; açık koşu varsa aynı koşu |
| POST /v1/runs/{id}/commands | ardışık komut batch'i ve kanıt | ACK sequence, checkpoint, durum; client toplam skoru alanı yok |
| POST /v1/runs/{id}/lease | son ACK ve zaman kanıtı | Yeni lease; offline sınırı aşılmışsa local-only durumu |
| POST /v1/rewards/intent | run, placement, commandId | Tek seferlik claim nonce; ödül miktarını server belirler |
| GET /v1/runs/{id}/status | kendi run kimliği | Son doğrulama/eksik kanıt; bütün save halka açık değil |
| GET /v1/boards/{ruleset}/{metric} | snapshot token ve cursor, limit 20 | En fazla 20 satır; en fazla 100; toplam sıralama revizyonu |
| GET /v1/me/records | geçerli session | Kendi iki en iyi sonucu ve sırası |
| PATCH /v1/me/appearance | izinli avatarId | Sunucu sahiplik kontrolünden sonra genel avatar değişimi |
| DELETE /v1/me | yakın zamanda doğrulanmış session | Silme işi receipt; istemci verified kimlik verilerini temizler |
| GET /v1/deletions/{receipt} | kısa ömürlü rastgele receipt | Yalnız silme durumu |
| GET /v1/admob/ssv | sağlayıcı imzalı callback | Doğrulanmış tek reward proof; oyun parasına doğrudan yazmaz |

Hata kodları: AUTH_REQUIRED, FORBIDDEN, RULESET_UNSUPPORTED, SEQUENCE_GAP, PROOF_PENDING, RUN_LOCAL_ONLY, RATE_LIMITED, MAINTENANCE, INVALID_COMMAND. Ağ timeout'u ekonomi işlemini geri almaz. Aynı idempotency key aynı sonucu döndürür; farklı payload ile tekrar kullanım hata verir. Komut işleme 202/PENDING dönebilir; scoreboard'a client iyimser skor eklenmez.

Challenge/session ve sağlayıcının SSV endpoint'i dışında tüm skor API operasyonları session ister; tek ek istisna, yalnız rastgele kısa ömürlü receipt ile okunabilen silme durumu endpoint'idir. /me, run, reward ve deletion yanıtları private/no-store; yalnız kişisel veri içermeyen liste projeksiyonu revizyon bazında paylaşılabilir cache kullanır. Kullanıcının kendi sıra bilgisi ortak cache'e girmez. Genel leaderboard erişiminin açık olması kimlik doğrulama olmadan bütün özel API'lerin kullanılacağı anlamına gelmez.

## 13. Zaman, log ve ödül doğrulaması

### Log ve kayıt

Mevcut son 256 komut tanılaması korunur ama doğrulama için kullanılmaz. Verified komutu, ortaya çıkan state ve outbox aynı IndexedDB transaction'ında kaydedilir. Kayıt olamıyorsa global uygunluk askıya alınır; ana yerel kayıt/kurtarma davranışı sürer. Başarısız komut ekonomik kayıt sayılmaz; gerekirse yerel tanılamada kalır.

En fazla 128 komut veya 128 KiB açılmış payload bir batch'tir; limitlerden ilkine ulaşınca gönderilir. Bağlantı varken 30 saniyede bir, pause ve hedef anında flush. Bir batch'in ACK'i atomik checkpoint'tir; eksik sequence atlanmaz. Yerel outbox 8 MiB sınırına yaklaşırsa önce senkron denenir; yer yoksa yeni log sessizce düşürülmez, kariyer LOCAL_ONLY olur. Hiçbir veri limiti ana oyuncu parasını silmez.

### Doğrulanabilir saat politikası

Sunucu en fazla 24 saatlik offline lease verir. Aktif sürede güvenilir monotonic ölçüm kullanılır; server timestamp üst sınırı aşan süre kabul edilmez. Cihaz saati ödül hakkı için tek otorite değildir. Yerel duvar saati geri alınsa da son kabul edilen sunucu anı geri gitmez.

- Aktif doğal tick: mevcut 60 gerçek saniye / 1 oyun dakikası; manuel yenilemenin +2 oyun dakikası ayrı action olarak korunur.
- Offline ilerleme: mevcut 15 dakika tam hız, sonrasında 0,35 oran ve 240 gerçek dakika cap; FTUE tamamlanmadan offline ilerleme yok.
- Doğal yenileme 72 gerçek saniye/1 hak; faz kapasitesi mevcut 50/25. Lease içindeki doğrulanabilir zaman kullanılır; faz değişimi hemen clamp eder.
- Reklam/native ekranı ve app background geçişleri başlangıç/bitiş kayıtlarıyla tek zaman akışında yer alır; aynı süre hem aktif hem offline sayılmaz.
- Süre üst sınırı doğru olsa bile geçerli zaman aralıklarının istemcide yeniden kurgulanması tümüyle engellenmiş sayılmaz. Attestation + sequence + server ACK'leri riski azaltır; bot/simülasyon dayanıklılığı ayrıca test edilir.
- 24 saatten uzun doğrulanamayan kesinti, farklı cihaza kopya, sıra fork'u veya motor uyumsuzluğu: o kariyer LOCAL_ONLY. Yeniden global uygunluğa sessiz geçiş yok. Oyuncu aynı kariyeri oynamaya devam eder; daha önce kabul edilmiş skor otomatik silinmez, kanıtlı sahtekârlık ayrı incelemedir.
- Yeniden açılışta monotonic süre bağı güvenle sürdürülemiyorsa yeni server lease alınır. Offline cihaz reboot'unda bu bağ kurulamazsa global doğrulama yereldeki duvar saatinden tahmin edilmez; kariyer LOCAL_ONLY kalır. Kesin kanıt yerine geniş “tolerans” vererek saat açığı yaratılmaz.
- Sunucu arızası yüzünden oyuncunun suçu varmış gibi mesaj verilmez: “Kariyerin cihazında devam ediyor; bu sonucun global doğrulaması sürdürülemiyor.” Kesin neden destek ayrıntısında bulunur.

### Reward ve IAP

AdMob ödül intent'i, tek claim nonce ve placement'ı run'a bağlar. İstemci gerçek tamamlanma callback'i alınca yerelde hakkını hemen verir. Sunucu claim'i ancak Google SSV imzası/transaction tekilliği/intent bağıyla kabul eder. Erken kapanma ve no-fill için claim yok. Client “25 aldım” demesi kanıt değildir. [Google SSV rehberi](https://developers.google.com/admob/ios/ssv)

Premium/Reklamsız bypass için sunucuda doğrulanmış ve o anda geçerli StoreKit işlem/entitlement kanıtı gerekir; client boolean'ı yeterli değildir. Bypass miktar, faz cap'i ve diğer yerleşim kurallarını değiştirmez. İmzalı işlemde bundle/product/environment/revocation ve sahiplik doğrulanır; mümkün olan yeni işlemlerde appAccountToken iç playerId'ye bağlanır. Legacy veya Family Sharing işlemi için imzalı mevcut entitlement ve attested native oturum gerekir; tek transactionId metniyle başka kullanıcıya hak bağlanmaz. Bu kanıt elde edilemiyorsa mevcut restore/yerel satın alma hakkı kısıtlanmaz, global kanıt PROOF_PENDING kalır; sonrasında tanımlı yedi günlük süre uygulanır. Bu paket Family Sharing'i açmaz/kapatmaz ve eski ürüne yeni aile paylaşım vaadi eklemez.

StoreKit'in işlem/ownership/revocation/appAccountToken alanları resmi sözleşmeden alınır; henüz kurulmamış sunucu bunları bugün doğruluyormuş gibi raporlanmaz. [StoreKit işlem özellikleri](https://developer.apple.com/documentation/StoreKit/transaction-properties)

Gecikmiş kanıt için yeniden deneme 5 sn, 30 sn, 2 dk, 10 dk, sonra en erken saatte bir; foreground/ağ dönüşü bu sınırı aşmaz. Yedi gün tamamlanmazsa ilgili aday globalden hariç kalır ve yerel sonuç korunur. Yeniden reklam izletilmez; ödül geri alınmaz. Test reklamı ve sandbox satın alımı yalnız test ortamı skoruna gider, gerçek listede görünmez.

## 14. Global ekranın durum makinesi

| Durum | Gösterim | İzinli eylem |
| --- | --- | --- |
| 1.2 | İki yerel rekor; global düğme yok | Kariyer kartı / kurallar |
| 1.3 katılmamış | “Global sıralama isteğe bağlıdır.” | Kuralları oku, yeni doğrulanan kariyer başlat, geri |
| Kimlik iptal | “Katılmadın; mevcut kariyerin değişmedi.” | Tekrar dene veya yerelde devam |
| Verified aktif | İki hedefin ilerlemesi; yerel değil run doğrulama durumu | Senkron durumu / main'e geç |
| Proof pending | “Sonucun kontrol ediliyor.” | Bekle; aynı skoru ikinci kez oluşturma yok |
| Doğrulandı | Sıra ve kabul edilen değer | Listeyi gör |
| Local-only | “Bu sonuç yalnız cihazındaki rekorlarda.” | Kariyere devam; destek ayrıntısı |
| Çevrimdışı | Son önbellek ve güncelleme zamanı | Yeniden dene; yeni sahte sıra yok |
| Boş liste | “Henüz doğrulanmış sonuç yok.” | Kendi hedefini incele; bot yok |
| Bakım / kapalı servis | “Global sıralama şu anda kullanılamıyor.” | Yerel rekorlar devam |
| Hesap siliniyor | “Global kaydın kaldırılıyor.” | Durum receipt'i; yeni otomatik hesap oluşturma yok |

Liste görünür olduğu anda tek sorgu, ardından en erken 60 saniyede manuel güncelleme. Sürekli canlı listener yok. API 60 saniye cache'li sonuç snapshot'ı verir; cursor o revizyona bağlıdır. Revision kaybolursa “Liste güncellendi” ile baştan yüklenir, satır karışmaz. Satırlar standartta 56 px, büyük metinde en az 72 px; seçilen avatar statik, skor satır atmaz. Kamuya açık ayrı profil sayfası yok.

## 15. Gizlilik, silme ve maliyet sınırları

Global katılım ekranı: “Sıralama için Game Center kimliğin, seçtiğin avatar kimliği ve oyun hareketlerin işlenir. Yerel ismin, e-posta adresin ve profil fotoğrafın yayımlanmaz. Kaydını Ayarlar'dan silebilirsin. Ana oyunu katılmadan oynayabilirsin.” Katılım varsayılan kapalı, Analytics izninden bağımsız. Onay kutusu ve “Katıl” açık eylemi vardır; önceden işaretli değildir.

Gereksiz ATT/IDFA geri gelmez. Firebase Analytics yalnız mevcut izinli olay adlarını göndermeye devam eder. İşlevsel doğrulama verisi Analytics'e yönlendirilmez. App Privacy ve gizlilik metni gerçek GameKit/App Attest/backend davranışına göre güncellenir; takma ad olması veriyi otomatik anonim yapmaz.

**Silme:** Profil/Ayarlar → Global sıralama → “Global hesabımı ve verilerimi sil”. Açıklama: global skor ve sunucu geçmişi silinir; bu cihazdaki kariyerler ve App Store satın alımları silinmez. Yakın kimlik doğrulaması ve tek açık onay gerekir. İstek sonrası listeden gizleme en geç 5 dakika/cache süresi; aktif veri ve Game Center eşlemesi en geç 7 gün; operasyon yedeğinde en geç 30 gün. Kesinti durumunda iş retry edilir ve receipt'de açık gösterilir; başarısız işlem “silindi” gösterilmez. Uygulama silmek hesap silmek değildir. Apple'ın hesap silme kuralları bu akışın kabul kapısıdır. [Apple rehberi](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)

Silme isteği sonrası istemci otomatik yeni hesap/run açmaz. İleride yeniden katılım yeni açık onay ister; silme devam ederken aynı kimlikle yeni kayıt açılmaz. Silindikten sonra eski verified kariyer yerel devam edebilir ama yeni hesapta geriye dönük global uygunluk kazanmaz. Silinen kişisel kimliği sırf tekrar katılmayı kalıcı engellemek için gizli listede saklamayız; çoklu hesap/bot riskinin sıfırlanmadığı kabul edilir, ödüllü turnuva sunulmaz.

Doğrulama komut batch'leri kabul sonrası 30 gün tutulur; çalışır checkpoint ve skorun asgari kanıtı hesap durdukça. Tamamlanmamış 90 gün hareketsiz run kapatılır; yerelde kariyer devam eder ama global devam etmez. Sunucu request loglarında payload/token/isim yok; operasyon metadata'sı 14 gün. IP yalnız güvenlik/istek işleme için gerektiği kadar; kalıcı kullanıcı profiline yazılmaz. Destek `nostoscomp@gmail.com`.

**İşletim hedefi:** ilk kontrollü beta için aylık 25 USD iç bütçe hedefi. Bu fiyat teklifi, bedava çalışma garantisi veya kullanıcının harcama onayı değildir. Hizmet açılmadan ayrı onay gerekir. Bütçe onayı yoksa yalnız 1.2 çıkar; 1.3 özelliği kapalı kalır.

Beta kotaları: kullanıcı başına bir açık run, başlangıç en fazla günde bir; oyuncu başına dakikada 12 batch, 60 board okuması/saat; sistemde günde 500 yeni run ve 20.000 batch kabulü. Bu sınırlar betaya aittir; yüksek talepte core oyun değil global katılım/senkron bekler. Kotalar limit değerlerine göre test edilir; IP'ye dayalı toplu ban yapılmaz.

Cloud harcama uyarısı %50/%80/%100. Ölçülen maliyet hedefin %80'ine varınca yeni run kabulü kapatılır, mevcutlar kısıtlı senkron ve cache'li okuma ile devam eder; %100'de yeni hesaplama işleri durdurulur. Faturalama gecikmesi ve platform masrafları nedeniyle bunlar kesin harcama tavanı sağlamaz. Sağlayıcı instance sınırı da tek başına fatura garantisi değildir. [Firestore ücretlendirme](https://firebase.google.com/docs/firestore/pricing)

## 16. Ölçüm ve değişiklik yapmama kuralları

Bu sürümde yeni üretim telemetri parametresi eklenmez. Gönüllü pilotta cihazdaki metrikler kullanıcının açık dışa aktarmasıyla alınır; ad/kimlik içermez. Yerel ölçümler: ilk piyasa alımı/teklif/satış/kârlı satış süresi, ilk evde ticaret, teklif bekleme aralıkları, hata sayıları ve final eylemleri.

5–8 gözlemli pilot; ardından en az 15 uzun kariyer denemesi. Bu sayılar istatistiksel yayın büyümesi kanıtı değildir. Pilotun amacı UI/akış hatası ve gerçek bekleme kaynağı bulmaktır. İlk kâr veya teklif süresi kötü çıkarsa bu paket gizli tempo artışı yapmaz; ayrı denge düzeltme kaydı açılır. Mevcut simülasyonun 241 ticaret beklentisi gerçek ev alma ölçümü diye sunulmaz.

## 17. Uygulama paketleri, dosya sınırları ve geçiş planı

| Paket | Yapılacak iş | Mevcut dayanak / beklenen sınır | Bitirme kanıtı |
| --- | --- | --- | --- |
| P01 | Semantik tema, tipografi, kart/rozet, modal ve safe-area | App.css, theme-surfaces.css, mevcut UI; yeni UI framework yok | Aynı save/tema/cihaz önce-sonra görüntüsü |
| P02 | Journal tabanlı kişisel kayıtlar, ilk ev summary | domain/economy/meta, models, migrations, persistence | Muhasebe ve migration fixture'ları |
| P03 | Final/profil/vitrin hiyerarşisi | HomeFinale, SettingsPanel, JourneyPanel, AvatarPortrait | Focus/ölçek/entitlement testleri |
| P04 | Yerel paylaşım PNG ve native/web fallback | Yeni tek paylaşım hizmeti; native Share/Filesystem yalnız burada | Fiziksel iOS paylaş/iptal/offline |
| P05 | QA, pilot, gerçek mağaza/editorial çekim | Mevcut test/build araçları | 1.2 kabul raporu; yalnız ardından release |
| P06 | 1.3 iki yuva, outbox ve sözleşme fixture'ları | Persistence ve saf domain; log aynı transaction | Kesinti/fork/geri dönüş testleri |
| P07 | Native kimlik/App Attest ve backend verifier | Tek dar native köprü + Cloud Run; Firestore özel | Saldırı fixture'ları ve backend sözleşme testi |
| P08 | Ödül/IAP proof, skor, global UI/silme | Mevcut reklam/billing davranışı + sunucu kanıtı | Test sağlayıcılarıyla uçtan uca |
| P09 | Kontrollü beta, operasyon ve 1.3 release kanıtı | Ücretli servis için ayrı yetki | Güvenlik/maliyet/geri alma kapıları |

Yeni dosyalar yalnız bu görevlerin gerçek gereksinimi kadar açılır; klasör iskeleti ve boş servis yazılmaz. Büyük App.tsx yeniden mimarisi bu paketin işi değildir. Saf hesaplar UI'ye kopyalanmaz; doğrulayıcı motor artifact'ini aynı kaynak revizyonundan alır. Aynı seed/zaman/komutla aynı sonuç şarttır.

Migration 21→22 eski main kaydını ve mevcut yedeği korur. Ev varsa ilk HOME_PURCHASE ve o andan önceki journal'dan özet kurulur; eksik aile/asset ikonu fallback, eksik ekonomik kanıt PARTIAL. Güncel kariyerin toplam kârı geçmiş ilk ev anına yazılmaz. 22→23 main'i zarfa alır, verified boş başlar; migration internet/Game Center istemez. Okunamayan kayıt mevcut kurtarma yoluna gider; otomatik sıfırdan global run açılmaz.

## 18. Test şartnamesi ve önceden belirlenmiş başarısızlık yolu

| Test | Senaryo | Beklenen sonuç | Başarısızsa |
| --- | --- | --- | --- |
| T01 | Hediye defter + 1 piyasa satışı | Ticaret 1; tüm satış 2; global kâr yalnız piyasa | P02 bitmez |
| T02 | Zararlı satış, hızlı satış, iki callback | Her gerçek satış bir kez; negatif kâr doğru | Muhasebe kabulü durur |
| T03 | İlk evden sonra iyi satış/yeni ev/load | İlk summary değişmez | P02/P03 bitmez |
| T04 | Legacy evli/evsiz/eksik journal | Veri silinmez; gerekirse PARTIAL | Migration dağıtılmaz |
| T05 | Uzun ürün, lamba/araç/çanta, eksik raster | Tam görsel/fallback, rozet çakışması yok | İlgili UI düzeltilir, yeni asset şartı konmaz |
| T06 | 320/375/390/430; tüm tema; %200/büyük metin | Okunur, controls erişilebilir; 2 sütun reflow | 9 görünür ürün şartı için yazı küçültülmez |
| T07 | Bildirim bir/iki satır; filtre değişimi | Kartlarda bildirim kaynaklı sıçrama yok | Bildirim kabı/metni düzeltilir |
| T08 | Azaltılmış hareket/VoiceOver | Sakin hareket, doğru focus/etiket | A11y kapısı kapanır |
| T09 | Paylaş/iptal/asset yok/offline | PNG veya açık fallback; oyun değişmez | Native share çalışana kadar release kapalı |
| T10 | Premium/NoAds/tekil avatar restore/revoke | Hak ayrımı korunur; yeni güç yok | Monetizasyon regresyonu düzeltilir |
| T11 | 99/100/101 satış; negatif ve eşit kâr | Tam 100 snapshot, 1-1-3 eşitlik | Skor modülü kapalı |
| T12 | Nakit hedefi, ev alışından önce/sonra | ₺3.750.000 doğru an; ev gideri geçmişi bozmaz | first-home-budget yayımlanmaz |
| T13 | Main↔verified; işlem/reklam beklerken geçiş | Veri karışmaz; bekleyen callback kendi careerId'sinde | 1.3 çıkmaz |
| T14 | Save/outbox yazarken kapanma/kota | Komut kaybolmaz/iki kez olmaz; main korunur | 1.3 çıkmaz |
| T15 | Eksik/sahte/sırası bozuk komut, yanlış kullanıcı | Sunucu reddi, skor yok; ana oyun banlanmaz | Doğrulayıcı tamamlanmadan yayın yok |
| T16 | İleri/geri saat, çift sayılan süre, 24 saat aşımı | Bedava doğrulanmış süre yok; tanımlı local-only | Zaman kanıtı kapısı kapanır |
| T17 | SSV gecikmesi/duplikasyon/sahte ödül | Yerel bir ödül; global proof bekler veya reddedilir | Client toplamı kabul edilerek bypass yapılmaz |
| T18 | Sandbox/debug/attestation yok | Gerçek listede test skoru yok | 1.3 çıkmaz |
| T19 | İlk 100 eşitlik, cursor revizyonu, kendi satırı | Sabit sayfalama ve doğru aynı sıra | Board release kapalı |
| T20 | Delete/cache/yedek/token iptali | Açıklanan sürede gizleme/silme; main/IAP kalır | Global kayıt açılışı durur |
| T21 | Servis kapalı, auth iptal, kota, bütçe stop | Yerel kariyer oynanır; sahte sıra yok | İzolasyon düzeltilir |
| T22 | Aynı seed/config/zaman/komut web/native/server | Kanonik tutarlar ve hash aynı | Motor farkı çözülür; skor toleransı eklenmez |

Her kod paketinde ilgili otomatik kontroller; release adayı için mevcut tam test/lint/TypeScript/production build. Native release yalnız hazır pakette, mevcut araçlarla ve yayın yetkisinden ayrı alınır. CSS/JS teslim bütçeleri korunur. P01–P05 geçmeden 1.2; T11–T22 dahil P06–P09 geçmeden 1.3 çıkmaz.

Kritik uyumsuzlukta yapılacak tek iş rastgele alternatif kurmak değil: bulguyu, etkilenen karar kimliğini ve gereken değişikliği kaydetmek. Güvenlik, veri kaybı veya erişilebilirlik sorunu bilerek kabul edilmez. Ölçülen gerçek, şartnameden farklıysa bunu gizlemek yerine ilgili paket durur; geri kalan bağımsız paketler devam edebilir.

## 19. Apple sunumu ve yayın sırası

1.2 tamamlandığında gerçek build'den beş görsel: Pazar / Karar ve satış / Portföy / Ev yolculuğu / Kişisel final. Özel isimler kapalı; yanlış destek cihazı maketi yok. Video 30 saniye: 0–5 fırsat, 5–12 karar, 12–20 satış sonucu, 20–27 ev ve kişisel anı, 27–30 oyun adı. Gerçek beklemeler uygun kurgu ile kısalabilir; “gerçek zaman” diye yanlış sunulmaz.

Nomination türü App Enhancements. Öne çıkan vaat: “İlk evin, senin ticaret hikâyen.” Yerel/gönüllü paylaşım, okunabilirlik ve ilk ev kişiselleştirmesi somut örneklerle anlatılır. 1.2 nomination'ına 1.3 sıralaması yazılmaz. Türkçe ve İngilizce; doğrulanabilir bağımsız geliştirici hikâyesi. Yeni geliştirme tarihi bugün verilmez: QA'dan sonra uygulanabilir hedef aralığı seçilir ve nomination için en az üç hafta bırakılır. Apple seçimini veya indirme sayısını garanti etmeyiz. [Apple nomination süreci](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/)

Mevcut 1.1.2 incelemesi korunur. Bu belge release tetiklemez. Kodlamaya başlandığında ayrı feature dalı; test artefact'leri ve değişiklik kaydı; merge/push/deploy için o aşamadaki kullanıcı yetkisi. İki sürüm ayrımı sabittir; “büyük güncelleme olsun” diye riskli global altyapı 1.2'ye sıkıştırılmaz.

## 20. Karar bütünlüğü kontrolü ve teslim durumu

Önceki araştırmanın açık konuları burada kapatıldı: avatar sayısı 6; iki skor ölçüsü ve değerleri sabit; rekabet serbest kariyer; iki yuva; iOS kimliği Game Center; backend Cloud Run/Firestore; Game Center skor servisi yok; public isim üretilmiş; SSV/StoreKit kanıtı; saat ve offline sınırı; silme/saklama; sunucu kesintisi; yayın sürümleri ve kabul testleri.

Ürün tercihi olarak “kodlarken seçilecek” madde bırakılmadı. Buna karşılık test başarısı, native SDK uyumu, sağlayıcı kotası, gerçek maliyet, hukuki metinlerin doğruluğu ve Apple sonucu bugün yapılmış gibi gösterilmedi. Bunlar tasarım seçimi değil doğrulama ve dış yetki kapılarıdır. Kurulum veya harcama onayı gerektiren yerde sessiz işlem yapılmaz.

Kaynak dayanağı araştırma raporu ve bu belgede bağlantılı resmi dokümanlardır; kaynak kod incelemesi `a1317e2` tabanlıdır. Native Game Center kimlik yöntemi, Google SSV ve bulut ayarları bu tur resmi belgelerle kontrol edildi. Bunun dışındaki ölçüler, kotalar, süreler ve sürüm ayrımı TradeUp'a ait kararlardır; platform zorunluluğu veya ölçülmüş performans sonucu diye sunulmaz.

Bu tur yalnız bu şartname ve araştırma raporunun yönlendirme satırı düzenlendi. Uygulama kodu, asset, servis, build ve Apple kaydı değişmedi. Kod testi/build çalıştırılmadı; doküman bütünlüğü ve referansları denetlendi. OmniRoute: 0 çağrı. Ponytail yaklaşımı mevcut motor/asset/araçların yeniden kullanımında ve gereksiz yeni sistemlerin dışarıda tutulmasında kullanıldı.
