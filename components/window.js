/* global Expo */
import { arr, string } from "lively.lang";
import { pt, Color, Rectangle } from "lively.graphics";
import { Label, morph, Morph, ShadowObject } from "lively.morphic";
import { connect, signal } from "lively.bindings";
import {StyleSheet} from '../style-rules.js';
import {HorizontalLayout} from '../layout.js';


export default class Window extends Morph {

  static get styleSheet() {
    let windowButtonSize = pt(13, 13);
    return new StyleSheet({
      ".Window .buttonGroup": {
        draggable: false,
        fill: Color.transparent,
        position: pt(0, 0),
        layout: new HorizontalLayout({autoResize: true, spacing: 6})
      },
      ".Window.inactive": {
        fill: Color.gray.lighter().lighter(),
        borderRadius: 7,
        borderColor: Color.gray,
        borderWidth: 1,
        dropShadow: {distance: 10, blur: 40, color: Color.black.withA(.1)}
      },
      ".Window.inactive .windowButton": {
        borderColor: Color.gray.darker(),
        fill: Color.gray,
        borderRadius: 14,
        extent: windowButtonSize
      },
      ".Window.active .closeButton": {
        borderRadius: 14,
        extent: windowButtonSize,
        borderColor: Color.darkRed,
        fill: Color.rgb(255, 96, 82)
      },
      ".Window .defaultLabelStyle": {
        fill: Color.transparent,
        opacity: 0.5,
        fontSize: 11,
        position: pt(2,1)
      },
      ".Window.active .minimizeButton": {
        borderRadius: 14,
        extent: windowButtonSize,
        borderColor: Color.brown,
        fill: Color.rgb(255, 190, 6)
      },
      ".Window.active .maximizeButton": {
        borderRadius: 14,
        extent: windowButtonSize,
        borderColor: Color.darkGreen,
        fill: Color.green
      },
      ".Window .windowTitleLabel": {
        fill: Color.transparent,
        fontColor: Color.darkGray
      },
      ".Window.active": {
        fill: Color.lightGray,
        borderRadius: 7,
        borderColor: Color.gray,
        borderWidth: 1,
        dropShadow: {distance: 10, blur: 40, color: Color.black.withA(.3)},
      }
    });
  }

  static get properties() {
    return {
      controls: {
        after: ["submorphs"],
        initialize() {
          this.controls = this.getControls();
          if (this.resizable) this.controls.push(this.resizer());
          this.submorphs = [...this.submorphs, ...this.controls];
        }
      },
      styleClasses: {defaultValue: ["active"]},
      clipMode: {defaultValue: "hidden"},
      resizable: {defaultValue: true},

      title: {
        after: ["controls"],
        derived: true,
        get() {
          return this.titleLabel().textString;
        },
        set(title) {
          let textAndAttrs = typeof title === "string" ? [title, {}] : title, maxLength = 100, length = 0, truncated = [];
          for (var i = 0; i < textAndAttrs.length; i = i + 2) {
            let string = textAndAttrs[i], attr = textAndAttrs[i + 1];
            string = string.replace(/\n/g, "");
            var delta = string.length + length - maxLength;
            if (delta > 0) string = string.slice(0, -delta);
            truncated.push(string, attr || {});
            if (length >= maxLength) break;
          }
          this.titleLabel().value = truncated;
          this.relayoutWindowControls();
        }
      },

      targetMorph: {
        after: ["controls"],
        derived: true,
        get() {
          return arr.withoutAll(this.submorphs, this.controls)[0];
        },
        set(morph) {
          let ctrls = this.controls;
          arr.withoutAll(this.submorphs, ctrls).forEach(ea => ea.remove());
          if (morph) this.addMorph(morph, ctrls[0]);
          this.whenRendered().then(() => this.relayoutWindowControls());
        }
      },

      nonMinizedBounds: {},
      nonMaximizedBounds: {},
      minimizedBounds: {},
      minimized: {},
      maximized: {}
    };
  }

