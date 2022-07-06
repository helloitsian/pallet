const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const beautify = require("js-beautify");
const { readEntry, writeOutput } = require("./util.js");
const PalletJs = require("./pallet-js");
const PalletCSS = require("./pallet-css");

let $ = null;

const outputBundle = async (bundle, relativePath) =>
  new Promise((resolve, reject) => {
    if (bundle.length === 0)
      reject({
        action: "bundleLinkCheck",
        success: false,
        error: "No bundle to output",
      });

    const absolutePath = path.resolve(relativePath);
    const dirname = path.dirname(absolutePath);

    if (!fs.existsSync(dirname)) {
      fs.mkdir(dirname, { recursive: true }, async (err) => {
        if (err) {
          reject({ action: "mkdir", success: false, error: err });
        } else {
          writeOutput(bundle, absolutePath).then((result) => resolve(result));
        }
      });
    } else {
      writeOutput(bundle, absolutePath).then((result) => resolve(result));
    }
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

const outputHtml = async (env, out) => {
  const isDev = env === "development";

  if (isDev) {
    injectWebSocketCode();
  }

  const prettified = beautify.html($.html(), {
    indent_size: 2,
    extra_liners: [],
  });

  await writeOutput(prettified, `${out.dir}/${out.html}`);
};

const defaultOutputOptions = (outputOptions) => {
  const defaultConfig = {
    dir: "dist",
    html: "index.html",
    js: {
      preLoad: "bundle.js",
      postLoad: "defered.bundle.js",
    },
  };

  return { ...defaultConfig, ...(outputOptions || {}) };
};

const defaultOptions = (options) => {
  const optionDefaults = {
    env: "development",
    entry: "./index.html",
  };
  return {
    ...optionDefaults,
    ...options,
    output: options.output ? defaultOutputOptions(options.output) : null,
  };
};

const build = async (
  options = {
    entry: "index.html",
    output: {
      dir: "dist",
      html: "index.html",
      js: {
        nonDefered: "bundle.js",
        defered: "defered.bundle.js",
      },
    },
    env: "development",
  }
) => {
  const defaultedOptions = defaultOptions(options);
  const { entry, output: outputConfig, env } = defaultedOptions;
  const dirname = path.dirname(entry);
  const html = await readEntry(entry);
  $ = cheerio.load(html);

  try {
    // bundle js
    const { nonDefered, defered } = await PalletJs.bundle(
      dirname,
      $,
      outputConfig.dir,
      outputConfig.js.nonDefered,
      outputConfig.js.defered
    );
    // bundle css
    const css = await PalletCSS.bundle(
      dirname,
      $,
      outputConfig.dir,
      outputConfig.css
    );
    // flags
    const hasNonDefered = nonDefered.length > 0;
    const hasDefered = defered.length > 0;
    const hasCSS = css.length > 0;

    // output bundled js
    if (outputConfig) {
      const hasJS = outputConfig.js || false;
      const hasCSSOutput = outputConfig.css || false;
      const hasHTML = outputConfig.html || false;

      if (hasNonDefered && hasJS && outputConfig.js.nonDefered)
        await outputBundle(
          nonDefered,
          `${outputConfig.dir}/${outputConfig.js.nonDefered}`
        );
      if (hasDefered && hasJS && outputConfig.js.defered)
        await outputBundle(
          defered,
          `${outputConfig.dir}/${outputConfig.js.defered}`
        );
      if (hasCSS && hasCSSOutput && outputConfig.css.length > 0) {
        await outputBundle(css, `${outputConfig.dir}/${outputConfig.css}`);
      }
      if (hasHTML && outputConfig.html.length > 0)
        await outputHtml(env, outputConfig);
    }

    return {
      js: {
        nonDefered,
        defered,
      },
      css,
      html,
    };
  } catch (err) {
    console.log("Bundle Error:", err);
    return {};
  }
};

module.exports.build = build;
