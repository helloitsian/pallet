#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const { build } = require("../lib/index");

const argv = yargs(process.argv)
  .option("entry", {
    alias: "e",
    describe: "Entry point",
    default: "./index.html",
  })
  .option("dir", {
    alias: "d",
    describe: "Output Directory",
    default: "dist",
  })
  .option("html", {
    describe: "Html Output file path",
    default: "index.html",
  })
  .option("css", {
    describe: "Css Output file path",
    default: "style.css",
  })
  .option("immediate", {
    describe: "Non-Defered JavaScript Output file path",
    default: "bundle.js",
  })
  .option("defered", {
    describe: "Defered JavaScript Output file path",
    default: "defered.bundle.js",
  })
  .option("config", {
    alias: "c",
    describe: "Path to config file",
    default: "./pallet.config.js",
  })
  .help().argv;

if (fs.existsSync(path.join(process.cwd(), argv.config))) {
  const config = require(path.join(process.cwd(), argv.config));
  build(config);
} else {
  const outputConfig = {
    dir: argv.dir,
    html: argv.html,
    css: argv.css,
    js: {
      immediate: argv.immediate,
      defered: argv.defered,
    },
  };
  build({
    entry: argv.entry,
    shouldOutput: argv.output === "true" ? true : false,
    output: outputConfig,
  });
}
