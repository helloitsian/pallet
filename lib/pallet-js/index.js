const { readEntry, removeTags } = require("../util.js");

const findDependencies = (dirname, dom) => {
  const nonDefered = [];
  const defered = [];

  // find all script tags that execute pre-DOMContentLoaded
  dom("head > script").each((i, el) => {
    const src = dom(el).attr("src");
    const defer = dom(el).attr("defer");
    if (src) {
      // handle deferred <script> tags
      if (defer) defered.push(`${dirname}/${src}`);
      else nonDefered.push(`${dirname}/${src}`);
    }
  });

  // find all script tags that execute post-DOMContentLoaded
  dom("body > script").each((i, el) => {
    const src = dom(el).attr("src");
    if (src) {
      defered.push(`${dirname}/${src}`);
    }
  });

  return {
    nonDefered,
    defered,
  };
};

const merge = async (dependencies) => {
  const promises = dependencies.map(readEntry);
  const results = await Promise.all(promises);
  return results.join("\n");
};

const bundle = async (dirname, dom, outDir, nonDeferedOutName, deferOutName) => {
  const { nonDefered, defered } = findDependencies(dirname, dom);
  if (!nonDefered.length && !defered.length)
    return {
      nonDefered: [],
      defered: [],
    };

  const nonDeferedMerged = await merge(nonDefered);
  const deferedMerged = await merge(defered);

  // remove tags from dom
  removeTags(dom, "script");
  if (outDir && (nonDeferedOutName || deferOutName)) {
    // pop root dir name off outDir
    let toSlice = 1;
    if (outDir.startsWith("./")) toSlice = 2;
    if (outDir.startsWith("../")) toSlice = 3;
    const relativeOutDir = outDir.split('/').slice(toSlice).join('/');
    const nonDeferedPath = `${relativeOutDir}/${nonDeferedOutName}`;
    const deferedPath = `${relativeOutDir}/${deferOutName}`;
  
    // add tags to dom
    if (nonDeferedOutName)
      dom("head").append(`<script src=".${nonDeferedPath}"></script>`);
    if (deferOutName)
      dom("head").append(`<script src=".${deferedPath}" defer="defer"></script>`);
  } else {
    dom("head").append(`<script>${nonDeferedMerged}</script>`);
    dom("head").append(`<script>${deferedMerged}</script>`);
  }

  return {
    nonDefered: nonDeferedMerged,
    defered: deferedMerged,
  };
};

module.exports = {
  bundle,
};
