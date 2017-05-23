import {obj, string, num, arr, properties} from "lively.lang";
import {pt, Color, Rectangle, rect} from "lively.graphics";
import {signal, connect, disconnect} from "lively.bindings";
import {
  Morph,
  Button,
  List,
  Text,
  GridLayout,
  HorizontalLayout,
  StyleSheet,
  Path,
  Ellipse,
  config,
  Label,
  Tooltip,
  Icon
} from "lively.morphic";
import {intersect, shape} from "svg-intersections";
import {roundTo} from "lively.lang/number.js";

class LeashEndpoint extends Ellipse {
  onDrag(evt) {
    this.leash.onEndpointDrag(this, evt);
  }

  getConnectionPoint() {
    const {isPath, isPolygon, vertices, origin} = this.connectedMorph,
          gb = this.connectedMorph.globalBounds();
    if ((isPath || isPolygon) && this.attachedSide != "center") {
      const vs = vertices.map(({x, y}) => pt(x, y).addPt(origin)),
            ib = Rectangle.unionPts(vs),
            side = ib[this.attachedSide](),
            center = ib.center().addPt(ib.center().subPt(side)),
            line = shape("line", {x1: side.x, y1: side.y, x2: center.x, y2: center.y}),
            path = shape("polyline", {points: vs.map(({x, y}) => `${x},${y}`).join(" ")}),
            {x, y} = arr.min(intersect(path, line).points, ({x, y}) => pt(x, y).dist(side));
      return pt(x, y).addPt(gb.topLeft());
    } else {
      return gb[this.attachedSide]();
    }
  }

  update(change) {
    const globalPos = this.getConnectionPoint(), pos = this.leash.localize(globalPos);
    this.vertex = {...this.vertex, ...pos};
  }

  clearConnection() {
    if (this.connectedMorph) {
      disconnect(this.connectedMorph, "extent", this, "update");
      disconnect(this.connectedMorph, "position", this, "update");
    }
  }

  relayout() {
    const {x, y} = this.vertex, bw = this.leash.borderWidth;
    //this.extent = this.pt((2*bw), (2 * bw));
    this.center = pt(x + bw, y + bw);
  }

  attachTo(morph, side) {
    this.clearConnection();
    this.connectedMorph = morph;
    this.attachedSide = side;
    this.vertex = {
      ...this.leash.vertices[this.index],
      controlPoints: this.leash.controlPointsFor(side)
    };
    connect(this.connectedMorph, "position", this, "update");
    connect(this.connectedMorph, "extent", this, "update");
    this.update();
  }

  static get properties() {
    return {
      index: {},
      leash: {},
      vertex: {
        get() {
          return this.leash.vertices[this.index];
        },
        set(v) {
          this.leash.vertices[this.index] = v;
          this.leash.vertices = this.leash.vertices; // this is a very akward interface
        }
      }
    };
  }
}

export class Leash extends Path {
  static get properties() {
    return {
      start: {},
      end: {},
      borderWidth: {defaultValue: 2},
      borderColor: {defaultValue: Color.black},
      fill: {defaultValue: Color.transparent},
      styleSheets: {
        after: ["endpointStyle"],
        initialize() {
          this.styleSheets = new StyleSheet({
            ".Leash .LeashEndpoint": {
              fill: Color.black,
              origin: pt(3.5, 3.5),
              extent: pt(10, 10),
              nativeCursor: "-webkit-grab"
            }
          });
        }
      },
      vertices: {
        after: ["start", "end"],
        initialize() {
          this.vertices = [this.start, this.end];
        }
      },
      submorphs: {
        initialize() {
          this.submorphs = [
            (this.startPoint = this.endpoint(0)),
            (this.endPoint = this.endpoint(1))
          ];
          connect(this, "extent", this, "relayout");
          connect(this, "position", this, "relayout");
        }
      }
    };
  }

  remove() {
    super.remove();
    this.startPoint.clearConnection();
    this.endPoint.clearConnection();
  }

  onEndpointDrag(endpoint, evt) {
    const v = endpoint.vertex, {x, y} = v;
    endpoint.vertex = {...v, ...pt(x, y).addPt(evt.state.dragDelta)};
    this.relayout();
  }

  getEndpointStyle(idx) {
    return {
      ...this.endpointStyle,
      ...(idx == 0 ? this.endpointStyle.start : this.endpointStyle.end)
    };
  }

  endpoint(idx) {
    const leash = this, {x, y} = leash.vertices[idx];
    return new LeashEndpoint({index: idx, leash: this, position: pt(x, y)});
  }

