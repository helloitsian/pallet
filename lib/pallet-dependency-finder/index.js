const { isExcluded, fetchExternalDependency } = require("../util.js");

const handleFetchExternalDependency = async (url, mutate, isDefered) =>
  new Promise((resolve, reject) => {
    fetchExternalDependency(url).then((result) =>
      resolve(mutate(result, isDefered))
    );
  });

const mutateCSSResponse = (code) => {
  return { type: "css", valueType: "code", code: code };
};

const mutateJavaScriptResponse = (code, isDefered) => {
  return { type: "js", valueType: "code", code: code, defered: isDefered };
};

module.exports.findDependencies = async (dirname, dom, exluded) => {
  const promises = [];

  dom("head > link[rel='stylesheet']").each((i, el) => {
    const href = dom(el).attr("href");
    if (href) {
      if (isExcluded(href, exluded)) {
        return;
      }
      if (href.startsWith("http")) {
        promises.push(handleFetchExternalDependency(href, mutateCSSResponse));
      } else {
        promises.push({
          type: "css",
          valueType: "file",
          path: `${dirname}/${href}`,
          relativePath: href,
        });
      }
    }
  });

  dom("head > style").each((i, el) => {
    const code = dom(el).text();
    if (code) {
      promises.push(mutateCSSResponse(code));
    }
  });

  dom("body > style").each((i, el) => {
    const code = dom(el).text();
    if (code) {
      promises.push(mutateCSSResponse(code));
    }
  });

  dom("head > script").each((i, el) => {
    const src = dom(el).attr("src");
    const defered = dom(el).attr("defer") === "true";
    if (src) {
      if (isExcluded(src, exluded)) {      
        return;
      }
      if (src.startsWith("http")) {
        promises.push(
          handleFetchExternalDependency(src, mutateJavaScriptResponse, defered)
        );
      } else {
        promises.push({
          type: "js",
          valueType: "file",
          path: `${dirname}/${src}`,
          relativePath: src,
        });
      }
    } else {
      const code = dom(el).text();
      if (code) {
        promises.push(mutateJavaScriptResponse(code, defered));
      }
    }
  });

  dom("body > script").each((i, el) => {
    const src = dom(el).attr("src");
    if (src) {
      if (isExcluded(src, exluded)) {
        return;
      }
      if (src.startsWith("http")) {
        promises.push(
          handleFetchExternalDependency(src, mutateJavaScriptResponse, true)
        );
      } else {
        promises.push({
          type: "js",
          valueType: "file",
          path: `${dirname}/${src}`,
          relativePath: src,
          defered: true,
        });
      }
    } else {
      const code = dom(el).text();
      if (code) {
        promises.push(mutateJavaScriptResponse(code, true));
      }
    }
  });

  const results = await Promise.all(promises);
  const dependencies = results.reduce(
    (final, current) => {
      if (current.type === "css") {
        final.css.push(current);
      } else if (current.type === "js") {
        if (current.defered) final.js.defered.push(current);
        else final.js.immediate.push(current);
      }
      return final;
    },
    { css: [], js: { defered: [], immediate: [] } }
  );

  return dependencies;
};
