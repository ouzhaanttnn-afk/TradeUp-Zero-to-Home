# TradeUp ₺3 Milyon ve Ev Hedefi Simülasyonu

Tarih: 8 Eylül 2026  
Katalog: 153 oynanabilir ürün ailesi
Ev fiyatı: ₺3.500.000

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

| Nokta                     |          Medyan ticaret | Arka plan altını |
| ------------------------- | ----------------------: | ---------------: |
| ₺5.000                    |                      12 |               %5 |
| ₺875.000                  |                     318 |              %22 |
| ₺1.750.000                |                     458 |              %42 |
| ₺2.625.000                |                     528 |              %65 |
| ₺3.000.000                |                     561 |            %77,1 |
| ₺3.150.000                |                     573 |              %82 |
| ₺3.500.000, ev alınabilir |                     602 |              %92 |
| Ev satın alındı           | 602 + satın alma kararı |             %100 |

100 koşuda ev hedefi için tamamlanan ticaret sayısı:

- Hızlı koşu (yüzde 10): 514 ticaret
- Medyan koşu: 602 ticaret
- Yavaş koşu (yüzde 90): 661 ticaret
- Medyan koşuda fırsat bulmak için 33 piyasa yenilemesi

## Denge yorumu

₺3 milyon medyanda 561 ticarette, ₺3,5 milyonluk ev ise 602 ticarette erişiliyor. Son bölümde yüksek bütçeli ürünlerin tek ticarette daha büyük mutlak kâr üretmesi nedeniyle bazı eşikler aynı ticarette aşılabiliyor.

Bu sonuç kısa bir oyun için yüksek, uzun süreli bir mobil simülasyon için ise ölçülmesi gereken bir beta hedefidir. Oyuncu oturum başına ortalama 3–5 başarılı ticaret bitirirse medyan ev yolculuğu yaklaşık 120–201 aktif oturuma karşılık gelir. Beta testinde ilk izlenecek ölçüler; ilk ₺5.000'e ulaşma, ₺875.000'e ulaşma, kârlı ticaret başına süre ve oyuncunun hangi servet basamağında ayrıldığı olmalıdır.

Yeni 32 ürün başlangıç ve orta seviyede çeşitlilik sağlar; araç basamağını erkene çekmez. Bu nedenle içerik artışı tek başına ev hedefini yapay olarak kolaylaştırmaz. Simülasyon bir denge ölçüm aracıdır, canlı oyun kuralı değildir ve fiyat motorunu değiştirmez. Tablodaki her ara eşik artık aynı 100 tohumluk örnekten hesaplanır ve otomatik testte birebir korunur.

Eklenen 16 üst-orta ürün yalnızca 3. seviyede açılır. Önceki kataloğa göre medyan ev yolculuğunu 662'den 602 ticarete indirmiştir; bu yaklaşık %9 hızlanma beta analizinde özellikle izlenmelidir.