  controlPointsFor(side) {
    const next = {
      topCenter: pt(0, -1),
      topLeft: pt(1, -1),
      rightCenter: pt(1, 0),
      bottomRight: pt(1, 1),
      bottomCenter: pt(0, 1),
      bottomLeft: pt(-1, 1),
      leftCenter: pt(-1, 0),
      topRight: pt(-1, -1),
      center: pt(0, 0)
    }[side];
    return {previous: next.negated().scaleBy(100), next: next.scaleBy(100)};
  }

  relayout() {
    this.startPoint.relayout();
    this.endPoint.relayout();
  }
}

export class Slider extends Morph {
  constructor(props) {
    super({
      height: 20,
      fill: Color.transparent,
      draggable: false,
      ...props
    });
    const slider = this;
    this.submorphs = [
      new Path({
        borderColor: Color.gray.darker(),
        borderWidth: 2,
        vertices: [this.leftCenter.addXY(5, 0), this.rightCenter.addXY(-5, 0)]
      }),
      {
        type: "ellipse",
        fill: Color.gray,
        name: "slideHandle",
        borderColor: Color.gray.darker(),
        borderWidth: 1,
        dropShadow: {blur: 5},
        extent: pt(15, 15),
        nativeCursor: "-webkit-grab",
        getValue: () => {
          return roundTo(this.target[this.property], 0.01);
        },
        onDragStart(evt) {
          this.valueView = new Tooltip({description: this.getValue()}).openInWorld(
            evt.hand.position.addXY(10, 10)
          );
        },
        onDrag(evt) {
          slider.onSlide(this, evt.state.dragDelta);
          this.valueView.description = this.getValue();
          this.valueView.position = evt.hand.position.addXY(10, 10);
        },
        onDragEnd(evt) {
          this.valueView.remove();
        }
      }
    ];
    connect(this, "extent", this, "update");
    this.update();
  }

  normalize(v) {
    return Math.abs(v / (this.max - this.min));
  }

  update() {
    const x = (this.width - 15) * this.normalize(this.target[this.property]);
    this.get("slideHandle").center = pt(x + 7.5, 10);
  }

  onSlide(slideHandle, delta) {
    const oldValue = this.target[this.property],
          newValue = roundTo(oldValue + delta.x / this.width, 0.01);
    this.target[this.property] = Math.max(this.min, Math.min(this.max, newValue));
    this.update();
  }
}

export class PropertyInspector extends Morph {

  static get properties() {

    return {
      target: {},
      property: {},
      min: {defaultValue: -Infinity},
      max: {defaultValue: Infinity},
      styleSheets: {
        initialize() {
          this.styleSheets = new StyleSheet({
            ".PropertyInspector .Button": {
              clipMode: "hidden",
              borderWidth: 0,
              fill: Color.transparent,
            },
            ".PropertyInspector .Button.activeStyle [name=label]": {
              fontColor: Color.white.darker()
            },
            ".Button.triggerStyle [name=label]": {
              fontColor: Color.black
            },
            ".PropertyInspector": {
              extent: pt(55, 25),
              borderRadius: 5,
              borderWidth: 1,
              borderColor: Color.gray,
              clipMode: "hidden"
            },
            ".PropertyInspector [name=down]": {padding: rect(0, -5, 0, 10)},
            ".PropertyInspector [name=up]": {padding: rect(0, 0, 0, -5)},
            ".PropertyInspector [name=value]": {
              fill: Color.white,
              padding: Rectangle.inset(4),
              fontSize: 15
            }
          });
        }
      },
      layout: {
        initialize() {
          this.layout = new GridLayout({
            columns: [1, {paddingLeft: 5, paddingRight: 5, fixed: 25}],
            grid: [["value", "up"], ["value", "down"]]
          });
        }
      },
      submorphs: {
        after: ["target", "property", "defaultValue", "min", "max"],
        initialize() {
          this.submorphs = [
            new ValueScrubber({
              name: "value",
              value: (this.target && this.target[this.property]) || this.defaultValue || 0,
              min: this.min,
              max: this.max
            }),
            {
              type: "button",
              name: "down", styleClasses: ['buttonStyle'],
              label: Icon.makeLabel("sort-desc", {padding: rect(2, 2, 0, 0), fontSize: 12})
            },
            {
              type: "button",
              name: "up", styleClasses: ['buttonStyle'], autofit: true,
              label: Icon.makeLabel("sort-asc", {padding: rect(2, 2, 0, 0), fontSize: 12})
            }
          ];
          connect(this.get("value"), "scrub", this.target, this.property);
          connect(this.get("up"), "fire", this, "increment");
          connect(this.get("down"), "fire", this, "decrement");
        }
      }
    };

  }

