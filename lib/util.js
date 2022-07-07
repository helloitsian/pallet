const fs = require("fs");
const path = require("path");

module.exports.readEntry = (entry) => {
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

module.exports.writeOutput = async (bundle, outPath) => {
  if (!fs.existsSync(path.dirname(outPath))) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(outPath, bundle, (err) => {
      if (err) {
        reject({ success: false, error: err });
      } else {
        resolve({ success: true, message: "Output file written successfully" });
      }
    });
  });
};

module.exports.removeTags = (dom, tag) => {
  dom(tag).each((i, el) => {
    dom(el).remove();
  });
}