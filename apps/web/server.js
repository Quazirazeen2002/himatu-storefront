const path = require("path");
const fs = require("fs");

const standalonePath = path.join(__dirname, ".next/standalone/apps/web/server.js");
if (fs.existsSync(standalonePath)) {
  process.chdir(path.join(__dirname, ".next/standalone/apps/web"));
  require(standalonePath);
} else {
  const next = require("next");
  const http = require("http");
  const port = process.env.PORT || 3000;
  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();
  app.prepare().then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> HIMATU Storefront ready on http://localhost:${port}`);
    });
  });
}
