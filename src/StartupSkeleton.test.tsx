import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StartupSkeleton } from "./App";

describe("startup skeleton", () => {
  it("communicates real loading without interactive or financial placeholders", () => {
    const markup = renderToStaticMarkup(<StartupSkeleton />);

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Kayıt yükleniyor"');
    expect(markup).toContain("TRADEUP");
    expect(markup).toContain("Kariyerin hazırlanıyor");
    expect(markup).toContain('class="startup-progress__spinner"');
    expect(markup.match(/<button/g)).toBeNull();
    expect(markup).not.toContain("₺");
  });
});
