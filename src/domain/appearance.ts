import type { EntitlementId, EntitlementState } from "./models";

export type ShellTheme = "classic" | "obsidian" | "night-market" | "workshop";
export type HomeInteriorStyle = "classic" | "modern" | "heritage" | "coastal";

export type AppearancePreferences = {
  shellTheme: ShellTheme;
  homeInteriorStyle: HomeInteriorStyle;
};

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  shellTheme: "classic",
  homeInteriorStyle: "classic",
};

const themeEntitlement: Partial<Record<ShellTheme, EntitlementId>> = {
  obsidian: "premium_lifetime",
  "night-market": "theme_night_market",
  workshop: "theme_workshop",
};

const owns = (entitlements: readonly EntitlementState[], id: EntitlementId) =>
  entitlements.some((entry) => entry.entitlementId === id && entry.status === "OWNED");

export const canUseShellTheme = (
  theme: ShellTheme,
  entitlements: readonly EntitlementState[],
) => theme === "classic" || owns(entitlements, themeEntitlement[theme]!);

export const canUseHomeInteriorStyle = (
  style: HomeInteriorStyle,
  entitlements: readonly EntitlementState[],
) => style === "classic" || owns(entitlements, "home_styles_01");

export const sanitizeAppearance = (
  value: Partial<AppearancePreferences> | undefined,
  entitlements: readonly EntitlementState[],
): AppearancePreferences => {
  const shellTheme = value?.shellTheme ?? "classic";
  const homeInteriorStyle = value?.homeInteriorStyle ?? "classic";
  return {
    shellTheme: canUseShellTheme(shellTheme, entitlements) ? shellTheme : "classic",
    homeInteriorStyle: canUseHomeInteriorStyle(homeInteriorStyle, entitlements)
      ? homeInteriorStyle
      : "classic",
  };
};
