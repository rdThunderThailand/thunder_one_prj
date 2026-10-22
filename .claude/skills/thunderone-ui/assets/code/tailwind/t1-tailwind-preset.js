// ThunderOne — Tailwind v3 preset.
// GENERATED from skills/thunderone-ui/tokens.json by scripts/build.mjs. Do not edit by hand.
// tailwind.config: presets: [require('./t1-tailwind-preset.js')]
/** @type {import('tailwindcss').Config} */
module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "border": "hsl(var(--border) / <alpha-value>)",
        "input": "hsl(var(--input) / <alpha-value>)",
        "ring": "hsl(var(--ring) / <alpha-value>)",
        "background": "hsl(var(--background) / <alpha-value>)",
        "foreground": "hsl(var(--foreground) / <alpha-value>)",
        "primary": {
          "DEFAULT": "hsl(var(--primary) / <alpha-value>)",
          "foreground": "hsl(var(--primary-foreground) / <alpha-value>)"
        },
        "secondary": {
          "DEFAULT": "hsl(var(--secondary) / <alpha-value>)",
          "foreground": "hsl(var(--secondary-foreground) / <alpha-value>)"
        },
        "muted": {
          "DEFAULT": "hsl(var(--muted) / <alpha-value>)",
          "foreground": "hsl(var(--muted-foreground) / <alpha-value>)"
        },
        "accent": {
          "DEFAULT": "hsl(var(--accent) / <alpha-value>)",
          "foreground": "hsl(var(--accent-foreground) / <alpha-value>)"
        },
        "destructive": {
          "DEFAULT": "hsl(var(--destructive) / <alpha-value>)",
          "foreground": "hsl(var(--destructive-foreground) / <alpha-value>)"
        },
        "card": {
          "DEFAULT": "hsl(var(--card) / <alpha-value>)",
          "foreground": "hsl(var(--card-foreground) / <alpha-value>)"
        },
        "popover": {
          "DEFAULT": "hsl(var(--popover) / <alpha-value>)",
          "foreground": "hsl(var(--popover-foreground) / <alpha-value>)"
        },
        "sidebar": {
          "DEFAULT": "hsl(var(--sidebar-background) / <alpha-value>)",
          "foreground": "hsl(var(--sidebar-foreground) / <alpha-value>)",
          "primary": "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          "accent": "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          "border": "hsl(var(--sidebar-border) / <alpha-value>)",
          "ring": "hsl(var(--sidebar-ring) / <alpha-value>)"
        },
        "success": {
          "DEFAULT": "hsl(var(--success) / <alpha-value>)",
          "foreground": "hsl(var(--success-foreground) / <alpha-value>)",
          "muted": "hsl(var(--success-muted) / <alpha-value>)"
        },
        "warning": {
          "DEFAULT": "hsl(var(--warning) / <alpha-value>)",
          "foreground": "hsl(var(--warning-foreground) / <alpha-value>)",
          "muted": "hsl(var(--warning-muted) / <alpha-value>)"
        },
        "error": {
          "DEFAULT": "hsl(var(--error) / <alpha-value>)",
          "foreground": "hsl(var(--error-foreground) / <alpha-value>)",
          "muted": "hsl(var(--error-muted) / <alpha-value>)"
        },
        "info": {
          "DEFAULT": "hsl(var(--info) / <alpha-value>)",
          "foreground": "hsl(var(--info-foreground) / <alpha-value>)",
          "muted": "hsl(var(--info-muted) / <alpha-value>)"
        },
        "in-progress": {
          "DEFAULT": "hsl(var(--in-progress) / <alpha-value>)",
          "muted": "hsl(var(--in-progress-muted) / <alpha-value>)"
        },
        "t1": {
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
        }
      },
      "fontFamily": {
        "sans": [
          "Manrope",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif"
        ]
      },
      "borderRadius": {
        "xs": "4px",
        "sm": "6px",
        "md": "10px",
        "lg": "var(--radius)",
        "xl": "16px",
        "card": "16px",
        "control": "12px",
        "nav": "10px",
        "pill": "9999px"
      },
      "boxShadow": {
        "panel": "0px 1px 2px rgba(15, 23, 39, 0.04)",
        "control": "0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "dropdown": "0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12), 0px 9px 28px 8px rgba(0, 0, 0, 0.05)"
      },
      "spacing": {
        "sidebar": "224px",
        "header": "69px"
      },
      "width": {
        "sidebar": "224px",
        "search": "448px"
      },
      "height": {
        "header": "69px",
        "nav": "32px",
        "control": "32px"
      },
      "fontSize": {
        "page-title": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.5px",
            "fontWeight": "800"
          }
        ],
        "kpi": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.6px",
            "fontWeight": "700"
          }
        ],
        "label": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.1px"
          }
        ]
      }
    }
  }
};
