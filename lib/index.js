const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

let $ = null;

const readEntry = (entry) => {
  return new Promise((resolve, reject) => {
    fs.readFile(entry, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const writeOutput = async (bundle, path) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, bundle, (err) => {
      if (err) {
        reject({ success: false, error: err });
      } else {
        resolve({ success: true, message: "Output file written successfully" });
      }
    });
  });
};

const findDependencies = (dirname, html) => {
  $ = cheerio.load(html);
  const preLoad = [];
  const postLoad = [];

  // find all script tags that execute pre-DOMContentLoaded
  $("head > script").each((i, el) => {
    const src = $(el).attr("src");
    const defer = $(el).attr("defer");
    if (src) {
      // handle deferred <script> tags
      if (defer) postLoad.push(`${dirname}/${src}`);
      else preLoad.push(`${dirname}/${src}`);
    }
  });

  // find all script tags that execute post-DOMContentLoaded
  $("body > script").each((i, el) => {
    const src = $(el).attr("src");
    if (src) {
      postLoad.push(`${dirname}/${src}`);
    }
  });

  return {
    preLoad,
    postLoad,
  };
};

const merge = async (dependencies) => {
  const promises = dependencies.map(readEntry);
  const results = await Promise.all(promises);
  return results.join("\n");
};

const bundle = async (dependencies) => {
  if (!dependencies.length) return "";
  return await merge(dependencies);
};

const outputBundle = async (bundle, relativePath) =>
  new Promise((resolve, reject) => {
    if (bundle.length === 0)
      resolve({ success: false, error: "No bundle to output" });

    const absolutePath = path.resolve(relativePath);
    const dirname = path.dirname(absolutePath);

    if (!fs.existsSync(dirname)) {
      fs.mkdir(dirname, async (err) => {
        if (err) {
          reject(err);
        } else {
          writeOutput(bundle, absolutePath).then((result) => resolve(result));
        }
      });
    }

    writeOutput(bundle, absolutePath).then((result) => resolve(result));
  });

const generateWebSocketCode = (bundle) => {
  return `
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      window.location.reload();
    };
  `;
};

const injectWebSocketCode = () => {
  $("body").append(`<script>${generateWebSocketCode()}</script>`);
};

const outputHtml = async (env, hasPreload, hasPostload, out) => {
  const isDev = env === "development";

  // remove previous script tags
  $("script").each((i, el) => {
    $(el).remove();
  });

  if (isDev) {
    injectWebSocketCode();
  } else {
    if (hasPreload)
      $("head").append(`<script src="${out.js.preLoad}"></script>`);
    if (hasPostload)
      $("body").append(`<script src="${out.js.postLoad}"></script>`);
  }

  await writeOutput($.html(), `${out.dir}/${out.html}`);
};

const defaultOutputOptions = (outputOptions) => {
  const defaultConfig = {
    dir: "dist",
    html: "index.html",
    js: {
      preLoad: "preload.bundle.js",
      postLoad: "postload.bundle.js",
    },
  };

  return { ...defaultConfig, ...outputOptions };
};

const defaultOptions = (options) => {
  const optionDefaults = {
    env: "development",
    entry: "./index.html",
  };
  return {
    ...optionDefaults,
    ...options,
    output: defaultOutputOptions(options.output),
  };
};

const build = async (
  options = {
    entry: "index.html",
    output: {
      dir: "dist",
      html: "index.html",
      js: {
        preLoad: "preload.bundle.js",
        postLoad: "postload.bundle.js",
      },
    },
    env: "development",
  }
) => {
  const defaultedOptions = defaultOptions(options);
  const { entry, output: outputConfig, env } = defaultedOptions;
  const html = await readEntry(entry);
  const dirname = path.dirname(entry);
  const dependencies = findDependencies(dirname, html);
  const preLoadBundle = await bundle(dependencies.preLoad);
  const postLoadBundle = await bundle(dependencies.postLoad);
  const hasPreload = preLoadBundle.length > 0;
  const hasPostload = postLoadBundle.length > 0;

  if (hasPreload)
    await outputBundle(
      preLoadBundle,
      `${outputConfig.dir}/${outputConfig.js.preLoad}`
    );
  if (hasPostload)
    await outputBundle(
      postLoadBundle,
      `${outputConfig.dir}/${outputConfig.js.postLoad}`
    );
  await outputHtml(env, hasPreload, hasPostload, outputConfig);

  return [preLoadBundle, postLoadBundle];
};

module.exports.build = build;
