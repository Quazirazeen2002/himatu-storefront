import { useId } from "react";
// Original vector studies, deliberately presented as placeholders rather than product photographs.
export function FigureArt({
  variant = "swordsman",
  color = "#b45435",
  hero = false,
}: {
  variant?: string;
  color?: string;
  hero?: boolean;
}) {
  const gradientId = useId();
  const sword = variant === "swordsman" || variant === "sorcerer";
  return (
    <svg
      viewBox="0 0 500 600"
      className={`figure-art ${hero ? "figure-art--hero" : ""}`}
      role="img"
      aria-label={`Concept figure silhouette: ${variant}. Placeholder artwork, not a product photograph.`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4b4b49" />
          <stop offset=".55" stopColor="#242423" />
          <stop offset="1" stopColor="#101010" />
        </linearGradient>
      </defs>
      <ellipse cx="250" cy="554" rx="138" ry="17" fill="#111" opacity=".09" />
      <path
        d="M134 531 245 507 365 531 365 549 250 572 134 548Z"
        fill="#242423"
      />
      <path d="m134 531 116 23 115-23-120-24Z" fill="#555550" />
      <g
        fill={`url(#${gradientId})`}
        stroke="#111"
        strokeWidth="1.3"
        strokeLinejoin="round"
      >
        <path d="m225 339-25 94-45 79 40 15 57-77 18-61 22 67 39 65 38-16-35-84-13-100Z" />
        <path d="m157 506-18 25 58 6 13-18ZM327 508l-1 24 57 1-18-29Z" />
        <path d="m205 186-40 23-25 91 34 21 31-65-9 99 61 34 78-40-30-96 32 58 37-25-43-81-50-22Z" />
        <path d="m199 219-35 74-28 30 13 17 44-34 28-59M301 220l35 54 25 20 19-11-25-35-28-43" />
        <path d="m211 178 10-30 65-1 12 40-39 36Z" fill="#a49b89" />
        <path
          d="m211 101 25-18 36 1 24 25-5 47-25 28-32-14-24-32Z"
          fill="#b3a797"
        />
        {variant === "pirate" ? (
          <>
            <ellipse cx="253" cy="106" rx="65" ry="12" fill="#c4ad76" />
            <path d="m218 100 7-38 49-4 18 42Z" fill="#c4ad76" />
            <path d="m221 89 66-2 3 11-71 2Z" fill={color} />
          </>
        ) : (
          <path
            d="m207 119-10-29 24 5-5-25 24 14 10-28 12 24 30-14-8 27 27-2-15 38-11-21-25 5-19-5-16 22Z"
            fill={variant === "sorcerer" ? "#d6d4ce" : "#20201e"}
          />
        )}
        {variant === "ninja" && (
          <path d="m209 112 81-4 1 16-79 6Z" fill="#777b7b" />
        )}
        <path d="m211 189 43 31 43-34-12 79-28 72-48-58Z" fill={color} />
        <path d="m202 190-33 18 20 67-20 112 49-15 22-89ZM297 185l35 20-6 71 37 111-51-20-38-86Z" />
        <path d="m214 326 89-7 8 19-101 12Z" fill="#8b8170" />
        {sword && (
          <>
            <path d="m99 415 265-268 4 5-257 276Z" fill="#c7c7bd" />
            <path d="m93 423 43-44 9 9-42 46Z" fill="#333" />
            <path d="m119 378 24 26 6-6-24-26Z" fill={color} />
          </>
        )}
        <path
          d="m242 121 10 1m21-3 9-1m-24 27 15-2"
          fill="none"
          stroke="#38342e"
          strokeWidth="3"
        />
        <path
          d="m222 232 12 46-17 37m78-55 12 39m-81 80-14 54m75-53 23 67"
          fill="none"
          stroke="#fff"
          opacity=".13"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}
