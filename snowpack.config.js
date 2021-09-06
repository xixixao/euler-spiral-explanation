module.exports = {
  exclude: [
    "**/node_modules/**/*",
    "**/.git/**/*",
    "**/docs/**",
    "**/build/**",
    "**/package.json",
    "**/package-lock.json",
    "**/snowpack.config.js",
    "**/docs/**",
    "**/docs_bad/**",
  ],
  plugins: ["@snowpack/plugin-sass"],
};
