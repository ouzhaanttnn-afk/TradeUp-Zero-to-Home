# TradeUp 1.1.0 — gerçek görsel üretim çağrıları

Mod: built-in imagegen; 24 ayrı yeni üretim. Her çağrıda `transparent_background: true` kullanıldı. Referans görseller önceden görsel dil açısından incelendi, fakat çağrılara girdi resmi, `referenced_image_paths` veya `num_last_images_to_include` verilmedi. Aşağıdaki şablonlar ve konu metinleri gerçek çağrıları yeniden oluşturur; yazım boşlukları dahil üretim metni korunmuştur.

Kaynak PNG dizinleri:

- Orta: `C:/Users/Gaming/.codex/generated_images/01a10043-e6b7-7710-a1e8-0ffac4acb154`
- İleri: `C:/Users/Gaming/.codex/generated_images/01a10044-357f-7083-85d1-aae4c8c96e43`

Son oyun görselleri `src/assets/products/prd_<familyId>.webp`; kaynak dosya eşlemeleri `scripts/import-release110-assets.mjs` içindedir. Dönüşüm yalnız mekanik WebP sıkıştırma ve saydam kenar normalizasyonudur, yeni tasarım üretmez.

## Orta segment — ortak metin

Birleştirme sırası: başlangıç → framing → son → `Subject: {konu}.`

Başlangıç:

```text
Use case: stylized-concept
Asset type: TradeUp mobile game inventory product cutout.
Scene/backdrop: genuinely transparent alpha background; no scene, backdrop, floor, pedestal or cast shadow outside the object.
Style/medium: polished premium realistic 3D product render, matching the existing TradeUp table saw and commercial espresso art: emerald/dark green solid body, restrained brushed brass trim, realistic silver metal, glass and black rubber materials, clean readable realistic silhouette. Avoid toy or cartoon proportions.
```

İlk üç ürünün framing satırı (`smart_lock`, `rotary_hammer`, `spot_cleaner`):

```text
Composition/framing: square canvas, single complete object centered, elevated isometric three-quarter view, entire object inside frame occupying about80% of canvas, at least8% empty transparent padding on every edge. Nothing cropped.
```

Diğer dokuz ürünün framing satırı:

```text
Composition/framing: square canvas, single complete object centered, elevated isometric three-quarter view. Fit the entire object strictly inside the central 76% of the square; reserve at least 12% completely empty transparent margin on all four sides, including protrusions. Entire object visible, nothing cropped.
```

Son:

```text
Lighting/mood: soft studio lighting, crisp controlled reflections and clean material shading, sharp object edges.
Constraints: one original product only; no readable text, symbols, numbers, lettering, logos, watermark, glow, frame, badge, extra objects or decorative base. Preserve genuine transparency.
```

Konu metinleri (ID eşlemesi dışında her satır `Subject: ` öneki ve son nokta ile kullanıldı):

