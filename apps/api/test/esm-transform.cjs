// Jest 29 runs CJS tests. Transpile ESM-only dependencies without changing production files.
const ts = require("typescript");
module.exports = {
  getCacheKey(source, filename, options) {
    return require("node:crypto")
      .createHash("sha256")
      .update(
        source +
          filename +
          options.configString +
          require("node:fs").readFileSync(__filename, "utf8"),
      )
      .digest("hex");
  },
  process(source, filename) {
    return {
      code: ts.transpileModule(
        (/\b(?:const|let|var)\s+require\s*=/.test(source)
          ? source.replace(/\brequire\b/g, "__esmRequire")
          : source
        ).replaceAll(
          "import.meta.url",
          'require("node:url").pathToFileURL(__filename).href',
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
          },
          fileName: filename,
        },
      ).outputText,
    };
  },
};
