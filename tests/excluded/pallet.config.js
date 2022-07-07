module.exports = {
  entry: "./excluded.test.html",
  exclude: ["https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"],
  output: {
    dir: "dist",
    html: "index.html",
    css: "style.css",
    js: {
      immediate: "bundle.js",
      defered: "defered.bundle.js",
    },
  },
}