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

## Ödüllü bağlantının yeniden kontrolü

Kullanıcının ek isteği üzerine `claimReward("MARKET_SCOUT")` → gerçek AdMob
adapter'ı → domain ödül işlemi birlikte sınandı. Yalnız native SDK sınırı mock;
gerçek reklam trafiği oluşturulmadı. İstek iOS ödüllü birimi
`ca-app-pub-4229088811556918/4710266110`, `npa: true` ve yayın yapılandırmasında
`isTesting: false` kullanır. Gösterimin başlaması ödül değildir. SDK ödül callback'i
veya geçerli ödül sonucu hak verir; yinelenen callback ikinci ödül vermez.
Erken kapatma ve no-fill hak vermez, busy kilidini bırakır, nakdi değiştirmez.
Başarı bildirimi artık genel hızlandırma mesajı yerine güncel hak/kapasiteyi söyler.

- **473 birim testi**, lint, TypeScript ve production web build başarılı.
- Yayın build'i `VITE_ADMOB_PRODUCTION_ENABLED=true`, test bayrağı `false` ile alındı.
- Demo reklam kimliği kontrolü ve ATT'siz native gizlilik kontrolü başarılı.
- 320/390/430 px kompakt düğme ve büyük yazı tarayıcı senaryoları tekrar sınandı.
  İlk turda üç genişlik geçti; build ile çakışan son senaryo Ayarlar yüklemesinde
  zaman aşımına uğradı. Sabit build üzerinde tek başına yeniden çalıştırıldı ve geçti.
- Apple'a/TestFlight'a yükleme, inceleme, merge veya production site yayını yapılmadı.
  Yeni IPA üretilmedi; sonraki native release derlemesi bu dalı kaynak almalıdır.
  Canlı dolum/UMP hesap yapılandırması için fiziksel cihaz doğrulaması hâlâ gerekir.
