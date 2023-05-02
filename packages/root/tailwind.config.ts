import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import theme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      textShadow: {
        "3d": [
          "-1px 0px 0px #04121b",
          "-2px 0px 0px #00a4ac",
          "-3px 0px 0px #00fbc3",
          "-4px 0px 0px #6bfdde",
          "1px 0px 0px #290000",
          "2px 0px 0px #fe1101",
          "3px 0px 0px #fd4336",
        ].join(","),
      },
    },
    fontFamily: {
      serif: ["Playfair Display", ...theme.fontFamily.serif],
      sans: ["Source Sans Pro", ...theme.fontFamily.sans],
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
} satisfies Config;
