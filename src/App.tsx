import { useEffect, useState } from "react";
import "./App.css";
import { assetFor } from "./assets";
import { HOME_GOAL, money, signal, wealth, type Listing } from "./game";
import { useGameStore } from "./stores/gameStore";
type Tab = "market" | "inventory" | "wealth";
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
  const [selected, setSelected] = useState<Listing | null>(null);
  const { game, notice, hydrate, refresh, buy, offer, sell, reset } =
    useGameStore();
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const total = wealth(game);
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
        <button
          className="icon-button"
          onClick={refresh}
          aria-label="Pazarı yenile"
        >
          ↻
        </button>
      </header>
      <section className="wallet">
        <div>
          <small>Nakit</small>
          <strong>{money(game.cash)}</strong>
        </div>
        <div>
          <small>Tahmini servet</small>
          <strong>{money(total)}</strong>
        </div>
        <div className="goal">
          <small>
            Ev hedefi · {Math.min(100, Math.floor((total / HOME_GOAL) * 100))}%
          </small>
          <span>
            <i
              style={{ width: `${Math.min(100, (total / HOME_GOAL) * 100)}%` }}
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
              <span>{game.listings.length} ilan</span>
            </div>
            <div className="chips">
              <button className="active">Tümü</button>
              <button>İyi fiyat</button>
              <button>Hızlı satıcı</button>
            </div>
            <div className="feed">
              {game.listings.map((item) => {
                const s = signal(item);
                return (
                  <button
                    className="listing"
                    key={item.id}
                    onClick={() => setSelected(item)}
                  >
                    <div className="product-art">
                      <img src={assetFor(item.family.assetKey)} alt="" />
                    </div>
                    <div className="listing-copy">
                      <div className="meta">
                        <span>{item.family.category}</span>
                        <span>canlı</span>
                      </div>
                      <h3>{item.family.name}</h3>
                      <div className="tags">
                        <b className={s.cls}>{s.text}</b>
                        <span>%{item.condition} kondisyon</span>
                      </div>
                    </div>
                    <div className="price">
                      <strong>{money(item.price)}</strong>
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
              <span>{game.inventory.length} ürün</span>
            </div>
            {!game.inventory.length ? (
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
              {game.inventory.map((item) => (
                <article className="owned" key={item.id}>
                  <div className="owned-icon">
                    <img src={assetFor(item.family.assetKey)} alt="" />
                  </div>
                  <div>
                    <h3>{item.family.name}</h3>
                    <p>
                      Alış {money(item.paid)} · Değer {money(item.fair)}
                    </p>
                  </div>
                  <div className="sell-actions">
                    <button onClick={() => sell(item, true)}>
                      Hızlı sat <b>{money(item.fair * 0.82)}</b>
                    </button>
                    <button
                      className="primary"
                      onClick={() => sell(item, false)}
                    >
                      Piyasaya koy <b>{money(item.fair * 1.05)}</b>
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
              <strong className={game.realizedProfit < 0 ? "loss" : ""}>
                {money(game.realizedProfit)}
              </strong>
              <p>
                Nakit ve envanter değeri ayrı tutulur. Gerçek kâr satış
                tamamlandığında yazılır.
              </p>
            </section>
            <div className="stats">
              <div>
                <span>Likidite oranı</span>
                <b>%{total ? Math.round((game.cash / total) * 100) : 0}</b>
              </div>
              <div>
                <span>Kariyer olayı</span>
                <b>{game.career.length}</b>
              </div>
              <div>
                <span>Ev hedefi</span>
                <b>{money(HOME_GOAL)}</b>
              </div>
            </div>
            <div className="timeline">
              {game.career
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div key={event.id}>
                    <span>
                      {new Date(event.at).toLocaleDateString("tr-TR")}
                    </span>
                    <b>{event.label}</b>
                    <em>
                      {event.amount !== undefined ? money(event.amount) : ""}
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
          className={tab === "wealth" ? "active" : ""}
          onClick={() => setTab("wealth")}
        >
          <span>↗</span>Servet
        </button>
      </nav>
      {selected ? (
        <div className="scrim" onClick={() => setSelected(null)}>
          <section className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Kapat"
            >
              ×
            </button>
            <div className="hero-art">
              <img
                src={assetFor(selected.family.assetKey)}
                alt={selected.family.name}
              />
            </div>
            <small>
              {selected.family.category} · {sellerLabel[selected.seller]} satıcı
            </small>
            <h2>{selected.family.name}</h2>
            <div className="detail-price">
              <strong>{money(selected.price)}</strong>
              <span className={signal(selected).cls}>
                {signal(selected).text}
              </span>
            </div>
            <div className="band">
              <div>
                <span>Tahmini piyasa bandı</span>
                <b>
                  {money(selected.fair * 0.9)} – {money(selected.fair * 1.1)}
                </b>
              </div>
              <i>
                <em
                  style={{
                    left: `${Math.max(4, Math.min(94, (selected.price / (selected.fair * 1.2)) * 100))}%`,
                  }}
                />
              </i>
            </div>
            <div className="details">
              <div>
                <span>Kondisyon</span>
                <b>%{selected.condition}</b>
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
            {negotiation?.counter ? (
              <button
                className="counter-offer"
                onClick={() => {
                  if (buy(selected, negotiation.counter)) setSelected(null);
                }}
              >
                Karşı teklifi kabul et · {money(negotiation.counter)}
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
                  if (buy(selected)) setSelected(null);
                }}
              >
                Hemen al <small>{money(selected.price)}</small>
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
