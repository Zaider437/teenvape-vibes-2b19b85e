import { SVGProps } from "react";

const PRIMARY = "#e11d74";

export function LoveVapeLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 48"
      role="img"
      aria-label="LoveVape"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="lv-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PRIMARY} />
          <stop offset="100%" stopColor="#ff5fa2" />
        </linearGradient>
      </defs>
      <g transform="translate(4 4)">
        <rect x="0" y="0" width="40" height="40" rx="12" fill="url(#lv-grad)" />
        <path
          d="M9 27c0-5 4-8 8-8 2 0 4 1 5 3 2-3 5-4 8-4 5 0 8 4 8 9 0 4-2 7-5 8-5 1-9-3-14-3-3 0-6 1-8 3-3-1-5-4-5-8z"
          fill="#fff"
          opacity="0.95"
        />
        <circle cx="14" cy="16" r="2" fill="#fff" />
      </g>
      <g transform="translate(52 6)" fontFamily="'Archivo Black', 'Anton', Impact, sans-serif">
        <text x="0" y="20" fontSize="22" fill={PRIMARY} fontWeight="900" letterSpacing="-1">
          Love
        </text>
        <text x="64" y="20" fontSize="22" fill="#ffffff" fontWeight="900" letterSpacing="-1">
          Vape
        </text>
        <text x="0" y="34" fontSize="7" fill="#ffffff" opacity="0.55" letterSpacing="3">
          GRODNO · 18+
        </text>
      </g>
    </svg>
  );
}