  __deserialize__(snapshot, objRef) {
    super.__deserialize__(snapshot, objRef);
    if (!this.target) this.setProperty("target", {});
  }

  update() {
    this.get("value").value = this.target[this.property];
  }

  increment() {
    if (this.max != undefined && this.target[this.property] >= this.max) return;
    this.target[this.property] = (this.target[this.property] || this.defaultValue) + 1;
    this.update();
  }

  decrement() {
    if (this.min != undefined && this.target[this.property] <= this.min) return;
    this.target[this.property] = (this.target[this.property] || this.defaultValue) - 1;
    this.update();
  }
}

export class ValueScrubber extends Text {
  static get properties() {
    return {
      value: {defaultValue: 0},
      fill: {defaultValue: Color.transparent},
      draggable: {defaultValue: true},
      min: {defaultValue: -Infinity},
      max: {defaultValue: Infinity}
    };
  }

  relayout() {
    const d = 5;
    this.fit();
    if (this.width + d < this.textBounds().width) {
      this.squeezeLabel(this.width + d);
    } else if (this.width > this.textBounds().width) {
      this.expandLabel(this.width);
    }
  }

  squeezeLabel(len) {
    if (this.fontSize < 11) return;
    while (this.fontSize > 10 && this.textBounds().width > len) {
      this.fontSize -= 2;
      this.padding = this.padding.withY(this.padding.top() + 1);
    }
  }

  expandLabel(len) {
    if (this.fontSize > 13) return;
    while (this.fontSize < 14 && this.textBounds().width < len) {
      this.fontSize += 2;
      this.padding = this.padding.withY(this.padding.top() - 1);
    }
  }

  onKeyDown(evt) {
    super.onKeyDown(evt);
    if ("Enter" == evt.keyCombo) {
      const [v, unit] = this.textString.split(" ");
      if (v) {
        this.value = parseFloat(v);
        signal(this, "scrub", this.scrubbedValue);
      }
      evt.stop();
    }
  }

  onDragStart(evt) {
    this.execCommand("toggle active mark");
    this.initPos = evt.position;
    this.factorLabel = new Tooltip({description: "1x"}).openInWorld(
      evt.hand.position.addXY(10, 10)
    );
  }

  getScaleAndOffset(evt) {
    const {x, y} = evt.position.subPt(this.initPos),
          scale = num.roundTo(Math.exp(-y / $world.height * 4), 0.01);
    return {offset: x, scale};
  }

  onDrag(evt) {
    // x delta is the offset to the original value
    // y is the scale
    const {scale, offset} = this.getScaleAndOffset(evt), v = this.getCurrentValue(offset, scale);
    signal(this, "scrub", v);
    this.textString = obj.safeToString(v);
    if (this.unit) this.textString += " " + this.unit;
    this.factorLabel.description = scale + "x";
    this.factorLabel.position = evt.hand.position.addXY(10, 10);
    this.relayout();
  }

  getCurrentValue(delta, s) {
    const v = this.scrubbedValue + Math.round(delta * s);
    return Math.max(this.min, Math.min(this.max, v));
  }

  onDragEnd(evt) {
    const {offset, scale} = this.getScaleAndOffset(evt);
    this.value = this.getCurrentValue(offset, scale);
    this.factorLabel.softRemove();
  }

  set value(v) {
    v = Math.max(this.min, Math.min(this.max, v));
    this.scrubbedValue = v;
    this.textString = obj.safeToString(v) || "";
    if (this.unit) this.textString += " " + this.unit;
    this.relayout();
  }
}

export class CheckBox extends Morph {
  static get properties() {
    return {
      draggable: {defaultValue: false},
      extent: {defaultValue: pt(15, 15)},
      borderWidth: {defaultValue: 0},
      active: {defaultValue: true},
      checked: {defaultValue: false},
      fill: {defaultValue: Color.transparent},
      nativeCursor: {defaultValue: "pointer"}
    };
  }

  trigger() {
    try {
      this.checked = !this.checked;
      signal(this, "toggle", this.checked);
    } catch (err) {
      var w = this.world();
      if (w) w.logError(err);
      else console.error(err);
    }
  }

