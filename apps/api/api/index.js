// Use tsc-compiled Nest modules so dependency-injection decorator metadata is preserved.
const express = require("express");
const { createApplication } = require("../dist/bootstrap");
const server = express();
let initialization;
module.exports = async function handler(req, res) {
  initialization ??= createApplication(server).catch((error) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  server(req, res);
};
