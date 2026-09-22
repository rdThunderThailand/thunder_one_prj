const fs = require('fs');

function fixLayout() {
  const file = 'src/app/layout.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<<<<<<< HEAD\nconst manrope = Manrope\({\n  variable: "--font-manrope",\n=======\nconst geistMono = Geist_Mono\({\n  variable: "--font-geist-mono",\n>>>>>>> origin\/feat\/people-workspace/g, 
`const geistMono = Geist_Mono({
  variable: "--font-geist-mono",`);
  
  content = content.replace(/<<<<<<< HEAD\n      className=\{`\$\{manrope\.variable\} \$\{geistMono\.variable\} h-full antialiased`\}\n=======\n      className=\{`\$\{geistMono\.variable\} \$\{manrope\.variable\} h-full antialiased`\}\n>>>>>>> origin\/feat\/people-workspace/g, 
`      className={\`\${manrope.variable} \${geistMono.variable} h-full antialiased\`}`);
  
  fs.writeFileSync(file, content);
}

function fixGlobals() {
  const file = 'src/app/globals.css';
  let content = fs.readFileSync(file, 'utf8');
  // Just use HEAD for everything except the last part
  
  // Conflict 1
  content = content.replace(/<<<<<<< HEAD\n \* Design system definition[\s\S]*?=======\n \* Design token system, ported[\s\S]*?>>>>>>> origin\/feat\/people-workspace\n/g, 
` * Design system definition — adopted 2026-09-19 from a shared token set
 * (oklch semantic colors, radius/shadow/z-index/text-size scales, a few
 * custom utilities). Most existing components in this app do NOT use these
 * tokens yet — they were built against hardcoded hex values and Tailwind's
 * default zinc/indigo palette (see e.g. src/components/layout/Sidebar.tsx,
 * most feature pages). This file brings the token system in as a
 * foundation; call sites are being migrated incrementally, not all at once.
 *
 * The @theme inline block maps CSS custom properties to Tailwind utility
 * classes (e.g. --color-primary -> bg-primary, text-primary).
 *
 * The :root and .dark blocks define the actual color values using oklch.
 * All colors MUST use oklch format.
 *
 * To add a new semantic color:
 * 1. Add the variable to :root (light value) and .dark (dark value)
 * 2. Register it in @theme inline as --color-<name>: var(--<name>)
 */
`);

  // Conflict 2
  content = content.replace(/<<<<<<< HEAD\n  --color-ring-offset-background[\s\S]*?=======\n>>>>>>> origin\/feat\/people-workspace\n/g,
`  --color-ring-offset-background: var(--background);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
`);

  // Conflict 3
  content = content.replace(/<<<<<<< HEAD\n  --color-info: var\(--info\);[\s\S]*?=======\n[\s\S]*?>>>>>>> origin\/feat\/people-workspace\n/g,
`  --color-info: var(--info);
  --color-info-soft: var(--info-soft);
  --color-surface-subtle: var(--surface-subtle);
  --color-surface-raised: var(--surface-raised);
  --color-border-subtle: var(--border-subtle);
  --color-overlay: var(--overlay);
  --color-program: var(--program);
  --shadow-panel: 0 1px 2px color-mix(in oklab, var(--foreground) 4%, transparent);
  --shadow-float: 0 14px 36px color-mix(in oklab, var(--foreground) 12%, transparent);
  --shadow-dialog: 0 24px 60px color-mix(in oklab, var(--foreground) 18%, transparent);
  --z-index-nav: 20;
  --z-index-sticky: 30;
  --z-index-overlay: 60;
  --z-index-modal: 70;
  --z-index-popover: 80;
  --z-index-tooltip: 90;
}

:root {
  --radius: 0.75rem;
  --background: oklch(0.985 0.002 255);
  --foreground: oklch(0.205 0.035 265);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.129 0.042 264.695);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.129 0.042 264.695);
  --primary: oklch(0.58 0.22 262);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.968 0.007 247.896);
  --secondary-foreground: oklch(0.208 0.042 265.755);
  --muted: oklch(0.963 0.006 255);
  --muted-foreground: oklch(0.5 0.03 262);
  --accent: oklch(0.968 0.007 247.896);
  --accent-foreground: oklch(0.208 0.042 265.755);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.984 0.003 247.858);
  --border: oklch(0.91 0.012 255);
  --input: oklch(0.91 0.012 255);
  --ring: oklch(0.704 0.04 256.788);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.129 0.042 264.695);
  --sidebar-primary: oklch(0.208 0.042 265.755);
  --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
  --sidebar-accent: oklch(0.968 0.007 247.896);
  --sidebar-accent-foreground: oklch(0.208 0.042 265.755);
  --sidebar-border: oklch(0.929 0.013 255.508);
  --sidebar-ring: oklch(0.704 0.04 256.788);
  --success: oklch(0.63 0.17 150);
  --success-soft: oklch(0.96 0.04 150);
  --warning: oklch(0.7 0.17 65);
  --warning-soft: oklch(0.97 0.045 75);
  --danger: oklch(0.61 0.24 27);
  --danger-soft: oklch(0.96 0.035 25);
  --danger-foreground: oklch(1 0 0);
  --primary-soft: oklch(0.965 0.028 262);
  --info: oklch(0.58 0.17 235);
  --info-soft: oklch(0.965 0.025 235);
  --surface-subtle: oklch(0.975 0.004 255);
  --surface-raised: oklch(1 0 0);
  --border-subtle: oklch(0.94 0.008 255);
  --overlay: oklch(0.12 0.02 260 / 45%);
  --program: oklch(0.25 0.09 252);
}
`);

  // Conflict 4
  content = content.replace(/<<<<<<< HEAD\n=======\n\}\n\n@keyframes spark-draw \{[\s\S]*?>>>>>>> origin\/feat\/people-workspace/g,
`}`);

  // Now append grow-bar to the end
  content += `\n@keyframes grow-bar {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@utility animate-grow-bar {
  transform-origin: left;
  animation: grow-bar 700ms ease-out both;
}
`;
  
  fs.writeFileSync(file, content);
}

fixLayout();
fixGlobals();

