import { arr, Path } from "lively.lang";
import { parse, stringify, transform, query, nodes } from "lively.ast";
import { capturing, es5Transpilation } from "lively.source-transform";
import { runtime as classRuntime } from "lively.classes";
import { getGlobal } from "./util.js";

var {id, literal, member, objectLiteral} = nodes;

export const defaultDeclarationWrapperName = "lively.capturing-declaration-wrapper",
             defaultClassToFunctionConverterName = "initializeES6ClassForLively";

function processInlineCodeTransformOptions(parsed, options) {
  if (!parsed.comments) return options;
  var livelyComment = parsed.comments.find(ea => ea.text.startsWith("lively.vm "));
  if (!livelyComment) return options;  
  try {
    var inlineOptions = eval("inlineOptions = {" + livelyComment.text.slice("lively.vm ".length) + "};");
    return Object.assign(options, inlineOptions);
  } catch (err) { return options; }
}

export function evalCodeTransform(code, options) {
  // variable declaration and references in the the source code get
  // transformed so that they are bound to `varRecorderName` aren't local
  // state. THis makes it possible to capture eval results, e.g. for
  // inspection, watching and recording changes, workspace vars, and
  // incrementally evaluating var declarations and having values bound later.
  
  // 1. Allow evaluation of function expressions and object literals
  code = transform.transformSingleExpression(code);
  var parsed = parse(code, {withComments: true});

  options = processInlineCodeTransformOptions(parsed, options);

  // 2. Annotate definitions with code location. This is being used by the
  // function-wrapper-source transform.
  var {classDecls, funcDecls, varDecls} = query.topLevelDeclsAndRefs(parsed),
      annotation = {};

  if (options.hasOwnProperty("evalId")) annotation.evalId = options.evalId;
  if (options.sourceAccessorName) annotation.sourceAccessorName = options.sourceAccessorName;
  [...classDecls, ...funcDecls].forEach(node =>
    node["x-lively-object-meta"] = {...annotation, start: node.start, end: node.end});
  varDecls.forEach(node =>
    node.declarations.forEach(decl =>
      decl["x-lively-object-meta"] = {...annotation, start: decl.start, end: decl.end}));
  

  // transforming experimental ES features into accepted es6 form...
  parsed = transform.objectSpreadTransform(parsed);

  // 3. capture top level vars into topLevelVarRecorder "environment"

  if (!options.topLevelVarRecorder && options.topLevelVarRecorderName) {
    let G = getGlobal();
    if (options.topLevelVarRecorderName === "GLOBAL") { // "magic"
      options.topLevelVarRecorder = getGlobal();
    } else {
      options.topLevelVarRecorder = Path(options.topLevelVarRecorderName).get(G);
    }
  }

  if (options.topLevelVarRecorder) {

    // capture and wrap logic
    var blacklist = (options.dontTransform || []).concat(["arguments"]),
        undeclaredToTransform = !!options.recordGlobals ?
          null/*all*/ : arr.withoutAll(Object.keys(options.topLevelVarRecorder), blacklist),
        varRecorder = id(options.varRecorderName || '__lvVarRecorder'),
        es6ClassToFunctionOptions = undefined;

    if (options.declarationWrapperName || typeof options.declarationCallback === "function") {
      // 2.1 declare a function that wraps all definitions, i.e. all var
      // decls, functions, classes etc that get captured will be wrapped in this
      // function. This allows to define some behavior that is run whenever
      // variables get initialized or changed as well as transform values.
      // The parameters passed are:
      //   name, kind, value, recorder
      // Note that the return value of declarationCallback is used as the
      // actual value in the code being executed. This allows to transform the
      // value as necessary but also means that declarationCallback needs to
      // return sth meaningful!
      let declarationWrapperName = options.declarationWrapperName || defaultDeclarationWrapperName;

      options.declarationWrapper = member(
        id(options.varRecorderName || '__lvVarRecorder'),
        literal(declarationWrapperName), true);

      if (options.declarationCallback)
        options.topLevelVarRecorder[declarationWrapperName] = options.declarationCallback;
    }

    var transformES6Classes = options.hasOwnProperty("transformES6Classes") ?
      options.transformES6Classes : true;
    if (transformES6Classes) {
      // Class declarations and expressions are converted into a function call
      // to `createOrExtendClass`, a helper that will produce (or extend an
      // existing) constructor function in a way that allows us to redefine
      // methods and properties of the class while keeping the class object
      // identical
      if (!(defaultClassToFunctionConverterName in options.topLevelVarRecorder))
        options.topLevelVarRecorder[defaultClassToFunctionConverterName] = classRuntime.initializeClass;
      es6ClassToFunctionOptions = {
        currentModuleAccessor: options.currentModuleAccessor,
        classHolder: varRecorder,
        functionNode: member(varRecorder, defaultClassToFunctionConverterName),
        declarationWrapper: options.declarationWrapper,
        evalId: options.evalId,
        sourceAccessorName: options.sourceAccessorName
      };
    }

    // 3.2 Here we call out to the actual code transformation that installs the captured top level vars
    parsed = capturing.rewriteToCaptureTopLevelVariables(
      parsed, varRecorder,
      {
        es6ImportFuncId: options.es6ImportFuncId,
        es6ExportFuncId: options.es6ExportFuncId,
        ignoreUndeclaredExcept: undeclaredToTransform,
        exclude: blacklist,
        declarationWrapper: options.declarationWrapper || undefined,
        classToFunction: es6ClassToFunctionOptions,
        evalId: options.evalId,
        sourceAccessorName: options.sourceAccessorName,
        keepTopLevelVarDecls: options.keepTopLevelVarDecls
     });
  }


  if (options.wrapInStartEndCall) {
    parsed = transform.wrapInStartEndCall(parsed, {
      startFuncNode: options.startFuncNode,
      endFuncNode: options.endFuncNode
    });
  }

  var result = stringify(parsed);

  if (options.jsx) result = es5Transpilation(result);

  if (options.sourceURL) result += "\n//# sourceURL=" + options.sourceURL.replace(/\s/g, "_");

  return result;
}

export function evalCodeTransformOfSystemRegisterSetters(code, options = {}) {
  if (!options.topLevelVarRecorder) return code;

  if (typeof options.declarationCallback === "function" || options.declarationWrapperName) {
    let declarationWrapperName = options.declarationWrapperName || defaultDeclarationWrapperName;
    options.declarationWrapper = member(
      id(options.varRecorderName),
      literal(declarationWrapperName), true);
    if (options.declarationCallback)
      options.topLevelVarRecorder[declarationWrapperName] = options.declarationCallback;
  }

  var parsed = parse(code),
      blacklist = (options.dontTransform || []).concat(["arguments"]),
        undeclaredToTransform = !!options.recordGlobals ?
          null/*all*/ : arr.withoutAll(Object.keys(options.topLevelVarRecorder), blacklist),
      result = capturing.rewriteToRegisterModuleToCaptureSetters(
        parsed, id(options.varRecorderName || '__lvVarRecorder'), {exclude: blacklist, ...options});
  return stringify(result);
}

function copyProperties(source, target, exceptions = []) {
  Object.getOwnPropertyNames(source).concat(Object.getOwnPropertySymbols(source))
    .forEach(name =>
      exceptions.indexOf(name) === -1
   && Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name)));
}
