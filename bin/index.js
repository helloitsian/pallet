#!/usr/bin/env node
const fs = require("fs");
const yargs = require('yargs');
const { build } = require('../lib/index');

const argv = yargs(process.argv)
    .option("config", {
      "alias": "c",
      "describe": "Path to config file"
    })
    .help().argv;

if (argv.config) {
  const config = fs.readFileSync(path.join(__dirname, '/', argv.config), "utf8");
  const parsedConfig = JSON.parse(config);
  build(parsedConfig);
} else {
  build();
}