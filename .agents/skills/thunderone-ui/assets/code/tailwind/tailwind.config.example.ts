// Tailwind v3 config for a Lovable / shadcn project using the ThunderOne preset.
// Keep your project's own plugins; the preset only adds theme values.
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import t1Preset from '@rdthunderthailand/thunderone-theme/tailwind/preset';

export default {
  darkMode: ['class'],
  presets: [t1Preset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { container: { center: true, padding: '1rem' } },
  plugins: [animate],
} satisfies Config;
