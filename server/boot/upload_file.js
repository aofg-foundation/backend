const SHA256 = require("crypto-js/sha256");

module.exports = function (app) {
  app.dataSources['loopback-component-storage'].connector.getFilename = function (file, req, res) {
    const name = file.name
    const parts = name.split('.')
    const extension = parts[parts.length-1]
    const uniqueName = `${SHA256(new Date().getTime().toString())}.${extension}`
    return uniqueName;
  }
}