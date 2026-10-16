# TradeUp 1.2 — İlk Evim

Araştırma, cila değerlendirmesi ve geliştirme planı · 16 Ekim 2026

Durum: uygulamaya alınmamış ürün önerisi. Sürüm adı çalışma adıdır.

Güncelleme: kullanıcının tüm kararların kodlamadan önce verilmesi talimatıyla [uygulama şartnamesi ve karar kaydı](TRADEUP_1.2_IMPLEMENTATION_SPEC_2026-10-16.md) hazırlanmıştır. Bu araştırmadaki seçenekler, açık sorular ve prototip hipotezleriyle çelişen yerde yeni şartname esas alınır. Araştırma bulguları tarihsel kanıt olarak korunmuştur; geliştirme başlamamıştır.

İncelenen kaynak: `a1317e2` commit’indeki TradeUp. Bu belge için oyun kodu, ekonomi, satın alma kayıtları ve Apple başvurusu değiştirilmedi. Kullanıcının son talimatıyla öneriler GDD kapsam dondurmasına bağlı değildir; GDD geçmiş kararların anlaşılması için kullanılmıştır. Bu serbestlik, mevcut kayıtları veya oyuncuya satılmış hakları bozma izni değildir.

## 1. Karar özeti

Önerim: oyunu tekrar oynatmaya zorlayan bir sisteme çevirmeden, **bitirmeye değer ve bitirdiğini paylaşmaya değer** hale getirmek.

İki teslimat sınırı öneriyorum:

- **1.2 çekirdek:** okunaklılık ve görsel cila, ilk ev finalinin güçlendirilmesi, kişisel kariyer kartı, mevcut altı avatarın daha iyi sunulması, isteğe bağlı paylaşım ve editoryal sunum dosyası.
- **1.2 rekabet modülü:** iki açık ölçütlü Top 100. Yalnız skor güvenliği, maliyet ve adalet denemeleri geçerse aynı sürüme girer. Geçmezse çekirdeği bekletmez; sonraki sürüme ayrılır. Yayında çalışmayan “sıralama” düğmesi bırakılmaz.

Rekabet için iki ayrı başarı öneriyorum: **“İlk ev bütçesine en az ticaretle ulaşanlar”** ve **“100 ticarette en yüksek net kâr”**. İkisini belirsiz bir “ticaret/para puanı”na çevirmeyelim. 100 sayısı şimdilik prototip hipotezidir; mevcut ekonomiyle ölçülmeden kesinleşmez.

Ana başarı yine ev sahibi olmak. Sıralama, arkadaşlarla konuşulabilecek bir ek katman; oyunun bitişini geçersiz kılan yeni bir zorunluluk değil.

### Bu güncellemeye koymayacağım şeyler

- Günlük giriş serisi, kaçırınca kaybedilen ödül, zorunlu sezon, yeni enerji duvarı.
- Daha fazla reklam, para paketi, ücretli skor çarpanı veya Premium’a ekonomik güç.
- Zorunlu hesap açılışı, zorunlu yeniden başlatma, eski kariyerleri silme.
- Bütün ürünleri yeniden çizme, beşinci ana sekme, sırf çeşit sayısı artsın diye yeni ürün paketi.
- Sırf Apple’a “büyük güncelleme” demek için tamamlanmamış özellik ilanı.

## 2. Araştırmanın kapsamı ve güven sınırı

Çalışma üç kanıta dayanıyor: mevcut kodun statik incelemesi, kullanıcının paylaştığı ekranlar/oyuncu yorumları ve aşağıda bağlantısı verilen birincil kaynaklar. Rakipler bu çalışma için oynanmadı; karşılaştırma geliştirici açıklamalarına dayanır. Yeni fiziksel cihaz testi, yeni kariyer simülasyonu, kullanıcı araştırması veya canlı gelir ölçümü yapılmadı.

Bu belgede:

- **Bulgu:** kaynak kodda veya belirtilen resmi kaynakta görülen durum.
- **Öneri:** TradeUp için ürün/tasarım kararı; sektörün kanıtlanmış tek doğrusu değildir.
- **Hipotez:** oyuncu testi veya prototiple doğrulanması gereken beklenti.

İki arkadaşın milyonlara ulaşması değerli bir nitel işaret; tek başına geniş kitlenin bitirme oranını veya dengesini kanıtlamaz. Apple tarafından seçilme, indirme veya gelir garantisi verilmez.

## 3. Şu anda gerçekten neler var?

| Alan | Mevcut kanıt | Planın gerçek katkısı |
| --- | --- | --- |
| Ev finali | `src/ui/HomeFinale.tsx` çalışır final penceresi ve öne çıkan anlar içeriyor | Baştan final icat etmek değil; ilk ev anını kalıcı, kişisel ve paylaşılabilir yapmak |
| Kariyer hikâyesi | `src/domain/meta.ts`, `JourneyPanel.tsx` ve `journeyPresentation.ts` olay geçmişi, açılır alan ve sayfalama içeriyor | Daha net özet ve tutarlı sayaçlar; yeni uzun sayfa eklememek |
| Profil | Yerel isim, avatar, seviye ve satış bilgileri var | Profilin bilgi hiyerarşisi ve kişisel rekor alanı |
| Avatar | `src/content/avatars.ts`: 3 ücretsiz + 3 Premium, toplam 6 | Mevcut altıyı daha güçlü sunmak; bunları yeni içerikmiş gibi saymamak |
| Hareketli avatar | `AvatarPortrait.tsx` ve CSS: portre, aura ve küçük dönüşümler | Gerçekçi ürün anlatımı; bunlar iskelet animasyonlu karakterler değil |
| Erişilebilirlik | Büyük metin, azaltılmış hareket ve dokunsal tercihleri mevcut | Tercihlerin tüm ilgili ekranlarda taşmadan işlemesini doğrulamak |
| Ev çeşitleri | Beş ayrı ev ve daha pahalı eve geçiş kodu var | Beş evi yeniden eklemek değil; ilk ev ile sonraki yükseltmeyi ayırmak |
| Global sıralama | Game Center/GameKit veya skor backend entegrasyonu bulunmadı | Yeni altyapı ve yeni güvenlik sorumluluğu |
| Kayıt | IndexedDB, doğrulama, yedek ve migration mevcut | Kaydı koruyan final snapshot’ı; global doğrulukla karıştırmamak |
| Replay | `replayDiagnostics.ts` yalnız son 256 komutu tutuyor | Mevcut tanılama kaydı, tüm kariyerin güvenilir ispatı değildir |
| Firebase | İzinli iOS Analytics; uzaktan yalnız olay adları gönderiliyor | Mevcut sistem ayrıntılı kariyer/kâr hunisini ölçüyor varsayılmayacak |

