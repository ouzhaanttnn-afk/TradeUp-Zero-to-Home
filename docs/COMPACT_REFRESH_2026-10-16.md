# Kompakt pazar yenileme — 16 Ekim 2026

Kullanıcının güncel isteği: ayrı reklam satırı yok. Aynı yenileme düğmesi hak
**0** olduğunda **Reklam izle +25**, hak geldiğinde tekrar **Yenile + sayaç**
gösterir. Sıfırın üstünde reklam CTA'sı gösterilmez. Doğal +1 dolum sayacı korunur.
Premium/Reklamsız oyuncu aynı alanda videosuz **+25 yenileme** kullanır.

## Eksik düğme davranışı

Build 45'te ayrı CTA, `consent.canRequestAds` false ise hiç çizilmiyordu. Ekran
görüntüsünde 0/50 ve pasif Yenile var. Yeni kod sağlayıcının varlığını izin
sonucundan ayırır: native reklam sağlayıcısı varsa sıfırdaki düğme kaybolmaz.
Açık kullanıcı dokunuşuyla güncel UMP/başlatma denemesi yapılır. Başarısız veya
izin vermeyen sonuçta reklam/ödül başlatılmaz; açıklama gösterilir ve tekrar
denenebilir. Aynı anda iki dokunuş tek akışa indirgenir. Güncel oyun durumu korunur.
Diğer yerleşimlerin kuralları, kapasite, doğal dolum ve ekonomi değiştirilmez.

Bu, telefondaki ilk UMP isteğinin neden başarısız olduğunu kanıtlamaz. Gerçek
cihaz SDK günlüğü/AdMob mesaj durumu ayrıca incelenmeden hesap yapılandırmasının
ve canlı reklam dolumunun düzeldiği iddia edilmez. Web'de native sağlayıcı yoksa
aynı düğme açık mobil-uygulama açıklamasıyla devre dışıdır; sahte reklam oynatılmaz.

## Doğrulama ve teslim

- 71 dosya / **469 birim testi** başarılı. İzin yenileme, ret/hata, çift dokunma,
  erken video kapatma, Premium/Reklamsız ve geç dönen işlem testleri dahil.
- Lint, TypeScript ve production web build başarılı. SDK/bağımlılık eklenmedi.
- **4 tarayıcı senaryosu** başarılı: üç mobil genişlikte 0→25→0→25 geçişi,
  ayrı satır bulunmaması, tek 44 px dokunma alanı ve doğal sayaç kontrolü.
- Sıfır-hak senaryosu ayrıca büyük yazıda 320/390/430 px sınır denetimleriyle
  tekrar geçti. Görseller `release-artifacts/compact-scout-large-*.png`.
- Birim testleri mock native sağlayıcı kullanır; gerçek reklam trafiği veya yeni
  fiziksel iPhone testi yapılmadı. Tarayıcı testi kendi preview işlemini kapattı.
- Dal: `codex/compact-scout-refresh`. Main/production web ve Apple değiştirilmez.
  Yeni native build, TestFlight yüklemesi veya inceleme gönderimi yapılmadı.
  App Store'daki **1.1.1 (45)** bu kaynak değişikliğiyle kendiliğinden güncellenmez.

Ponytail yaklaşımıyla mevcut düğme/altın varyantı yeniden kullanıldı; ayrı CTA
ve CSS kaldırıldı. Doğrulama becerisiyle UI→store→izin→ödül sınırları ayrı
kontrol edildi; canlı reklam/cihaz doğrulamasıyla karıştırılmadı. Omni kullanılmadı.