  onMouseDown(evt) {
    if (this.active) this.trigger();
  }

  render(renderer) {
    return renderer.renderCheckBox(this);
  }
}

export class LabeledCheckBox extends Morph {
  static example() {
    var cb = new LabeledCheckBox({label: "foo"}).openInWorld();
    // cb.remove()
  }

  static get properties() {
    return {
      name: {defaultValue: "LabeledCheckBox"},
      alignCheckBox: {defaultValue: "left"},
      label: {
        defaultValue: "label",
        after: ["submorphs"],
        derived: true,
        get() {
          return this.labelMorph.value;
        },
        set(value) {
          this.labelMorph.value = value;
        }
      },
      checked: {
        after: ["submorphs"],
        derived: true,
        get() {
          return this.checkboxMorph.checked;
        },
        set(value) {
          this.checkboxMorph.checked = value;
          signal(this, "checked", value);
        }
      },
      active: {
        after: ["submorphs"],
        derived: true,
        get() {
          return this.checkboxMorph.active;
        },
        set(value) {
          this.checkboxMorph.active;
        }
      },
      labelMorph: {
        derived: true,
        readOnly: true,
        get() {
          return this.getSubmorphNamed("label");
        }
      },
      checkboxMorph: {
        derived: true,
        readOnly: true,
        get() {
          return this.getSubmorphNamed("checkbox");
        }
      },

      submorphs: {
        initialize() {
          this.submorphs = [
            new CheckBox({name: "checkbox"}),
            new Label({
              nativeCursor: "pointer",
              name: "label",
              padding: Rectangle.inset(3, 0)
            })
          ];
        }
      }
    };
  }

  constructor(props) {
    super(props);
    connect(this, "alignCheckBox", this, "extent");
    connect(this, "alignCheckBox", this, "relayout");
    connect(this.labelMorph, "value", this, "relayout");
    connect(this.checkboxMorph, "checked", this, "checked");
    this.relayout();
    setTimeout(() => this.relayout(), 0);
  }

  relayout() {
    var l = this.labelMorph, cb = this.checkboxMorph;
    if (this.alignCheckBox === "left") {
      cb.leftCenter = pt(0, Math.max(this.height, l.height) / 2);
      l.leftCenter = cb.rightCenter;
    } else {
      l.position = pt(0, 0);
      cb.leftCenter = pt(l.width, l.height / 2);
    }
    this.extent = this.submorphBounds().extent();
  }

  trigger() {
    this.checkboxMorph.trigger();
  }

  onMouseDown(evt) {
    if (this.active) this.trigger();
    evt.stop();
  }
}

export class ModeSelector extends Morph {
  static example() {
    var cb = new ModeSelector({items: {foo: {}}}).openInWorld();
    // cb.remove()
  }

  static get properties() {
    return {
      items: {
        set(items) {
          if (obj.isArray(items)) {
            this.keys = this.values = items;
          } else {
            this.keys = obj.keys(items);
            this.values = obj.values(items);
          }
        }
      },
      height: {defaultValue: 30},
      init: {},
      keys: {},
      values: {},
      tooltips: {},
      styleSheets: {
        initialize() {
          this.styleSheets = new StyleSheet({
            ".ModeSelector": {fill: Color.transparent, origin: pt(0, 5)},
            ".ModeSelector [name=typeMarker]": {fill: Color.gray.darker(), borderRadius: 3},
            ".ModeSelector .label": {
              fontWeight: "bold",
              nativeCursor: "pointer",
              padding: Rectangle.inset(4)
            }
          });
        }
      },
      layout: {
        after: ["items"],
        initialize() {
          this.layout = new GridLayout({
            rows: [0, {paddingBottom: 10}],
            grid: [[...arr.interpose(this.keys.map(k => k + "Label"), null)]],
            autoAssign: false,
            fitToCell: false
          });
          this.layout.row(0).items.forEach(c => {
            c.group.align = "center";
          });
        }
      },
      submorphs: {
        initialize() {
          this.submorphs = [
            {name: "typeMarker"},
            ...this.createLabels(this.keys, this.values, this.tooltips)
          ];
          this.update(
            this.init ? this.init : this.keys[0],
            this.values[this.keys.includes(this.init) ? this.keys.indexOf(this.init) : 0],
            true
          );
          connect(this, "extent", this, "relayout");
        }
      }
    };
  }

