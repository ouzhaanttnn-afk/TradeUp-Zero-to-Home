# İlk Evim — uygulama ilerlemesi

17 Ekim 2026 · Dal: `codex/first-home-polish`

Bu dosya yapılmış işi izler; tasarımın yerine geçmez. Kapsam: `TRADEUP_1.2_IMPLEMENTATION_SPEC_2026-10-16.md`. Main, mevcut Apple incelemesi, reklam kuralları ve satın alma ürünleri değiştirilmedi.

## Bu blokta uygulananlar

### P01 — okunabilirlik ve yüzeyler

- Standart pazarda üç sütun, büyük metinde mevcut iki sütun korunur. Başlık 12 px, fiyat 15 px, bilgi rozeti 11 px; metin büyütme desteği devam eder.
- Ürün sahnesi 4:3, detay sahnesi 16:7; görsel `contain` ve iç boşlukla gösterilir. Koşul ve kısa ilgi metni ortak rozet satırında; özel ürün yıldızı aynı ilgi rozetindedir.
- Dört temanın ortak panel/yazı/çizgi renkleri uygulanır. Eski inline tema renklerinin yeni token'ları ezmesi giderildi. Durum renkleri ve ürün rasterları korunur.
- Bildirim iki satırlık sabit alan kullanır. Pazar hareketi kısa satırdan erişilebilir bilgi penceresine açılır; Escape/Android geri ve odak dönüşü mevcut modal altyapısını kullanır.
- Yenileme oku merkezinden 600 ms döner; azaltılmış harekette dönüş yapmaz. Ekonomi veya reklam sonucu değiştirilmedi.

### P02 — ilk ev anısı ve yerel rekorlar

- Save sürümü 21→22: yerel careerId ve ilk ev snapshot'ı. Mevcut nakit, journal, haklar ve tercihler korunur.
- Piyasa ticareti ve kârı kanonik journal'dan okunur. Hediye defter hariç; zarar ve masraflar dahil. 100. piyasa ticareti kârı ve ilk ₺3.750.000 nakit geçişi ayrı yerel sonuçlardır.
- Snapshot ilk HOME_PURCHASE işleminde oluşturulur. Sonraki satış veya ev yükseltmesi ilk evi/sonuçlarını değiştirmez. Eski kayıtta eksik kanıt PARTIAL'dır; geçmiş uydurulmaz.
- Ev anısı kalıcı yazma başarılı olunca açılır. Disk/kayıt hatası yeniden kayıt eylemi sunar; yeniden ev satın almaz.

### P03 — kişisel sunum

- İlk ev finali gerçek ev anısını, ticaret/kârı ve ilk/en iyi kârlı satışı gösterir. İki unvan aynı işlemdeyse tek ürün kartı vardır. Yolculuk'tan tekrar açılabilir.
- Rekorlarım kapalı başlayan yerel ayrıntıdır; global doğrulanmış skor iddiası veya sahte Top100 düğmesi yoktur.
- Kurucu rozeti Premium olarak adlandırıldı; sahiplik koşulu değişmedi.
- Mevcut üç ücretsiz ve üç ücretli avatar korunur. Avatar açılımı, taslak önizleme, Kullan/İptal ve kilitli avatardan gerçek mağazaya geçiş vardır. Liste portreleri statik kalır.
- Profil piyasa ticaretini ve en iyi satış kârını gösterir; yerel ad trim/boşluk birleştirme uygular, kontrol/satır ayırıcı karakterleri reddeder. Eski isimler migration sırasında yeniden yazılmaz.
- Mağazada Reklamsız ve Premium iki ana kart olarak görünür; sahiplikte tekrar satın alma sunulmaz. Tekil ürünler korunur. Tema ve ev stili ayrı kapalı açılımlardır. Native fiyat gelmezse tek yeniden yükleme eylemi vardır; sahte fiyat yoktur.
- Vitrin kapalı başlar. Kesin fair value gösteren eski sunum, mevcut kanıta bağlı tahmin aralığına çevrildi; domain muhasebesi değişmedi.

