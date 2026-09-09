# Mağaza Dışı Hazırlık Durumu

Bu belge, `TRADEUP_MASTER_GDD_v2.2.md` içindeki Definition of Done maddelerini
mağaza yayın operasyonlarından ayırır. Bir madde yalnız otomatik test veya
tekrarlanabilir yerel komutla doğrulandığında tamamlanmış sayılır.

Son yerel doğrulama: 9 Eylül 2026.

## Otomatik olarak doğrulananlar

- [x] Data, lokalizasyon ve `assetKey` tabanlı ürün aileleri; ürün adına özel
  oyun kodu olmadan aynı aileden çoklu ilan üretimi ve kıyaslama.
- [x] Deterministik kanıt, inceleme, değer tahmini ve karşı hamleli yüksek etkili
  kusur akışı.
- [x] Tam iki oyuncu teklif hakkı, kalıcı satıcı tabanı ve ek hak vermeyen
  karşı teklifler.
- [x] Aktif pazar, işaretli NPC riski, artımlı ilan gelişi ve tekrar oynatılabilir
  dünya komutları.
- [x] `OwnedAsset` yaşam döngüsü, değişmez maliyet temeli, net servet ve
  tekil satış kapama muhasebesi.
- [x] Satın alma, hazırlık, ilan, teklif, geri çekme, yeniden ilan ve satış
  sonrası journal mutabakatı.
- [x] FTUE içindeki gerçek kıyas, kanıt, pazarlık, hazırlık, ilan ve alıcı
  satış zinciri.
- [x] Sürümlü kayıt, migration, yedek kurtarma ve sınırlı çevrimdışı
  ilerleme.
- [x] 320, 390 ve 430 CSS px portre düzenleri; büyük metin, azaltılmış
  hareket, haptik kapalı ve eksik görsel fallback senaryoları.
- [x] Kritik modal yüzeylerde klavye odağı, Escape ile kapanma, odağı geri
  verme ve kritik/ciddi axe ihlali bulunmaması.
- [x] Yalnız dört rewarded placement, ilk satış ve 20 aktif dakika kapısı,
  cooldown ile oturum/rolling limitleri ve aynı payload yolunu kullanan premium
  bypass.
- [x] Beş non-consumable SKU için metadata fiyatı, pending/cancel/restore/revoke ve
  offline entitlement davranışının sandbox adapter testleri.
- [x] Consent reddinde oynanabilirlik, izinsiz reklam isteği engeli ve ekonomiyi
  etkilemeyen tema/avatar entitlement'ları.
- [x] Çevrimdışı Chrome smoke testi, servis worker cache'i ve çevrimdışı
  yeniden yüklemede kayıt/journal korunumu.
- [x] Kod kapsamı alt sınırları, teslim boyutu bütçeleri ve 100 seed kariyer
  simülasyonu.

## Son yerel kapı sonucu

- `pnpm test`: 44 test dosyasında 295 test başarılı.
- `pnpm test:coverage`: satır %70,19; branch %54,42; function %66,62;
  statement %68,74 ve tüm zorunlu alt sınırlar geçildi.
- `pnpm lint`: başarılı.
- `pnpm build`: başarılı; ana JavaScript parçası 328,21 KB ve 400 KB
  bütçesinin altında.
- `pnpm exec playwright test`: 27 mobil, çevrimdışı ve erişilebilirlik
  senaryosu başarılı.
- `pnpm cap:sync`: Android projesi ve Capacitor eklentileri başarıyla eşlendi.

## Yerel kodla kapatılamayan kalite kapıları

Bu maddeler eksik oyun mekaniği değildir; cihaz, mağaza hesabı veya gerçek oyuncu
verisi gerektirir:

- [ ] Android WebView'da gerçek cihaz düşük/orta/yüksek performans turu.
- [ ] iOS projesinin macOS/Xcode üzerinde oluşturulması ve cihaz smoke testi.
- [ ] StoreKit ve Google Play Billing sandbox purchase/restore/refund/revoke turu.
- [ ] Gerçek reklam SDK'sı test birimleriyle consent ve dört placement doğrulaması.
- [ ] Kapalı betada crash-free sessions ≥%99,5 ve FTUE ≥%70 kanıtı.
- [ ] Retention ve ekonomi ayarı için en az bir gerçek oyuncu playtest turu.

Bu dış kapılar geçilmeden production reklamı, canlı IAP veya soft launch
açılmamalıdır.
