import { useEffect, useMemo, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import "./App.css";
import { assetFor, visualTreatmentFor } from "./assets";
import { familyById } from "./content/families";
import {
  activeBookCostMinor,
  activeOwnedAssets,
  activePlayerListings,
  inventoryAssets,
  quoteAssetExit,
} from "./domain/economy";
import {
  comparableListings,
  comparisonRows,
  inspectionOptions,
  listingEstimateBand,
} from "./domain/decision";
import { WORLD_CONFIG } from "./domain/config";
import { ftueCopy, ftueStageLabel, isFtueActive } from "./domain/ftue";
import {
  categoryExpertiseLevel,
  marketExpertiseLevel,
  nextExpertiseThreshold,
  savedSearchMatches,
} from "./domain/meta";
import type { CareerEventGroup, ItemInstance } from "./domain/models";
import { activeMarketListings, npcRiskSignal } from "./domain/world";
import { HOME_GOAL_MINOR, money, signal, wealth } from "./game";
import { useGameStore } from "./stores/gameStore";

type Tab = "market" | "follow" | "portfolio" | "journey";
type PortfolioSegment = "inventory" | "preparation" | "listings";
type TimelineFilter = "ALL" | CareerEventGroup;

const sellerLabel = {
  urgent: "Acilci",
  expert: "Piyasacı",
  uninformed: "Bilgisiz",
  emotional: "Duygusal",
  merchant: "Tüccar",
  risky: "Riskli",
};

const evidenceLabel = (confidence: number) =>
  confidence >= 0.72 ? "Yüksek" : confidence >= 0.46 ? "Orta" : "Düşük";

function ProductVisual({
  instance,
  className,
  alt = "",
}: {
  instance: ItemInstance;
  className: string;
  alt?: string;
}) {
  const visual = visualTreatmentFor(instance);
  return (
    <div
      className={`${className} product-visual product-visual--${visual.conditionBand}${
        visual.fallback ? " product-visual--fallback" : ""
      }`}
    >
      <img src={assetFor(instance.family.assetKey)} alt={alt} />
      <span className="condition-overlay" aria-hidden="true" />
      {visual.revealedDefect ? (
        <span
          className="visual-badge visual-badge--defect"
          aria-label="Doğrulanmış kusur"
        >
          !
        </span>
      ) : null}
      {visual.missingAccessory ? (
        <span
          className="visual-badge visual-badge--accessory"
          aria-label="Eksik aksesuar"
        >
          −
        </span>
      ) : null}
      {visual.verifiedEvidence ? (
        <span
          className="visual-badge visual-badge--verified"
          aria-label="Kanıt doğrulandı"
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("market");
  const [portfolioSegment, setPortfolioSegment] =
    useState<PortfolioSegment>("inventory");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const {
    game,
    ready,
    notice,
    hydrate,
    flush,
    scan,
    tick,
    buy,
    offer,
    sell,
    list,
    withdrawListing,
    acceptBuyer,
    inspect,
    prepare,
    openListing,
    markCompared,
    dismissCoach,
    toggleWatch,
    saveSearch,
    removeSearch,
    recordImpressions,
    openJourney,
    setAnalytics,
    setHaptics,
    setReducedMotion,
    setLargeText,
    reset,
  } = useGameStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setInterval(tick, WORLD_CONFIG.activeTickMin * 60_000);
    return () => window.clearInterval(timer);
  }, [ready, tick]);
  useEffect(() => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void hydrate();
      else void flush();
    }).then((handle) => {
      if (disposed) void handle.remove();
      else removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [flush, hydrate]);

  const total = wealth(game);
  const marketListings = activeMarketListings(game);
  const impressionKey = marketListings.map((listing) => listing.id).join("|");
  useEffect(() => {
    if (ready && impressionKey)
      recordImpressions(impressionKey.split("|").filter(Boolean));
  }, [impressionKey, ready, recordImpressions]);

  const selected =
    marketListings.find((listing) => listing.id === selectedId) ?? null;
  const inventory = inventoryAssets(game);
  const playerListings = activePlayerListings(game).flatMap((playerListing) => {
    const asset = game.ownedAssets.find(
      (item) => item.id === playerListing.ownedAssetId,
    );
    return asset ? [{ listing: playerListing, asset }] : [];
  });
  const watchedListings = marketListings.filter((listing) =>
    game.follow.watchedListingIds.includes(listing.id),
  );
  const negotiating =
    selected && game.negotiation?.listingId === selected.id
      ? game.negotiation
      : undefined;
  const offers = negotiating?.offersRemaining ?? 2;
  const ftueActive = isFtueActive(game);
  const coach = ftueCopy[game.ftue.stage];
  const showCoach =
    ftueActive && !game.ftue.dismissedStages.includes(game.ftue.stage);
  const startingOffer =
    game.ftue.stage === "STARTING_SALE"
      ? game.buyerOffers.find(
          (item) => item.id === "offer:ftue-starting-notebook",
        )
      : undefined;
  const marketLevel = marketExpertiseLevel(game);
  const marketXpTarget = nextExpertiseThreshold(game.expertise.marketXp);
  const portfolioMarketValue = activeOwnedAssets(game).reduce(
    (sum, asset) => sum + asset.instance.fairValueMinor,
    0,
  );
  const unrealizedEstimate = portfolioMarketValue - activeBookCostMinor(game);
  const homeProgress = Math.min(
    100,
    Math.floor((total / HOME_GOAL_MINOR) * 100),
  );
  const timeline = useMemo(
    () =>
      game.career
        .filter(
          (event) => timelineFilter === "ALL" || event.group === timelineFilter,
        )
        .toReversed(),
    [game.career, timelineFilter],
  );

  const selectListing = (listingId: string) => {
    setSelectedId(listingId);
    setComparing(false);
    openListing(listingId);
  };
  const navigate = (nextTab: Tab) => {
    setTab(nextTab);
    if (nextTab === "journey") openJourney();
  };

  const renderInventoryCard = (
    item: (typeof inventory)[number],
    showPreparation: boolean,
  ) => {
    const quote = quoteAssetExit(item);
    return (
      <article
        className="owned"
        key={`${showPreparation ? "prep" : "stock"}:${item.id}`}
      >
        <ProductVisual instance={item.instance} className="owned-icon" />
        <div>
          <h3>{item.instance.family.name}</h3>
          <p>
            Defter maliyeti {money(item.bookCostMinor)} · Tahmini çıkış{" "}
            {money(quote.quickSaleMinor)}–{money(quote.balancedAskingMinor)}
          </p>
          <p>
            Kanıt {evidenceLabel(item.instance.evidenceConfidence)} · Likidite %
            {Math.round(
              (item.instance.family.liquidity +
                item.instance.liquidityBonusBps / 10_000) *
                100,
            )}{" "}
            · {item.state}
          </p>
        </div>
        <div className="sell-actions">
          {showPreparation
            ? item.instance.family.preparation
                .filter(
                  (action) =>
                    item.instance.preparationHistory.filter(
                      (record) => record.kind === action.kind,
                    ).length < action.maxUses,
                )
                .map((action) => (
                  <button
                    key={action.kind}
                    onClick={() => prepare(item.id, action.kind)}
                  >
                    {action.label} <b>{money(action.costMinor)}</b>
                    <small>
                      {action.durationMin} dk ·{" "}
                      {action.kind === "CLEAN"
                        ? `+${action.conditionGain} kondisyon`
                        : action.kind === "TEST"
                          ? `+%${Math.round(action.confidenceGain * 100)} güven`
                          : `+%${Math.round(action.liquidityGainBps / 100)} likidite`}
                    </small>
                  </button>
                ))
            : null}
          {!showPreparation && !ftueActive ? (
            <button onClick={() => sell(item, true)}>
              Hızlı çık <b>{money(quote.quickSaleMinor)}</b>
            </button>
          ) : null}
          {!showPreparation &&
          (!ftueActive || game.ftue.stage === "LISTING") ? (
            <button
              className="primary"
              onClick={() => list(item, quote.balancedAskingMinor)}
            >
              İlan oluştur <b>{money(quote.balancedAskingMinor)}</b>
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div
      className={`app-shell${game.accessibility.reducedMotion ? " reduced-motion" : ""}${game.accessibility.largeText ? " large-text" : ""}`}
    >
      <header>
        <div>
          <span className="eyebrow">TRADEUP</span>
          <h1>Zero to Home</h1>
        </div>
        {!ftueActive && tab === "market" ? (
          <button
            className="icon-button"
            onClick={scan}
            aria-label="Pazarı tara"
          >
            ↻
          </button>
        ) : null}
      </header>

      <section className="wallet" aria-label="Finans özeti">
        <div>
          <small>Nakit</small>
          <strong>{money(game.cashMinor)}</strong>
        </div>
        <div>
          <small>Tahmini net servet</small>
          <strong>{money(total)}</strong>
        </div>
        {game.home.unlocked ? (
          <button className="goal" onClick={() => navigate("journey")}>
            <small>Ev yolculuğu · %{homeProgress}</small>
            <span>
              <i style={{ width: `${homeProgress}%` }} />
            </span>
          </button>
        ) : null}
      </section>

      <div className="notice" role="status">
        {notice}
      </div>
      {showCoach ? (
        <aside className="coach" aria-label="İlk oturum rehberi">
          <button onClick={dismissCoach} aria-label="Rehberi kapat">
            ×
          </button>
          <small>İLK İŞLEM · {ftueStageLabel[game.ftue.stage]}</small>
          <h2>{coach.title}</h2>
          <p>{coach.body}</p>
        </aside>
      ) : null}

      <main>
        {tab === "market" ? (
          <>
            <div className="section-title">
              <div>
                <small>CANLI PAZAR</small>
                <h2>Fırsat akışı</h2>
              </div>
              <span>{marketListings.length} ilan</span>
            </div>
            <div className="feed">
              {startingOffer ? (
                <article className="starting-sale">
                  <img src={assetFor("prd_notebook")} alt="Eski defter" />
                  <div>
                    <small>ECE'NİN TEKLİFİ</small>
                    <h3>Eski defter</h3>
                    <p>
                      Nakit 0 · Defter maliyeti 0 · Satış kârı{" "}
                      {money(startingOffer.amountMinor)}
                    </p>
                    <button
                      className="primary"
                      onClick={() => acceptBuyer(startingOffer.id)}
                    >
                      Teklifi kabul et · {money(startingOffer.amountMinor)}
                    </button>
                  </div>
                </article>
              ) : null}
              {marketListings.map((item) => {
                const categoryLevel = categoryExpertiseLevel(
                  game,
                  item.instance.family.category,
                );
                const itemSignal = signal(item, categoryLevel);
                const risk = npcRiskSignal(item, game.gameTimeMin);
                const watched = game.follow.watchedListingIds.includes(item.id);
                return (
                  <button
                    className="listing"
                    key={item.id}
                    onClick={() => selectListing(item.id)}
                  >
                    <ProductVisual
                      instance={item.instance}
                      className="product-art"
                    />
                    <div className="listing-copy">
                      <div className="meta">
                        <span>
                          {item.instance.family.category} · Lv{categoryLevel}
                        </span>
                        <span>{watched ? "◆ Takipte" : risk.text}</span>
                      </div>
                      <h3>{item.instance.family.name}</h3>
                      <div className="tags">
                        <b className={itemSignal.cls}>{itemSignal.text}</b>
                        <span>%{item.instance.condition} kondisyon</span>
                        {categoryLevel >= 1 ? (
                          <span>
                            Likidite %
                            {Math.round(item.instance.family.liquidity * 100)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="price">
                      <strong>{money(item.priceMinor)}</strong>
                      <small>ilgi %{item.interest}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === "follow" ? (
          <>
            <div className="section-title">
              <div>
                <small>GERİ DÖNÜŞ NOKTAN</small>
                <h2>Takip</h2>
              </div>
              <span>{watchedListings.length} canlı</span>
            </div>
            {!watchedListings.length &&
            !game.follow.savedSearches.length &&
            !game.follow.missedOpportunities.length ? (
              <div className="empty">
                <span>◇</span>
                <h3>Henüz takip yok</h3>
                <p>
                  Bir ilanı takip et. Pazar okuryazarlığın Lv3 olduğunda family
                  alarmı da kurabilirsin.
                </p>
                <button onClick={() => navigate("market")}>
                  Pazardan family seç
                </button>
              </div>
            ) : null}
            {watchedListings.length ? (
              <h3 className="module-title">İzleme listesi</h3>
            ) : null}
            <div className="feed compact-feed">
              {watchedListings.map((item) => (
                <button
                  className="listing"
                  key={item.id}
                  onClick={() => selectListing(item.id)}
                >
                  <ProductVisual
                    instance={item.instance}
                    className="product-art"
                  />
                  <div className="listing-copy">
                    <small>CANLI · %{item.instance.condition} kondisyon</small>
                    <h3>{item.instance.family.name}</h3>
                    <span className="subtle">
                      {npcRiskSignal(item, game.gameTimeMin).text}
                    </span>
                  </div>
                  <div className="price">
                    <strong>{money(item.priceMinor)}</strong>
                    <small>incele</small>
                  </div>
                </button>
              ))}
            </div>
            {game.follow.savedSearches.length ? (
              <h3 className="module-title">Family alarmları</h3>
            ) : null}
            <div className="follow-stack">
              {game.follow.savedSearches.map((search) => {
                const family = familyById(search.familyId);
                const matches = marketListings.filter((listing) =>
                  savedSearchMatches(search, listing),
                );
                return (
                  <article className="follow-card" key={search.id}>
                    <div>
                      <small>KAYITLI ARAMA · {matches.length} EŞLEŞME</small>
                      <h3>{family?.name ?? "Bilinmeyen family"}</h3>
                      <p>
                        En çok {money(search.maxPriceMinor)} · min. %
                        {search.minCondition} kondisyon · kanıt{" "}
                        {search.evidencePreference === "CHECKED"
                          ? "kontrollü"
                          : "farketmez"}
                      </p>
                    </div>
                    <div className="inline-actions">
                      {matches[0] ? (
                        <button
                          className="primary"
                          onClick={() => selectListing(matches[0].id)}
                        >
                          Eşleşmeyi aç
                        </button>
                      ) : null}
                      <button onClick={() => removeSearch(search.id)}>
                        Kaldır
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {game.follow.missedOpportunities.length ? (
              <h3 className="module-title">Kaçan fırsatlar</h3>
            ) : null}
            <div className="follow-stack">
              {game.follow.missedOpportunities.toReversed().map((missed) => {
                const similar = marketListings.find(
                  (listing) => listing.familyId === missed.familyId,
                );
                return (
                  <article className="follow-card missed" key={missed.id}>
                    <div>
                      <small>
                        {missed.reason === "NPC_PURCHASE"
                          ? "BAŞKA ALICI ALDI"
                          : "SÜRESİ DOLDU"}{" "}
                        · {missed.atGameMin}. DK
                      </small>
                      <h3>{missed.familyName}</h3>
                      <p>
                        {money(missed.priceMinor)} · %{missed.condition}{" "}
                        kondisyon. Karar kaydı silinmedi; bu bir ceza değil.
                      </p>
                    </div>
                    {similar ? (
                      <button onClick={() => selectListing(similar.id)}>
                        Benzerini gör
                      </button>
                    ) : (
                      <button onClick={() => navigate("market")}>
                        Pazara dön
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === "portfolio" ? (
          <>
            <div className="section-title">
              <div>
                <small>TEK SAHİPLİK AKIŞI</small>
                <h2>Portföy</h2>
              </div>
              <span>{activeOwnedAssets(game).length} varlık</span>
            </div>
            <div
              className="segments"
              role="tablist"
              aria-label="Portföy bölümleri"
            >
              {(["inventory", "preparation", "listings"] as const).map(
                (segment) => (
                  <button
                    role="tab"
                    aria-selected={portfolioSegment === segment}
                    className={portfolioSegment === segment ? "active" : ""}
                    key={segment}
                    onClick={() => setPortfolioSegment(segment)}
                  >
                    {segment === "inventory"
                      ? "Envanter"
                      : segment === "preparation"
                        ? "Hazırlık"
                        : "İlanlarım"}
                  </button>
                ),
              )}
            </div>
            {portfolioSegment !== "listings" && !inventory.length ? (
              <div className="empty">
                <span>□</span>
                <h3>Portföyün boş</h3>
                <p>
                  Pazardan bir fırsat al; varlık hazırlık ve ilan aşamalarında
                  burada kalır.
                </p>
                <button onClick={() => navigate("market")}>Pazara git</button>
              </div>
            ) : null}
            <div className="inventory-grid">
              {portfolioSegment === "inventory"
                ? inventory.map((item) => renderInventoryCard(item, false))
                : null}
              {portfolioSegment === "preparation"
                ? inventory.map((item) => renderInventoryCard(item, true))
                : null}
              {portfolioSegment === "listings"
                ? playerListings.map(({ listing: playerListing, asset }) => (
                    <article className="owned" key={playerListing.id}>
                      <ProductVisual
                        instance={asset.instance}
                        className="owned-icon"
                      />
                      <div>
                        <h3>{asset.instance.family.name}</h3>
                        <p>
                          Defter maliyeti {money(asset.bookCostMinor)} · İlan{" "}
                          {money(playerListing.askingPriceMinor)} · İlgi %
                          {playerListing.interest}
                        </p>
                      </div>
                      <div className="sell-actions">
                        <button
                          onClick={() => withdrawListing(playerListing.id)}
                        >
                          İlanı geri çek
                        </button>
                      </div>
                    </article>
                  ))
                : null}
            </div>
            {portfolioSegment === "listings" &&
            !playerListings.length &&
            !game.buyerOffers.length ? (
              <div className="empty">
                <span>▱</span>
                <h3>Aktif ilanın yok</h3>
                <p>
                  Envanter segmentinden bir varlık seçip dengeli fiyatla
                  listele.
                </p>
                <button onClick={() => setPortfolioSegment("inventory")}>
                  Envantere dön
                </button>
              </div>
            ) : null}
            {portfolioSegment === "listings"
              ? game.buyerOffers.map((buyerOffer) => (
                  <article className="owned buyer-card" key={buyerOffer.id}>
                    <div className="owned-icon handshake">◇</div>
                    <div>
                      <h3>{buyerOffer.buyer} teklif verdi</h3>
                      <p>
                        {money(buyerOffer.amountMinor)} · Teklif süresi sınırlı
                      </p>
                    </div>
                    <div className="sell-actions">
                      <button
                        className="primary"
                        onClick={() => acceptBuyer(buyerOffer.id)}
                      >
                        Teklifi kabul et
                      </button>
                    </div>
                  </article>
                ))
              : null}
          </>
        ) : null}

        {tab === "journey" ? (
          <>
            <div className="section-title">
              <div>
                <small>KİŞİSEL KAYIT</small>
                <h2>Yolculuk</h2>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setSettingsOpen((open) => !open);
                  setResetArmed(false);
                }}
              >
                Ayarlar
              </button>
            </div>
            {settingsOpen ? (
              <section className="settings-card">
                <div>
                  <span>Dokunsal geri bildirim</span>
                  <button
                    aria-pressed={game.accessibility.hapticsEnabled}
                    onClick={() =>
                      setHaptics(!game.accessibility.hapticsEnabled)
                    }
                  >
                    {game.accessibility.hapticsEnabled
                      ? "Açık · kapat"
                      : "Kapalı · aç"}
                  </button>
                </div>
                <div>
                  <span>Azaltılmış hareket</span>
                  <button
                    aria-pressed={game.accessibility.reducedMotion}
                    onClick={() =>
                      setReducedMotion(!game.accessibility.reducedMotion)
                    }
                  >
                    {game.accessibility.reducedMotion
                      ? "Açık · kapat"
                      : "Kapalı · aç"}
                  </button>
                </div>
                <div>
                  <span>Metin boyutu</span>
                  <button
                    aria-pressed={game.accessibility.largeText}
                    onClick={() => setLargeText(!game.accessibility.largeText)}
                  >
                    {game.accessibility.largeText
                      ? "Büyük · standart"
                      : "Standart · büyüt"}
                  </button>
                </div>
                <div>
                  <span>İsteğe bağlı analitik</span>
                  <button
                    aria-pressed={game.analytics.enabled}
                    onClick={() => setAnalytics(!game.analytics.enabled)}
                  >
                    {game.analytics.enabled ? "Açık · kapat" : "Kapalı · aç"}
                  </button>
                </div>
                <p>
                  Karar olayları yalnız yerel kuyrukta tutulur; kişisel bilgi
                  içermez. Kapatmak kuyruğu temizler.
                </p>
                <button
                  className={resetArmed ? "danger-confirm" : "secondary"}
                  onClick={() => {
                    if (resetArmed) {
                      setResetArmed(false);
                      setSettingsOpen(false);
                      void reset();
                    } else setResetArmed(true);
                  }}
                >
                  {resetArmed
                    ? "Tüm kariyeri kalıcı olarak sıfırla"
                    : "Kariyeri sıfırlama seçenekleri"}
                </button>
                {resetArmed ? (
                  <button
                    className="text-button"
                    onClick={() => setResetArmed(false)}
                  >
                    Vazgeç
                  </button>
                ) : null}
              </section>
            ) : null}
            <section className="score-card">
              <small>GERÇEKLEŞEN KÂR</small>
              <strong className={game.realizedProfitMinor < 0 ? "loss" : ""}>
                {money(game.realizedProfitMinor)}
              </strong>
              <p>
                Nakit, aktif varlık değeri ve gerçekleşen kâr ayrı hesaplanır.
              </p>
            </section>
            <div className="metric-grid">
              <div>
                <span>Nakit</span>
                <b>{money(game.cashMinor)}</b>
              </div>
              <div>
                <span>Net worth</span>
                <b>{money(total)}</b>
              </div>
              <div>
                <span>Portföy piyasa değeri</span>
                <b>{money(portfolioMarketValue)}</b>
              </div>
              <div>
                <span>Aktif book cost</span>
                <b>{money(activeBookCostMinor(game))}</b>
              </div>
              <div>
                <span>Gerçekleşmemiş tahmin</span>
                <b className={unrealizedEstimate < 0 ? "loss" : ""}>
                  {money(unrealizedEstimate)}
                </b>
              </div>
              <div>
                <span>Likidite oranı</span>
                <b>%{total ? Math.round((game.cashMinor / total) * 100) : 0}</b>
              </div>
            </div>
            <section className="expertise-card">
              <div className="expertise-heading">
                <div>
                  <small>PAZAR OKURYAZARLIĞI</small>
                  <h3>Lv{marketLevel}</h3>
                </div>
                <span>
                  {game.expertise.marketXp} / {marketXpTarget} XP
                </span>
              </div>
              <div className="xp-bar">
                <i
                  style={{
                    width: `${Math.min(
                      100,
                      (game.expertise.marketXp / marketXpTarget) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p>
                {marketLevel < 3
                  ? "Lv3: family alarmları ve trend özeti"
                  : marketLevel < 6
                    ? "Lv6: kanıt güveni ve kusur ihtimali"
                    : "Bilgi araçların kararını netleştirir; fiyat bonusu vermez."}
              </p>
              <div className="category-levels">
                {Object.entries(game.expertise.categoryXp)
                  .sort((left, right) => right[1] - left[1])
                  .map(([category, xp]) => (
                    <span key={category}>
                      {category} · Lv{categoryExpertiseLevel(game, category)}{" "}
                      <small>{xp} XP</small>
                    </span>
                  ))}
              </div>
            </section>
            {game.home.unlocked ? (
              <section className="home-card">
                <div className="home-silhouette" aria-hidden="true">
                  <span>⌂</span>
                </div>
                <div>
                  <small>EV YOLCULUĞU · %{homeProgress}</small>
                  <h3>Kendi alanına giden yol</h3>
                  <p>
                    {homeProgress < 50
                      ? "İlk kârlı satışınla hedef görünür oldu."
                      : `Kalan servet mesafesi ${money(
                          Math.max(0, HOME_GOAL_MINOR - total),
                        )}. Ev alımı için hedefte nakit gerekecek.`}
                  </p>
                  <div className="xp-bar">
                    <i style={{ width: `${homeProgress}%` }} />
                  </div>
                </div>
              </section>
            ) : (
              <section className="locked-home">
                <span>⌂</span>
                <div>
                  <small>UZUN DÖNEM HEDEFİ</small>
                  <h3>Ev yolculuğu henüz görünmedi</h3>
                  <p>
                    Temel döngüyü öğrenip ilk kârlı satışını tamamladığında
                    açılır.
                  </p>
                </div>
              </section>
            )}
            <div className="timeline-header">
              <h3>Kariyer zaman çizelgesi</h3>
              <span>{game.career.length} anlamlı olay</span>
            </div>
            <div className="chips timeline-filters">
              {(
                ["ALL", "FIRSTS", "RECORDS", "MILESTONES", "HOME"] as const
              ).map((filter) => (
                <button
                  className={timelineFilter === filter ? "active" : ""}
                  key={filter}
                  onClick={() => setTimelineFilter(filter)}
                >
                  {filter === "ALL"
                    ? "Tümü"
                    : filter === "FIRSTS"
                      ? "İlkler"
                      : filter === "RECORDS"
                        ? "Rekorlar"
                        : filter === "MILESTONES"
                          ? "Eşikler"
                          : "Ev yolculuğu"}
                </button>
              ))}
            </div>
            {!timeline.length ? (
              <div className="empty compact-empty">
                <h3>Bu grupta olay yok</h3>
                <p>
                  Anlamlı ilkler, rekorlar ve eşikler gerçek işlemlerinden
                  doğar.
                </p>
              </div>
            ) : null}
            <div className="timeline">
              {timeline.map((event) => (
                <article key={event.id}>
                  <div className="timeline-dot" />
                  <div>
                    <small>
                      {event.atGameMin}. OYUN DK · {event.group}
                    </small>
                    <b>{event.label}</b>
                    {event.buyPriceMinor !== undefined &&
                    event.sellPriceMinor !== undefined ? (
                      <p>
                        Alış {money(event.buyPriceMinor)} · Satış{" "}
                        {money(event.sellPriceMinor)} · Kâr{" "}
                        {money(event.realizedProfitMinor ?? 0)}
                      </p>
                    ) : null}
                  </div>
                  {event.amountMinor !== undefined ? (
                    <em>{money(event.amountMinor)}</em>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </main>

      <nav aria-label="Ana bölümler">
        {(["market", "follow", "portfolio", "journey"] as const).map((item) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => navigate(item)}
          >
            <span>
              {item === "market"
                ? "⌂"
                : item === "follow"
                  ? "◇"
                  : item === "portfolio"
                    ? "▣"
                    : "↗"}
            </span>
            {item === "market"
              ? "Pazar"
              : item === "follow"
                ? "Takip"
                : item === "portfolio"
                  ? "Portföy"
                  : "Yolculuk"}
          </button>
        ))}
      </nav>

      {selected ? (
        <div className="scrim" onClick={() => setSelectedId(null)}>
          <section
            className="sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grab" />
            <button
              className="close"
              onClick={() => setSelectedId(null)}
              aria-label="Kapat"
            >
              ×
            </button>
            <ProductVisual
              instance={selected.instance}
              className="hero-art"
              alt={selected.instance.family.name}
            />
            <small>
              {selected.instance.family.category} ·{" "}
              {sellerLabel[selected.seller]} satıcı
            </small>
            <h2>{selected.instance.family.name}</h2>
            <div className="detail-price">
              <strong>{money(selected.priceMinor)}</strong>
              <span
                className={
                  signal(
                    selected,
                    categoryExpertiseLevel(
                      game,
                      selected.instance.family.category,
                    ),
                  ).cls
                }
              >
                {
                  signal(
                    selected,
                    categoryExpertiseLevel(
                      game,
                      selected.instance.family.category,
                    ),
                  ).text
                }
              </span>
            </div>
            <div className="sheet-follow-actions">
              <button
                className={
                  game.follow.watchedListingIds.includes(selected.id)
                    ? "active-watch"
                    : ""
                }
                onClick={() => toggleWatch(selected.id)}
              >
                {game.follow.watchedListingIds.includes(selected.id)
                  ? "◆ Takipten çıkar"
                  : "◇ İlanı takip et"}
              </button>
              {marketLevel >= 3 ? (
                <button
                  onClick={() =>
                    saveSearch(
                      selected.familyId,
                      selected.priceMinor,
                      selected.instance.condition,
                      "ANY",
                    )
                  }
                >
                  Family alarmı kur
                </button>
              ) : (
                <span>Family alarmı Lv3'te açılır</span>
              )}
            </div>
            <div className="band">
              <div>
                <span>Tahmini piyasa bandı</span>
                <b>
                  {money(
                    listingEstimateBand(
                      selected,
                      categoryExpertiseLevel(
                        game,
                        selected.instance.family.category,
                      ),
                    ).lowMinor,
                  )}{" "}
                  –{" "}
                  {money(
                    listingEstimateBand(
                      selected,
                      categoryExpertiseLevel(
                        game,
                        selected.instance.family.category,
                      ),
                    ).highMinor,
                  )}
                </b>
              </div>
              <i>
                <em
                  style={{
                    left: `${Math.max(
                      4,
                      Math.min(
                        94,
                        (selected.priceMinor /
                          (listingEstimateBand(
                            selected,
                            categoryExpertiseLevel(
                              game,
                              selected.instance.family.category,
                            ),
                          ).highMinor || 1)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </i>
            </div>
            <div className="details">
              <div>
                <span>Kondisyon</span>
                <b>%{selected.instance.condition}</b>
              </div>
              <div>
                <span>Kanıt güveni</span>
                <b>{evidenceLabel(selected.instance.evidenceConfidence)}</b>
              </div>
              <div>
                <span>Pazarlık hakkı</span>
                <b>
                  {"● ".repeat(offers)}
                  {"○ ".repeat(2 - offers)}
                </b>
              </div>
            </div>
            <div className="evidence-panel">
              <small>
                KANIT DOSYASI · GÜVEN %
                {Math.round(selected.instance.evidenceConfidence * 100)}
              </small>
              {selected.instance.evidence.map((record) => {
                const definition = selected.instance.family.evidence.find(
                  (item) => item.id === record.definitionId,
                );
                return (
                  <p key={record.definitionId}>
                    <b>{definition?.label}</b> · {record.status}
                  </p>
                );
              })}
              {!ftueActive || game.ftue.stage === "EVIDENCE" ? (
                <div className="inspection-actions">
                  {Object.entries(inspectionOptions).map(([kind, option]) => (
                    <button
                      key={kind}
                      onClick={() =>
                        inspect(
                          selected.id,
                          kind as keyof typeof inspectionOptions,
                        )
                      }
                    >
                      {option.label}
                      <small>
                        {option.durationMin
                          ? `${option.durationMin} dk · pazar ilerler`
                          : "anında"}
                      </small>
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                className="primary"
                onClick={() => {
                  const opening = !comparing;
                  setComparing(opening);
                  if (opening) markCompared(selected.id);
                }}
              >
                {comparing
                  ? "Karşılaştırmayı kapat"
                  : "Benzer ilanlarla karşılaştır"}
              </button>
            </div>
            {comparing ? (
              <div className="compare-stack">
                <h3>
                  Aynı family · {comparableListings(game, selected.id).length}{" "}
                  ilan
                </h3>
                {comparisonRows(comparableListings(game, selected.id)).map(
                  (row) => (
                    <div
                      className={
                        row.different ? "compare-row different" : "compare-row"
                      }
                      key={row.label}
                    >
                      <b>{row.label}</b>
                      <span>
                        {row.values.map((value, index) => (
                          <em key={`${value}-${index}`}>
                            {row.label === "Fiyat"
                              ? money(Number(value))
                              : value}
                          </em>
                        ))}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : null}
            {(!ftueActive || game.ftue.stage === "NEGOTIATION") &&
            negotiating?.counterMinor ? (
              <button
                className="counter-offer"
                onClick={() => {
                  if (buy(selected, negotiating.counterMinor))
                    setSelectedId(null);
                }}
              >
                Karşı teklifi kabul et · {money(negotiating.counterMinor)}
              </button>
            ) : null}
            {!ftueActive || game.ftue.stage === "NEGOTIATION" ? (
              selected.priceMinor > game.cashMinor && !ftueActive ? (
                <div className="cash-shortfall">
                  <p>
                    {money(selected.priceMinor - game.cashMinor)} nakit eksik.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      navigate("portfolio");
                      setPortfolioSegment("listings");
                    }}
                  >
                    Portföyden çıkış planla
                  </button>
                </div>
              ) : (
                <div className="sheet-actions">
                  <button onClick={() => offer(selected)}>
                    Pazarlık et{" "}
                    <small>
                      {offers ? `${offers} hakkın var` : "Görüşme kapandı"}
                    </small>
                  </button>
                  {!ftueActive ? (
                    <button
                      className="primary"
                      onClick={() => {
                        if (buy(selected)) setSelectedId(null);
                      }}
                    >
                      Hemen al <small>{money(selected.priceMinor)}</small>
                    </button>
                  ) : null}
                </div>
              )
            ) : (
              <p className="decision-lock">
                Karar sırası: karşılaştır → kanıtı kontrol et → pazarlık.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
