import { readFileSync, writeFileSync } from "fs";
import { exec } from "./shell-exec.js";

export function ensureDir(dir) {
  return exec(`node -e 'var fs = require("fs"); if (!fs.existsSync("${dir}")) fs.mkdirSync("${dir}");'`);
}

export async function read(path) {
  if (System.get("@system-env").node) {
    try {
      return String(readFileSync(path.replace(/file:\/\//, "")))
    } catch (e) { return ""; }
  } else {
    var {output, code} = await lively.shell.readFile(path);
    return code ? "" : output;
  }
}

export async function write(path, content) {
  if (System.get("@system-env").node) {
    try {
      String(writeFileSync(path.replace(/file:\/\//, ""), content))
    } catch (e) { console.warn(`error writing ${path}: ${e}`)}
  } else {
    var {code} = await lively.shell.writeFile("test.txt", "fooo barrr")
  }
}

export function join() {
  var args = Array.prototype.slice.call(arguments);
  return args.reduce(function (path, ea) {
      return typeof ea === 'string' ? path.replace(/\/*$/, '') + '/' + ea.replace(/^\/*/, '') : path;
  });
}

export function normalizeProjectSpec(spec) {
  return Object.assign({}, spec, {
    dir: spec.dir || join(spec.parentDir, spec.name)
  });
}

export function getPackageSpec() {
  return System.decanonicalize("lively.installer/packages-config.json");
}

export async function readPackageSpec(pkgSpec) {
    return JSON.parse(System.get("@system-env").browser ?
      await (await fetch(pkgSpec)).text() :
      await read(pkgSpec));
}
