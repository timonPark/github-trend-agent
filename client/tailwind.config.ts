import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-color-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        primer: {
          canvas: {
            default: 'var(--bgColor-default, #ffffff)',
            subtle: 'var(--bgColor-muted, #f6f8fa)',
            inset: 'var(--bgColor-inset, #f6f8fa)',
          },
          fg: {
            default: 'var(--fgColor-default, #1f2328)',
            muted: 'var(--fgColor-muted, #656d76)',
            subtle: 'var(--fgColor-subtle, #6e7781)',
            accent: 'var(--fgColor-accent, #0969da)',
            success: 'var(--fgColor-success, #1a7f37)',
            danger: 'var(--fgColor-danger, #d1242f)',
          },
          border: {
            default: 'var(--borderColor-default, #d0d7de)',
            muted: 'var(--borderColor-muted, #d8dee4)',
            accent: 'var(--borderColor-accent-emphasis, #0969da)',
          },
          btn: {
            primary: {
              bg: 'var(--button-primary-bgColor-rest, #1f883d)',
              hover: 'var(--button-primary-bgColor-hover, #1a7f37)',
              fg: 'var(--button-primary-fgColor-rest, #ffffff)',
            },
            default: {
              bg: 'var(--button-default-bgColor-rest, #f6f8fa)',
              hover: 'var(--button-default-bgColor-hover, #eff2f5)',
              border: 'var(--button-default-borderColor-rest, rgba(31,35,40,0.15))',
            }
          }
        }
      }
    },
  },
  plugins: [],
};

export default config;
