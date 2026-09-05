import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StartupSkeleton } from "./App";

describe("startup skeleton", () => {
  it("communicates real loading without interactive or financial placeholders", () => {
    const markup = renderToStaticMarkup(<StartupSkeleton />);

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Kayıt yükleniyor"');
    expect(markup.match(/class="startup-grid"/g)).toHaveLength(1);
    expect(markup.match(/<button/g)).toBeNull();
    expect(markup).not.toContain("₺");
  });
});