## Doğrulama

- 76 dosyada **495 birim testi geçti**. Journal uzlaşımı, masraflı/zararlı satış, 99/100/101 sınırı, snapshot değişmezliği, migration, kayıp SALE kanıtının PARTIAL sayılması, disk hatasından tekrar kayıt, Premium/Reklamsız ayrımı bu kapsama dahildir.
- `pnpm lint`, TypeScript ve `pnpm build` başarılı. Web çıktısı `dist/`; bu imzalı IPA veya Apple'a yüklenen yeni sürüm değildir.
- Mobil tarayıcı matrisinde 18 senaryo doğrulandı: 320/390/430 px, büyük metin, görsel fallback, yenileme/reklam alanı, azaltılmış hareket, dört tema, mağaza hakları, profil/ilk açılış ve ev anısı. Son kapsamlı tur 17 geçti / 1 odak hatası yakaladı. Kapalı `details` içindeki gizli kontrollerin odak sırasına girmesi ortak modal katmanında düzeltildi; profil/mağaza yeniden testi **2/2 geçti**. Avatar taslağı, İptal, Kullan ve üç kilitli portreden gerçek mağazaya geçiş bu tarayıcı testindedir.
- Son domain/görsel fallback düzeltmesinden sonra ilk ev satın al → kalıcı kayıt → final → kapat → yeniden aç → reload → yerel rekor akışı **1/1 tekrar geçti**. `node scripts/check-native-ad-privacy.mjs` de başarılı: ATT geri eklenmedi, UMP sırası ve ad-ID'siz Analytics ayarı korunuyor. Native çalıştırma veya StoreKit işlemi yapılmadı.
- Temel CSS ve JS teslim bütçeleri korunur; ağır panel/yeni ayrıntılar mevcut tembel yükleme yapısını kullanır. Yeni bağımlılık/asset üretimi veya arka plan servisi yoktur.

## Henüz tamamlanmayan kabul kapıları

- 18 Ekim kapsam eki / P03A: reklamın izin sonrası önceden hazırlanması, kompakt yükleme durumu ve fiziksel cihaz gecikme ölçümü henüz uygulanmadı. Kullanıcı bunu 1.2 büyük güncellemesine aldı; ayrı acil build istenmedi. 17 Ekim'deki AdMob izin mesajı/gizlilik URL düzeltmesi sunucu yapılandırmasıdır; ön yükleme kodu değildir. 1.2.0 (47) TestFlight betası bu eki içermez.
- P04: 1080×1350 PNG kartı, isim gizlilik seçimi, önizleme, web indirme/paylaşım ve native Share/Filesystem cache temizliği henüz uygulanmadı. Çalışmayan paylaş düğmesi gösterilmez.
- P05: tam release regresyonu, 375 px ve %200 metin/kontrast matrisi, fiziksel iPhone/iPad ve VoiceOver, gerçek StoreKit/geri yükleme kontrolü, gerçek build'den mağaza görselleri ve editoryal paket. Tarayıcı testleri fiziksel cihaz testi diye sunulmaz.
- 1.3 P06–P09: ikinci kariyer zarfı, komut/kanıt kuyruğu, Game Center/App Attest, sunucu doğrulama, global liste ve silme/operasyon işleri uygulanmadı. Bulut açılmadı ve yeni ücretli kaynak kurulmadı. Yerel rekorlar geriye dönük global doğrulanmışa çevrilmez.

Bu blok tam 1.2 release onayı değildir. Push, merge, dağıtım ve Apple başvurusu yapılmadı. OmniRoute kullanımı: **0 çağrı**. Ponytail yaklaşımı mevcut ekonomi, modal, persistence ve avatar altyapısını yeniden kullanmak; React kontrolü pahalı geçmiş hesaplarını memoize etmek ve ağır ekranları ayrı tutmak için uygulandı.
