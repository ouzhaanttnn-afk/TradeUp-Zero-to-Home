export type IconName =
  "close" | "follow" | "home" | "journey" | "offer" | "portfolio" | "refresh";

interface IconProps {
  name: IconName;
  className?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  follow: (
    <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3.35L7 21Z" />
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