  createLabels(keys, values, tooltips = {}) {
    return arr.zip(keys, values).map(([name, value]) => {
      const tooltip = tooltips[name];
      return {
        name: name + "Label",
        styleClasses: ["label"],
        type: "label",
        value: name,
        autofit: true,
        ...(tooltip && {tooltip}),
        onMouseDown: evt => {
          this.update(name, value);
        }
      };
    });
  }

  async relayout(animated = true) {
    let tm = this.get("typeMarker"),
        bounds = this.currentLabel.bounds();
    this.currentLabel && animated ? await tm.animate({bounds, duration: 200}) : tm.setBounds(bounds);
     
  }

  async update(label, value, silent = false) {
    const newLabel = this.get(label + "Label");
    if (newLabel == this.currentLabel) return;
    if (this.currentLabel) this.currentLabel.fontColor = Color.black;
    this.currentLabel = newLabel;
    newLabel.fontColor = Color.white;
    await this.whenRendered();
    await this.relayout(!silent);
    !silent && signal(this, label, value);
    !silent && signal(this, "switchLabel", value);
  }
}

export class DropDownSelector extends Morph {
  constructor(props) {
    const {target, property, values} = props;
    super({
      border: {radius: 3, color: Color.gray.darker(), style: "solid"},
      layout: new HorizontalLayout({spacing: 4}),
      ...props
    });
    this.build();
  }

  build() {
    this.dropDownLabel = Icon.makeLabel("chevron-circle-down", {
      opacity: 0,
      fontSize: 16,
      fontColor: Color.gray.darker()
    });
    this.submorphs = [
      {
        type: "text",
        name: "currentValue",
        padding: Rectangle.inset(0),
        readOnly: true
      },
      this.dropDownLabel
    ];
    this.relayout();
  }

  getMenuEntries() {
    const currentValue = this.getNameFor(this.value);
    return [
      ...(this.value ? [{command: currentValue, target: this}] : []),
      ...arr.compact(
        this.commands.map(c => {
          return c.name != currentValue && {command: c.name, target: this};
        })
      )
    ];
  }

  get commands() {
    if (obj.isArray(this.values)) {
      return this.values.map(v => {
        return {
          name: v,
          exec: () => {
            this.value = v;
          }
        };
      });
    } else {
      return properties.forEachOwn(this.values, (name, v) => {
        return {
          name,
          exec: () => {
            this.value = v;
          }
        };
      });
    }
  }

  getNameFor(value) {
    if (this.getCurrentValue) return this.getCurrentValue();
    if (obj.isArray(this.values)) {
      return obj.safeToString(value);
    } else {
      return obj.safeToString(properties.nameFor(this.values, value));
    }
  }

  get value() {
    return this.target[this.property];
  }

  set value(v) {
    if (obj.isFunction(v)) {
      v();
    } else {
      this.target[this.property] = v;
    }
    this.relayout();
  }

  relayout() {
    const vPrinted = this.getNameFor(this.value), valueLabel = this.get("currentValue");
    if (vPrinted == "undefined") {
      valueLabel.textString = "Not set";
      valueLabel.fontColor = Color.gray;
    } else {
      valueLabel.textString = vPrinted;
      valueLabel.fontColor = Color.black;
    }
  }

  onHoverIn() {
    this.dropDownLabel.animate({opacity: 1, duration: 300});
  }

  onHoverOut() {
    this.dropDownLabel.animate({opacity: 0, duration: 200});
  }

  onMouseDown(evt) {
    this.menu = this.world().openWorldMenu(evt, this.getMenuEntries());
    this.menu.globalPosition = this.globalPosition;
    this.menu.isHaloItem = this.isHaloItem;
  }
}

export class SearchField extends Text {

