import { useMemo } from "react";
import { careerRecords } from "../domain/careerRecords";
import type { GameState } from "../domain/models";
import { money } from "../game";
import { useTranslation } from "../i18n";
import { careerCopy } from "./careerPresentation";

export default function CareerRecordsCard({
  game,
  onOpenMemory,
  status,
}: {
  game: GameState;
  onOpenMemory: () => void;
  status: "IDLE" | "SAVING" | "FAILED";
}) {
  const { lang } = useTranslation();
  const copy = careerCopy(lang);
  const records = useMemo(
    () =>
      careerRecords({
        ownedAssets: game.ownedAssets,
        transactionJournal: game.transactionJournal,
      }),
    [game.ownedAssets, game.transactionJournal],
  );
  return (
    <section className="career-records-card">
      {game.firstHomeSummary ? (
        <div className="career-memory-entry">
          <div>
            <small>{copy.completed}</small>
            <strong>{copy.owned}</strong>
          </div>
          <button
            className="secondary"
            disabled={status === "SAVING"}
            onClick={onOpenMemory}
          >
            {status === "SAVING"
              ? copy.saving
              : status === "FAILED"
                ? copy.retry
                : copy.memory}
          </button>
        </div>
      ) : null}
      {status === "FAILED" ? <p role="alert">{copy.saveFailed}</p> : null}
      <details className="career-records-disclosure">
        <summary>{copy.records}</summary>
        <dl>
          <div>
            <dt>{copy.trades}</dt>
            <dd>{records.marketTradeCount}</dd>
          </div>
          <div>
            <dt>{copy.profit}</dt>
            <dd>{money(records.marketProfitMinor, lang)}</dd>
          </div>
          <div>
            <dt>{copy.budget}</dt>
            <dd>
              {records.firstHomeBudgetTradeCount === undefined
                ? copy.pending
                : `${records.firstHomeBudgetTradeCount} ${copy.trades.toLocaleLowerCase(lang)}`}
            </dd>
          </div>
          <div>
            <dt>{copy.hundred}</dt>
            <dd>
              {records.profitAt100Minor === undefined
                ? copy.pending
                : money(records.profitAt100Minor, lang)}
            </dd>
          </div>
        </dl>
        {!records.complete ? <p>{copy.noRecords}</p> : null}
        <p>{copy.local}</p>
      </details>
    </section>
  );
}