  constructor(props = {}) {
    super(props);
    this.relayoutWindowControls();
    connect(this, "extent", this, "relayoutWindowControls");
    connect(this.titleLabel(), "value", this, "relayoutWindowControls");
  }

  get isWindow() {
    return true;
  }

  targetMorphBounds() {
    return new Rectangle(0, 25, this.width, this.height - 25);
  }

  relayoutWindowControls() {
    var innerB = this.innerBounds(),
        title = this.titleLabel(),
        labelBounds = innerB.withHeight(25),
        lastButtonOrWrapper = this.getSubmorphNamed("button wrapper") || arr.last(this.buttons()),
        buttonOffset = lastButtonOrWrapper.bounds().right() + 3,
        minLabelBounds = labelBounds.withLeftCenter(pt(buttonOffset, labelBounds.height / 2));

    // resizer
    this.resizer().bottomRight = innerB.bottomRight();

    // targetMorph
    if (this.targetMorph && this.targetMorph.isLayoutable) this.targetMorph.setBounds(this.targetMorphBounds());

    // title
    title.textBounds().width < labelBounds.width - 2 * buttonOffset
      ? (title.center = labelBounds.center())
      : (title.leftCenter = minLabelBounds.leftCenter());
  }

  getControls() {
    return [
            morph({
              name: "button wrapper",
              styleClasses: ["buttonGroup"],
              submorphs: this.buttons()
            }),
            this.titleLabel()
          ];
  }

  buttons() {
    let closeButton =
      this.getSubmorphNamed("close") ||
      morph({
        name: "close",
        styleClasses: ['windowButton', "closeButton"],
        tooltip: "close window",
        submorphs: [
          Label.icon("times", {
            styleClasses: ["defaultLabelStyle"],
            visible: false
          })
        ]
      });
    connect(closeButton, "onMouseDown", this, "close");
    connect(closeButton, "onHoverIn", closeButton.submorphs[0], "visible", {
      converter: () => true
    });
    connect(closeButton, "onHoverOut", closeButton.submorphs[0], "visible", {
      converter: () => false
    });

    let minimizeButton =
      this.getSubmorphNamed("minimize") ||
      morph({
        name: "minimize",
        styleClasses: ['windowButton', "minimizeButton"],
        tooltip: "collapse window",
        submorphs: [
          Label.icon("minus", {
            styleClasses: ["defaultLabelStyle"],
            visible: false
          })
        ]
      });
    connect(minimizeButton, "onMouseDown", this, "toggleMinimize");
    connect(minimizeButton, "onHoverIn", minimizeButton.submorphs[0], "visible", {
      converter: () => true
    });
    connect(minimizeButton, "onHoverOut", minimizeButton.submorphs[0], "visible", {
      converter: () => false
    });

    if (this.resizable) {
      var maximizeButton =
        this.getSubmorphNamed("maximize") ||
        morph({
          name: "maximize",
          styleClasses: ['windowButton', "maximizeButton"],
          tooltip: "maximize window",
          submorphs: [
            Label.icon("plus", {
              styleClasses: ["defaultLabelStyle"],
              visible: false
            })
          ]
        });
      connect(maximizeButton, "onMouseDown", this, "toggleMaximize");
      connect(maximizeButton, "onHoverIn", maximizeButton.submorphs[0], "visible", {
        converter: () => true
      });
      connect(maximizeButton, "onHoverOut", maximizeButton.submorphs[0], "visible", {
        converter: () => false
      });
    }

    return arr.compact([closeButton, minimizeButton, maximizeButton]);
  }

  titleLabel() {
    return (
      this.getSubmorphNamed("titleLabel") ||
      this.addMorph({
        padding: Rectangle.inset(0, 2, 0, 0),
        styleClasses: ["windowTitleLabel"],
        type: "label",
        name: "titleLabel",
        reactsToPointer: false,
        value: ""
      })
    );
  }

