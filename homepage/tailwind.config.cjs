const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        morion: ["Morion", "Inter var"],
        wigrum: ["monospace", "Inter var"],
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "theme-layer-darkest": "#0b0b13",
        "theme-layer-darker": "#12121a",
        "theme-layer-dark": "#171722",
        "theme-layer-base": "#1c1c28",
        "theme-layer-light": "#232334",
        "theme-layer-lighter": "#303044",
        "theme-layer-lightest": "#454258",
        "theme-loading-bar-shine": "#51516d",
        "theme-border-grey": "#2d2d3d",
        "theme-border-lighter": "#393953",
        "theme-text-light": "#f7f7f7",
        "theme-text-base": "#c3c2d4",
        "theme-text-dark": "#6f6e84",
        "theme-purple": "#5973fe",
        "theme-green": "#3fb68b",
        "theme-red": "#ff5353",
        "theme-yellow": "#ffb648",
        "theme-champagne": " #FDE6C4",
        "theme-navy": " #040728",
        "theme-white": " #FFFFFF",
        "theme-oldlace": " #FEF3E2",
        "theme-sky": " #025BEE",
        "theme-aqua": " #59F4F4",
        "theme-copper": " #DC7F5A",
        "theme-pan-navy": " #27272A",
        "theme-pan-sky": " #0072B5",
        "theme-pan-champagne": " #F4EEE8",
      },
    },
  },
  plugins: [],
};
