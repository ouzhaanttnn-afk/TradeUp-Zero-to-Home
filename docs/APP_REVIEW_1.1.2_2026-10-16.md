# TradeUp 1.1.2 (46) — 16 Ekim 2026

Kullanıcı yeni düzeltmenin Apple'a yüklenmesini ve incelemeye gönderilmesini
açıkça onayladı. Main'e merge veya otomatik mağaza yayını yapılmaz.

## Kaynak ve doğrulama

- Dal: `codex/compact-scout-refresh`.
- Derlenen commit: `92a6ccb5d9fcf5b7b9d04ae2af2b525212522e78`.
- Yerel birim testleri: **71 dosya / 473 test** başarılı; lint, TypeScript ve
  production web build başarılı. Sürüm değişikliğine ait 9 test ayrıca geçti.
- Bulutta aynı 473 test, lint, production build, iOS sync, ATT'siz native
  gizlilik kontrolü ve demo reklam kimliği kontrolü geçti.
- Aynı yenileme düğmesi sıfır hakta **Reklam izle +25**, hak geldiğinde normal
  yenileme sayacı gösterir. UMP açık dokunuşta yeniden denenir. SDK ödül sinyali
  olmadan hak verilmez; yinelenen sinyal ikinci ödül vermez. Premium/Reklamsız,
  doğal dolum ve 50→25 kapasite kuralları korunur.

## İmzalı IPA ve Apple yüklemesi

- Mevcut ücretsiz Codemagic M2 kotası kullanıldı; başlamadan önce 191/500 dakika
  kullanılmıştı. Tek native build, toplam **3m 41s**. Yeni abonelik açılmadı.
- [Codemagic build 6ad1b96f3ffd2c7f0ad3d2a4](https://codemagic.io/app/6ac0a97ff49075906ade5690/build/6ad1b96f3ffd2c7f0ad3d2a4).
- Apple yükleyici: **UPLOAD SUCCEEDED with no errors**.
- Apple build/delivery ID: `0b8e3404-76e5-491c-a66e-dda4327d73dc`.
- Apple: **VALID / APP_STORE_ELIGIBLE**, sürüm **1.1.2**, build **46**.
- Dosya: `C:/Users/Gaming/Desktop/TRADEUP/release-artifacts/TradeUp-1.1.2-46.ipa`.
- SHA-256: `8db1500acf302a9b6eeec7933e319ce911564584dc28c84ef91d0685c084dd4e`.
- Yerel IPA kontrolü: doğru bundle/sürüm/build, imza ve profil dosyaları,
  production reklamları **true**, test reklamları **false**, ATT açıklama anahtarı
  yok, Firebase analitik/IDFV/reklam izin varsayılanları kapalı. Bu yapısal kontrol
  yeni fiziksel cihaz reklam testi veya Google'ın dolum garantisi değildir.
- Yükleme kanıtı: `release-artifacts/testflight-46-upload-success.png`.

## App Review hazırlığı

- Yeni sürüm ID: `ec49ee51-d64b-4c0c-9d1a-44aa280785df`; build 46 bağlandı.
- Türkçe yenilikler ve inceleme notları kompakt reklam düğmesine göre güncellendi.
- Mevcut beş onaylı iPhone görseli korundu; altı satın alma ürünü **APPROVED**.
- İletişim **nostoscomp@gmail.com**; canlı gizlilik/destek sayfaları HTTP 200 ve
  aynı adresi içeriyor. Canlı `app-ads.txt` HTTP 200, doğru Google yayıncı kaydı var.
- Yayın **MANUAL**; yayımdaki 1.1.1 (45) kaldırılmadı. App Privacy değiştirilmedi.
- [Başvuru ef9bfe89-c501-4f84-b27b-dd755193d027](https://appstoreconnect.apple.com/apps/6811362281/distribution/reviewsubmissions/details/ef9bfe89-c501-4f84-b27b-dd755193d027)
  **16 Ekim 2026 16:54:11 (Europe/Istanbul)** tarihinde gönderildi. Apple'ın
  gönderim yanıtı HTTP 200, `state: WAITING_FOR_REVIEW`; tek öğe 1.1.2 sürümüdür.
- Apple tarayıcı oturumu kapandı; yeni kimlik bilgisi veya erişim oluşturulmadan
  mevcut yetkili API anahtarı kullanıldı. Geçici HTTP 500/zaman aşımlarından sonra
  her yazının sonucu kontrol edildi; boş taslak doğrulandıktan sonra öğe ekleme
  yeniden denendi ve başarıyla gönderildi. Çift başvuru/build oluşturulmadı.
- İnceleme bekliyor olmak Apple onayı veya mağazada yayımlanmış olmak değildir.

Omni kullanılmadı; yeni bağımlılık, asset veya tekrar native derleme yapılmadı.
