// Unicode characters that are considered "extending", i.e. treated as a single
// unit. The list below is based on
// https://github.com/codemirror/CodeMirror/blob/master/src/util/misc.js#L122
const extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/
export function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

// Returns a number from the range [`0`; `str.length`] unless `pos` is outside that range.
export function skipExtendingChars(str, pos, dir) {
  while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos)))
    pos += dir;
  return pos
}


function test() {
  let measure = DOMTextMeasure.initDefault().reset();
  measure.defaultCharExtent({fontSize: 12, fontFamily: "serif"});
}



export class DOMTextMeasure {

  static default() {
    if (!this._default)
      throw new Error("DOMMeasure has not yet been initialized!")
    return this._default;
  }

  static initDefault(domEnv) {
    if (!this._default) {
      if (!domEnv && typeof document === "undefined")
        throw new Error("Cannot initialize DOMMeasure without document");
      if (!domEnv) domEnv = {document}
      this._default = this.forDOMEnv(domEnv);
    }
    return this._default;
  }

  static removeDefault() {
    if (this._default) {
      this._default.uninstall();
      this._default = null;
    }
  }

  static forDOMEnv({document}) {
    var fontMetric = new DOMTextMeasure();
    fontMetric.install(document, document.body);
    return fontMetric;
  }


  reset() {
    var doc, parentNode;
    if (this.element) {
      parentNode = this.element.parentNode;
      doc = this.element.ownerDocument;
    }
    this.uninstall();
    // this.charMap = {};
    // this.cachedBoundsInfo = {};
    if (doc && parentNode)
      this.install(doc, parentNode);
    return this;
  }

  install(doc, parentEl) {
    this.maxElementsWithStyleCacheCount = 50;
    this.elementsWithStyleCache = {};
    this.elementsWithStyleCacheCount = 0;
    this.defaultCharWidthHeightCache = {};
    this.doc = doc;
    let el = this.element = doc.createElement("div");
    el.id = "domMeasure";
    this.setMeasureNodeStyles(el.style, true);
    parentEl.appendChild(el);
  }

  uninstall() {
    let el = this.element;
    if (!el) return
    if (el.parentNode) el.parentNode.removeChild(el);
    this.element = null;
  }

  setMeasureNodeStyles(style, isRoot) {
    style.width = style.height = "auto";
    style.left = style.top = "0px";
    style.visibility = "hidden";
    style.position = "absolute";
    style.whiteSpace = "pre";
    style.font = "inherit";
    style.overflow = isRoot ? "hidden" : "visible";
  }

  generateStyleKey(fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textStyleClasses) {
    return `${fontFamily}-${fontSize}-${fontWeight}-${fontStyle}-${textDecoration}-${textStyleClasses}`;
  }

  ensureMeasureNode(styleKey, style, className = "") {
    // create a DOM node that would be a textlayer node in a normal text morph.
    // In order to measure stuff this node gets line nodes appended later

    // returns an existing or new node with style
    let {doc, element: root, elementsWithStyleCache: cache} = this;
    if (cache[styleKey]) return cache[styleKey];
    let el = cache[styleKey] = document.createElement("div");
    if (className) el.className = className;
    el.id = styleKey;
    root.appendChild(el);
    this.elementsWithStyleCacheCount++;
    Object.assign(el.style, style);
    el.style.fontSize = style.fontSize + "px";
    if (style.textStyleClasses)
      el.className = style.textStyleClasses.join(" ");
    if (this.elementsWithStyleCacheCount > this.maxElementsWithStyleCacheCount) {
      let rmCacheEl = root.childNodes[0];
      root.removeChild(rmCacheEl);
      cache[rmCacheEl.id] = null;
    }
    return el;
  }

  ensureMeasureNodeForLine(line, defaultStyle, defaultStyleKey, textNodeClassName = "") {
    let {doc: document} = this,
        textNode = this.ensureMeasureNode(defaultStyleKey, defaultStyle, textNodeClassName);

    let lineEl = document.createElement("div");
    lineEl.className = "line";

    // FIXME... TextRenderer>>renderLine...!
    let { textAndAttributes } = line, renderedChunks = [];
    for (let i = 0; i < textAndAttributes.length; i = i+2) {
      let text = textAndAttributes[i], attr = textAndAttributes[i+1];
      if (!attr) {
        lineEl.appendChild(document.createTextNode(text));
        continue;
      }

      let tagname = attr.link ? "a" : "span",
          style = {}, attrs = {textContent: text};

      if (attr.link) {
        attrs.href = attr.link;
        attrs.target = "_blank";
      }

      if (attr.fontSize) style.fontSize               = attr.fontSize + "px";
      if (attr.fontFamily) style.fontFamily           = attr.fontFamily;
      if (attr.fontWeight) style.fontWeight           = attr.fontWeight;
      if (attr.fontStyle) style.fontStyle             = attr.fontStyle;
      if (attr.textDecoration) style.textDecoration   = attr.textDecoration;
      if (attr.fontColor) style.color                 = attr.fontColor ? String(attr.fontColor) : "";
      if (attr.backgroundColor) style.backgroundColor = attr.backgroundColor ? String(attr.backgroundColor) : "";
      if (attr.nativeCursor) attrs.style.cursor       = attr.nativeCursor; 

      if (attr.textStyleClasses && attr.textStyleClasses.length)
        attrs.className = attr.textStyleClasses.join(" ");

      let el = document.createElement(tagname);
      Object.assign(el, attrs);
      Object.assign(el.style, style);
      lineEl.appendChild(el);
    }

    textNode.appendChild(lineEl);
    return lineEl;
  }

