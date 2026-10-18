# TradeUp 1.2 — yüksek kâr ve pazarda ev ilanları

18 Ekim 2026 · **Onay bekleyen öneri. Kodlama yetkisi değildir.**

Kullanıcı önce plan, açık onaydan sonra kod istedi. Bu belge 1.2 şartnamesinin mevcut ekonomi değiştirmeme ve Yolculuk'tan ev alma kararlarına önerilen değişikliktir; onay olmadan mevcut şartname/GDD veya çalışan davranış değiştirilmez. Reklam ön yükleme işi önceki onaylı kapsamda kalır. Bu tur oyun kodu, build, mağaza kaydı, fiyat veya oyuncu verisi değiştirilmedi.

## 1. Fotoğrafın değerlendirmesi

- Üst Sınıf Sedan: toplam harcama ₺1.251.480; alıcı teklifi ₺1.654.590; fark ₺403.110. Maliyete göre yaklaşık %32,21 potansiyel getiri. ₺1.905.370 ilan fiyatı gerçekleşmiş gelir değildir. Kabul edilmemiş teklif gerçekleşmiş kâr değildir.
- Üstteki küçük ürün: ₺4.334 maliyet, ₺4.440 teklif, ₺106 fark; yaklaşık %2,45 getiri. Mutlak tutar tek başına denge ölçüsü değildir.
- Kodda alıcı tutarı gerçek ürün değeri, kondisyon, talep, persona ve pazar etkisinden gelir; oyuncunun maliyetine sabit kâr eklenmez. Satıcı iskonto/pazarlık tabanlarıyla %32 fırsatı mümkündür. Bu, tek başına muhasebe hatası kanıtı değildir.
- Fotoğraftaki %1 ilgi ve 42 oyun dakikası sonuca bağlanmaz: 42 dakika mevcut teklifin karar penceresidir, alıcıyı bekleme süresi değildir. Bir görüntü yüksek getirinin ne sıklıkta oluştuğunu veya tüm kariyer temposunu kanıtlamaz.
- Görüş: nadir yüksek kâr keşfi korunmalı; yüksek bedelli ürünlerde tekrarlanabilir olağanüstü iskonto ev hedefini rutin birkaç satışa indiriyorsa hedefli düzeltme gerekir. İlk oyun zorluğu veya bekleme süreleri artırılarak telafi edilmez.

## 2. Denge yaklaşımı — öneri

Onaydan sonra ilk adım mevcut sürümün maliyet/satış dağılımını sabit seed'lerle karşılaştırmalı ölçmektir. Erken, orta ve ileri aşama; normal/acele/riskli satıcı; düz satış/pazarlık/hazırlık ve araç dışı karşılaştırmalar kapsanır. İki örnek üzerinden yeni yüzde sabitleri seçilmez.

Rapor: maliyet dahil kâr yüzdesi ve tutarı; medyan/üst dilim; %25 ve %30 üzeri tamamlanan satışların oranı; zarar payı; sermayenin bağlı kaldığı süre; ilk ₺3,75 milyon nakit ve gerçek ilk ev alışına kadar ticaret/aktif süre. İlan fiyatı, kabul edilmemiş teklif ve hediye defter ayrı tutulur. Bunlar test/yerel ölçümdür; yeni üretim telemetrisi değildir.

Tasarım kararı: **oyuncunun kârına sert tavan yok**. Sorun doğrulanırsa düzeltme kaynağında, yüksek bedelli ürünlerin olağan satıcı iskonto/pazarlık dağılımında yapılır; alıcının oyuncunun alış fiyatına bakarak onu cezalandırması yok. Nadir gerçek fırsat korunur. Kategorilerin tamamına katsayı indirimi, ev fiyatı artışı, yeni masraf ve teklif yavaşlatma kapsam dışıdır.

Sayısal denge değişikliği için kapı: ölçüm bulgusu ve tam önerilen eski/yeni değerler kullanıcıya sunulur; ayrıca onay gelmeden katsayı değiştirilmez. Dağılım zaten kabul edilebilirse denge değişikliği yapılmaz. Eski para, tamamlanmış satış, aktif sahip olunan ürün maliyeti ve ilk ev anısı yeniden yazılmaz.

## 3. Ev ilanları Pazar'a taşınsın — kesin önerilen akış

