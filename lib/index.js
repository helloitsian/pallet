const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const PalletDependencyFinder = require("./pallet-dependency-finder");
const CleanCSS = require("clean-css");
const uglify = require("uglify-js");
const { isExcluded } = require('./util');

const readFile = (file) => {
  return fs.readFileSync(file, { encoding: "utf8" });
}

const writeFile = (outPath, content) => {
  if (!fs.existsSync(path.dirname(outPath))) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  } 

  fs.writeFileSync(outPath, content);
}

const mergeDependencies = (dependencies) => {
  return dependencies.map((dependency) => {
    if (dependency.valueType === "file") {
      return readFile(dependency.path);
    } else {
      return dependency.code;
    }
  }).join('\n')
};

const defaultOptions = (options={}) => {
  return {
    entry: "./index.html",
    exclude: [],
    output: {
      dir: "dist",
      html: "index.html",
      css: "style.css",
      js: {
        immediate: "bundle.js",
        defered: "defered.bundle.js",
        ...(options.output?.js || {}),
      },
      ...options.ouput,
    },
    ...options,
  };
}

const cleanUpDOM = (dom, excluded) => {
  dom("script").each((i, el) => {
    const src = dom(el).attr("src");
    if (src && !isExcluded(src, excluded))
      dom(el).remove();
    else if (!src)
      dom(el).remove();
  });
  dom("style").each((i, el) => {
    dom(el).remove();
  });
  dom("link[rel='stylesheet']").each((i, el) => {
    const href = dom(el).attr("href");
    if (href && !isExcluded(href, excluded))
      dom(el).remove();
    else if (!href)
      dom(el).remove();
  });
}

const build = async (options) => {
  const { entry, output, exclude } = defaultOptions(options);
  const excludeMap = exclude.reduce((map, excluded) => ({ 
    ...map,
    [excluded]: true,
  }), {});
  const dirname = path.dirname(entry);
  const html = readFile(entry);
  const dom = cheerio.load(html);

  const dependencies = await PalletDependencyFinder.findDependencies(
    dirname,
    dom,
    excludeMap,
  );

  const css = mergeDependencies(dependencies.css); 
  const immediateJs = mergeDependencies(dependencies.js.immediate);
  const deferedJs = mergeDependencies(dependencies.js.defered);
  
  // minify bundles
  const { errors: cssMinifyErrors, styles: miniCSS } = new CleanCSS().minify(css);
  const { error: immediateMinifyError, code: miniImmediateJs } = uglify.minify(immediateJs);
  const { error: deferedMinifyError, code: miniDeferedJs } = uglify.minify(deferedJs);

  // remove old scripts and styles
  cleanUpDOM(dom, excludeMap);
  
  // write bundle files, inject them into html
  if (miniCSS.length > 1) {
    writeFile(path.join(output.dir, output.css), miniCSS);
    dom("head").append(`<link rel="stylesheet" href="${output.css}">`);
  }
  if (miniImmediateJs.length > 1) {
    writeFile(path.join(output.dir, output.js.immediate), miniImmediateJs);
    dom("head").append(`<script src="${output.js.immediate}"></script>`);
  }
  if (miniDeferedJs.length > 1) {
    writeFile(path.join(output.dir, output.js.defered), miniDeferedJs);
    dom("head").append(`<script src="${output.js.defered}" defer></script>`);
  }

  // finally output the html
  writeFile(path.join(output.dir, output.html), dom.html());
};

module.exports.build = build;
