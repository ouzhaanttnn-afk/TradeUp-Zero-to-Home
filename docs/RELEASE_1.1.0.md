# TradeUp 1.1.0 — hazırlık ve doğrulama

## Tamamlanan kapsam

- 24 yeni ürün: 12 orta, 12 ileri. Toplam 237 aile. `src/content/release110.json` içerik ve TR/EN/DE/ES adlarının tek kaynağıdır.
- Çeşit denetimi: 10 kategori; başlangıç havuzu 89 aile. Sayı yetersiz bulunmadığı için ek rastgele ürün eklenmedi. Aynı görünen iki lazer kazıma adı Kompakt/Profesyonel olarak ayrıldı; ID, fiyat ve eski kayıtlar korunur. Sonraki içerik genişlemesinde Telefon ve Moda/Bakım dağılımı öncelikli adaydır.
- 24 ayrı built-in imagegen çağrısıyla özgün, marka içermeyen görsel üretildi. Her ürün için ayrı saydam PNG oluşturuldu; sprite atlas veya sahne kullanılmadı.
- PNG kaynakları saydam sınırlar açısından denetlendi; mekanik biçim dönüşümüyle 512×512 WebP, 448 px içerik alanı ve 32 px boş kenar sağlandı. Yeni görseller 19–68 KB; toplam ürün bütçesi 12 MiB altında.
- Native rewarded reklam erken kapanınca SDK'nın çözülmeyen promise'i artık UI kilitlemez. Dismiss/failure/earned dinleyicileri tek sonuçta temizlenir. 180 sn güvenli zaman aşımı izin, yükleme ve dinleyici hazırlığını da kapsar; gecikmiş native yanıt ödül veya izin sayfası açamaz. Takılan temizleme işlemi oyun kontrollerini bekletmez.
- Yeni soğuk oturumda kullanım sayacı açılır; sıradan pause/resume bunu yapmaz. Günlük limitler ve 90 sn aralık gerçek zamanla korunur. Save schema 21, muhafazakâr migration ve kayıt/journal uzlaştırması eklendi.
- İlan erişimi, teklif çıkmasa dahi aynı ilan ömründe yalnız bir kez kullanılabilir. Kalıcı işlem defteri bu sınırı günlük reklam kayıtları temizlendikten ve save/load sonrasında da korur. Yeni ilan ömrü ayrı değerlendirilir.
- iOS marketing version 1.1.0. Build numarası CI tarafından seçilir; 41'den ve Apple'daki son build'den büyük olmalıdır.

## Görsel üretim kaydı

Mod: built-in imagegen, yeni görsel üretimi. Girdi resmi yok; her çağrının konusu `release110.json` içindeki ayrı üründür. Saydamlık açık.

Gerçek çağrı metinleri ve konu eşlemeleri [görsel üretim kaydında](ASSET_GENERATION_1.1.0.md) bulunur. Netleme seti bir kontrolcü ve bir motor; ağ anahtarı 24 port olarak sınırlandı.

Özgün PNG dizinleri:

- Orta: `C:/Users/Gaming/.codex/generated_images/01a10043-e6b7-7710-a1e8-0ffac4acb154`
- İleri: `C:/Users/Gaming/.codex/generated_images/01a10044-357f-7083-85d1-aae4c8c96e43`

Dosya eşlemeleri ve dönüşüm: `scripts/import-release110-assets.mjs`. Oyunda kullanılan son dosyalar: `src/assets/products/prd_<familyId>.webp`.

## 100 seed kariyer ölçümü

Fiyatlandırma motoru, pazarlık hakları, kâr formülü ve erişim eşikleri değişmedi. Yeni aileler örneklenen fırsat havuzunu genişletir.

| Ölçüm                 | 1.0.4 kataloğu | 1.1.0 kataloğu |
| --------------------- | -------------: | -------------: |
| Hızlı P10 ev ticareti |            222 |            214 |
| Medyan ev ticareti    |            260 |            241 |
| Yavaş P90 ev ticareti |            285 |            269 |
| Medyan yenileme       |             28 |             28 |

Bu otomatik strateji simülasyonudur; gerçek oyuncu süresi veya garantili kazanç değildir. Medyan 300 / P90 330 sınırları korunur.

## Doğrulama

- `pnpm test`: 65 dosya, 425 test başarılı; kapalı reklam adapter'ında sıfır SDK isteği ve her iki reklamsız entitlement'ın değişmeyen hak limitleri dahil.
- `pnpm lint` ve `pnpm build`: başarılı.
- Mobil tarayıcı: 40 test başarılı; 1 mağaza görseli üretim testi yalnız talep üzerine çalıştığı için atlandı. 320/390/430 px, görsel fallback, erişilebilirlik, temalar, offline akış ve çekirdek döngü doğrulandı.
- Windows web doğrulaması native imzalı IPA veya gerçek iPhone testi yerine geçmez.

## Yayın güvenliği

Codemagic workflow manuel, yalnız ücretsiz M2 makine; Apple'a binary yükler, App Review veya beta review başlatmaz. İnceleme akışında production ve test reklamları ayrı flag'lerle kapalıdır: SDK/UMP/ATT/reklam isteği yapılmaz, video CTA görünmez; doğrulanmış Premium/Reklamsız bypass aynı limitleri korur. Test servisi yalnız açık test config'iyle çalışır. `check-review-ad-config.mjs` derlenmiş uygulama web payload'ında resmi demo kimliği bulursa arşivi durdurur; bu kontrol vendor SDK kaynaklarındaki kullanılmayan fallback literal'ları kapsamaz. Production aktivasyonu GDD'nin gerçek saha kalite kapısını ayrıca gerektirir.

Eski 1.0.4 (41) başvurusu yeni imzalı 1.1.0 Apple'da işlenmeden geri çekilmez. Yeni App Review başvurusunda altı IAP birlikte bulunur, yayın manuel kalır. Uygulama veya IAP kaydı silinmez.

2026-10-03 hesap kontrolü: Kullanıcının açık onayıyla mevcut TradeUp Apple API anahtarı, dağıtım sertifikası ve App Store profili Codemagic'e bağlandı. Bundle ID `com.tradeup.zerotohome`, profil ve sertifika Eylül 2027'ye kadar geçerli. Codemagic'in GitHub seçili depo listesine yalnız TradeUp eklendi; diğer uygulamanın mevcut izni değişmedi. Yeni imzalı build henüz yüklenmedi ve App Review başlatılmadı. Apple'daki mevcut 1.0.4 (41) ve altı IAP, tek başvuruda Waiting for Review durumunda korunuyor.

OmniRoute yerel servisine erişilemedi; bu blokta Omni inference kullanımı 0. Kod, fiyatlandırma, doğrulama ve yayın kararları ana Codex tarafından kontrol edildi.