  static get properties() {
    return {
      layout: {
        initialize() {
          this.layout = new HorizontalLayout({direction: 'rightToLeft'});
        }
      },
      fuzzy: {
        derived: true, after: ["filterFunction", "sortFunction"],
        set(fuzzy) {
          // fuzzy => bool or prop;
          this.setProperty("fuzzy", fuzzy);
          if (!fuzzy) {
            if (this.sortFunction === this.fuzzySortFunction)
              this.sortFunction = null;
            if (this.filterFunction === this.fuzzyFilterFunction)
              this.filterFunction = this.defaultFilterFunction;
          } else  {
            if (!this.sortFunction) this.sortFunction = this.fuzzySortFunction
            if (this.filterFunction == this.defaultFilterFunction)
              this.filterFunction = this.fuzzyFilterFunction;
          }
        }
      },

      filterFunction: {
        get() {
          let filterFunction = this.getProperty("filterFunction");
          if (!filterFunction) return this.defaultFilterFunction;
          if (typeof filterFunction === "string")
            filterFunction = eval(`(${filterFunction})`);
          return filterFunction;
        }
      },

      sortFunction: {},

      defaultFilterFunction: {
        readOnly: true,
        get() {
          return this._defaultFilterFunction
              || (this._defaultFilterFunction = (parsedInput, item) =>
                    parsedInput.lowercasedTokens.every(token =>
                      item.string.toLowerCase().includes(token)));
        }
      },

      fuzzySortFunction: {
        get() {
          return this._fuzzySortFunction
              || (this._fuzzySortFunction = (parsedInput, item) => {
                var prop = typeof this.fuzzy === "string" ? this.fuzzy : "string";
                // preioritize those completions that are close to the input
                var fuzzyValue = String(Path(prop).get(item)).toLowerCase();
                var base = 0;
                parsedInput.lowercasedTokens.forEach(t => {
                  if (fuzzyValue.startsWith(t)) base -= 10;
                  else if (fuzzyValue.includes(t)) base -= 5;
                });
                return arr.sum(parsedInput.lowercasedTokens.map(token =>
                  string.levenshtein(fuzzyValue.toLowerCase(), token))) + base
              })
        }
      },

      fuzzyFilterFunction: {
        get() {
          return this._fuzzyFilterFunction
              || (this._fuzzyFilterFunction = (parsedInput, item) => {
            var prop = typeof this.fuzzy === "string" ? this.fuzzy : "string";
            var tokens = parsedInput.lowercasedTokens;
            if (tokens.every(token => item.string.toLowerCase().includes(token))) return true;
            // "fuzzy" match against item.string or another prop of item
            var fuzzyValue = String(Path(prop).get(item)).toLowerCase();
            return arr.sum(parsedInput.lowercasedTokens.map(token =>
                    string.levenshtein(fuzzyValue, token))) <= 3;
          });
        }
      },
      submorphs: {
        after: ['placeHolder'],
        initialize() {
           this.submorphs = [
            {
              type: "label",
              name: 'placeholder',
              isLayoutable: false,
              opacity: .3,
              value: "Search",
              reactsToPointer: false,
              padding: rect(6, 3, 2, 2)
            },
            Icon.makeLabel("times-circle", {
              padding: rect(2,2,4,2),
              fontSize: 14,
              visible: false,
              name: "placeholder icon",
              fontColor: Color.gray,
              nativeCursor: 'pointer'
            })
           ];
           connect(this.get('placeholder icon'), 'onMouseDown', this, 'clearInput');
        }
      }
    }
  }

  parseInput() {
    var filterText = this.textString,
      // parser that allows escapes
        parsed = Array.from(filterText).reduce(
          (state, char) => {
            // filterText = "foo bar\\ x"
            if (char === "\\" && !state.escaped) {
              state.escaped = true;
              return state;
            }
  
            if (char === " " && !state.escaped) {
              if (!state.spaceSeen && state.current) {
                state.tokens.push(state.current);
                state.current = "";
              }
              state.spaceSeen = true;
            } else {
              state.spaceSeen = false;
              state.current += char;
            }
            state.escaped = false;
            return state;
          },
          {tokens: [], current: "", escaped: false, spaceSeen: false}
        );
    parsed.current && parsed.tokens.push(parsed.current);
    var lowercasedTokens = parsed.tokens.map(ea => ea.toLowerCase());
    return {tokens: parsed.tokens, lowercasedTokens};
  }

  clearInput() {
    this.textString = '';
    signal(this, "searchInput", this.parseInput());
    this.onBlur();
  }

  matches(string) {
    if (!this.textString) return true;
    return this.filterFunction.call(this, this.parseInput(), {string});
  }

  onChange(change) {
    super.onChange(change);
    let inputChange = change.selector === "insertText" || change.selector === "deleteText",
        validInput = this.isFocused() && this.textString;
    if (this.get('placeholder icon')) this.get('placeholder icon').visible = !!this.textString;
    this.active && inputChange && signal(this, "searchInput", this.parseInput());
  }

  onBlur(evt) {
    super.onBlur(evt)
    this.active = false;
    this.get('placeholder').visible = !this.textString;
    this.animate({styleClasses: ["idle"], duration: 500});

  }
  
  onFocus(evt) {
    super.onFocus(evt);
    this.animate({styleClasses: ["selected"], duration: 500});
    this.get('placeholder').visible = false;
    this.active = true;
  }
}
