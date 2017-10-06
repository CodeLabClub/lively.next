/* global System */
import { promise } from "lively.lang";
import { Icon, Morph, StyleSheet, Image, Text } from "lively.morphic";
import { pt, Rectangle, Color } from "lively.graphics";
import { connect } from "lively.bindings";

import { Button } from "./buttons.js"


// var i = LoadingIndicator.open("test")
// i.remove()

const imageUrl = System.decanonicalize("lively.morphic/") + "lively-web-logo-small-animate.svg";

export default class LoadingIndicator extends Morph {

  static get styleSheet() {
    return new StyleSheet({
      ".LoadingIndicator [name=spinner]": {
        fill: Color.transparent,
        extent: pt(100, 104),
        position: pt(0, 0),
        halosEnabled: false
      },
      ".LoadingIndicator .center-text": {
        fontSize: 16,
        fontFamily: "Helvetica Neue, Arial",
        fontColor: Color.white,
        halosEnabled: false
      },
      ".LoadingIndicator [name=closeButton] [name=label]": {
        fontColor: Color.white,
        fontFamily: "FontAwesome"
      },
      ".LoadingIndicator [name=closeButton]": {
        extent: pt(20, 20),
        fill: Color.transparent,
        borderWidth: 0,
        fontColor: Color.white,
      }
    });
  }

  static open(label, props) {
    return new this({...props, label}).openInWorld();
  }

  static forPromise(p, label, props) {
    var i = this.open(label, props);
    promise.finally(Promise.resolve(p), () => i.remove());
    return i;
  }

  static async runFn(fn, label, props) {
    var i = this.open(label, props);
    await i.whenRendered();
    try { return await fn(); } finally { i.remove(); }
  }

  static get properties() {
    return {
      fill:       {defaultValue: Color.black.withA(.6)},
      fontSize:   {defaultValue: 16},
      fontFamily: {defaultValue: "Arial"},
      name:       {defaultValue: "LoadingIndicator"},
      borderRadius: {defaultValue: 10},
      label: {
        derived: true, after: ["submorphs"],
        get() { return this.getSubmorphNamed("label").value; },
        set(val) { this.getSubmorphNamed("label").value = val; }
      },

      fontFamily: {
        derived: true, after: ["submorphs"],
        get() { return this.getSubmorphNamed("label").fontFamily; },
        set(val) { this.getSubmorphNamed("label").fontFamily = val; }
      },

      fontSize: {
        derived: true, after: ["submorphs"],
        get() { return this.getSubmorphNamed("label").fontSize; },
        set(val) { this.getSubmorphNamed("label").fontSize = val; }
      },

      submorphs: {
        initialize() {
          this.submorphs = [
            new Image({
              imageUrl,
              name: "spinner"
            }),
            {
              type: "label",
              name: "label",
              value: "",
              styleClasses: ["center-text"]
            },
            {
              type: "button",
              name: "closeButton",
              label: Icon.textAttribute("times")
            }
          ];

        }
      }
    }
  }

  constructor(props = {}) {
    super(props);
    this.relayout();
    connect(this, 'extent', this, 'relayout');
    connect(this.get("label"), 'extent', this, "relayout");
    connect(this.get("label"), 'value', this, "updateLabel");
    connect(this.get("label"), 'fontSize', this, "updateLabel");
    connect(this.get("label"), 'fontFamily', this, "updateLabel");
    connect(this.get("closeButton"), 'fire', this, "remove");
    this.get("closeButton").fit();
  }

  get isEpiMorph() { return true }

  updateLabel() {
    var center = this.center; this.relayout();
    this.center = center;
  }

  relayout() {
    var padding = Rectangle.inset(20, 12),
        [spinner, label, closeButton] = this.submorphs,
        w = Math.max(spinner.width, label.width, 120) + padding.left() + padding.right(),
        h = spinner.height + label.height + padding.top() + padding.bottom();
    this.extent = pt(w,h);
    spinner.topCenter = this.innerBounds().topCenter().addXY(0, padding.top());
    label.topCenter = spinner.bottomCenter.addXY(0, 4);
    closeButton.right = w;
  }

  onHoverIn(evt) { this.get("closeButton").visible = true; }
  onHoverOut(evt) { this.get("closeButton").visible = false; }
}
