/*global System, beforeEach, afterEach, describe, it*/

import { expect } from "mocha-es6";
import { removeDir, createFiles, modifyJSON, noTrailingSlash, inspect as i } from "./helpers.js";

import { obj } from "lively.lang";
import { getSystem, removeSystem, printSystemConfig, loadedModules, moduleEnv } from "../src/system.js";
import { registerPackage, importPackage, applyConfig, getPackages } from "../src/packages.js";

var testDir = System.normalizeSync("lively.modules/tests/");


describe("package loading", function() {

  var project1aDir = testDir + "dep1/",
      project1bDir = testDir + "dep2/",
      project2Dir = testDir + "dependent-dir/",
      project1a = {
        "entry-a.js": "import { y } from './other.js'; var x = y + 1, version = 'a'; export { x, version };",
        "other.js": "export var y = 1;",
        "package.json": '{"name": "some-project", "main": "entry-a.js"}'
      },
      project1b = {
        "entry-b.js": "var x = 23, version = 'b'; export { x, version };",
        "package.json": '{"name": "some-project", "main": "entry-b.js"}'
      },
      project2 = {
        "index.js": "export { x, version } from 'some-project';",
        "package.json": JSON.stringify({
          name: "dependent-project", dependencies: {"some-project": "*"},
          lively: {packageMap: {"some-project": project1bDir}}
        })
      }

  var System;

  beforeEach(() => {
    System = getSystem("test", {baseURL: testDir});
    return Promise.all([
      createFiles(project1aDir, project1a),
      createFiles(project1bDir, project1b),
      createFiles(project2Dir, project2)])
        .then(_ => registerPackage(System, project1aDir))
  });

  afterEach(() => {
    removeSystem("test")
    // show(printSystemConfig(System)) &&
    return Promise.all([
      removeDir(project1aDir),
      removeDir(project1bDir),
      removeDir(project2Dir)]);
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  describe("basics", () => {
    
    it("registers and loads a package", () =>
      registerPackage(System, project1aDir)
        .then(_ => System.import("some-project"))
        .then(mod => expect(mod).to.have.property("x", 2))
        .then(m => expect(System.packages).to.containSubset({
            [noTrailingSlash(project1aDir)]: {
              main: "entry-a.js",
              meta: {"package.json": {format: "json"}},
              map: {},
              names: ["some-project"]}})));

    it("registers and loads dependent packages", () =>
      Promise.all([
        registerPackage(System, project1bDir),
        registerPackage(System, project2Dir)])
        .then(_ => System.import("dependent-project"))
        .then(mod => expect(mod).to.have.property("x", 23)));

    it("enumerates packages", () => 
      importPackage(System, project2Dir).then(() =>
        expect(getPackages(System)).to.containSubset({
          [project2Dir.replace(/\/$/, "")]: {
            address: project2Dir.replace(/\/$/, ""),
            name: `dependent-project`, names: [`dependent-project`],
            modules: [
              {deps: [`${project1aDir}entry-a.js`], name: `${project2Dir}index.js`},
              { deps: [], name: `${project2Dir}package.json`}],
          },
          [project1aDir.replace(/\/$/, "")]: {
            address: project1aDir.replace(/\/$/, ""),
            name: `some-project`, names: [`some-project`],
            modules: [
              {deps: [`${project1aDir}other.js`], name: `${project1aDir}entry-a.js`},
              {deps: [],name: `${project1aDir}other.js`},
              {deps: [],name: `${project1aDir}package.json`}]
          }})))
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  describe("with pre-loaded dependent packages", function() {

    it("uses existing dependency by default", () =>
      registerPackage(System, project2Dir)
        .then(() => System.import("dependent-project"))
        .then(m => expect(m.version).to.equal("a")));

    it("uses specified dependency when preferLoaded is false", () =>
      modifyJSON(project2Dir + "package.json", {lively: {preferLoadedPackages: false}})
        .then(() => registerPackage(System, project2Dir))
        .then(() => System.import("dependent-project"))
        .then(m => expect(m.version).to.equal("b")));

    it("deals with package map directory entry", () =>
      modifyJSON(project2Dir + "package.json", {lively: {preferLoadedPackages: false, packageMap: {"some-project": project1bDir}}})
        .then(() => registerPackage(System, project2Dir))
        .then(() => System.import("dependent-project"))
        .then(m => expect(m.version).to.equal("b")));

    it("deals with package map relative entry", () =>
      modifyJSON(project2Dir + "package.json", {lively: {preferLoadedPackages: false, packageMap: {"some-project": "../dep2/"}}})
        .then(() => registerPackage(System, project2Dir))
        .then(m => expect(System.packages).to.containSubset({
          [noTrailingSlash(project1bDir)]: {main: "entry-b.js", map: {}, names: ["some-project"]},
          [noTrailingSlash(project2Dir)]: {map: {"some-project": "../dep2/"}, names: ["dependent-project"]}
        }))
        .then(() => System.import("dependent-project"))
        .then(m => expect(m.version).to.equal("b")));

  });

});

describe("package configuration test", () => {
  
  var S;
  beforeEach(() => S = getSystem("test", {baseURL: testDir}));
  afterEach(() => removeSystem("test"));
  
  it("installs hooks", () =>
    Promise.resolve()
      .then(() => applyConfig(S, {lively: {hooks: [{target: "normalize", source: "(proceed, name, parent, parentAddress) => proceed(name + 'x', parent, parentAddress)"}]}}, "barr"))
      .then(_ => (S.defaultJSExtensions = true) && S.normalize("foo"))
      .then(n => expect(n).to.match(/foox.js$/)));

  it("installs meta data in package", () =>
    Promise.resolve()
      .then(() => applyConfig(S, {lively: {meta: {"foo": {format: "global"}}}}, "some-project-url"))
      .then(n => expect(S.packages["some-project-url"].meta).to.deep.equal({"foo": {format: "global"}})));

  it("installs absolute addressed meta data in System.meta", () => {
    var testName = testDir + "foo";
    return Promise.resolve()
      .then(() => applyConfig(S, {lively: {meta: {[testName]: {format: "global"}}}}, "some-project-url"))
      .then(n => expect(S.packages["some-project-url"]).to.not.have.property("meta"))
      .then(n => expect(S.meta).to.deep.equal({[testName]: {format: "global"}}));
  });

  it("can resolve .. in url", () =>
    Promise.resolve()
      .then(() => expect(S.normalizeSync("..", testDir + "foo/bar.js")).to.equal(testDir + "index.js"))
      .then(() => S.normalize("..", testDir + "foo/bar.js"))
      .then((result) => expect(result).to.equal(testDir + "index.js")));
});
