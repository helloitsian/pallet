# Pallet

## Install 
```
npm install pallet-bundler
or...
npm install -g pallet-bundler
```

## Getting Started
Simply run `pallet` in a folder with an `index.html` file in it and let Pallet do the rest!
```
pallet
```

## Options (CLI)
```
Options:
      --version    Show version number                                 [boolean]
  -e, --entry      Entry point                         [default: "./index.html"]
  -d, --dir        Output Directory                            [default: "dist"]
      --html       Html Output file path                 [default: "index.html"]
      --css        Css Output file path                   [default: "style.css"]
      --immediate  Non-Defered JavaScript Output file path [default: "bundle.js"]
      --defered    Defered JavaScript Output file path
                                                  [default: "defered.bundle.js"]
  -c, --config     Path to config file           [default: "./pallet.config.js"]
      --help       Show help                                           [boolean]
```

## Using a Config File

### Example Config File
```javascript
module.exports = {
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
  },
}; 
```
### Steps
1. Make a file called `pallet.config.js`.
2. Run `pallet`!

