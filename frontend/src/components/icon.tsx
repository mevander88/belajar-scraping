import type { SVGProps } from "react";

export type IconName =
  | "alert-circle" | "alert-triangle" | "arrow-left" | "arrow-right"
  | "calendar" | "check-circle" | "close" | "external-link" | "home"
  | "inbox" | "library" | "maximize" | "menu" | "pause" | "play"
  | "play-circle" | "refresh" | "search" | "star" | "tags" | "volume" | "volume-off";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { name: IconName };

export function Icon({ name, className = "size-5", ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {name === "alert-circle" && <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
      {name === "alert-triangle" && <><path d="M10.3 4.5 2.8 17.3A1.8 1.8 0 0 0 4.4 20h15.2a1.8 1.8 0 0 0 1.6-2.7L13.7 4.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></>}
      {name === "arrow-left" && <><path d="m15 18-6-6 6-6" /><path d="M9 12h11" /></>}
      {name === "arrow-right" && <><path d="m9 18 6-6-6-6" /><path d="M4 12h11" /></>}
      {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>}
      {name === "check-circle" && <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8" /></>}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
      {name === "external-link" && <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>}
      {name === "home" && <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>}
      {name === "inbox" && <><path d="M4 5h16l1 11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3L4 5Z" /><path d="M3.5 14h5l1.5 2h4l1.5-2h5" /></>}
      {name === "library" && <><path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 4 15-3.5 1z" /></>}
      {name === "maximize" && <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></>}
      {name === "menu" && <path d="M4 7h16M4 12h16M4 17h16" />}
      {name === "pause" && <path d="M9 7v10M15 7v10" />}
      {name === "play" && <path d="m9 7 8 5-8 5V7Z" />}
      {name === "play-circle" && <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>}
      {name === "refresh" && <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>}
      {name === "search" && <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>}
      {name === "star" && <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />}
      {name === "tags" && <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1" /></>}
      {name === "volume" && <><path d="M5 10v4h4l5 4V6L9 10H5Z" /><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" /></>}
      {name === "volume-off" && <><path d="M5 10v4h4l5 4V6L9 10H5Z" /><path d="m17 10 4 4M21 10l-4 4" /></>}
    </svg>
  );
}
