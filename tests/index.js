const path = require("path");
const { build } = require("../lib/index.js");

const currentTest = "./css/css.test.html";

(async () => {

  const result = await build({
    entry: currentTest,
    output: {
      dir: "dist",
      html: "index.html",
      css: "bundle.css",
      js: {
        nonDefered: "bundle.js",
        defered: "defered.bundle.js",
      },
    }
  })

  const { css, js } = result;
  
  if (js) {
    console.log("::: preload :::")
    console.log(js.defered);
    console.log("::: postload :::")
    console.log(js.nonDefered);
  }
  if (css) {
    console.log("::: css :::")
    console.log(css);
  }

})();