```text
smart_lock: an original electronic keypad door lock with a small matching door lever, combined as one complete lock assembly; slim upright keypad housing, dark inactive touch surface with discreet unmarked circular button indents, short matching lever, plausible metal door-lock hardware; no door or wall
rotary_hammer: an original professional rotary hammer drill, complete handheld tool with dark green casing, rubberized black rear grip and side auxiliary handle, silver chuck holding a short masonry bit, small restrained brass controls; plausible sturdy construction
spot_cleaner: an original compact portable upholstery extraction cleaner, complete green body with carry handle, visible translucent clean-water and recovery tanks, short black ribbed hose curled closely around its body with small attached extraction nozzle; no carpet or fabric
document_scanner: an original automatic duplex document scanner, green compact desktop body with sloped feeder tray raised behind it, silver paper guides, front dark output slot and folded output tray; empty feeder and no paper sheets; plausible office-machine proportions
guitar_amplifier: an original electric guitar combo amplifier, compact rectangular dark-green cabinet with black woven grille over a single large speaker, brass corner protectors, slim top panel with a few brass knobs, short black carry handle; no guitar and no cable
sewing_overlocker: an original four-thread overlock sewing machine, green sculpted machine body, silver needle and presser-foot assembly, dark vent details, four brass spool posts with four pale neutral thread cones mounted on the integral stand behind it, tidy visible thread paths; no fabric swatches
bench_drill: an original benchtop pillar drill press: emerald green motor head with black belt-cover top, vertical polished silver steel column, three-spoke feed handle with small brass tips, silver chuck with short drill bit, compact adjustable green-and-silver worktable, sturdy integral green machine foot; complete realistic benchtop tool
resin_printer: an original desktop resin 3D printer: compact square dark green lower chassis with simple blank black front control screen and restrained brass rim, amber transparent rectangular protective hood showing the vertical silver build mechanism inside; complete original machine
studio_subwoofer: an original active studio subwoofer: compact dark green rectangular cabinet, large single black woofer visibly inset in front, small circular bass-reflex port beside it, restrained brass trim around woofer, matte black rubber feet; no other speakers
digital_oscilloscope: an original benchtop digital oscilloscope with emerald-green housing, one dark glass screen displaying only a simple thin emerald waveform line on an otherwise blank field with no letters or numbers, realistic rows of small silver/brass knobs and black unmarked push buttons, front connector sockets, angled integral feet and small top carry handle; no probe cables
short_throw_projector: an original home ultra-short-throw projector, low broad emerald-green rectangular body, recessed upward-facing lens well and angled glass optical opening on top, small side ventilation grille, brushed brass trim, black rubber feet; no projected beam or screen
magnetic_exercise_bike: an original magnetic stationary exercise bike, full complete realistic compact fitness bicycle with emerald-green frame and flywheel shroud, restrained brass adjustment knobs, black padded saddle, black curved rubber handlebars, small blank dark console, silver saddle stem and crank, pedals with straps, integral stabilizer feet; complete silhouette, both handlebars and feet entirely within the frame
```

## İleri segment — ortak metin

Birleştirme sırası: ortak metin → `Subject` → kapanış. İlk dört ürün A, son sekiz B kullanır.

A:

```text
Use case: stylized-concept
Asset type: TradeUp premium mobile game inventory product cutout, square image.
Scene/backdrop: genuinely transparent alpha background; absolutely no scenery, floor, pedestal, base plane or cast floor shadow.
Style/medium: polished premium 3D product render, plausible real industrial construction and readable recognizable silhouette, refined isometric three-quarter view matching emerald-and-brass table saw and espresso machine game art.
Composition/framing: one complete equipment object centered; fit within about 80% of square canvas, at least 8% clear transparent margin on every side; show all extremities, do not crop.
Lighting: soft clean studio illumination, crisp edges, subtle material highlights, rich dimensional shading on the object only.
Color palette/materials: deep emerald/dark green painted housing, restrained brushed brass accents on a few handles/fasteners, realistic brushed silver metal, clear glass and black rubber where appropriate; plausible proportions, no toy-like distortions.
Constraints: original unbranded design; no writing or labels, letters, numbers, logos, watermarks, glow, frame, badges, scene props, loose accessories, duplicate items; no fake checkerboard. Render real transparent alpha.
```

B aynı metindir, yalnız aşağıdaki üç satır yer değiştirir:

```text
Asset type: TradeUp premium mobile game inventory product cutout, SQUARE canvas.
Composition/framing: zoom out so one COMPLETE equipment object centered fits within central80%of SQUARE canvas; mandatory8–10%clear transparent padding on EVERY side including top bottom; all extremities visible, no cropping. Square1280x1280 composition.
Constraints: original unbranded design; no writing or labels, letters, numbers, logos, watermarks, glow, frame, badges, scene props, duplicate items; no fake checkerboard. Render real transparent alpha.
```

Konu metinleri:

