export type IconName =
  | "analytics"
  | "close"
  | "haptics"
  | "follow"
  | "home"
  | "journey"
  | "motion"
  | "offer"
  | "portfolio"
  | "refresh"
  | "settings"
  | "sound"
  | "store"
  | "text"
  | "sort";

interface IconProps {
  name: IconName;
  className?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  analytics: (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  follow: (
    <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3.35L7 21Z" />
  ),
  haptics: (
    <>
      <rect x="8" y="4" width="8" height="16" rx="2" />
      <path d="M4.5 8.5a5 5 0 0 0 0 7" />
      <path d="M19.5 8.5a5 5 0 0 1 0 7" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  journey: (
    <>
      <path d="M4 18 10 12l4 4 6-8" />
      <path d="M15 8h5v5" />
    </>
  ),
  motion: (
    <>
      <path d="M4 12h10" />
      <path d="m11 8 4 4-4 4" />
      <path d="M19 7v10" />
    </>
  ),
  offer: (
    <>
      <path d="M4 8.5h6l2 2h8" />
      <path d="m17 7.5 3 3-3 3" />
      <path d="M20 15.5h-6l-2-2H4" />
      <path d="m7 12.5-3 3 3 3" />
    </>
  ),
  portfolio: (
    <>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M9 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12h18" />
      <path d="M10 12v2h4v-2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7.5 7.5 0 1 0 .35 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.05 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.2V9.55h.15A1.7 1.7 0 0 0 4.05 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.51 3.2l.06.06A1.7 1.7 0 0 0 8.45 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V1.8h4.05v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.15.62.7 1.55 1.7 1.55h.1v4.05h-.1c-1 0-1.55.78-1.7 1.4Z" />
    </>
  ),
  sound: (
    <>
      <path d="M5 10h3l4-3v10l-4-3H5Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  store: (
    <>
      <path d="M4 9h16l-1 11H5Z" />
      <path d="m5 9 2-5h10l2 5" />
      <path d="M9 12v4" />
      <path d="M15 12v4" />
    </>
  ),
  text: (
    <>
      <path d="M5 5h14" />
      <path d="M12 5v14" />
      <path d="M8 19h8" />
    </>
  ),
  sort: (
    <>
      <path d="M7 4v16" />
      <path d="m4 7 3-3 3 3" />
      <path d="M17 20V4" />
      <path d="m14 17 3 3 3-3" />
    </>
  ),
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}