  prepareMeasureForLineSimpleStyle(styleKey, style) {
    // returns an existing or new node with style
    let {doc, element: root, elementsWithStyleCache: cache} = this;
    if (cache[styleKey]) return cache[styleKey];
    let el = cache[styleKey] = document.createElement("div");
    el.id = styleKey;
    root.appendChild(el);
    this.elementsWithStyleCacheCount++;
    Object.assign(el.style, style);
    el.style.fontSize = style.fontSize + "px";
    if (style.textStyleClasses)
      el.className = style.textStyleClasses.join(" ");
    if (this.elementsWithStyleCacheCount > this.maxElementsWithStyleCacheCount) {
      let rmCacheEl = root.childNodes[0];
      root.removeChild(rmCacheEl);
      cache[rmCacheEl.id] = null;
    }
    return el;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  defaultCharExtent(style, styleKey) {  
    if (!styleKey) {
      let {fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textStyleClasses} = style;
      styleKey = this.generateStyleKey(fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textStyleClasses);
    }
    let {defaultCharWidthHeightCache} = this,
        found = defaultCharWidthHeightCache[styleKey];
    if (found) return found;
    let node = this.prepareMeasureForLineSimpleStyle(styleKey, style);
    node.textContent = "Hello World!";
    let {width, height} = node.getBoundingClientRect();
    return defaultCharWidthHeightCache[styleKey] = {width: width/12, height};
  }

  manuallyComputeCharBoundsOfLine(line, defaultStyle, offsetX = 0, offsetY = 0, styleKey, textNodeClassName = "newtext-text-layer") {
// window.line = line
// window.defaultStyle = defaultStyle

    if (!styleKey) {
      let {fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textStyleClasses} = defaultStyle;
      styleKey = this.generateStyleKey(fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textStyleClasses);
    }

    let lineNode = this.ensureMeasureNodeForLine(line, defaultStyle, styleKey, textNodeClassName),
        offset = cumulativeOffset(lineNode);

    try {
      return charBoundsOfLine(line, lineNode, offset.left + offsetX, offset.top + offsetY);
    } finally { lineNode.parentNode.removeChild(lineNode); }
  }
}

function cumulativeOffset(element) {
  let top = 0, left = 0;
  do {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while(element);
  return {top, left};
};


export function charBoundsOfLine(line, lineNode, offsetX = 0, offsetY = 0) {
  const {ELEMENT_NODE, TEXT_NODE, childNodes} = lineNode;

  let node = childNodes[0],
      result = [],
      textLength = line.text.length,
      index = 0;

  while (node) {

    let textNode = node.nodeType === ELEMENT_NODE && node.childNodes[0] ?
      node.childNodes[0] : node;

    if (textNode.nodeType === TEXT_NODE) {
      let length = textNode.length;
      for (let i = 0; i < length; i++) {
        // let {left: x, top: y, width, height} =  measureCharInner(node, i);
        // result[index++] = typeof height === "undefined" ?
        //   null : {x: x - offsetX, y: y - offsetY, width, height};
        let {left, top, width, height} = measureCharInner(textNode, i),
            x = left - offsetX,
            y = top - offsetY;
        result[index++] = {x, y, width, height};
      }

    } else if (node.nodeType === ELEMENT_NODE) {
      let {left, top, width, height} = node.getBoundingClientRect(),
          x = left - offsetX,
          y = top - offsetY;
      result[index++] = {x,y,width,height};

    } else throw new Error(`Cannot deal with node ${node}`);

    node = node.nextSibling;
  }
  
  return result;
}



function measureCharInner(node, index, bias = "left") {
  let rect, start = index, end = index + 1;
  if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
    for (let i = 0; i < 4; i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
      rect = getUsefulRect(range(node, start, end).getClientRects(), bias)
      if (rect.left || rect.right || start == 0) break
      end = start
      start = start - 1
    }
  }
  return rect;
  // let {bottom, height, left, right, top, width} = rect;
  // return {bottom, height, left, right, top, width};
}

function range(node, start, end, endNode) {
    let r = document.createRange()
    r.setEnd(endNode || node, end)
    r.setStart(node, start)
    return r

  // range = function(node, start, end) {
  //   let r = document.body.createTextRange()
  //   try { r.moveToElementText(node.parentNode) }
  //   catch(e) { return r }
  //   r.collapse(true)
  //   r.moveEnd("character", end)
  //   r.moveStart("character", start)
  //   return r
  // }
}

function getUsefulRect(rects, bias) {
  let rect = {left: 0, right: 0, top: 0, bottom: 0};
  if (bias == "left") for (let i = 0; i < rects.length; i++) {
    if ((rect = rects[i]).left != rect.right) break
  } else for (let i = rects.length - 1; i >= 0; i--) {
    if ((rect = rects[i]).left != rect.right) break
  }
  return rect
}