```text
commercial_coffee_grinder [A]
Subject: a commercial coffee grinder with tall clear bean hopper containing coffee beans, dark green cast housing, front dosing chute, compact catch tray and small brass adjustment collar. Complete single functional appliance.

commercial_deck_oven [A]
Subject: a professional two-deck commercial baking oven with two stacked rectangular glass-door baking chambers, substantial green housing, brushed stainless steel front and simple brass door handles. Grounded realistic oven proportions, complete single equipment unit with short support legs.

dough_sheeter [A]
Subject: a professional dough sheeter, green central roller housing, realistic silver rollers, two attached horizontal side conveyor tables with pale food-grade belts, solid frame and small caster feet. One complete machine; both conveyor tables and all support legs fully visible.

industrial_dust_extractor [A]
Subject: a workshop industrial dust extractor on a sturdy small wheeled green frame, motor/fan housing, large vertical pleated filter canister above a semi-transparent collection bag held by a brass retaining ring, a single short corrugated suction hose attached to its inlet and neatly tucked beside frame. One complete plausible workshop machine.

rack_audio_power_amp [B]
Subject: a professional rackmount stage audio power amplifier, wide low2U enclosure, deep green top panel, brushed silver front, two large recessed fan ventilation grilles, two small brass volume knobs, rack ears and dark rubber handles. No screens showing text, just tiny neutral status lights. Only one amplifier, no cabinet.

cine_follow_focus_kit [B]
Subject: a wireless cinema follow-focus kit as one coherent two-part functional set: compact deep green hand controller with a large textured brass focus wheel and short antenna, alongside exactly one small green geared lens motor with silver toothed drive wheel and short mounting clamp. Controller and motor close together as a single inventory set, no camera, no lens, no extra accessories.

professional_band_saw [B]
Subject: a floorstanding professional woodworking band saw, tall deep green cast-metal frame with round upper and lower wheel housings, thin vertical blade beneath adjustable blade guide, broad brushed-silver cutting table, brass guide knobs and sturdy closed pedestal base with four small rubber feet. Complete realistic machinery including all upper/lower parts, blade, table and feet.

large_format_printer [B]
Subject: a professional wide-format roll printer, wide deep green rectangular printer body on an integrated wheeled stand, realistic silver media rollers, modest brass trim on side fasteners, visible roll of blank white paper feeding through front into attached black fabric collection basket. One complete plausible large printer, no printed artwork, no computer.

enterprise_network_switch [B]
Subject: one enterprise network switch in a slim1U rackmount metal enclosure; exactly24 visible ethernet ports in two neat rows of12 on a brushed-silver front panel, small neutral status light points above ports, dark emerald green top/side housing and restrained brass screws on the two attached rack ears. One realistic functioning switch, no rack cabinet and no plugged-in cables.

industrial_uv_printer [B]
Subject: one industrial flatbed UV printer with a broad horizontal empty brushed-aluminum print bed, deep green side body panels and sturdy machine frame, linear gantry spanning the bed with a clear enclosed printhead carriage, short legs and black feet, small attached blank control panel. Dark green machinery with restrained brass accents; no paper roll, no graphic printed on bed, no scene.

modular_synth_rack [B]
Subject: one compact professional modular synthesizer cabinet, deep green angled metal case with three rows of silver synth modules, many plausible knobs and patch sockets, a restrained collection of connected emerald, black and muted brass-colored patch cables linking sockets, narrow wooden-looking dark green side cheeks with brass fasteners. A readable functional synthesizer cabinet, no keyboard, no separate speaker, no readable text or markings.

professional_laminator [B]
Subject: one professional wide-format roll laminator, deep green side housings on an integrated open metal wheeled stand, two prominent parallel silver-and-black rollers with a clear upper protective shield, attached feed table, visible roll of transparent film held above the rollers, modest brass tension knobs. Single complete credible machine, no printed sheets, no scene.
```

Her kapanışta ID'nin alt çizgileri boşluğa çevrilir:

```text
Primary request: Generate only this {subject name} as a distinct inventory asset.
```
