/* ThunderOne design tokens.
   GENERATED from skills/thunderone-ui/tokens.json by scripts/build.mjs. Do not edit by hand. */

export const t1Tokens = {
  "bg": {
    "primary": "#F9FAFB",
    "primaryStrong": "#F3F4F6",
    "secondary": "#E5E7EB",
    "tertiary": "#D1D5DB",
    "inverse": "#111827",
    "brand": "#286EF9"
  },
  "surface": {
    "default": "#FFFFFF",
    "raised": "#E5E7EB",
    "overlay": "#111827"
  },
  "text": {
    "primary": "#111827",
    "secondary": "#374151",
    "tertiary": "#9CA3AF",
    "inverse": "#FFFFFF",
    "brand": "#0551DE"
  },
  "border": {
    "default": "#D1D5DB",
    "subtle": "#E5E7EB",
    "strong": "#9CA3AF",
    "brand": "#0551DE",
    "focus": "#0444BB"
  },
  "action": {
    "primary": "#286EF9",
    "primaryHover": "#0551DE",
    "primaryPressed": "#0444BB",
    "subduedMenu": "#E9F4FF",
    "subdued": "#E8F0FE",
    "subdued2": "#DEE9FE",
    "subduedHover": "#BBD2FE",
    "subduedPressed": "#98BCFD",
    "secondary": "#E5E7EB",
    "destructive": "#EF4444"
  },
  "status": {
    "success": "#10B981",
    "successBg": "#ECFDF5",
    "warning": "#F59E0B",
    "warningBg": "#FFFBEB",
    "error": "#EF4444",
    "errorBg": "#FEF2F2",
    "info": "#286EF9",
    "infoBg": "#DEE9FE",
    "inProgress": "#8B5CF6",
    "inProgressBg": "#F5F3FF"
  },
  "primitive": {
    "white": "#FFFFFF",
    "black": "#000000",
    "blue": {
      "50": "#DEE9FE",
      "100": "#BBD2FE",
      "200": "#98BCFD",
      "300": "#75A5FC",
      "400": "#528EFB",
      "500": "#0C60FA",
      "600": "#0551DE",
      "700": "#0444BB",
      "800": "#033898",
      "900": "#022B75",
      "1000": "#021E52",
      "1100": "#010F29"
    },
    "gray": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "300": "#D1D5DB",
      "400": "#9CA3AF",
      "500": "#6B7280",
      "600": "#4B5563",
      "700": "#374151",
      "800": "#1F2937",
      "900": "#111827"
    },
    "green": {
      "50": "#ECFDF5",
      "100": "#D1FAE5",
      "300": "#6EE7B7",
      "500": "#10B981",
      "700": "#047857",
      "900": "#064E3B"
    },
    "red": {
      "50": "#FEF2F2",
      "100": "#FEE2E2",
      "300": "#FCA5A5",
      "500": "#EF4444",
      "700": "#B91C1C",
      "900": "#7F1D1D"
    },
    "amber": {
      "50": "#FFFBEB",
      "100": "#FEF3C7",
      "300": "#FCD34D",
      "500": "#F59E0B",
      "700": "#B45309",
      "900": "#78350F"
    },
    "purple": {
      "50": "#F5F3FF",
      "100": "#EDE9FE",
      "300": "#C4B5FD",
      "500": "#8B5CF6",
      "700": "#6D28D9",
      "900": "#4C1D95"
    }
  },
  "radius": {
    "xs": 4,
    "sm": 6,
    "md": 10,
    "lg": 12,
    "xl": 16,
    "pill": 9999
  },
  "shadow": {
    "card": "0px 1px 2px rgba(15, 23, 39, 0.04)",
    "control": "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)",
    "ring": "0px 0px 0px 4px #FFFFFF",
    "dropdown": "0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12), 0px 9px 28px 8px rgba(0, 0, 0, 0.05)"
  },
  "font": "'Manrope', system-ui, sans-serif",
  "layout": {
    "sidebar": 224,
    "header": 69,
    "contentPaddingX": 24,
    "contentPaddingTop": 20,
    "cardPadding": 16,
    "gridGap": 12
  }
} as const;

export type T1Tokens = typeof t1Tokens;
