export interface LogoMarkProps {
  className?: string;
  /** 'standard' for >= 24px (default), 'small' for 16-24px optical cut */
  cut?: "standard" | "small";
  /** monochrome draws all rays in the ground stroke color */
  monochrome?: boolean;
  /** 'ink' (default: white ground / spectral rays) or 'bone' (black ground / deep spectral rays) */
  ground?: "ink" | "bone";
}

/**
 * The forthe.tech mark:
 * Apex 55°, n 1.505, incident angle +16.5°, rays at -4°, -16.5°, -29°.
 * Standard cut: viewBox="-2.01 1.9 44.13 29.2", stroke-width 2.2 (for >= 24px)
 * Small cut: viewBox="0.42 1.45 41.22 30.1", stroke-width 3.1 (for 16-24px)
 * Crucial rule: Absolutely no beam inside the glass — light exists in the air, not as ink inside the glass.
 */
export function LogoMark({
  className = "h-8 w-10",
  cut = "standard",
  monochrome = false,
  ground = "ink",
}: LogoMarkProps) {
  const isBone = ground === "bone";
  const strokeColor = "currentColor";
  const ray1 = monochrome ? strokeColor : isBone ? "#AE4024" : "#D96346";
  const ray2 = monochrome ? strokeColor : isBone ? "#906A21" : "#CBA666";
  const ray3 = monochrome ? strokeColor : isBone ? "#496297" : "#899FCC";

  if (cut === "small") {
    return (
      <svg
        viewBox="0.42 1.45 41.22 30.1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M17 4L30 29L4 29Z" stroke={strokeColor} strokeWidth="3.1" />
        <path d="M2.97 20.84L9.20 19.00" stroke={strokeColor} strokeWidth="3.1" />
        <path d="M23.28 16.07L37.84 17.09" stroke={ray1} strokeWidth="3.1" />
        <path d="M24.80 19.00L38.79 23.14" stroke={ray2} strokeWidth="3.1" />
        <path d="M26.32 21.93L39.09 29.00" stroke={ray3} strokeWidth="3.1" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="-2.01 1.9 44.13 29.2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 4L30 29L4 29Z" stroke={strokeColor} strokeWidth="2.2" />
      <path d="M0.09 21.70L9.20 19.00" stroke={strokeColor} strokeWidth="2.2" />
      <path d="M23.60 16.69L39.44 17.80" stroke={ray1} strokeWidth="2.2" />
      <path d="M24.80 19.00L40.02 23.51" stroke={ray2} strokeWidth="2.2" />
      <path d="M26.00 21.31L39.89 29.00" stroke={ray3} strokeWidth="2.2" />
    </svg>
  );
}

/** Keep the shared mark wrapper; the wireframe sits directly on the obsidian surface. */
export function LogoTile({
  className = "h-8 w-10",
  cut = "standard",
  monochrome = false,
  ground = "ink",
}: LogoMarkProps) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center text-ink ${className}`}>
      <LogoMark className="h-full w-full" cut={cut} monochrome={monochrome} ground={ground} />
    </span>
  );
}

/** Lowercase sans-serif lockup (DM Sans 600 SemiBold), with the clay full stop as its only typographic accent. */
export function Wordmark({
  className = "",
  ground = "ink",
}: {
  className?: string;
  ground?: "ink" | "bone";
}) {
  const dotColor = ground === "bone" ? "text-[#ae4024]" : "text-[#d96346]";
  return (
    <span
      className={`whitespace-nowrap font-sans font-semibold leading-none tracking-tight text-ink ${className}`}
    >
      for the tech<span className={dotColor}>.</span>
    </span>
  );
}

/**
 * Vector outlined wordmark for standalone SVG uses where webfonts are unavailable.
 * DM Sans 600 SemiBold outlines + clay full stop circle.
 */
export function WordmarkOutlined({
  className = "",
  color = "currentColor",
  ground = "ink",
}: {
  className?: string;
  color?: string;
  ground?: "ink" | "bone";
}) {
  const dotColor = ground === "bone" ? "#AE4024" : "#D96346";
  return (
    <svg viewBox="0 -760 5494.4 780" className={className} fill="none" aria-hidden="true">
      <path
        d="M208 0V-710H334V-486H504V-382H334V0H208ZM540 0V-524H660V-448C684-496 738-534 812-534C824-534 838-532 848-528V-406C834-410 820-412 804-412C720-412 666-350 666-246V0H540ZM1520 -262C1520 -106 1394 10 1234 10C1074 10 948 -106 948 -262C948 -418 1074 -534 1234 -534C1394 -534 1520 -418 1520 -262ZM1394 -262C1394 -354 1324 -430 1234 -430C1144 -430 1074 -354 1074 -262C1074 -170 1144 -94 1234 -94C1324 -94 1394 -170 1394 -262ZM2016 0V-710H2142V-374H2356V-710H2482V0H2356V-270H2142V0H2016ZM2972 -186L3092 -164C3068 -50 2978 10 2830 10C2652 10 2542 -106 2542 -262C2542 -418 2664 -534 2824 -534C2988 -534 3094 -418 3090 -240H2668C2674 -150 2736 -92 2834 -92C2904 -92 2956 -128 2972 -186ZM2670 -326H2964C2958 -398 2904 -436 2824 -436C2744 -436 2684 -396 2670 -326ZM3448 0V-426H3334V-524H3448V-646H3574V-524H3720V-426H3574V-28C3574 14 3614 20 3672 8L3684 98C3608 114 3530 106 3482 72C3456 54 3448 30 3448 0ZM4198 -186L4318 -164C4294 -50 4204 10 4056 10C3878 10 3768 -106 3768 -262C3768 -418 3890 -534 4050 -534C4214 -534 4320 -418 4316 -240H3894C3900 -150 3962 -92 4060 -92C4130 -92 4182 -128 4198 -186ZM3896 -326H4190C4184 -398 4130 -436 4050 -436C3970 -436 3910 -396 3896 -326ZM4914 -22L4822 66C4762 26 4704 2 4636 2C4486 2 4386 -106 4386 -262C4386 -418 4496 -534 4654 -534C4718 -534 4774 -512 4824 -474L4752 -382C4718 -410 4684 -426 4642 -426C4556 -426 4512 -358 4512 -262C4512 -166 4556 -98 4640 -98C4694 -98 4744 -124 4786 -156L4848 -74C4868 -94 4892 -116 4914 -138V-22ZM4988 0V-710H5114V-332C5144 -382 5202 -422 5276 -422C5396 -422 5464 -346 5464 -218V0H5338V-208C5338 -278 5296 -320 5232 -320C5162 -320 5114 -272 5114 -194V0H4988Z"
        fill={color}
      />
      <circle cx="5409.4" cy="-85" r="85" fill={dotColor} />
    </svg>
  );
}
