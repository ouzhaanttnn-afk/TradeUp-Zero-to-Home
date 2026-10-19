# TradeUp 1.2 — 19 Ekim uygulama ve doğrulama

Dal: `codex/first-home-polish`. Kullanıcı önerileri ve Game Center barındırmalı Top 100 kurulumu kapsamında. Main, mevcut App Review ve nomination korunur. Push, merge, TestFlight/App Store upload, ücretli build veya bulut kurulumu yapılmadı.

## Uygulananlar

- Mevcut evler Pazar/Emlak'ta; Tümü'nde en fazla bir ev. Fiyat, keşif süresi, araştırma ve kanonik satın alma muhasebesi değişmedi. Yolculuk satın alma ekranı yerine Pazara yönlendirir.
- Ev detayı büyük görsel/fallback, tam bedel, nakit eksiği ve açık onay sunar. Mevcut ev takas bedeli olmadığı açıkça anlatılır. Modal ana shell'e portal ile açılır: sticky filtre/nav üstüne çıkması doğrulandı.
- Yolculuk'ta kalıcı Evim ve Portföy kısayolu; yükseltmeden bağımsız ilk ev anısı, eski kayıt ve sahiplik korunur.
- İlk ev başarı kartı 1080×1350 PNG cihazda; isim varsayılan kapalı, önizleme, indirme/Web Share. iOS için mevcut köprüde UIKit UIImage paylaşımı; yeni paket, dosya/cache, galeri izni veya paylaşım sunucusu yok. Native paylaşım kodlandı ama fiziksel cihazda henüz doğrulanmadı.
- Game Center köprüsü, iOS launch yolları/entitlement, isteğe bağlı Top 100 paneli ve açık skor gönderme onayı. Üç liste: servet zirvesi, ilk 100 ticaret net kârı, ilk ev bütçesine ticaret. Eski kaydı sıfırlama veya ikinci kariyer zorunluluğu yok. Yerel isim/oyun kaydı yüklenmez. Eksik/uzlaşmayan/sandbox kayıt ve güvenli sayı sınırı kontrolleri var; bunlar sunucu hile doğrulaması değildir.
- Skorlar hesap bağını native tarafta kontrol eder; hesap değişince önceki onayla otomatik gönderilmez. En iyi skor Apple'da tutulur. Game Center, oyun kaydını yedeklemez.
- UMP izni + güncel StoreKit hak kontrolünden sonra tek MARKET_SCOUT reklamı ön yükleme. Hazır slot tekrar indirilmeden kullanılır; placement kimliği, bir saatlik son kullanma, geri saat ve izin değişimi kontrolleri. Yüklemeler seri; erken kapatma/boş reklam ödül vermez. Hazırlık tek başına gösterim veya ödül değildir. +25, 50/25 kapasite, doğal dolum, Premium/Reklamsız, diğer placement ve 30 ticaret kuralı değişmedi.
- Gizlilik metninin yerel kaynağı Game Center ve paylaşım davranışını anlatır; e-posta `nostoscomp@gmail.com`. Canlı web sitesi bu tur yayımlanmadı.
- Yüksek kâr için fiyat/katsayı/oyun temposu değiştirilmedi. Gerçek oyuncu dağılımı ve sayısal öneri ayrı ölçüm/onay kapısıdır. Yeni ürün ailesi/raster üretilmedi; mevcut persona metinleri ve ürün altyapısı korunur.

## Apple ve AdMob'da tamamlanan hazırlık

- Apple'da TradeUp Game Center kaydı, üç classic BEST_SCORE sıralama, her biri tr/en-US başlık ve açıklama, bundle Game Center capability oluşturuldu. Son GET ile üç liste/altı dil kaydı ve IAP + Game Center capability doğrulandı. [Makbuz](APPLE_GAME_CENTER_SETUP_2026-10-19.md).
- Kullanıcı aynı reklam içindeki ikinci bölüm sorununu netleştirip kapatmaya onay verdi. Yüksek etkileşimli reklamlar app düzeyinde; Ad pods dört ödüllü birimde kapatılıp kaydedilmiş türler doğrulandı. Reklamlar veya +25 kapatılmadı. Bu canlı ayar güncelleme gerektirmez; önceden yüklenen yaratıcılar hemen değişmeyebilir. Normal bitiş kartı/etkileşimli biçim kalabilir. [Ayrıntı/kanıt](ADMOB_SHORT_ADS_2026-10-19.md).

## Test kanıtı

