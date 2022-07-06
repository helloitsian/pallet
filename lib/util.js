const fs = require("fs");

module.exports.readEntry = (entry) => {
  console.log("reading", entry);
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

module.exports.writeOutput = async (bundle, path) => {
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

module.exports.removeTags = (dom, tag) => {
  dom(tag).each((i, el) => {
    dom(el).remove();
  });
}