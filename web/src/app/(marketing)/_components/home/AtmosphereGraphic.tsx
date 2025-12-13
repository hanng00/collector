import type { ComponentProps } from "react";

export function AtmosphereGraphic(props: ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="dcGlowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(260 180) rotate(25) scale(520 380)">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#F3EDE4" stopOpacity="0.65" />
          <stop offset="1" stopColor="#F3EDE4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dcGlowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(930 150) rotate(-15) scale(520 360)">
          <stop stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#F3EDE4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F3EDE4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dcLine" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B0B0B" stopOpacity="0" />
          <stop offset="0.5" stopColor="#0B0B0B" stopOpacity="0.16" />
          <stop offset="1" stopColor="#0B0B0B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#dcGlowA)" />
      <rect width="1200" height="800" fill="url(#dcGlowB)" />

      {/* faint ruled lines */}
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 220 + i * 26;
        return (
          <path
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            d={`M120 ${y}H1080`}
            stroke="url(#dcLine)"
            strokeWidth="1"
          />
        );
      })}

      {/* subtle column guides */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 220 + i * 140;
        return (
          <path
            // eslint-disable-next-line react/no-array-index-key
            key={`c-${i}`}
            d={`M${x} 190V710`}
            stroke="#0B0B0B"
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        );
      })}

      {/* a single "red pencil" mark */}
      <path
        d="M360 610C460 584 510 582 640 600C760 616 820 616 910 588"
        stroke="#B61B1B"
        strokeOpacity="0.22"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M360 610C460 584 510 582 640 600C760 616 820 616 910 588"
        stroke="#B61B1B"
        strokeOpacity="0.12"
        strokeWidth="26"
        strokeLinecap="round"
      />
    </svg>
  );
}
