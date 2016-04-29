var fs = require("fs"),
    lang = require("lively.lang"),
    estree = require("estree-to-js"),
    estreeVisitor = "generated/estree-visitor.js";

function createEstreeVisitorModule() {
  var estreeSpec = JSON.parse(fs.readFileSync(require.resolve("estree-to-js/generated/es6.json"))),
      source = `"format esm";\n${estree.createVisitor(estreeSpec, []/*exceptions*/, "Visitor")}\nexport default Visitor;`;
  return lang.promise(fs.writeFile)(estreeVisitor, source);
}

createEstreeVisitorModule();