  resizer() {
    var win = this, resizer = this.getSubmorphNamed("resizer");
    if (resizer) return resizer;
    resizer = morph({
      name: "resizer",
      nativeCursor: "nwse-resize",
      extent: pt(20, 20),
      fill: Color.transparent,
      bottomRight: this.extent
    });
    connect(resizer, "onDrag", win, "resizeBy", {converter: evt => evt.state.dragDelta});
    return resizer;
  }

  toggleMinimize() {
    let {nonMinizedBounds, minimized, width} = this,
        bounds = this.bounds(),
        duration = 200,
        collapseButton = this.getSubmorphNamed("minimize"),
        easing = Expo.easeOut;

    if (minimized) {
      this.minimizedBounds = bounds;
      this.animate({bounds: nonMinizedBounds || bounds, duration, easing});
      collapseButton.tooltip = "collapse window";
    } else {
      this.nonMinizedBounds = bounds;
      var minimizedBounds = this.minimizedBounds || bounds.withExtent(pt(width, 25)),
          labelBounds = this.titleLabel().textBounds(),
          buttonOffset = arr.last(this.buttons()).bounds().right() + 3;
      if (labelBounds.width + 2 * buttonOffset < minimizedBounds.width)
        minimizedBounds = minimizedBounds.withWidth(labelBounds.width + buttonOffset + 3);
      this.minimizedBounds = minimizedBounds;
      collapseButton.tooltip = "uncollapse window";
      this.animate({bounds: minimizedBounds, duration, easing});
    }
    this.minimized = !minimized;
    this.resizer().visible = !this.minimized;
  }

  toggleMaximize() {
    var easing = Expo.easeOut, duration = 200;
    if (this.maximized) {
      this.animate({bounds: this.nonMaximizedBounds, duration, easing});
      this.resizer().bottomRight = this.extent;
      this.maximized = false;
    } else {
      this.nonMaximizedBounds = this.bounds();
      this.animate({bounds: this.world().visibleBounds().insetBy(5), duration, easing});
      this.resizer().visible = true;
      this.maximized = true;
      this.minimized = false;
    }
  }

  close() {
    var world = this.world();
    this.deactivate();
    this.remove();

    var next = world.activeWindow() || arr.last(world.getWindows());
    next && next.activate();

    signal(this, "windowClosed", this);
    if (this.targetMorph && typeof this.targetMorph.onWindowClose === "function") this.targetMorph.onWindowClose();
  }

  onMouseDown(evt) {
    this.activate(evt);
  }

  focus() {
    var w = this.world(), t = this.targetMorph;
    if (!w || !t) return;
    if (w.focusedMorph && (w.focusedMorph === t || t.isAncestorOf(w.focusedMorph))) return;
    t.focus();
  }

  isActive() {
    var w = this.world();
    if (!w) return false;
    if (this.titleLabel().fontWeight != "bold") return false;
    return arr.last(w.getWindows()) === this;
  }

  activate(evt) {
    if (this.isActive()) {
      this.focus(evt);
      return this;
    }

    this.styleClasses = ['active'];

    if (!this.world()) this.openInWorldNearHand();
    else this.bringToFront();
    let w = this.world() || this.env.world;

    arr.without(w.getWindows(), this).forEach(ea => ea.deactivate());
    this.titleLabel().fontWeight = "bold";
    this.focus(evt);

    signal(this, "windowActivated", this);
    setTimeout(() => this.relayoutWindowControls(), 0);

    return this;
  }

  deactivate() {
    this.styleClasses = ["inactive"];
    this.titleLabel().fontWeight = "normal";
    this.relayoutWindowControls();
  }

  get keybindings() {
    return super.keybindings.concat([
      {
        keys: {
          mac: "Meta-Shift-L R E N",
          win: "Ctrl-Shift-L R E N",
        },
        command: "[window] change title"
      }
    ]);
  }

  get commands() {
    return super.commands.concat([
      {
        name: "[window] change title",
        exec: async (win, args = {}) =>  {
          let title = args.title ||
            (await win.world().prompt("Enter new title", {
                input: win.title,
                historyId: "lively.morphic-window-title-hist"
              }));
          if (title) win.title = title;
          return true;
        }
      }
    ])
  }
}
