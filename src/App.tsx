import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import "./App.css";
import { assetFor } from "./assets";
import {
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
import { activeMarketListings, npcRiskSignal } from "./domain/world";
import { HOME_GOAL_MINOR, money, signal, wealth } from "./game";
import { useGameStore } from "./stores/gameStore";

type Tab = "market" | "inventory" | "listings" | "wealth";
const sellerLabel = {
  urgent: "Acilci",
  expert: "Piyasacı",
  uninformed: "Bilgisiz",
  emotional: "Duygusal",
  merchant: "Tüccar",
  risky: "Riskli",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("market");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
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
  const selected =
    marketListings.find((listing) => listing.id === selectedId) ?? null;
  const inventory = inventoryAssets(game);
  const playerListings = activePlayerListings(game).flatMap((listing) => {
    const asset = game.ownedAssets.find(
      (item) => item.id === listing.ownedAssetId,
    );
    return asset ? [{ listing, asset }] : [];
  });
  const negotiation =
    selected && game.negotiation?.listingId === selected.id
      ? game.negotiation
      : undefined;
  const offers = negotiation?.offersRemaining ?? 2;

  return (
    <div className="app-shell">
      <header>
        <div>
          <span className="eyebrow">TRADEUP</span>
          <h1>Zero to Home</h1>
        </div>
        <button className="icon-button" onClick={scan} aria-label="Pazarı tara">
          ↻
        </button>
      </header>
      <section className="wallet">
        <div>
          <small>Nakit</small>
          <strong>{money(game.cashMinor)}</strong>
        </div>
        <div>
          <small>Tahmini servet</small>
          <strong>{money(total)}</strong>
        </div>
        <div className="goal">
          <small>
            Ev hedefi ·{" "}
            {Math.min(100, Math.floor((total / HOME_GOAL_MINOR) * 100))}%
          </small>
          <span>
            <i
              style={{
                width: `${Math.min(100, (total / HOME_GOAL_MINOR) * 100)}%`,
              }}
            />
          </span>
        </div>
      </section>
      <div className="notice" role="status">
        {notice}
      </div>
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
              {marketListings.map((item) => {
                const itemSignal = signal(item);
                const risk = npcRiskSignal(item, game.gameTimeMin);
                return (
                  <button
                    className="listing"
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="product-art">
                      <img
                        src={assetFor(item.instance.family.assetKey)}
                        alt=""
                      />
                    </div>
                    <div className="listing-copy">
                      <div className="meta">
                        <span>{item.instance.family.category}</span>
                        <span>{risk.text}</span>
                      </div>
                      <h3>{item.instance.family.name}</h3>
                      <div className="tags">
                        <b className={itemSignal.cls}>{itemSignal.text}</b>
                        <span>%{item.instance.condition} kondisyon</span>
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
        {tab === "inventory" ? (
          <>
            <div className="section-title">
              <div>
                <small>STOK</small>
                <h2>Envanterim</h2>
              </div>
              <span>{inventory.length} ürün</span>
            </div>
            {!inventory.length ? (
              <div className="empty">
                <span>📦</span>
                <h3>Envanterin boş</h3>
                <p>
                  Pazardan bir fırsat al veya küçük ürünlerle yeniden başla.
                </p>
                <button onClick={() => setTab("market")}>Pazara git</button>
              </div>
            ) : null}
            <div className="inventory-grid">
              {inventory.map((item) => {
                const quote = quoteAssetExit(item);
                return (
                  <article className="owned" key={item.id}>
                    <div className="owned-icon">
                      <img
                        src={assetFor(item.instance.family.assetKey)}
                        alt=""
                      />
                    </div>
                    <div>
                      <h3>{item.instance.family.name}</h3>
                      <p>
                        Maliyet {money(item.bookCostMinor)} · Kondisyon %
                        {item.instance.condition}
                      </p>
                    </div>
                    <div className="sell-actions">
                      {item.instance.family.preparation
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
                        ))}
                      <button onClick={() => sell(item, true)}>
                        Hızlı sat <b>{money(quote.quickSaleMinor)}</b>
                      </button>
                      <button
                        className="primary"
                        onClick={() => list(item, quote.balancedAskingMinor)}
                      >
                        Piyasaya koy <b>{money(quote.balancedAskingMinor)}</b>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
        {tab === "listings" ? (
          <>
            <div className="section-title">
              <div>
                <small>BENİM PAZARIM</small>
                <h2>İlanlarım</h2>
              </div>
              <span>{playerListings.length} aktif</span>
            </div>
            {!playerListings.length && !game.buyerOffers.length ? (
              <div className="empty">
                <span>🧾</span>
                <h3>Henüz ilan yok</h3>
                <p>
                  Envanterden bir ürün seçip piyasaya koy. Piyasa ilerledikçe
                  alıcılar teklif verir.
                </p>
              </div>
            ) : null}
            <div className="inventory-grid">
              {playerListings.map(({ listing, asset }) => (
                <article className="owned" key={listing.id}>
                  <div className="owned-icon">
                    <img
                      src={assetFor(asset.instance.family.assetKey)}
                      alt=""
                    />
                  </div>
                  <div>
                    <h3>{asset.instance.family.name}</h3>
                    <p>
                      İlan fiyatı {money(listing.askingPriceMinor)} · İlgi %
                      {listing.interest}
                    </p>
                  </div>
                  <div className="sell-actions">
                    <button
                      className="primary"
                      onClick={() => withdrawListing(listing.id)}
                    >
                      İlanı geri çek
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {game.buyerOffers.map((buyerOffer) => (
              <article className="owned" key={buyerOffer.id}>
                <div className="owned-icon">🤝</div>
                <div>
                  <h3>{buyerOffer.buyer} teklif verdi</h3>
                  <p>{money(buyerOffer.amountMinor)} · Teklif süresi sınırlı</p>
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
            ))}
          </>
        ) : null}
        {tab === "wealth" ? (
          <>
            <div className="section-title">
              <div>
                <small>KARİYER</small>
                <h2>Servet yolculuğu</h2>
              </div>
            </div>
            <section className="score-card">
              <small>GERÇEKLEŞEN KÂR</small>
              <strong className={game.realizedProfitMinor < 0 ? "loss" : ""}>
                {money(game.realizedProfitMinor)}
              </strong>
              <p>
                Nakit ve aktif varlık değeri ayrı tutulur. Gerçek kâr satış
                tamamlandığında yazılır.
              </p>
            </section>
            <div className="stats">
              <div>
                <span>Likidite oranı</span>
                <b>%{total ? Math.round((game.cashMinor / total) * 100) : 0}</b>
              </div>
              <div>
                <span>Kariyer olayı</span>
                <b>{game.career.length}</b>
              </div>
              <div>
                <span>Ev hedefi</span>
                <b>{money(HOME_GOAL_MINOR)}</b>
              </div>
            </div>
            <div className="timeline">
              {game.career
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div key={event.id}>
                    <span>{event.atGameMin}. oyun dk.</span>
                    <b>{event.label}</b>
                    <em>
                      {event.amountMinor !== undefined
                        ? money(event.amountMinor)
                        : ""}
                    </em>
                  </div>
                ))}
            </div>
            <button className="danger" onClick={() => void reset()}>
              Kariyeri sıfırla
            </button>
          </>
        ) : null}
      </main>
      <nav>
        <button
          className={tab === "market" ? "active" : ""}
          onClick={() => setTab("market")}
        >
          <span>⌂</span>Pazar
        </button>
        <button
          className={tab === "inventory" ? "active" : ""}
          onClick={() => setTab("inventory")}
        >
          <span>▣</span>Envanter
        </button>
        <button
          className={tab === "listings" ? "active" : ""}
          onClick={() => setTab("listings")}
        >
          <span>♢</span>İlanlarım
        </button>
        <button
          className={tab === "wealth" ? "active" : ""}
          onClick={() => setTab("wealth")}
        >
          <span>↗</span>Servet
        </button>
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
            <div className="hero-art">
              <img
                src={assetFor(selected.instance.family.assetKey)}
                alt={selected.instance.family.name}
              />
            </div>
            <small>
              {selected.instance.family.category} ·{" "}
              {sellerLabel[selected.seller]} satıcı
            </small>
            <h2>{selected.instance.family.name}</h2>
            <div className="detail-price">
              <strong>{money(selected.priceMinor)}</strong>
              <span className={signal(selected).cls}>
                {signal(selected).text}
              </span>
            </div>
            <div className="band">
              <div>
                <span>Tahmini piyasa bandı</span>
                <b>
                  {money(listingEstimateBand(selected).lowMinor)} –{" "}
                  {money(listingEstimateBand(selected).highMinor)}
                </b>
              </div>
              <i>
                <em
                  style={{
                    left: `${Math.max(4, Math.min(94, (selected.priceMinor / (listingEstimateBand(selected).highMinor || 1)) * 100))}%`,
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
                <span>İlgi</span>
                <b>%{selected.interest}</b>
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
              <button
                className="primary"
                onClick={() => setComparing((value) => !value)}
              >
                {comparing
                  ? "Karşılaştırmayı kapat"
                  : "Benzer ilanlarla karşılaştır"}
              </button>
            </div>
            {comparing ? (
              <div className="compare-stack">
                <h3>
                  Aynı aile · {comparableListings(game, selected.id).length}{" "}
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
            {negotiation?.counterMinor ? (
              <button
                className="counter-offer"
                onClick={() => {
                  if (buy(selected, negotiation.counterMinor))
                    setSelectedId(null);
                }}
              >
                Karşı teklifi kabul et · {money(negotiation.counterMinor)}
              </button>
            ) : null}
            <div className="sheet-actions">
              <button onClick={() => offer(selected)}>
                Pazarlık et{" "}
                <small>
                  {offers ? `${offers} hakkın var` : "Görüşme kapandı"}
                </small>
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (buy(selected)) setSelectedId(null);
                }}
              >
                Hemen al <small>{money(selected.priceMinor)}</small>
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
