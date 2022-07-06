const { readEntry, removeTags } = require("../util.js");
const CleanCSS = require("clean-css");

const findDependencies = (dirname, dom) => {
  const dependencies = [];

  // find all link tags targetting style sheets
  dom("head > link[rel='stylesheet']").each((i, el) => {
    dependencies.push({ type: "link", path: `${dirname}/${dom(el).attr("href")}` });
  });

  // find all style tags in head
  dom("head > style").each((i, el) => {
    dependencies.push({ type: "style", code: dom(el).html().replace(/\n/g, "").trim() });
  });
  // find all style tags in body
  dom("body > style").each((i, el) => {
    dependencies.push({ type: "style", code: dom(el).html().replace(/\n/g, "").trim() });
  });

  return dependencies;
};

const merge = async (dependencies) => {
  const promises = dependencies.map((dependency) => {
    if (dependency.type === "link") {
      return readEntry(dependency.path);
    } else if (dependency.type === "style") {
      return new Promise((resolve, reject) => resolve(dependency.code));
    }
  });

  const results = await Promise.all(promises);
  return results.join("\n");
};

const bundle = async (dirname, dom, outDir, outName) => {
  const dependencies = findDependencies(dirname, dom);
  if (!dependencies.length) return "";

  const merged = await merge(dependencies);

  // remove old tags from dom
  removeTags(dom, "style");
  removeTags(dom, "link");

  // get relative path of css file
  const toSlice = outDir.startsWith('./') ? 2 : 1;
  const relativeOutDir = outDir.split('/').slice(toSlice).join('/');
  const cssPath = `${relativeOutDir}/${outName}`;
  // add new tags to dom
  dom("head").append(`<link rel="stylesheet "href="${cssPath}">`);

  // clean css, remove comments, duplicate styles, etc.
  const clean = new CleanCSS({
    level: 2,
  });
  const cleaned = clean.minify(merged).styles;

  return cleaned;
};

module.exports = {
  bundle,
}