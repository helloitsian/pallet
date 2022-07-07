#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yargs = require('yargs');
const { build } = require('../lib/index');

const argv = yargs(process.argv)
    .option("entry", {
      alias: "e",
      describe: "Entry point",
    })
    .option("outdir", {
      alias: "o",
      describe: "Output directory",
    })
    .option("html", {
      describe: "Html Output file path",
    })
    .option("css", {
      describe: "Css Output file path",
    })
    .option("nondefered", {
      describe: "Non-Defered JavaScript Output file path",
    })
    .option("defered", {
      describe: "Defered JavaScript Output file path",
    })
    .option("config", {
      alias: "c",
      describe: "Path to config file"
    })
    .help().argv;

if (argv.config) {
  const config = fs.readFileSync(path.join(__dirname, '/', argv.config), "utf8");
  const parsedConfig = JSON.parse(config);
  build(parsedConfig);
} else if (argv.entry) {

  const htmlArg = argv.html ? argv.html.replace(argv.outdir, "") : null;
  const cssArg = argv.css ? argv.css.replace(argv.outdir, "") : null;
  const nonDeferedArg = argv.nondefered ? argv.nondefered.replace(argv.outdir, "") : null;
  const deferedArg = argv.defered ? argv.defered.replace(argv.outdir, "") : null;

  const outputConfig = {
    dir: argv.outdir,
    html: argv.html,
    css: argv.css,
    js: {
      nonDefered: argv.nondefered,
      defered: argv.defered,
    }
  }

  build({
    entry: argv.entry,
    output: outputConfig,
  });
} else {
  build();
}