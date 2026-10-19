# TradeUp — Game Center hazırlık makbuzu

19 Ekim 2026. Kullanıcının Game Center barındırmalı sıralama kurulumu isteği kapsamında yalnız TradeUp için App Store Connect API kullanıldı. Anahtar içeriği/JWT dosyaya veya repoya yazılmadı. Mevcut App Review başvurusu, build, fiyat, diğer uygulamalar ve nomination değiştirilmedi. Hiçbir skor gönderilmedi.

## Oluşturulan kayıtlar

- App: `6811362281`, bundle: `com.tradeup.zerotohome` (`798PKN44L9`).
- Game Center detail: `88c37812-c465-4f06-8922-1e3e68b919e2`.
- Game Center capability: `798PKN44L9_GAME_CENTER` (201 Created). Önce yalnız IAP vardı; IAP korunur.

| Oyun kimliği | Apple kaynak kimliği | Ayar |
| --- | --- | --- |
| tradeup.wealth.v1 | f72f0218-ea5a-4c27-bbd5-f7d6a51b6fa3 | BEST_SCORE, DESC, 2 ondalık |
| tradeup.profit100.v1 | e5826926-bb1a-4656-be33-4dbfeef16b1b | BEST_SCORE, DESC, 2 ondalık; negatif destekli |
| tradeup.homebudget.v1 | dfefa782-32b7-4083-a0de-e66e67f8d51f | BEST_SCORE, ASC, tam ticaret |

Her üç listede `tr` ve `en-US` başlık/açıklama oluşturuldu (6 localization). Para skorları kuruş olarak gönderilir; Apple formatter iki ondalık ve ₺ son eki kullanır. Dönemsel sıfırlama yoktur. Para skor aralığı JS güvenli tam sayı sınırı, ticaret en az 1. Native köprü aynı üç kimlikle sınırlıdır.

Önemli API bulgusu: resmi DocC scoreRange alanlarını number gösterse de canlı API STRING ister; ilk leaderboard isteği 409 ile reddedildi ve kayıt oluşturmadı. Sonraki isteklerden önce mevcut kayıtlar okunarak tekrar/çift oluşturma engellendi; string tam sayılarla oluşturma başarılı oldu.

## Henüz yapılmadı — release kapıları

1. Yeni Game Center entitlement'ını içeren provisioning profile hazırlanması/seçilmesi. Eski profile güvenerek imzalı build hazır denmez. Sertifika silinmedi/iptal edilmedi; başka app profile'ına dokunulmadı.
2. macOS/Xcode üzerinde Swift derleme ve imzalı iOS build; Windows static test native derleme değildir.
3. Fiziksel cihaz ve sandbox Game Center giriş/iptal/hesap değiştirme, skor gönderme ve global ilk 100 + kendi sıra testi. Gerçek/sahte üretim skoru oluşturulmadı.
4. Yeni sürüm Game Center bağlantısı, gereken leaderboard metadata/görsel/review adımları ve App Privacy kontrolü. Bu tur App Review'a gönderilmedi veya yayına alınmadı.
5. Yerel `public/privacy.html` Game Center ve paylaşım davranışı için güncellendi; canlı site bu tur yayımlanmadı. İletişim `nostoscomp@gmail.com`.

Bu makbuz Apple kayıt hazırlığını kanıtlar; canlı sıralamanın dağıtıldığı veya Game Center'ın oyun kaydını buluta yedeklediği anlamına gelmez. Skorlar istemci raporludur; bağımsız sunucu hile doğrulaması yoktur.
