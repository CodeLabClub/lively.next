import { arr } from "lively.lang";
import JavaScriptEditorPlugin from "../js/editor-plugin.js";

import prism from "prism";
import "prism-json";

var warnStyle = {"border-bottom": "2px dotted orange"},
    errorStyle = {"background-color": "red"};


class JSONTokenizer {

  tokenize(string) {
    var pos = {row: 0, column: 0},
        tokens = prism.tokenize(string, prism.languages.json),
        styles = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i],
          currentTokens = [token];
      if (typeof token === "string")
        token = tokens[i] = {matchedStr: token, type: "default"}
      token.start = {...pos};
      var lines = token.matchedStr.split("\n");
      if (lines.length === 1) pos.column += lines[0].length;
      else pos = {row: pos.row + lines.length-1, column: arr.last(lines).length}
      token.end = {...pos};
    }
    return tokens;
  }

}

export default class JSONEditorPlugin extends JavaScriptEditorPlugin {

  static get shortName() { return "json"; }

  constructor() {
    super();
    this.tokenizer = new JSONTokenizer();
    this._tokens = [];
  }

  get isJSONEditorPlugin() { return true }

  detach(editor) {
    this.textMorph.removeMarker("js-syntax-error");
    super.detach(editor);
  }

  highlight() {
    let textMorph = this.textMorph;
    if (!this.theme || !textMorph || !textMorph.document) return;

    let tokens = this._tokens = this.tokenizer.tokenize(textMorph.textString),
        attributes = [];
    for (let {type, start, end} of tokens)
      if (type !== "default" && this.theme[type])
        attributes.push({start, end}, this.theme[type]);

    textMorph.setTextAttributesWithSortedRanges(attributes);

    try {
      JSON.parse(textMorph.textString);
      textMorph.removeMarker("js-syntax-error")
    } catch (err) {
      if (!(err instanceof SyntaxError)) throw err

      var pos;

      var [_, index] = err.message.match(/position ([0-9]+)/) || [];
      if (index && !isNaN(Number(index)))  {
        pos = textMorph.indexToPosition(Number(index));
      }
      if (!pos) {
        var [_, line] = err.message.match(/line ([0-9]+)/) || [],
            [_, column] = err.message.match(/column ([0-9]+)/) || [];
        if (!isNaN(Number(line))) pos = {row: Number(line)-1, column: Number(column)};
      }

      if (!pos) {
        var {column, line} = err;
        if (typeof line === "number") pos = {row: line-1, column};
      }

      if (!pos || isNaN(pos.row) || isNaN(pos.column))
        textMorph.showError("JSON editor plugin detected JSON parse error but cannot find error position");
      else {
        textMorph.addMarker({
          id: "js-syntax-error",
          range: {start: {column: pos.column-1, row: pos.row}, end: {column: pos.column+1, row: pos.row}},
          style: errorStyle,
          type: "js-syntax-error"
        });
      }

    }

  }

}