1. Dört ana sekme korunur. Satın alma noktası **Pazar** olur; Profil/Ayarlar veya Yolculuk'ta ikinci bir satın alma yolu kalmaz. Yolculuk yalnız hedefi, araştırma durumunu ve sahipliği anlatır.
2. Mevcut beş ev ve fiyatları korunur: Bahçeli Başlangıç Evi ₺3.750.000; Şehir Rezidans Dairesi ₺4.150.000; Teraslı Dubleks ₺4.750.000; Taş Avlulu Ev ₺5.600.000; Sahil Yamaç Villası ₺7.250.000.
3. Mevcut kilit açma, araştırma başlangıcı ve oyun zamanı beklemesi korunur. Açılan evler **Emlak** filtresinde ilan olur. Tümü akışında en fazla bir uygun ev kartı yer alır; Emlak'ta keşfedilmiş satın alınabilir seçenekler görülebilir. Yeni ev kartı normal ürün yenileme kontenjanını tüketmez.
4. Tümü'ndeki önerilen kart, keşfedilmiş üst seçenekler arasında nakdin yettiği en düşük fiyatlı ev; hiçbirine yetmiyorsa en yakın alt hedef olan en düşük fiyatlı evdir. Daha pahalı seçenekler Emlak'ta kaybolmaz. Aynı ev birden çok kopya ilan olmaz.
5. Ev kartı: mevcut ev görseli, konum, ev adı, tam fiyat ve Emlak etiketi. Dokununca büyük görsel, kısa özellikler, fiyat ve nakit eksiği/gerçek satın alma onayı. Normal ürüne ait kondisyon, satıcı kişiliği, pazarlık hakkı veya kâr tahmini eve uygulanmaz.
6. Keşfedilmiş ev ilanı yenileme ile yok olmaz, süresi dolmaz; sonraki evin araştırma sayacı sıfırlanmaz. Daha çok reklam/yenileme yapmak ev bulmayı rastgele hızlandırmaz. Nakit yetersizliği ilanı gizlemez; eksiği açıkça gösterir.
7. Mevcut tek ev/yükseltme modeli korunur: yalnız daha pahalı eve yükseltme, mevcut kanonik alış muhasebesi. Yeni takas bedeli, eski evi satma, çoklu emlak portföyü veya kira geliri eklenmez. Alınan ev satış listesinden çıkar; daha üst evler isteğe bağlı kalır.

## 4. Alınan ev kaybolmasın — Evim

- Yolculuk'un üst kısmında kalıcı **Evim** kartı: güncel evin büyük mevcut görseli, adı, konumu ve "Sahipsin" durumu. Ev hedefi/üst ev önerisi bu kartın yerine geçmez.
- "Evimi görüntüle" mevcut modal düzeninde büyük görseli ve ev bilgisini açar. Telefonu kapat/aç veya güncelleme sonrası aynı eve erişilir. Bu, etkileşimli 3D iç mekân veya ev gezme oyunu değildir.
- Portföy'de küçük bir Evim kısayolu aynı görünümü açar; dördüncü envanter segmenti veya beşinci ana sekme eklenmez. Ev normal satılabilir ürün gibi sunulmaz.
- İlk ev alışında kişisel final açılır; "İlk ev anım" güncel Evim'den ayrı kalır. Sonraki yükseltme güncel ev görselini değiştirir ama ilk evin sabit ticaret/kâr kaydını değiştirmez.
- Mevcut ücretsiz görünüm ve ev stili sahiplikleri korunur; bu düzeltme yeni ücretli ev görünümü satmaz veya sahip olunan paketi kilitlemez. Yeni raster/asset üretimi gerekmez.

## 5. Onay sonrası sıra ve kabul kapıları

1. Mevcut dengeyi ölç ve raporla; sayısal ayar gerekiyorsa değerleri ayrı onaya sun.
2. Mevcut ev ilanlarını Pazar/Emlak'a taşı; tek satın alma yolunu kanonik servise bağla.
3. Kalıcı Evim, Portföy kısayolu ve ilk ev anısı ayrımını uygula.
4. Eski evli/evsiz kayıt, araştırma sürerken güncelleme, yetersiz nakit, çift dokunuş, aynı işlem tekrarı, kayıt hatası, yenilemede ilan sürekliliği, ev yükseltme ve ilk anının değişmezliği testleri.
5. 320–430 px, büyük yazı, dört tema, mevcut beş ev görseli ve native geri/odak testleri. Kayıp görsel satın almayı kilitlemez.
6. Ekonomi/migration/monetizasyon regresyonu, test/lint/TypeScript/build; fiziksel cihaz kontrolü. Uygulanan değişiklikler 1.2 geliştirme dalında kalır. Push, merge, ücretli build veya Apple gönderimi bu planla yetkilendirilmez.

**Şu an:** yalnız öneri. Uygulama yok. İlk ev fiyatı/tempo değiştirilmedi; global Top100 hâlâ ayrı 1.3 kapsamıdır.
