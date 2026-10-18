# TradeUp 1.2 — İlk Evim / My First Home: nomination gönderimi

18 Ekim 2026 · Kullanıcı, büyük güncellemeyi anlatan nomination'ın dört hafta sonrası için doldurulup gönderilmesini açıkça istedi.

## Apple'da doğrulanan kayıt

- Uygulama: TradeUp: Zero to Home (`6811362281`).
- Başlık: TradeUp 1.2 - My First Home / Ilk Evim.
- Tür: `APP_ENHANCEMENTS`.
- Nomination ID: `1544e09a-6981-4969-bf68-77068c079070`.
- Durum: **SUBMITTED**; ayrı GET isteğiyle doğrulandı.
- Gönderim: 18 Ekim 2026, yaklaşık **20:19 Europe/Istanbul**.
- Hedef: **15 Kasım 2026 Pazar**; API tarih alanı `2026-11-15T09:00:00Z` (Türkiye 12:00). Bu nomination hedefidir, uygulamanın kesin yayın saati veya otomatik yayın ayarı değildir.
- Cihazlar: iPhone/iPad. Diller: Türkçe ve İngilizce.
- Önceki `APP_LAUNCH` başvurusu (`b68b21ef-11c6-442a-b317-aee75325d2a3`) değiştirilmedi; hâlâ Submitted.
- [App Store Connect nomination listesi](https://appstoreconnect.apple.com/apps/6811362281/distribution/nominations).

## Gönderilen anlatımın kapsamı

Yaklaşan büyük güncelleme: daha okunur ürün kartları ve büyük metin yerleşimi, tutarlı temalar ve kompakt pazar bilgisi; ilk ev, ticaret/kâr, ilk kârlı ve en iyi satıştan oluşan kişisel final/anı; isteğe bağlı cihazda üretilen paylaşım kartı; yerel rekorlar, avatar seçimi ve sade Reklamsız/Premium mağazası; reklam ön hazırlığıyla yükleme beklemesini azaltma.

Metin güncellemeyi tamamlanmış göstermiyor. Notlarda 1.2.0 geliştirme betasının TestFlight'ta olduğu; paylaşım, reklam ön yüklemesi ve son fiziksel cihaz QA'sının sürdüğü açık. Nihai görseller biten build'den hazırlanacak. Global Top100 ayrı sürüm olarak kapsam dışında bırakıldı; erişilebilirlik sertifikası veya garantili editoryal seçim iddiası yok. Onay bekleyen sayısal denge/ev ilanı önerisi uygulanmış gibi sunulmadı.

## Bu işlemde yapılmayanlar

Oyun kodu ve ekonomisi değiştirilmedi. Yeni build/IPA alınmadı, TestFlight yüklemesi veya App Review gönderimi yapılmadı. Mağaza görselleri değiştirilmedi. Mevcut sürümün yayın ayarı ve main dalı değiştirilmedi. Nomination uygulamayı yayımlamaz; Apple seçimi ve App Review sonucu garanti değildir.

API anahtarı yalnız kullanıcının belirttiği repo dışı yerel dosyadan belleğe okundu. Özel anahtar/JWT ekrana, repoya, bu belgeye veya istek payload'ına yazılmadı; anahtar yetkileri değiştirilmedi. Kod test/build turu gerektiren kaynak değişikliği yapılmadı. Doğrulama: taslak oluşturma 201, gönderme 200, son GET'te tür/tarih/durum/uygulama bağı ve eski kaydın korunması kontrol edildi.

## Sonraki teslim kapısı

Onaylı 1.2 işleri tamamlanır; yeni ev/denge önerisi için ayrıca plan onayı korunur. Cihaz ve paylaşım/reklam testlerinden sonra son build, güncel mağaza görselleri ve App Review hazırlanır. Yayın tarihi ayarı son release adımında ayrıca uygulanır; bugünkü nomination bunu zamanlamaz. Gecikme olursa nomination hedefi de gerçek plana göre güncellenir.
