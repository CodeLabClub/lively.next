/*global module,exports,require*/

var lang = typeof window !== "undefined" ? lively.lang : require("lively.lang");
var arr = lang.arr;
var ast = typeof window !== "undefined" ? lively.ast : require("lively.ast");
var exports = typeof window !== "undefined" ? (lively.vm || (lively.vm = {})) : module.exports;

lang.obj.extend(exports, {

  transformForVarRecord: function(code, varRecorder, varRecorderName, blacklist, defRangeRecorder, recordGlobals) {
    // variable declaration and references in the the source code get
    // transformed so that they are bound to `varRecorderName` aren't local
    // state. THis makes it possible to capture eval results, e.g. for
    // inspection, watching and recording changes, workspace vars, and
    // incrementally evaluating var declarations and having values bound later.
    blacklist = blacklist || [];
    blacklist.push("arguments");
    var undeclaredToTransform = recordGlobals ?
          null/*all*/ : lang.arr.withoutAll(Object.keys(varRecorder), blacklist),
        transformed = ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
          code, {name: varRecorderName, type: "Identifier"},
          {ignoreUndeclaredExcept: undeclaredToTransform,
           exclude: blacklist, recordDefRanges: !!defRangeRecorder});
    code = transformed.source;
    if (defRangeRecorder) lang.obj.extend(defRangeRecorder, transformed.defRanges);
    return code;
  },

  transformSingleExpression: function(code) {
    // evaling certain expressions such as single functions or object
    // literals will fail or not work as intended. When the code being
    // evaluated consists just out of a single expression we will wrap it in
    // parens to allow for those cases
    try {
      var parsed = ast.fuzzyParse(code);
      if (parsed.body.length === 1 &&
         (parsed.body[0].type === 'FunctionDeclaration'
       || parsed.body[0].type === 'BlockStatement')) {
        code = '(' + code.replace(/;\s*$/, '') + ')';
      }
    } catch(e) {
      if (typeof lively && lively.Config && lively.Config.showImprovedJavaScriptEvalErrors) $world.logError(e)
      else console.error("Eval preprocess error: %s", e.stack || e);
    }
    return code;
  },

  evalCodeTransform: function(code, options) {
    if (options.topLevelVarRecorder)
      code = exports.transformForVarRecord(
        code,
        options.topLevelVarRecorder,
        options.varRecorderName || '__lvVarRecorder',
        options.dontTransform,
        options.topLevelDefRangeRecorder,
        !!options.recordGlobals);
    code = exports.transformSingleExpression(code);

    if (options.sourceURL) code += "\n//# sourceURL=" + options.sourceURL.replace(/\s/g, "_");

    return code;
  },

  getGlobal: function() {
    if (typeof window !== "undefined") return window;
    if (typeof global !== "undefined") return global;
    if (typeof Global !== "undefined") return Global;
    return (function() { return this; })();
  },

  _eval: function(__lvEvalStatement, __lvVarRecorder/*needed as arg for capturing*/) {
    return eval(__lvEvalStatement);
  },

  _normalizeEvalOptions(opts) {
    if (!opts) opts = {};
    
    var current = opts.currentModule || opts.sourceURL;
    if (current && !opts.sourceURL) opts.sourceURL = current;

    var moduleEnv = opts.runtime && opts.runtime.modules && opts.runtime.modules[current];
    if (moduleEnv) {
      opts.varRecorderName = moduleEnv.varRecorderName;
      opts.topLevelVarRecorder = moduleEnv.topLevelVarRecorder;
      opts.context = moduleEnv.context;
      opts.dontTransform = moduleEnv.dontTransform;
      opts.topLevelDefRangeRecorder = moduleEnv.topLevelDefRangeRecorder;
      opts.recordGlobals = moduleEnv.recordGlobals;
    }

    if (!opts.context) opts.context = exports.getGlobal(); // "this"
    if (!opts.varRecorderName) opts.varRecorderName = '__lvVarRecorder';

    // options.dontTransform
    // options.topLevelDefRangeRecorder,
    // options.recordGlobals
    // options.sourceURL
    
    return opts;
  },

  runEval: function (code, options, thenDo) {
    // The main function where all eval options are configured.
    // options can be: {
    //   runtime: {
    //     modules: {[MODULENAME: PerModuleOptions]}
    //   }
    // }
    // or directly, PerModuleOptions = {
    //   varRecorderName: STRING, // default is '__lvVarRecorder'
    //   topLevelVarRecorder: OBJECT,
    //   context: OBJECT,
    //   sourceURL: STRING,
    //   recordGlobals: BOOLEAN // also transform free vars? default is false
    // }

    if (typeof options === 'function' && arguments.length === 2) {
      thenDo = options; options = null;
    }

    options = exports._normalizeEvalOptions(options);

    var result, err;

    try {
      code = exports.evalCodeTransform(code, options);
      typeof $morph !== "undefined" && $morph('log') && ($morph('log').textString = code);
      result = exports._eval.call(options.context, code, options.topLevelVarRecorder);
    }
    catch (e) { err = e; }
    finally { thenDo(err, result); }
  },

  syncEval: function(string, options) {
    // See #runEval for options.
    // Although the defaul eval is synchronous we assume that the general
    // evaluation might not return immediatelly. This makes is possible to
    // change the evaluation backend, e.g. to be a remotely attached runtime
    var result;
    exports.runEval(string, options, function(e, r) { result = e || r; });
    return result;
  }

});

exports.cjs = require("./lib/modules/cjs");
