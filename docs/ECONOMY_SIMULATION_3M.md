# TradeUp ₺3 Milyon ve Ev Hedefi Simülasyonu

Tarih: 19 Eylül 2026
Katalog: 213 oynanabilir ürün ailesi (sonraki sürüm; App Review'daki build'e dahil değil)

Emlak araştırma eşiği: ₺3.500.000

Ev fiyatları: ₺3.750.000–₺7.250.000

![Servet ilerledikçe arka planın altınlaşma eşikleri](./assets/career-gold-progression.svg)

## Yöntem

Bu rapor `src/analysis/careerSimulation.ts` içindeki tekrarlanabilir denge probundan üretildi. Aynı tohum her zaman aynı sonucu verir. 100 farklı piyasa tohumu çalıştırıldı.

Model, dikkatli ama kusursuz olmayan bir oyuncuyu temsil eder:

- Başlangıç nakdi ₺420'dir.
- Oyuncu yalnızca ekranda gösterilen ihtiyatlı fiyat tahmini alış fiyatından en az %3 yüksekse ürünü alır.
- Bilgi seviyesi her altı tamamlanmış ticarette kademeli artar ve 10. seviyede durur.
- Satış sonucu, mevcut alıcı teklif motorunun olağan değer bandında deterministik olarak örneklenir.
- Tek seferde tek alış-satış tamamlanır; ücretsiz para, reklam ödülü, gizli gerçek değer avantajı veya ekonomi dışı bonus kullanılmaz.
- Sonuçlar bekleme süresi değil, tamamlanan ticaret sayısıdır. Gerçek takvim süresi oyuncunun satışları ne sıklıkla takip ettiğine bağlıdır.

## Sonuç

| Nokta                         |               Medyan ticaret | Arka plan altını |
| ----------------------------- | ---------------------------: | ---------------: |
| ₺5.000                        |                           12 |               %5 |
| ₺875.000                      |                          153 |              %22 |
| ₺1.750.000                    |                          195 |              %42 |
| ₺2.625.000                    |                          227 |              %65 |
| ₺3.000.000                    |                          241 |            %77,1 |
| ₺3.150.000                    |                          246 |              %82 |
| ₺3.500.000, ev araması açılır |                          260 |              %92 |
| Ev satın alındı               | seçilen evin nakit bedelinde |             %100 |

100 koşuda ev hedefi için tamamlanan ticaret sayısı:

- Hızlı koşu (yüzde 10): 222 ticaret
- Medyan koşu: 260 ticaret
- Yavaş koşu (yüzde 90): 285 ticaret
- Medyan koşuda fırsat bulmak için 28 piyasa yenilemesi

## Denge yorumu

₺3 milyon medyanda 241 ticarette, ₺3,5 milyonluk emlak arama eşiği ise 260 ticarette erişiliyor. Bu eşik ev satın alımı değildir; en ucuz ev ₺3,75 milyon, en pahalı ev ₺7,25 milyondur. Son bölümde yüksek bütçeli ürünlerin tek ticarette daha büyük mutlak kâr üretmesi nedeniyle bazı eşikler aynı ticarette aşılabiliyor.

Bu sonuç uzun süreli mobil simülasyon için beta sırasında ölçülecek hedeftir. Oyuncu oturum başına ortalama 3–5 başarılı ticaret bitirirse emlak araştırması medyanda yaklaşık 52–87 aktif oturuma karşılık gelir. Seçilen evin gerçek satın alma süresi bunun üzerindedir. Beta testinde ilk izlenecek ölçüler; ilk ₺5.000'e ulaşma, ₺875.000'e ulaşma, kârlı ticaret başına süre ve oyuncunun hangi servet basamağında ayrıldığı olmalıdır.

Yeni 24 ürün; 7 başlangıç, 7 orta ve 10 son oyun ailesiyle çeşitlilik sağlar. Simülasyon bir denge ölçüm aracıdır, canlı oyun kuralı değildir ve fiyat motorunu değiştirmez. Tablodaki her ara eşik aynı 100 tohumluk örnekten hesaplanır ve otomatik testte birebir korunur.

Önceki 189 ürünlü sürümün medyanı 255 ticaretti; yeni katalogda 260 ticaret ölçülür. Bu küçük yavaşlama beta analizinde özellikle izlenmelidir.
