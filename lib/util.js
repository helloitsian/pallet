const axios = require("axios");

module.exports.isExcluded = (path, excluded) => {
  return excluded[path] != null;
}

module.exports.fetchExternalDependency = async (url) => {
  const response = await axios.get(url);
  return response.data;
};