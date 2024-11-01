import type { Config } from "tailwindcss";
import theme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      serif: ["Playfair Display", ...theme.fontFamily.serif],
      sans: ["Source Sans Pro", ...theme.fontFamily.sans],
    },
  },
  plugins: [],
} satisfies Config;
