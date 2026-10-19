# İlk Evim + Game Center — onaylı kapsam revizyonu

18 Ekim 2026. Kullanıcı önerilerin uygulanmasını ve Top 100'ün kendi bulutumuz yerine Game Center ile kurulmasını onayladı. Bu belge eski şartnamenin K06–K14, 9–15 ve P06–P09 sunucu/ikinci kariyer kararlarının yerine geçer. Eski belge tarihsel tasarımdır; Cloud Run, Firestore, App Attest, SSV sunucusu, ikinci kariyer veya ücretli hizmet kurulmaz. Main ve mevcut Apple başvurusu korunur; bu onay push/build servisi/yayın yetkisi değildir.

## Kesin kararlar

- Mevcut kariyer korunur; sıfırlama veya zorunlu tekrar yok. Game Center yalnız iOS'ta, kullanıcının açık bağlanma ve skor gönderme eylemleriyle çalışır. Ana oyun bağlantısız oynanır.
- İki ana liste ve bir filtre: En Zenginler (yüksek iyi), İlk 100 Ticarette Net Kâr (yüksek iyi), İlk Ev Bütçesine Ticaret (düşük iyi). Sonuncu ilk 375.000.000 kuruş nakde ulaşma sayacıdır. Hediye defter ticaret/kâr sayılmaz; zarar ve tüm maliyetler dahildir.
- Servet: mevcut kanonik netWorthMinor + yalnız şu anda sahip olunan evin sabit alış değeri. Satılan ürün, ilan fiyatı veya geçmişte bırakılmış ev ayrıca eklenmez. Bu değer yerel ekonomi hesabıdır, sunucu doğrulaması değildir. Game Center en iyi sonucu saklar; başlık/kurallar bunun kariyer zirvesi olduğunu açıklar.
- Skorlar kuruş olarak tam sayı; signed 64-bit ve JS güvenli tam sayı sınırı korunur. Eksik journal, uzlaşmayan nakit/maliyet, sandbox save ve geçersiz sayı gönderilmez. Native köprü yalnız üç sabit board ID'sini kabul eder. Bu kontroller modifiye istemciye karşı sunucu güvenliği sağlamaz.
- Game Center takma adı listede görünür; yerel profil adı, e-posta, tam save veya avatar dosyası yüklenmez. Kimlik ve liste barındırması Apple'dadır. Ücretsiz/ücretli kozmetik sıralama erişimini değiştirmez.
- Top 100, GameKit global/allTime range 1–100; kendi sırası ayrıca. Boş listeye bot eklenmez. Gönderim iptali, hesap değişimi, network/hazır olmayan board hatası oyun kaydını etkilemez. Hesap yeniden kontrol edilir; bir önceki hesap verisi yeni hesap adına gösterilmez.
- Ekonomi katsayıları/fiyatlar bu blokta değiştirilmez. Yüksek kâr dağılımı ayrı ölçüm kapısıdır; önceki %32 örnek tek başına hata sayılmaz.
- Evler mevcut keşif/fiyatlarla Pazar/Emlak'a taşınır; Tümü'nde en fazla bir ev. Evim, Yolculuk'ta kalıcıdır; ilk ev anısı ayrı kalır. Yeni 3D/kira/satış ekonomisi yok.
- Ödüllü reklam izin sonrası tek slotta ön yüklenir. Yanlış placement, eski izin, 1 saatlik son kullanım ve eşzamanlı slot korunur; yeni ödül/yerleşim/sıklık yok.
- İlk ev paylaşımı cihazda üretilir, isim varsayılan kapalı; ağır asset üretimi ve paylaşım sunucusu yok.
- Paylaşım uygulama kararı: yeni Share/Filesystem bağımlılığı yerine mevcut yerel köprüden UIKit `UIActivityViewController` + bellekte UIImage kullanılır. PNG önizleme cihazda; uygulama cache dosyası veya dosya zamanı API'si kullanılmadığından cache temizliği/Filesystem manifest gerekçesi eklenmez. Web Share ve açık indirme korunur. Eski şartnamenin bu iki bağımlılığı zorunlu tutan kısmı bu sadeleştirmeyle değiştirilmiştir.

## Apple hazırlığı — kodlamadan ayrı doğrulama kapısı

App ID com.tradeup.zerotohome için Game Center capability + uygun yeni provisioning profile gerekir. App Store Connect'te classic/all-time, Best Score ile aşağıdaki listeler ve TR/EN açıklamaları oluşturulup sürüme bağlanmalıdır:

| ID | Sıra | Birim |
| --- | --- | --- |
| tradeup.wealth.v1 | Descending | kuruş |
| tradeup.profit100.v1 | Descending | kuruş; negatif mümkün |
| tradeup.homebudget.v1 | Ascending | tamamlanan piyasa ticareti |

Live board kaydı, imza, sandbox skorları, hesap değiştirme ve fiziksel iPhone/iPad sunumu Windows birim testleriyle doğrulanmış sayılmaz. Test skorlarıyla production geliri/skoru oluşturulmaz. Privacy beyanı Game Center kimliği + oyun içeriğinin işlevsel kullanımına göre gözden geçirilir; ATT/IDFA eklenmez. Paylaşım, VoiceOver ve %200 metin release kapısıdır.

## Uygulama sırası

1. Saf skor hesabı/testleri ve native GameKit köprüsü; isteğe bağlı Top 100 paneli.
2. Mevcut evleri Pazar'a taşıma, Evim ve ilk anının korunması.
3. Tek ödüllü reklam ön yükleme ve callback regresyonları.
4. Yerel başarı kartı, UI/erişilebilirlik; tam test/lint/production build.
5. Apple kayıtları + fiziksel test + son mağaza görselleri. Ayrı yetki olmadan yükleme/yayın yok.

Resmi dayanak: [GameKit leaderboards](https://developer.apple.com/documentation/gamekit/encourage-progress-and-competition-with-leaderboards), [Capacitor yerel köprü](https://capacitorjs.com/docs/ios/custom-code), [Apple liste ayarları](https://developer.apple.com/help/app-store-connect/configure-game-center/manage-leaderboards/). Plan uygulama/cihaz testi makbuzu değildir.