Kod referansları bu commit içindir; uygulama başladığında tekrar doğrulanmalıdır. `src/domain/homePerks.ts` avantaj tanımları içeriyor; statik aramada çalışma zamanı çağrısı bulunmadı. “Ev alınca bu bonuslar zaten çalışıyor” diye tasarım kurulmayacak veya sessizce etkinleştirilmeyecek.

## 4. Dış araştırma: neyi örnek alalım, neyi almayalım?

| Kaynak | Resmi sunumdaki vurgu | TradeUp için yorumum |
| --- | --- | --- |
| [Dealer’s Life — geliştirici](https://www.abyteentertainment.com/dealers-life/) | Pazarlık, müşteri davranışı ve belirsiz değer tahmini | İlanın neden iyi/kötü olduğunu anlamak, salt ürün sayısından daha güçlü bir cila alanı |
| [Bid Wars — App Store ürün açıklaması](https://apps.apple.com/it/app/bid-wars-storage-auctions/id1023494154) | Kısa değerlendirme, teklif, bulunan eşyanın satış değeri ve koleksiyon | Hızlı karar ve ürün keşfi hissi alınabilir; açık artırma/enerji sistemi kopyalanmamalı |
| [Apple: Getting Featured](https://developer.apple.com/app-store/getting-featured/) | Oynanış, tasarım, sanat, erişilebilirlik, teknik kalite ve oyuna uygun olduğunda tekrar oynanabilirlik | Sonsuz tekrar şart değil. TradeUp’ın iyi sonlanan ticaret yolculuğunu daha iyi göstermek mantıklı |

Bu karşılaştırma “rakiplerin en çok tercih edilen ekranı budur” sonucunu vermez; böyle bir kullanım araştırması elimizde yok. TradeUp’ın savunulabilir konumu: dikey mobil arayüzde anlaşılır al-sat kararları ve somut bir ilk ev hedefi. “Piyasadaki ilk/tek oyun” iddiasına gerek yok.

## 5. Görsel cila değerlendirmesi

### 5.1 Korunacak kimlik

Zümrüt/obsidyen/altın palet, mevcut ürün çizimleri, masada sergilenen ürün hissi, kompakt üst bakiye, dört sekmeli gezinme ve standart boyutta üç sütun korunur. Kullanıcının sevdiği dönen ok geri bildirimi korunur. Yeni tasarım dili veya ağır animasyon kütüphanesi önerilmiyor.

### 5.2 Öncelikli sorunlar ve yapılacaklar

| Öncelik | Bulgu / risk | Önerilen müdahale | Kabul ölçütü |
| --- | --- | --- | --- |
| P0 | Bazı temel CSS kurallarında 7–9 px bilgi yazıları var; oyuncu küçük metin bildirdi | Etiketleri azaltıp başlık/fiyatı büyüten tipografi turu | Küçük cihazda fiyat, ürün adı ve ana eylem yakınlaştırmadan okunur; kesilen ad detayda eksiksiz görünür |
| P0 | Lüks yıldızı sol üstte; ilgi etiketi de sol üstte konumlanıyor | Tek rozet yerleşimi; yıldızı etiketin üstüne bindirmemek | Uzun yerelleştirme ve büyük metinde hiçbir rozet çakışmaz |
| P0 | “Ev hedefi %100” ile nakit eksiği/araştırma sürmesi aynı anda görülebiliyor | “Araştırma açıldı”, “Bütçe”, “Ev alındı” durumlarını açıkça ayırmak | %100 ifadesi ev sahibi olmuş gibi yanlış izlenim vermez |
| P0 | Ürün görseli daha önce detayda kırpılmış; sabit yoğunluk her ekrana uymayabilir | Kart/detay için ayrı görsel çerçevesi ve `contain` denetimi | Uzun lamba, geniş araç, çanta ve küçük eşya tamamen görünür; görsel esnemez |
| P1 | Tema düzeltmeleri mevcut; bütün yüzeyler için yeni cihaz doğrulaması yok | Radar, müze, modal, mağaza, boş durum ve native safe-area yüzey matrisi | Her temada aynı işlevsel hiyerarşi; geride sabit yeşil panel kalmaz |
| P1 | Birden fazla açıklama aynı bilgiyi tekrarlayabiliyor | Bir ana durum, bir yardımcı satır; ayrıntı isteğe bağlı açılır | Yenilemede metin değişmesi sayfayı dikey sıçratmaz |
| P1 | Portföy boşken müze büyük yer tutabiliyor | Boş vitrini tek kompakt önizleme; geniş görünüm isteğe bağlı | Envantere ulaşmak için boş yuvalar boyunca kaydırmak gerekmez |
| P1 | “Kurucu” etiketi oyuncuya açıklamasız görünebilir | Kaynağını doğrulayıp kısa açıklama eklemek; rütbe/Premium ile karıştırmamak | Oyuncu bunun ekonomik güç olmadığını anlayabilir |

Apple’ın tasarım ipuçları en az 44×44 pt dokunma hedefi ve okunaklı metin öneriyor. Bu, WebView’de bütün yazıları tek bir CSS sayısına eşitlemek anlamına gelmez; cihazda algılanan boyut ve ölçekleme test edilir. Ürün başlıklarında 11–12 CSS px, fiyatlarda 14–16 CSS px ilk prototip aralığıdır; bunlar Apple zorunluluğu değil, TradeUp için başlangıç hedefidir. [Apple tasarım ipuçları](https://developer.apple.com/design/tips/)

**Yoğunluk kararı:** 3×3 görünüm standart tercihte korunur; 320 px veya büyük yazı seçeneğinde dokuz ürünü zorla sığdırmak için yazı küçültülmez. Mevcut iki sütunlu büyük metin davranışı geliştirilir. Ürün görsellerinin büyüklüğünü korumak için önce rozet ve boşluk bütçesi azaltılır.

Hareketler kısa, amaçlı ve kapatılabilir olmalı. Avatar auraları, kutlama ve logo dönüşü azaltılmış harekette sakin karşılık kullanmalı; bilgi yalnız renk veya sese bağlanmamalı. [Apple erişilebilirlik rehberi](https://developer.apple.com/design/human-interface-guidelines/accessibility)

### 5.3 İlk oturum ve teklif bekleme

Yeni bir otomatik satış veya garanti kâr sistemi eklemek yerine mevcut bekleme görünür hale getirilmeli:

- İlan hazır mı, fiyatı nasıl konumlanmış, aktif teklif var mı: tek kısa durum satırı.
- Yalnız ekrana basmanın müşteri getirdiği izlenimi oluşmamalı; arka plandaki zaman akışının çalıştığı test edilmeli.
- Nakit daralınca mevcut satılabilir ürünlere kısa yol; yeni pop-up zinciri değil.
- İlk alım → ilan → teklif → satış hattında gereksiz çift onay ve üst üste bildirim denetimi.
- İlk teklif gecikmesi önce ölçülür. Sayısal hızlandırma yalnız veri bunu gerektiriyorsa ayrı denge değişikliği olur.

## 6. Paketin duygusal merkezi: ilk ev finali

**Öneri:** oyuncuya “bu senin ticaret hikâyendi” dedirten, tekrar izlenebilir ama atlanabilir bir kapanış.

Akış: ev satın alımı kesinleşir → kayıt güvenle yazılır → kısa anahtar/ev vurgusu → kişisel özet → “Devam et” ve isteğe bağlı “Kartını paylaş”. Bu önemli anın ortasına yeni reklam yerleşimi konmaz.

Özette en fazla dört ana bilgi:

1. Aldığın ev ve seçtiğin mevcut iç mekân stili.
2. İlk eve kadar tamamlanan piyasa ticareti sayısı.
3. İlk kârlı piyasa satışı ve en yüksek net kârlı satışın ürün görselleri.
4. İlk ev anındaki gerçekleşmiş ticaret kârı.

Alt bilgi açılır olabilir: baskın kategori, hazırlık/inceleme harcaması, zararına tamamlanan satış sayısı. “Hazırlığa harcanan para” gerçek değer artışı diye sunulmaz.

### Teknik sözleşme

- İlk geçerli `HOME_PURCHASE` kesinleştiğinde sürümlü ve değişmez bir `firstHomeSummary` oluşturulur. Ev kimliği, ticaret sayısı, kaynak işlem kimliği, ilgili ürün aileleri ve tutarlar saklanır.
- Sonradan daha pahalı ev almak veya daha iyi satış yapmak ilk finali değiştirmez. Şu anki `finaleHighlights`, kariyerin son olaylarını seçiyor; yeniden açıldığında değişme riski bu nedenle giderilmeli.
- Aynı işlem kimliği snapshot’ı iki defa üretmez. Kayıt başarısızlığında kutlama satış/ev işlemini tekrar uygulamaz.
- Eski kayıtta ilk ev güvenle journal’dan bulunabiliyorsa yerel özet hazırlanır; veri yoksa alan dürüstçe eksik kalır. Uydurma başarı üretilmez.
- İlk evi olmayan kayıtta “final” gösterilmez. Sonraki ev yükseltmeleri ayrı küçük başarıdır; oyunu bitirmek için beş evi alma şartı eklenmez.

### Paylaşım

Mevcut ev/ürün/portre asset’leriyle cihazda üretilen sade dikey kariyer kartı. Oyuncu önizler, sonra sistem paylaşım sayfasını kendisi açar. İsim paylaşımı kapatılabilir. Yerel başarı kartı “global doğrulandı” rozeti taşımaz. Paylaşım iptali, internet yokluğu veya desteklenmeyen API kaydı etkilemez. Yeni sunucuya görsel yükleme gerektirmeyen çözüm önceliklidir; Capacitor iOS ve web için dosya paylaşımı prototiple doğrulanır.

## 7. Profil ve avatar planı

“3+3=6” ifadesini, açıklama gelmezse **mevcut üç ücretsiz ve üç Premium avatarın daha iyi sunulması** olarak yorumluyorum. Altı yeni avatar siparişi kabul etmiyorum; aşağıda ayrı seçenek olarak bırakıyorum.

### Çekirdek profil düzeni

- Üstte portre, isim ve mevcut seviyenin kısa özeti.
- Tek kompakt “Kariyer kartım”: ilk ev durumu, tamamlanan piyasa ticareti, en iyi satış.
- Avatar seçimi ayrı açılır alan; her açılışta altı büyük portre yüzünden sayfa uzamaz.
- Her avatarın seçili/kilitli/sahip durumları aynı yerde gösterilir. Ücretsiz portrelere “düşük kalite”, Premium’a “daha iyi tüccar” hissi verilmez.
- Premium ve tekil animasyonlu avatar sahipliği mevcut kurala göre korunur. Reklamsız paket avatar açmaz. Yeni SKU/fiyat değişikliği bu planda yok.
- Profildeki satış sayacıyla yenileme/reklam eşiği sayacı açıklamasız çelişmez. `SettingsPanel` SALE kayıtlarını sayarken `completedTradeCount` başlangıç defterini dışlıyor; sunum için ortak tanım kullanılmalı.

### İsteğe bağlı altı YENİ avatar

Yeni içerik gerçekten istenirse 3 ücretsiz + 3 Premium için sanat yönü: farklı yaş/görünümde semt tüccarı, teknik ürün uzmanı, tasarım meraklısı; bunların Premium karşılıklarında yalnız ışık/aura ve kıyafet farkı. Önce altı küçük taslak birlikte değerlendirilir, sonra seçilenler mevcut portre diliyle üretilir. Marka/logolu kıyafet, istatistik avantajı, rastgele kutu veya yeni üyelik yok. Bu ek, çekirdek sürümün şartı değildir.

Kullanıcının galeriden fotoğraf yüklemesi bu güncellemede önerilmiyor. Yerel küratörlü avatar çok daha düşük gizlilik ve moderasyon yükü taşır. Sıralamada portre için yalnız avatar kimliği yeterlidir; kişisel fotoğraf göndermeyiz.

## 8. Sıralama tasarımı: neyi ölçüyoruz?

### 8.1 Reddedilen kolay ama yanıltıcı skorlar

- **Sınırsız servet:** daha uzun oynayanı ödüllendirir; beceri karşılaştırması değildir.
- **En yüksek tahmini servet:** henüz satılmamış malların değer aralığını ve tahmin sistemini skor malzemesi yapar.
- **Para / ticaret oranı:** çok az işlem veya tek şanslı satışla manipüle edilebilir; sıfır işlem sınırı sorunludur.
- **Gerçek zamanla en hızlı:** reklam süreleri, cihaz, bağlantı ve boşta geçen zaman karşılaştırmayı bozar.
- **İlk kaydolan/ilk bitiren 100 kişi:** erken gelenlere kalıcı ayrıcalık, sonraki oyuncuya kapanmış yarış demektir.

### 8.2 Önerilen iki filtre

| Liste | Net kural önerisi | Sıralama | Neden? |
| --- | --- | --- | --- |
| İlk Ev Bütçesi | Aynı kurallar setinde, nakit ilk kez ₺3.750.000’a ulaştığında tamamlanan piyasa ticareti sayısı | Azdan çoğa | Aynı bütçeye ulaşma verimliliğini karşılaştırır; ev araştırmasının bekleme süresini dışarıda bırakır |
| 100 Ticarette Kâr | İlk 100 tamamlanan piyasa ticaretinin kanonik gerçekleşmiş kârları toplamı | Çoktan aza | Sınırsız oynama yerine sabit işlem bütçesinde sonucu karşılaştırır |

₺3.750.000 mevcut en ucuz ev fiyatıdır; **bu bir yeni ev fiyatı/ekonomi değişikliği değil, önerilen ölçüm hedefidir**. Hedef nakit olduğu için ürünlerde duran para sayılmaz. Etiket özellikle “İlk Ev Bütçesi” olmalı; “evini alanlar” demek yanlış olur. Bu eşik, ev satın alımıyla aynı atomik komutta aşılabiliyorsa alış öncesi uygunluk anı da ele alınmalıdır.

“Gerçekten ilk evini alanlar” listesi tercih edilirse, beş farklı fiyatı tek yarışa karıştırmamak için ev kimliğine göre ayrı listeler gerekir. Beş küçük listeyi ilk sürümde önermiyorum. İlk ev alma başarısı her durumda kişisel kartta yer alır.

100 ticaret ölçüsü canlı pilot ve tam akış simülasyonuyla doğrulanacak; çok erken/çok geçse liste henüz açılmadan değişir. Açıldıktan sonra 100→150 gibi değişiklik eski skorların üstüne yazılmaz, yeni kural sürümü açılır.

### 8.3 Sayım ve tutar sözleşmesi

- Bir ticaret: piyasadan alınan bir varlığın `SOLD_COMPLETE` ile kesinleşmesi. Hızlı satış da sayılır; zarar da sayılır.
- Hediye başlangıç defteri, ilan açmak/kaldırmak, reklam ödülü, hazırlık ve ev alışverişi ticaret sayılmaz.
- Net kâr = satış hasılatı − alış − hazırlık − inceleme − şeffaf ücretler. Tam sayı kuruş; istemcinin yolladığı toplam kabul edilmez, doğrulayıcı hesaplar.
- 100. tamamlanma anı snapshot olur. Sonradan gelen 101. satış ve ev gideri geçmiş sonucu değiştirmez. Başlangıç hediyesinin kârı bu listeye dahil değildir.
- Negatif kâr geçerli sonuçtur; sahte sıfıra yuvarlanmaz. Eksi değerlere izin verme kararı skor aralığına da yansır.
- Beraberlikte aynı başarı derecesi gösterilir. Listeleme için stabil kimlik kullanılır; daha önce katılan gizlice daha iyi oyuncu sayılmaz. Game Center’ın eşitlik davranışı seçilirse özel arayüz o sözleşmeyle uyumlu olmalıdır.
- Bir oyuncunun her kural sürümünde en iyi uygun sonucu görünür; yeni deneme eskisini ancak daha iyiyse değiştirir. Yeni deneme için mevcut kariyer silinmez.

### 8.4 En önemli adalet sorunu

Mevcut serbest kariyer farklı pazar seed’leri ve oyuncu kararları içeriyor. Ayrıca Premium/Reklamsız, ödül videosunu beklemeden aynı hakkı kullanabiliyor. Ödül miktarı aynı olsa bile arama hızı ve fırsat sayısı farklılaşabilir. **Bu yüzden mevcut kariyerlerden toplanan listeye “tam eşit şartlı beceri yarışı” diyemeyiz.**

Önerilen karar kapısı:

1. İlk prototipte ücretsiz, video kullanan ve reklamsız oyuncuların fırsat/yenileme farkı karşılaştırılır.
2. Fark kabul edilemezse, gerçek rekabet ayrı ve tamamen isteğe bağlı, aynı başlangıç/seed/arama bütçeli bir koşu ister. Bu koşuda satın alım veya video sayısıyla ek rekabet avantajı verilmez; ana kariyerin reklamları ve hakları değiştirilmez.
3. Böyle bir yan koşu oyunu gereksiz karmaşıklaştırıyorsa **global liste ertelenir**. Yerel rekor + paylaşım çekirdeği yine çıkar.

Ödülsüz bir Top 100 de yanlış skorla güven kaybeder. İlk sürümde nakit ödül, turnuva ödülü veya sıralamaya bağlı ücretli hak yok. Yeterli oyuncu yokken liste botlarla doldurulmaz; gerçek katılım sayısı gösterilir.

## 9. Sıralamanın arayüzü

Yeni ana sekme yok. Yolculuk içinde “Rekorlarım”, oradan kompakt sıralama sayfası:

```text
Rekorlar
[ İlk Ev Bütçesi ] [ 100 Ticarette Kâr ]
Kendi sonucum / doğrulama durumu
Top 100 — 20 satır, devamını yükle
Sıra · Avatar · Takma ad · Sonuç
Kurallar ve gizlilik
```

Podyum, sürekli parlayan ilk üç ve dev profil kartları yerine okunaklı satırlar. Kendi satırı ilk üçte olmasa da bulunabilir. Yükleniyor, boş, çevrimdışı, katılmadı ve doğrulama bekliyor durumları ayrı. Sıralamaya girmeyen oyuncu ana oyunda kayıp yaşamaz.

Game Center sayısal skoru artan/azalan ve en iyi/son skor biçimleriyle destekliyor; klasik listeler zorunlu sıfırlanmaz. Bu, iki metriğin teknik sunumuna uyar ama skorun dürüst olduğunu tek başına kanıtlamaz. [Apple leaderboard özellikleri](https://developer.apple.com/help/app-store-connect/reference/game-center/leaderboards/)

## 10. Teknik seçenek ve güvenlik planı

| Seçenek | Artısı | Sınırı | Karar |
| --- | --- | --- | --- |
| Yalnız yerel rekor ve paylaşım | Mevcut mimariye en yakın; internet gerekmez | Global Top 100 değildir | Çekirdek için önerilen |
| Game Center’a istemciden skor | Native kimlik ve liste sunumu; az özel UI | Yerel değiştirilmiş kariyer skorunu güvenilir yapmaz; iOS’a özeldir | Hızlı ama doğrulanmış yarış diye sunulmaz |
| Sunucuda doğrulanmış kariyer/koşu | İstemci toplamına güvenmez; platformlar arası genişleyebilir | Backend, kimlik, log, saat ve bakım maliyeti | Global rekabet için koşullu hedef |

React/TypeScript/Capacitor ve saf domain motoru korunur. Yeni framework veya genel “oyun servisleri platformu” kurulmaz. GameKit için native köprü/entitlement işi gerektiği kabul edilir; Firebase’in projede bulunması Game Center veya skor veritabanının hazır olduğu anlamına gelmez.

### Doğrulanmış skor için asgari akış

Sunucu koşu başlangıcını ve kural sürümünü verir → ekonomik komutlar sıralı kaydedilir → doğrulayıcı başlangıçtan tekrar yürütür → uygun hedef snapshot’ını kendi hesaplar → tekil sonuç yayımlanır.

- `rulesetId`: config, içerik, motor revizyonu, başlangıç kuralları ve skor tanımını bağlar. Yalnız “1.2” yazmak yetmez; mevcut config `gdd-2.2-r3` ayrıca dikkate alınır.
- Mevcut 256 komutluk tanılama halkası kullanılmaz. Tam ekonomik kayıt ve doğrulanabilir ara checkpoint gerekir. Her frame/tick kaydedilerek sınırsız trafik oluşturulmaz; birleştirilebilir zaman ilerlemesi ayrıca tasarlanır.
- Seed/komut hash’i veya uygulamaya gömülmüş HMAC anahtarı tek başına güven kaynağı değildir. Sunucu başlangıcı, nonce, sıralama, tekrar kullanım ve kimlik bağını doğrular.
- Satış, ödül callback’i, reklam atlama hakkı, offline zaman ve saat geri alma doğrulanır. Uydurma `TICK` ile yıllarca ilerletilen kariyer kabul edilmez. Zaman kanıtı ve offline toleransı prototipte çözülmeden global yayın kapısı açılmaz.
- Yalnız geçerli oyun hareketlerini replay etmek otomatik oynayan botu engellemez. Sıra dışı davranış incelemesi ve hız sınırları ayrı katmandır; “hile imkânsız” sözü verilmez.
- App Attest/App Check istemci/istek kökenini destekler; ekonomik doğrulayıcının yerine geçmez. App Check de bütün kötüye kullanımı önlediğini iddia etmez. [Apple App Attest](https://developer.apple.com/documentation/DeviceCheck/establishing-your-app-s-integrity), [Firebase App Check](https://firebase.google.com/docs/app-check)
- Client doğrudan skor yazamaz. Doğrulayıcı kimliği, idempotency anahtarı ve yetkili yazma sınırı bulunur. Debug komutları ve test koşuları üretim listesine girmez.
- İnternet/attestation hatası kariyeri bozmaz veya otomatik ban üretmez; yerel devam ve açık “doğrulama bekliyor” durumu vardır. Desteklenmeyen cihaz için doğrulanmamış/yerel yol sunulur; bütün oyuna erişim kesilmez.
- Eski kariyerler tam, güvenilir başlangıç geçmişi yoksa geriye dönük “doğrulandı” olamaz. Yerel rekorları korunur. Yeni uygun koşu isteğe bağlıdır; mevcut kaydı silmez.
- Android sonradan bağlandığında aynı kural sürümü doğrulanmadan iOS’la sonuçlar karıştırılmaz. Web/test üretim listesine otomatik dahil edilmez.

Game Center testleri yayınla aynı sunucu ortamını kullanır; sürüm öncesi sonuçlar arkadaşlara görünebilir. Ayrı test kimlikleri/listeleri ve temizleme prosedürü gerekir. [Apple test rehberi](https://developer.apple.com/help/app-store-connect/configure-game-center/overview-of-testing-game-center/)

## 11. Gizlilik ve veri planı

- Profil adı ve avatar şu anda cihazda. Global paylaşım açık bir katılım eylemi gerektirir; eski isimler sessizce internete çıkmaz.
- Kamuya açık kayıtta en az veri: takma ad veya sistem adı, avatar kimliği, skor, kural sürümü ve teknik oyuncu kimliğinin kamuya uygun karşılığı. E-posta, yerel save dosyası ve cihaz kimliği listeye konmaz.
- Kişisel fotoğraf, sohbet, yorum, takipçi ve mesajlaşma yok. Özel takma ad herkese gösterilecekse uygunsuz isim bildirimi/inceleme ve gerekli moderasyon kapsamı ayrıca değerlendirilir; hazır avatar bunu tek başına çözmez.
- İşlevsel sıralama katılımı ile isteğe bağlı Analytics ayrı tercihlerdir. Analitiği reddeden kişi ana oyunu oynayabilir; reklam izinleri değiştirilmez.
- Yeni veri işleme için App Privacy ve gizlilik metni gerçek SDK davranışına göre güncellenir. Gereksiz ATT/IDFA izni geri eklenmez.
- Yeni kullanıcı hesabı oluşturulacaksa silme akışı bütçeye dahildir. Apple otomatik oluşturulan misafir hesapları da bu kapsamda değerlendiriyor. [Apple hesap silme rehberi](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- Önerilen saklama taslağı: doğrulama için ayrıntılı loglar 30 gün; uygun rekor ve itiraz için gereken asgari kanıt aktif kayıt sürdükçe. Bu süreler yasal gerçek değil tasarım başlangıcıdır; açık politika, silme ve yedek temizleme ile kesinleştirilir. Kalıcı herkese açık ayrıntılı işlem geçmişi yok.
- Destek/gizlilik iletişimi `nostoscomp@gmail.com` olarak korunur.

## 12. Ekonomi ve ölçüm: neyi bildiğimizi abartmayalım

Mevcut `careerSimulation.test.ts`, 100 seed için ₺3,5 milyon araştırma eşiğine medyan 241 ticaret beklentisi içeriyor; P10 214, P90 269. **Bunlar bu çalışmada yeniden çalıştırılmış sonuç değil, repodaki test beklentileridir.** Simülasyon alım/satımı sadeleştiriyor; gerçek teklif bekleme ve ilk ev satın alma akışını bütünüyle modellemiyor. Eski `ECONOMY_SIMULATION_3M.md` farklı katalogla daha eski bir rapordur.

| Mevcut ev | Fiyat | Araştırma başlangıcından görünme ofseti |
| --- | --- | --- |
| Bahçeli Başlangıç Evi | ₺3.750.000 | 180 oyun dakikası |
| Şehir Rezidans Dairesi | ₺4.150.000 | 180 oyun dakikası |
| Teraslı Dubleks | ₺4.750.000 | 270 oyun dakikası |
| Taş Avlulu Ev | ₺5.600.000 | 360 oyun dakikası |
| Sahil Yamaç Villası | ₺7.250.000 | 450 oyun dakikası |

Dolayısıyla “241 ticarette oyun bitiyor” demek doğru değil. Yeni ölçüm gerçek ilk `HOME_PURCHASE` olayında biter; hangi evin seçildiği raporlanır. Ayrıca maliyet, eldeki ürün, zarar ve bekleme birlikte değerlendirilir.

### Prototipte ölçülecekler

1. İlk piyasa alımı, ilk teklif, ilk piyasa satışı ve ilk kârlı satış süreleri.
2. Nakit yetersizken mevcut envanter ve aktif ilan durumu; yeniden yüklemeden teklif gelişi.
3. Gerçek ilk ev satın alımına kadar ticaret sayısı; medyan/P10/P90 ve tamamlamayan denemeler.
4. Normal, temkinli ve agresif fiyat stratejilerinde sonuç; ücretsiz/reklam/reklamsız farkı.
5. 100 ticarette kâr dağılımı; kaç oyuncu bu ölçüte ulaşabiliyor?
6. Finalde tek tuşla devam/paylaşma başarısı; sıralama açmayanın ana akışında ek adım var mı?

Firebase adaptörü bugün yalnız olay adını gönderiyor. Süre, tutar ve strateji kırılımını mevcut Analytics’ten çıkarabiliyormuşuz gibi davranmayacağız. Önce izinli test oturumlarında yerel ölçüm; gerekiyorsa sonra veri minimizasyonlu, onaylı olay sözleşmesi. Genel oyuncu adı ve serbest metin telemetriye taşınmaz.

## 13. İş paketleri ve üretim sırası

Tahminler tek deneyimli geliştirici için **kişi-gün aralıklarıdır**; takvim/teslim sözü değildir. Kod prototipi, native köprü ve mevcut testlerin gerçek durumu görüldüğünde yenilenir. Apple inceleme süresi dahil değildir.

| Sıra | Paket | Çıktı | İlk tahmin | Bağımlılık / durdurma koşulu |
| --- | --- | --- | --- | --- |
| A | Okunabilirlik ve yüzey cilası | Tipografi, rozet, tema, görsel ve boş durum düzeltmeleri | 3–5 | Fiziksel küçük ekran doğrulaması |
| B | İlk ev anısı | Değişmez final snapshot’ı, gerçek kişisel kayıt, save migration | 3–5 | Kanonik muhasebe ve ilk ev ayrımı |
| C | Profil ve paylaşım | Mevcut 6 avatarın sunumu, kariyer kartı, native paylaşım | 2–4 | B; yeni fotoğraf yükleme yok |
| D | Rekabet karar prototipi | İki skor hesaplayıcısı, adalet simülasyonu, backend/native teknik deneme | 2–4 | Sonuç eşitliği ve güven modeli başarısızsa global liste durur |
| E | Koşullu global Top 100 | Kimlik, tam log/checkpoint, sunucu doğrulama, API, liste, silme ve operasyon | 12–22 | D + işletim bütçesi + cihaz güvenlik testi; kapsam büyürse yeniden tahmin |
| F | QA ve editoryal sunum | Cihaz matrisi, gerçek oynanış çekimleri, nomination paketi | 4–6 çekirdek; E varsa ek 3–5 | Görseller teslim edilecek sürümden alınır |

Çekirdek A+B+C+F yaklaşık **12–20 kişi-gün**. D için ayrıca 2–4 gün keşif; E ve ek QA için 15–27 gün koşullu bütçe. Altı yeni avatar üretimi bu hesaba dahil değil. Tam sunucu doğrulaması “bir liste ekranı kadar küçük” tahmin edilmiyor; D sonunda aralık genişleyebilir.

Önce A’nın tek kritik ekranı ve B’nin veri prototipi görülür; bütün ekranlar bir anda yeniden yapılmaz. C ve F mevcut asset’leri kullanır. Sıralama altyapısı çekirdek cilayı bloke edemez.

### Bütçe ve ölçek

Yerel kartın özel sunucu maliyeti yok; global modülün maliyeti kullanıcı sayısı değil aktif kullanım ve doğrulama yüküyle hesaplanır. Örnek model: günlük liste açılışı × sayfa okuması + gönderilen skor × doğrulama CPU süresi + saklanan log hacmi + ağ trafiği.

Firestore seçilirse okumalar/yazmalar, bazı indeks sorguları, dinleyici güncellemeleri, depolama ve trafik ücretlendirmeyi etkiler. Sürekli Top 100 dinleyicisi yerine isteğe bağlı sayfalı istek/önbellek öneriyorum. “Firebase var, bir milyon oyuncu ücretsiz olur” varsayımı yok. [Resmi Firestore fiyatlandırma açıklaması](https://firebase.google.com/docs/firestore/pricing)

Yayın öncesi 1.000 / 10.000 / 100.000 günlük aktif oyuncu için aynı model çalıştırılır; bunlar büyüme tahmini değil yük senaryosudur. Harcama uyarısı, endpoint hız limiti ve yalnız sıralamayı kapatabilen operasyon anahtarı gerekir. Harcama uyarısı tek başına harcama üst sınırı değildir. Hiçbir ücretli servis bu belgeyle açılmadı.

## 14. Test ve kabul planı

### Otomatik testler

- Muhasebe: nakit, book cost, gerçekleşmiş kâr, ilan kaldırma, hızlı satış ve iki kez callback idempotency.
- Sayaç: başlangıç defteri dışarıda; zarar satış sayılır; ilan açma ve ev alımı sayılmaz.
- Snapshot: ilk evden sonra satış/yükseltme/load finali değiştirmez; eski save geçişi veri kaybetmez.
- Skor: 99/100/101 sınırı, negatif kâr, eşit skor, kuruş yuvarlama, hatalı payload, config değişimi.
- Güvenlik: değiştirilmiş save, eksik/tekrar/sırası bozuk komut, ileri/geri saat, sahte reklam ödülü, debug komutu, başka kullanıcı run kimliği, tekrar gönderim, kopyalanmış koşu ve yetkisiz skor yazımı.
- Kesinti: ağ kopması, yarım yazma, uygulama kapanması, offline sonrası tekrar bağlanma; sıralama bozulduğunda ana oyun sürer.
- IAP/reklam regresyonu: Premium/Reklamsız ayrımı, restore/revoke; ödül yalnız doğru tamamlanma ile bir kez; haklar faz kapasitesini aşmaz; 30 ticaret geçiş reklamı akışı değişmez.

### Görsel ve cihaz matrisi

- WebView 320/375/390/430 CSS px; fiziksel küçük iPhone ve büyük iPhone. Destek beyanındaki iPad/uyumluluk modu ayrıca doğrulanır; sadece ekran görüntüsü yüklemek native iPad desteği sayılmaz.
- Bütün temalar × standart/büyük metin × uzun Türkçe/İngilizce metin.
- Azaltılmış hareket, dokunsal kapalı, VoiceOver odak sırası, modal kapatma ve açılışa odak dönüşü.
- En uzun ürün adı, uzun/görece geniş asset, eksik görsel, yüksek tutar ve uzun sıralama adı.
- Reklam/purchase/native paylaşım ekranından dönünce scroll, safe-area ve modal yüksekliği.
- CLS benzeri yer değişimini video/ölçümle kontrol: bildirim tek/iki satır değişiminde pazar kartları sıçramaz.

### Pilot ve yayın kapıları

Önce 5–8 oyuncuyla gözlemli kullanılabilirlik turu: oyuncu fiyatı, kârı ve ev hedefinin durumunu açıklayabiliyor mu? Bu küçük grup istatistiksel büyüme kanıtı değildir. Ardından mümkünse 15–30 gönüllüyle farklı stratejili uzun test; tamamlamayanlar da rapora girer.

Kapılar: sıfır bilinen P0 veri kaybı/muhasebe hatası; satın alınmış haklarda regresyon yok; kritik yazı/eylem çakışması yok; finalde eski kariyer korunuyor; global modül varsa yalnız doğrulanmış veri yayımlanıyor. İlk teklif süresi için medyan/P90 raporlanır; ölçmeden “%30 hızlandı” yazılmaz.

Kod aşamasında mevcut `pnpm test`, `pnpm lint`, `pnpm build` ve ilgili Playwright/native testleri kullanılır. `vite.config.ts` mevcut teslim bütçeleri 400 KiB entry JS / 180 KiB chunk / 100 KiB CSS: sırf cila eklemek için bu sınırlar körlemesine büyütülmez. Gereksiz tam release build tekrarları yok; nihai paket tüm kapılardan sonra alınır.

## 15. Apple editoryal stratejisi

Apple’ın oyunu duyurmasını istemek makul; ama bunun yolu daha büyük sürüm numarası değil, gerçekten gösterilebilir bir iyileştirme ve net hikâye. App Review ile editoryal nomination ayrı süreçlerdir. Nomination gönderilmiş olması seçildiği anlamına gelmez. [Apple nomination rehberi](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/)

### Önerilen başvuru hikâyesi

“Küçük al-sat kararlarıyla ilk evine ulaş. Yeni güncelleme, oyuncunun kendi ürünlerini ve en iyi satışlarını hatırlayan kişisel bir ev finali, daha okunaklı tek elle arayüz ve paylaşılabilir kariyer özeti sunuyor.”

Bu metin bir **taslaktır**; özellikler tamamlanmadan güncel sürüm açıklaması gibi yayımlanmaz. Global sıralama ancak gerçekten teslim ediliyorsa eklenir. Tek geliştirici/Türkiye hikâyesi yalnız doğrulanabilir bilgilerle anlatılır; bütün asset’lerin el çizimi olduğu gibi kanıtsız iddia kurulmaz.

### Hazırlanacak editoryal paket

1. 25–35 saniyelik gerçek cihaz oynanışı: iyi fırsat → karar → net satış sonucu → ilk ev finali. Sahte UI veya AI ile uydurulmuş oyun görüntüsü değil.
2. Güncel sürümden beş güçlü mağaza görseli: pazar, satış/karar, portföy, ev yolculuğu, kişisel final. Açıklamalı çerçeve gerçek ekranı gizlememeli.
3. Türkçe ve doğal İngilizce kısa ürün özeti; farklılığımız, hedef oyuncu ve güncellemenin somut değişiklikleri.
4. Gizlilik/erişilebilirlik tercihlerini ve reklam/IAP davranışını doğru anlatan kısa not.
5. Herkese açık, erişilebilir demo/video ve basın materyali bağlantıları; kişisel oyuncu verisi göstermeyen çekimler.

### Zamanlama ve mevcut başvuru

- Güncelleme için uygun nomination türü **App Enhancements**; yayımlanmış oyunu yeniden ilk çıkışmış gibi sunmamak.
- Apple’ın genel featuring sayfası en az iki hafta, nomination iş akışı en az üç hafta ön hazırlık öneriyor. Planlamada **en az üç hafta**, tercihen 4–6 hafta tampon kullanılsın; bu Apple onay süresi vaadi değildir. [Featuring ölçütleri](https://developer.apple.com/app-store/getting-featured/), [Nomination takvimi](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/)
- 16 Ekim’de daha önceki salt okunur kontrolde eski nomination App Launch olarak, 14 Ekim hedef tarihiyle Submitted görünüyordu; son güncelleme 12 Ekim’di. Bu tarih ilk gönderim tarihi değildir ve seçilmeme nedeni çıkarılamaz. “Submitted” ekranından editör reddi sonucu da çıkarılamaz.
- Aynı kontroldeki yardımcı metin başlangıcında “1TradeUp” yazımı ve boş ek bağlantılar yeni hazırlıkta iyileştirilebilir. iPhone/iPad kutuları gerçek destekle eşleştirilmelidir.
- Mevcut 1.1.2 incelemesine bu plan için dokunulmaz. Daha sonra hazır prototip ve gerçekçi tarih oluşunca yeni güncelleme nomination’ı hazırlanır; bugün sırf sıra kazanmak için bitmemiş build gönderilmez.
- Editörlerden yanıt gelmezse oyuncu için değerli sürüm süresiz bekletilmez. Seçilme olmadan da mevcut oyunculara teslim edilmeye değer olmalıdır.

## 16. Riskler ve karar kapıları

| Risk | Önlem | Kimin kararı / ne zaman? |
| --- | --- | --- |
| Rekabet ana oyunu bozuyor | Katılım isteğe bağlı; çekirdek bitiş değişmez; ayrı koşu gerekirse önce prototip | Ürün sahibi + prototip sonrası |
| Ücretli haklar karşılaştırmayı etkiliyor | Video/NoAds fırsat farkı ölçümü; eşit kuralsız “adil yarış” iddiası yok | Global liste açılmadan |
| Eski kariyerler dışlanmış hissi | Yerel kayıt/final korunur; doğrulama sınırlılığı açık; reset zorunlu değil | Veri modeli tasarımında |
| Backend maliyeti/tacizi | Sunucu doğrulama, hız sınırı, önbellek, bütçe ve operasyon planı | Ücretli servis kurulmadan |
| App Review tekrar gizlilik sorunu | Gerçek veri envanteri, gerekirse hesap silme, doğru metadata, eski ATT’yi geri getirmeme | Native beta sonrası |
| Cila görünmez kalıyor | Önce/sonra aynı cihaz/tema/kayıt karşılaştırması; oyuncuya fark testi | A ve C sonunda |
| İlk final tarihçesi değişiyor | Değişmez ilk ev snapshot’ı ve migration testleri | B’nin kabul şartı |
| Fazla özellik nedeniyle aylarca bitmiyor | A+B+C+F çekirdek dondurma; E bağımsız kapı | Her paket sonunda |

## 17. Başlangıç kararı ve sınırlar

Benim önerdiğim sonraki uygulama sırası: **A okunaklılık → B kişisel ilk ev → C profil/paylaşım → D sıralama prototipi → F çekirdek doğrulama/sunum**. D güçlü sonuç verirse E ayrıca takvime alınır. Yeni ürün eklemek veya mevcut oyunu yeniden tasarlamak bu sıranın önüne geçmez.

Başlangıçtan önce yalnız gerçekten önemli kararlar: global listenin işletim bütçesi; gerekirse ayrı eşit koşullu denemeye istek; “3+3”ün mevcut altı mı yeni altı mı olduğu. Bu belgeyi hazırlamak için bunların yanıtı beklenmedi; hiçbiri kendiliğinden satın alma/kurulum/yayın yetkisi sayılmadı.

Başarı tanımımız: **Oyuncu rahatça anlasın, ticaretten keyif alsın, evini aldığında tatmin olsun ve isterse bunu paylaşsın.** Bir kez güzelce bitirilen oyun başarısız değildir.

## 18. Kaynak ve inceleme izi

Çevrimiçi kaynaklar 16 Ekim 2026’da incelendi. Bağlantılı resmi belgeler değişebilir; uygulama ve yayın öncesinde ilgili kurallar yeniden doğrulanmalıdır.

- Tasarım/featuring: [Apple tasarım ipuçları](https://developer.apple.com/design/tips/), [erişilebilirlik](https://developer.apple.com/design/human-interface-guidelines/accessibility), [getting featured](https://developer.apple.com/app-store/getting-featured/), [nomination iş akışı](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/).
- Rekabet/güvenlik: [leaderboard özellikleri](https://developer.apple.com/help/app-store-connect/reference/game-center/leaderboards/), [Game Center testi](https://developer.apple.com/help/app-store-connect/configure-game-center/overview-of-testing-game-center/), [App Attest](https://developer.apple.com/documentation/DeviceCheck/establishing-your-app-s-integrity), [Firebase App Check](https://firebase.google.com/docs/app-check).
- Veri/operasyon: [hesap silme](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion), [Firestore ücretlendirme](https://firebase.google.com/docs/firestore/pricing).
- Tür karşılaştırması: [Dealer’s Life geliştirici açıklaması](https://www.abyteentertainment.com/dealers-life/), [Bid Wars ürün açıklaması](https://apps.apple.com/it/app/bid-wars-storage-auctions/id1023494154). Kullanıcı yorumları veya mağaza puanları karşılaştırmanın kanıtı olarak kullanılmadı.
- Kod incelemesi: `src/App.tsx`, `src/App.css`, `src/theme-surfaces.css`, `src/content/avatars.ts`, `src/content/homes.ts`, `src/ui/AvatarPortrait.tsx`, `src/ui/HomeFinale.tsx`, `src/ui/SettingsPanel.tsx`, `src/ui/JourneyPanel.tsx`, `src/ui/journeyPresentation.ts`, `src/domain/economy.ts`, `src/domain/meta.ts`, `src/domain/models.ts`, `src/domain/config.ts`, `src/domain/profile.ts`, `src/domain/homePerks.ts`, `src/services/persistence.ts`, `src/infrastructure/replayDiagnostics.ts`, `src/infrastructure/firebaseAnalytics.ts`, `src/analysis/careerSimulation.ts`, `src/analysis/careerSimulation.test.ts`, `vite.config.ts`, `package.json`.
- Geçmiş kararlar: `AGENTS.md`, `docs/TRADEUP_MASTER_GDD_v2.2.md`, `docs/FINAL_FIX_2026-10-14.md`, `docs/COMPACT_REFRESH_2026-10-16.md`, `docs/ECONOMY_SIMULATION_3M.md`. Öneriler kullanıcının GDD sınırlarını kaldıran son talimatına göre değerlendirilmiştir.

Bu tur OmniRoute kullanım sayısı: **0**. Mimari, ekonomi, güvenlik ve son tasarım kararları birincil incelemeyle yapıldı. Yeni kurulum, asset üretimi, derleme, deploy veya Apple değişikliği yapılmadı.