- Son kullanıcı ekran görüntüsündeki uzun basma/metin seçimi için oyun kökünde `user-select: none` ve iOS `-webkit-touch-callout: none` eklendi; input/textarea/düzenlenebilir alanlar seçilebilir kalır. Ek paket veya dokunma olayını engelleyen JavaScript yok. 512 test, lint/TypeScript ve üretim build geçti; tarayıcı regresyonunda pazar/detay metnini sürükleyerek seçememe + profil adını seçme/düzenleme/kaydetme geçti. İlk test, başlangıç defteri teklifi kabul edilmeden pazar kartı beklediği için başarısızdı; gerçek ilk satış akışı eklenerek 1/1 geçti. Fiziksel iOS uzun basma son kontrolü henüz yapılmadı. Kullanıcının `dur` talebi üzerine push/IPA build başlatılmadı.
- Son tam tur: **79 dosya / 512 birim testi geçti**. Journal/100. ticaret/zarar, yalnız mevcut evin servete dahil olması, yerel veri gizliliği, sandbox/eksik kayıt ve native payload sınırı; ön yükleme/dedup/son kullanım/izin iptali/yanlış placement/no-fill/ad-free regresyonu kapsanır.
- `pnpm lint`, `pnpm exec tsc -b --pretty false`, `pnpm build` geçti. `node scripts/check-native-ad-privacy.mjs` geçti; ATT/IDFA eklenmedi, UMP-before-ads ve ad-ID'siz Analytics korunur.
- Tarayıcı: ilk 8 senaryo (ilk ev satın alma-final-paylaşım PNG-indirme-kayıt-yeniden açma, pazar 320/430 ve yenileme/reklam düğmesi 320/390/430) geçti. Modal portal düzeltmesinden sonra ilk ev akışı 1/1 yeniden geçti.
- Yeni 4 tema/genişlik matrisi 4/4 geçti: Klasik 320, Gece Pazarı 375 büyük yazı, Atölye 390, Obsidyen 430 büyük yazı. Yetersiz nakit, tek/çok ev kartı, yatay taşmama, modal kapatma kontrolünün örtülmemesi, Escape ve odak dönüşü doğrulandı. İlk deneme dört kez yanlış test metni (`nakit eksik` yerine gerçek `Nakit eksiği`) yüzünden başarısızdı; uygulama metni değiştirilmeden test düzeltildi ve dört senaryo geçti.
- Üretim CSS bütçesi yeni stilleri ana pakete ekleyince aşıldı; limit artırılmadan yeni ekranlara lazy CSS ayrıldı ve build geçti. JS/CSS teslim bütçeleri korunur. React kontrolünde lazy panel, effect temizliği, object URL temizliği, çift tık kilidi ve erişilebilir form etiketleri değerlendirildi.

Web çıktı: `C:\Users\Gaming\Desktop\TRADEUP\dist`. Bu imzalı IPA değildir. Yeni Apple build numarası ayrılmadı veya yüklenmedi; geliştirme sürümü 1.2.0 olarak kalır.

## Yayından önce kalanlar

1. Game Center capability'li provisioning profile + macOS/Xcode native derleme/imza. Windows static Swift wiring testi native derleme veya çalışma kanıtı değildir.
2. Fiziksel iPhone/iPad Game Center sandbox giriş/iptal/hesap değişimi, gerçek top 100/kendi sıra ve skor gönderimi. Bu tur test/üretim skoru gönderilmedi.
3. Fiziksel cihazda test reklamlarıyla soğuk/sıcak açılış gecikmesi ve native paylaş/iptal. Gelir üreten test/tıklama yapılmadı; gecikme süresi ölçülmüş gibi raporlanmaz.
4. %200 metin/VoiceOver/kontrast tam release matrisi, StoreKit restore, son build'e ait gerçek iPhone/iPad mağaza çekimleri. Büyük yazı testi bu tam erişilebilirlik değerlendirmesinin yerine geçmez.
5. Canlı gizlilik kaynağı ve App Privacy beyanının gerçek Game Center veri davranışıyla eşleştirilmesi; yeni sürümün Game Center review bağlantıları. Mevcut başvuru değişmedi; bu blok yayın onayı değildir.

Yeni bağımlılık, raster üretimi, ücretli servis veya arka plan daemon'u yok. Playwright tek worker ile kendi preview süreçlerini açıp kapattı. OmniRoute çağrısı 0; subagent kullanılmadı. Ponytail mevcut motor/asset/köprüyü korumakta; React ve uçtan uca doğrulama becerileri UI güvenliği ve test sınırlarını belirlemekte kullanıldı.
