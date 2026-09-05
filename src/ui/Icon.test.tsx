import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Icon, type IconName } from "./Icon";

const iconNames: IconName[] = [
  "close",
  "follow",
  "home",
  "journey",
  "offer",
  "portfolio",
  "refresh",
];

describe("Icon", () => {
  it.each(iconNames)(
    "renders %s as a decorative, non-focusable svg",
    (name) => {
      const markup = renderToStaticMarkup(<Icon name={name} />);

      expect(markup).toContain("<svg");
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain('viewBox="0 0 24 24"');
    },
  );
});
