import type { GameState } from "../domain/models";
import type { RadarSignal } from "../domain/marketEvents";
import { Icon } from "./Icon";

const TIER_COPY: Record<
  RadarSignal["tier"],
  { badge: string; detail: string }
> = {
  HIGH: {
    badge: "Talep yüksek",
    detail: "Alıcı hareketliliği arttı",
  },
  RISING: {
    badge: "Yükselişte",
    detail: "Talep güçleniyor",
  },
};

export default function RadarPanel({
  game,
  signal,
  onOpenMarketCategory,
}: {
  game: GameState;
  signal: RadarSignal | null;
  onOpenMarketCategory: (category: string) => void;
}) {
  return (
    <>
      <div className="section-title">
        <div>
          <small>PAZAR RADARI</small>
          <h2>Radar</h2>
        </div>
      </div>
      {signal ? (
        <section className={`radar-card radar-card--${signal.tier}`}>
          <div className="radar-card-heading">
            <span className="radar-badge" aria-hidden="true">
              <Icon name="radar" />
            </span>
            <div>
              <b>{TIER_COPY[signal.tier].badge}</b>
              <small>{signal.message}</small>
            </div>
          </div>
          <div className="radar-categories">
            {signal.categories.map((category) => (
              <button
                key={category}
                onClick={() => onOpenMarketCategory(category)}
                aria-label={`${category} kategorisini pazarda gör`}
              >
                <span>{category}</span>
                <small>{TIER_COPY[signal.tier].detail}</small>
              </button>
            ))}
          </div>
          <p className="radar-effect-note">
            Bu kategorilerde ilanına alıcı teklifi normalden daha hızlı
            gelebilir. Fiyatı mantıksızsa yine de gelmeyebilir.
          </p>
        </section>
      ) : (
        <section className="radar-card radar-card--calm">
          <div className="radar-card-heading">
            <span className="radar-badge" aria-hidden="true">
              <Icon name="radar" />
            </span>
            <div>
              <b>Pazar dengeli</b>
              <small>Şu anda öne çıkan kategori yok</small>
            </div>
          </div>
          <p className="radar-effect-note">
            Radar zaman zaman 1-3 kategoride talep artışı gösterir. Aktif
            olduğunda burada ve o kategorilerdeki ilanlarda görünür.
          </p>
        </section>
      )}
      <p className="radar-footnote">
        Radar dışındaki kategorilerde satış normal şekilde devam eder.
      </p>
      {game.follow.watchedListingIds.length ? (
        <p className="radar-footnote">
          Takip ettiğin ilanlara Pazar sekmesindeki{" "}
          <Icon name="follow" /> simgesinden ulaşabilirsin.
        </p>
      ) : null}
    </>
  );
}
