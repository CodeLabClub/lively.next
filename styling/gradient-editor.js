import { RadialGradient, Rectangle, Complementary, Point,
         Triadic, Tetradic, Quadratic, pt, rect,
         Analogous, Neutral, Color, LinearGradient } from "lively.graphics";
import {Morph, Image, VerticalLayout, GridLayout, StyleSheet,
        Text, Path, HorizontalLayout, Ellipse, morph, Icon} from "lively.morphic";
import {num, obj, arr} from "lively.lang";
import {connect, signal, once} from "lively.bindings";
import { Popover } from "./style-popover.js";
import {ColorPalette} from "./color-palette.js";
import {ColorPicker} from "./color-picker.js";

const WHEEL_URL = 'https://www.sessions.edu/wp-content/themes/divi-child/color-calculator/wheel-5-ryb.png'

class GradientTypeSelector extends Morph {

      get defaultLinearGradient() {
         return new LinearGradient({stops: [
              {color: Color.white, offset: 0},
              {color: Color.black, offset: 1}]});
      }

      get defaultRadialGradient() {
         return new RadialGradient({
               stops: [
                {color: Color.white, offset: 0},
                {color: Color.black, offset: 1}],
              focus: pt(.5,.5),
              bounds: rect(0,0,30,30)});
      }

      static get properties() {
        return {
          layout: {
            initialize() {
              this.extent = pt(180, 40);
              this.layout = new GridLayout({
               grid: [[null, "radialMode", null, "linearMode", null]],
                       autoAssign: false, fitToCell: false})
            }
          },

          submorphs: {
            initialize() {
              this.submorphs = [{
                 type: "ellipse",
                 styleClasses: ['modeButton'], name: "radialMode",
                 fill: this.defaultRadialGradient,
                 onMouseDown: (evt) => {
                    signal(this, "radial");
                 }
              }, {
                  type: 'ellipse',
                  styleClasses: ['modeButton'], name: "linearMode",
                  fill: this.defaultLinearGradient,
                  onMouseDown: (evt) => {
                     signal(this, "linear");
                 }
              }];
            }
          }
        }
      }

      update(gradient) {
        const [radial, linear] = this.submorphs;
        radial.borderColor = linear.borderColor = Color.gray.darker();
        if (gradient instanceof RadialGradient) {
            radial.borderColor = Color.orange;
        } else if (gradient instanceof LinearGradient) {
            linear.borderColor = Color.orange;
        }
      }

}

export class GradientEditor extends Morph {
  static get properties() {
    return {
      gradientValue: {
        set(v) {
          if (!(v && v.isGradient)) {
            v = false;
          }
          this.setProperty("gradientValue", v);
        }
      },
      submorphs: {
        initialize() {
          this.build();
        }
      },
      styleSheets: {
        initialize() {
          this.styleSheets = GradientEditor.styleSheet;
        }
      }
    };
  }

  remove() {
    super.remove();
    this.gradientHandle && this.gradientHandle.remove();
  }

  static get styleSheet() {
    return new StyleSheet({
      ".GradientEditor": {
        layout: new VerticalLayout({
          spacing: 3,
          layoutOrder(m) {
            return this.container.submorphs.indexOf(m)
          }
        }),
        fill: Color.transparent
      },
      ".GradientEditor [name=addStopLabel]": {
        fontSize: 18,
        fontColor: Color.orange,
        position: pt(-5, -22),
        extent: pt(10, 10),
        padding: Rectangle.inset(0),
        fixedWidth: true,
        fixedHeight: true
      },
      ".GradientEditor [name=stopControlPreview]": {extent: pt(2, 50), fill: Color.orange},
      ".propertyView": {
        fill: Color.black.withA(0.7),
        borderRadius: 5,
        padding: Rectangle.inset(5),
        fontColor: Color.white
      },
      ".GradientEditor .stopControlLine": {
        extent: pt(2, 50),
        fill: Color.gray.darker(),
        tooltip: "Drag to change proportional offset of stop"
      },
      ".StopControlHead": {
        fill: Color.black.withA(0.3),
        borderRadius: 20,
        extent: pt(15, 15),
        position: pt(-6, -22)
      },
      ".pickerField": {
        imageUrl: WHEEL_URL,
        extent: pt(15, 15),
        tooltip: "Open Color Picker",
        nativeCursor: "pointer",
        fill: Color.transparent
      },
      ".GradientEditor .paletteField": {
        nativeCursor: "pointer",
        clipMode: "hidden",
        tooltip: "Open Color Palette"
      },
      ".GradientEditor [name=typeSelector]": {fill: Color.transparent, extent: pt(180, 40)},
      ".GradientEditor .modeButton": {
        nativeCursor: "pointer",
        extent: pt(30, 30),
        borderWidth: 2
      },
      ".GradientEditor [name=instruction]": {
        fontSize: 15,
        padding: Rectangle.inset(15),
        fontWeight: "bold",
        fontColor: Color.black.lighter()
      },
      ".closeButton": {
        fontColor: Color.gray.lighter(),
        tooltip: "Remove Stop",
        fontSize: 17,
        nativeCursor: "pointer"
      },
      ".GradientEditor [name=gradientEditor]": {
        extent: pt(180, 50),
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Color.gray.darker()
      }
    });
  }
  async selectRadialGradient() {
    this.gradientClass = RadialGradient;
    this.get("linearMode").borderColor = Color.gray.darker();
    this.get("radialMode").borderColor = Color.orange;
    await this.applyGradient(this.gradientClass);
    await this.updateGradientHandles(this.gradientClass);
  }

  async selectLinearGradient() {
    this.gradientClass = LinearGradient;
    this.get("radialMode").borderColor = Color.gray.darker();
    this.get("linearMode").borderColor = Color.orange;
    await this.applyGradient(this.gradientClass);
    await this.updateGradientHandles(this.gradientClass);
  }

  async applyGradient(gradientClass) {
    const prevGradient = this.gradientValue, gradientEditor = this.get("gradientEditor");
    if (prevGradient && prevGradient.isGradient) {
      const {stops, focus, vector} = prevGradient;
      this.gradientValue = new gradientClass({
        stops,
        bounds: this.gradientBounds,
        focus,
        vector
      });
    } else {
      this.gradientValue = new gradientClass({
        stops: [{color: Color.white, offset: 0}, {color: Color.black, offset: 1}],
        bounds: this.gradientBounds
      });
    }
    this.update(this.gradientValue);
  }

  showGradientHandlesOn(aMorph) {
    this.handleMorph = aMorph;
    this.updateGradientHandles();
  }

  async updateGradientHandles(gradientClass = this.gradientClass) {
    // gradient handles need to be requested from the user of
    // a gradient editor. It is not the responsibility of
    // the gradient editor to know of the target at hand.
    const duration = 300;
    if (!this.handleMorph) return;
    this.gradientHandle && (await this.gradientHandle.fadeOut(duration));
    if (gradientClass == RadialGradient) {
      this.gradientHandle = new GradientFocusHandle({target: this.handleMorph});
    } else if (gradientClass == LinearGradient) {
      this.gradientHandle = new GradientDirectionHandle({target: this.handleMorph});
    }
    if (this.gradientHandle) {
      signal(this, "openHandle", this.gradientHandle);
      this.gradientHandle.opacity = 0;
      this.gradientHandle.animate({opacity: 1, duration});
    }
  }

  update(g = this.gradientValue) {
    if (g && g.isGradient) {
      this.get("gradientEditor").update(g);
    }
  }

  build() {
    var selector;
    this.submorphs = [(selector = new GradientTypeSelector({name: "typeSelector"})), this.gradientEditor()];
    connect(selector, "radial", this, "selectRadialGradient");
    connect(selector, "linear", this, "selectLinearGradient");
    connect(this, "gradientValue", this, "update");
    this.update(this.gradientValue);
    selector.update(this.gradientValue);
    this.gradientValue && this.updateGradientHandles(this.gradientValue.__proto__.constructor);
  }

  gradientEditor() {
    return new GradientStopVisualizer({name: "gradientEditor", gradientEditor: this});
  }
}

class StopControlHead extends Morph {

   static get properties() {
     return {
       stopVisualizer: {},
       gradientEditor: {},
       targetProperty: {
         get() { return this.stopVisualizer.targetProperty },
       },
       index: {},
       queue: {defaultValue: []},
       isHaloItem: {defaultValue: true},
       layout: {initialize() { this.layout = new HorizontalLayout({spacing: 3}) }}
    }
  }

   update(gradient) {
      var paletteField = this.getSubmorphNamed("paletteField"),
          pickerField = this.getSubmorphNamed("pickerField");
      if (!paletteField) {
         this.submorphs = [paletteField = this.paletteField(pt(10,10))];
      }
      paletteField.fill = this.stopColor = gradient.stops[this.index].color;
   }
   
   onHoverIn() {
      const color = this.targetProperty.stops[this.index].color;
      this.palette = this.palette || new Popover({
        name: "Color Palette",
        targetMorph: new ColorPalette({color})
      });
      connect(this.palette.targetMorph, 'color', this.palette, 'color');
      this.picker = this.picker || new ColorPicker({color}),
      this.picker.color = color;
      this.scheduleExpand();
   }
           
   onHoverOut() {
      this.scheduleShrink();
   }
   
   scheduleExpand() {
      if (this.queue.pop()) return;
      this.queue.push(this.expand);
      this.dequeue();
   }
           
   scheduleShrink() {
      if (this.queue.pop()) return;
      this.queue.push(this.shrink);
      this.dequeue();
   }
   
   async dequeue() {
      if (this.queueActive) return;
      this.queueActive = true;
      while (this.queue.length > 0) {
         await this.queue.shift().bind(this)()
      }
      this.queueActive = false;
   }
           
   async expand() {
      if (this.submorphs.length > 1) return;
      const palette = this.get("paletteField");
      this.layout = null;
      this.submorphs = [this.closeButton(), palette, this.pickerField()];
      palette.animate({extent: pt(15,15), duration: 200});
      await this.animate({
        layout: new HorizontalLayout({spacing: 3}), 
        center: pt(-1,-15), duration: 200
      });
      this.stopVisualizer.gradientEditor.update();
   }
           
   async shrink() {
      if (this.submorphs.length < 3) return;
      const oldCenter = this.center,
            [close, palette, picker] = [
              this.get("close"), this.get("paletteField"), this.get("pickerField")
            ];
      palette.animate({extent: pt(10,10), duration: 200});
      this.layout = null; close.remove(); picker.remove();
      await this.animate({
        layout: new HorizontalLayout({spacing: 3}), 
        center: oldCenter, duration: 200
      });
   }
           
   onWidgetClosed() {
       this.palette = this.picker = null;
       this.shrink();
   }
   
   closeButton() {
      return new Morph({
         name: "close",
         extent: pt(15,15), fill: Color.transparent,
         origin: pt(0,-3), clipMode: 'hidden',
         submorphs: [Icon.makeLabel("close", {
          styleClasses: ["closeButton"],
          onMouseDown: () => {
             this.stopVisualizer.removeStop(this.index) && this.remove();
          }})]})
   }
           
   updateColor(color) {
       this.stopVisualizer.updateStop(this.index, {color});
   }
           
   openColorWidget(name) {
       this.stopVisualizer.stopControls.forEach(c => c.head.closeAllWidgets());
       this[name].topLeft = pt(0, 0);
       connect(this[name], "color", this, "updateColor");
       connect(this[name], "close", this, "onWidgetClosed");
       connect(this.stopVisualizer, "remove", this[name], "remove");
       connect(this[name], 'onBlur', this, 'removeWhenLostFocus', {
         converter: () => name, varMapping: {name}
       });
       this[name].fadeIntoWorld(this.globalBounds().bottomCenter());
       this[name].focus();
   }

   removeWhenLostFocus(name) {
    setTimeout(() => {
      if (!$world.focusedMorph.ownerChain().includes(this[name])) {
       this.closeColorWidget(name);
     } else {
       this[name].focus();
     }
    }, 100);
   }
   
   closeColorWidget(name) {
      this[name] && this[name].remove();
   }
           
   closeAllWidgets() {
      this.closeColorWidget('palette');
      this.closeColorWidget('picker');
   }
   
   paletteField(extent) {
       const stopControl = this,
             paletteField = morph({
          type: "ellipse", name: "paletteField", extent,
          styleClasses: ['paletteField'],
       });
     connect(
       paletteField, 'onMouseDown', 
       this, 'openColorWidget', {
         converter: () => 'palette'
       }
     );
     return paletteField;
   }
           
   pickerField() {
       let pickerField = new Image({
          name: "pickerField",
          styleClasses: ['pickerField']
       });
      connect(pickerField, 'onMouseDown', 
              this, 'openColorWidget', {
        converter: () => 'picker'
      });
     return pickerField;
   }
}

class GradientStopVisualizer extends Morph {

  static get properties() {
    return {
         fill: {defaultValue: Color.gray},
         gradientEditor: {},
         targetProperty: {
           get() {
             return this.gradientEditor.gradientValue;
           },
           set(v) {
             this.gradientEditor.gradientValue = v;
           }
         },
         submorphs: {
           initialize() {
             this.submorphs = [{
                 type: "label", name: "instruction", value: "Select Gradient Type",
                 visible: !(this.targetProperty && this.targetProperty.isGradient)
             }, {name: "stopControlPreview", visible: false, 
                 submorphs: [Icon.makeLabel("plus-circle", {name: "addStopLabel"})]
             }];
            }
          }
      }
  }

  update(gradient) {
    this.fill = new LinearGradient({stops: gradient.stops, vector: "eastwest"});
    this.get("instruction").animate({opacity: 0, visible: false, duration: 300});
    this.renderStopControls(gradient)
  }
  
  onHoverOut() { this.toggleStopPreview(false) }
  
  onMouseMove(evt) {
    const pos = evt.positionIn(this),
          absOffset = pos.x;
    if (this.stopControls && this.stopControls.find(m => m.bounds().containsPoint(pos))) {
       this.toggleStopPreview(false)
    } else {
       this.toggleStopPreview(true);
       this.get("stopControlPreview").position = pt(absOffset, 0);
    }
  }
  
  onMouseDown(evt) {
    if (!this.get("stopControlPreview").visible) return;
    var   offset = evt.positionIn(this).x / this.width,
          idx = this.targetProperty.stops.findIndex(m => m.offset > offset);
    idx = idx < 0 ? this.targetProperty.stops.length - 1 : idx;
    this.insertStop(idx, offset);
  }
  
  toggleStopPreview(visible) {
    if (!this.get("instruction").visible)
      this.get("stopControlPreview").visible = visible
  }
  
  removeStop(idx) {
      const gradient = this.targetProperty;
      if (gradient.stops.length > 2) {
          arr.removeAt(gradient.stops, idx);
          this.targetProperty = gradient;
          return true;
      } else {
         return false;
      }
  }
  
  insertStop(idx, offset) {
      const gradient = this.targetProperty,
            color = gradient.stops[idx].color;
      arr.pushAt(gradient.stops, {offset, color}, idx);
      this.targetProperty = gradient;
   }
   
   updateStop(idx, props) {
      const gradient = this.targetProperty;
      gradient.stops[idx] = {...gradient.stops[idx], ...props};
      this.targetProperty = gradient;
   }
   
   renderStopControls(gradient) {
      if (!this.stopControls || this.stopControls.length != gradient.stops.length) {
         const [instructions, preview] = this.submorphs;
         this.stopControls = gradient.stops.map((s,i) => new GradientStopControl({
              stopVisualizer: this, index: i
         }));
         this.submorphs = [instructions, preview, ...this.stopControls];
         arr.invoke(this.stopControls, "update", gradient);
      }
     arr.invoke(this.stopControls, "update", gradient);
   }
   
}

class GradientStopControl extends Morph {

  static get properties() {
    return {
      index: {},
      head: {},
      stopVisualizer: {},
      styleClasses: {defaultValue: ['stopControlLine']},
      nativeCursor: {defaultValue: '-webkit-grab'},
      submorphs: {
        after: ['index', 'stopVisualizer', 'gradientEditor'],
        initialize() {
          this.head = new StopControlHead({
             stopVisualizer: this.stopVisualizer,
             index: this.index
          });
          this.head.stopControl = this;
          this.addMorph(this.head);
         }
      }
    }
  }

  update(gradient) {
    this.position = this.stopVisualizer
                        .extent.subPt(pt(10,0))
                        .scaleByPt(pt(gradient.stops[this.index].offset, 0))
                        .addPt(pt(5,0))
   this.head.update(gradient);
  }
          
  onDragStart(evt) {
     this.nativeCursor = '-webkit-grabbing';
     this.stopVisualizer.nativeCursor = '-webkit-grabbing';
     this.offsetView = this.addMorph(new Text({
        type: 'text', styleClasses: ['Tooltip'], padding: 3
     })).openInWorld(evt.hand.position.addPt(pt(10,10)));
  }
          
  onDrag(evt) {
     const absOffset = this.position.x - 5 + evt.state.dragDelta.x,
           offset = Math.max(0, Math.min(1, absOffset / (this.stopVisualizer.width - 10)));
     this.stopVisualizer.updateStop(this.index, {offset});
     this.offsetView.textString = (offset * 100).toFixed(2) + "%"
     this.offsetView.position = evt.hand.position.addPt(pt(10,10));
  }
          
  onDragEnd() {
     this.nativeCursor = '-webkit-grab';
     this.stopVisualizer.nativeCursor = 'auto';
     this.offsetView.remove();
  }
}

class FocusHandle extends Ellipse {

  static get properties() {
    return {
      gradientHandle: {},
      styleClasses: {defaultValue: ['focusHandle']},
      extent: pt(20,20)
    }
  }

  relayout() {
     this.center = this.gradientHandle.innerBounds().center();
  }
  
  onDragStart(evt) {
     this.tfm = this.gradientHandle.target.getGlobalTransform().inverse();
     this.focusView = this.addMorph(new Text({
          type: 'text', styleClasses: ['propertyView']
     })).openInWorld(evt.hand.position.addPt(pt(10,10)));
     this.focusView.rotation = 0;
     this.focusView.scale = 1;
  }
  
  onDrag(evt) {
     const {x,y} = evt.state.dragDelta,
           gh = this.gradientHandle,
           g = gh.target.fill;
     g.focus = g.focus.addXY(x / gh.target.width, y / gh.target.height)
     this.focusView.textString = `x: ${(g.focus.x * 100).toFixed()}%, y: ${(g.focus.y * 100).toFixed()}%`;
     this.focusView.position = evt.hand.position.addPt(pt(10,10));
     gh.target.makeDirty();
     gh.relayout();
  }
  
  onDragEnd(evt) {
     this.focusView.remove();
  }

}

class BoundsHandle extends Ellipse {

  static get properties() {
    return {
      side: {},
      gradientHandle: {},
      styleClasses: {
        after: ['side'],
        initialize() {
          this.styleClasses = ['boundsHandle', this.side]
        }
      }
    }
  }

  relayout() {
     this.center = this.gradientHandle.innerBounds().partNamed(this.side);
     this.scale = 1 / this.gradientHandle.target.getGlobalTransform().getScale();
  }
  
  onDragStart(evt) {
    this.boundsView = this.addMorph(new Text({
      type: 'text', styleClasses: ['propertyView']
    })).openInWorld(evt.hand.position.addPt(pt(10,10)));
    this.boundsView.rotation = 0;
  }
  
  onDrag(evt) {
    var gh = this.gradientHandle,
        g = gh.target.fill,
        newSide = g.bounds.partNamed(this.side).addPt(evt.state.dragDelta.scaleBy(2));
    g.bounds = g.bounds.withPartNamed(this.side, newSide);
    this.boundsView.textString = `w: ${g.bounds.width.toFixed()}px h: ${g.bounds.height.toFixed()}px`
    this.boundsView.position = evt.hand.position.addPt(pt(10,10));
    gh.target.makeDirty()
    gh.relayout();
  }
  
  onDragEnd(evt) {
    this.boundsView.remove()
  }
  
}

export class GradientFocusHandle extends Ellipse {

   /* Used to configure the focal point of a radial gradient, i.e. its center and bounds */

    static get properties() {
      return {
        target: {/* REQUIRED */},
        isHaloItem: {defaultValue: true},
        styleSheets: {
          initialize() {
            this.styleSheets = this.styler;
          }
        },
        submorphs: {
          initialize() {
            this.submorps = [];
            this.initBoundsHandles();
            this.addMorph(new FocusHandle({gradientHandle: this}))
            this.relayout();
          }
        }
      }
    }

  get styler() {
    return new StyleSheet({
      ".GradientFocusHandle": {
        fill: Color.transparent,
        borderColor: Color.orange,
        draggable: false,
        borderWidth: 2
      },
      ".GradientFocusHandle .topCenter": {nativeCursor: "ns-resize"},
      ".GradientFocusHandle .rightCenter": {nativeCursor: "ew-resize"},
      ".GradientFocusHandle .bottomCenter": {nativeCursor: "ns-resize"},
      ".GradientFocusHandle .leftCenter": {nativeCursor: "ew-resize"},
      ".GradientFocusHandle .propertyView": {
        fill: Color.black.withA(0.7),
        borderRadius: 5,
        padding: Rectangle.inset(5),
        fontColor: Color.white
      },
      ".GradientFocusHandle .boundsHandle": {
        borderColor: Color.orange.darker(),
        fill: Color.orange.withA(0.7),
        tooltip: "Resize bounds of radial gradient"
      },
      ".GradientFocusHandle .crossBar": {
        borderWidth: 2,
        borderColor: Color.orange,
        center: pt(11, 11),
        draggable: false
      },
      ".GradientFocusHandle .focusHandle": {
        clipMode: "hidden",
        nativeCursor: "-webkit-grab",
        fill: Color.transparent,
        borderColor: Color.orange,
        submorphs: [
          {type: "path", vertices: [pt(0, 0), pt(50, 0)], styleClasses: ["crossBar"]},
          {type: "path", vertices: [pt(0, 0), pt(0, 50)], styleClasses: ["crossBar"]},
          {
            type: "ellipse",
            fill: Color.transparent,
            extent: pt(20, 20),
            tooltip: "Shift focal center of radial gradient",
            reactsToPointer: false
          }
        ]
      }
    });
  }

    relayout() {
       const {bounds, focus} = this.target.fill;
       this.extent = bounds.extent();
       this.submorphs.forEach(m => m.relayout());
       this.rotation = this.target.rotation;
       this.scale = this.target.scale;
       this.borderWidth = 2 / this.scale;
       if (this.owner) 
          this.center = this.owner.localizePointFrom(this.target.extent.scaleByPt(focus), this.target);
    }

    initBoundsHandles() {
       this.bounds().sides.forEach(side => {
          this.addMorph(new BoundsHandle({gradientHandle: this, side}))
       });
    }

}

class RotationPoint extends Ellipse {
  static get properties() {
    return {
      gradientHandle: {},
    };
  }

  relayout() {
    this.center = Point.polar(
      this.gradientHandle.width / 2,
      this.gradientHandle.target.fill.vectorAsAngle()
    );
  }

  onDragStart(evt) {
    this.angleView = this.addMorph(
      new Text({
        type: "text",
        styleClasses: ["propertyView"]
      })
    ).openInWorld(evt.hand.position.addPt(pt(10, 10)));
    this.angleView.rotation = 0;
  }

  onDrag(evt) {
    let gh = this.gradientHandle;
    gh.target.fill.vector = evt.positionIn(gh).theta();
    gh.target.makeDirty();
    gh.relayout();
    this.angleView.textString = `${(num.toDegrees(gh.target.fill.vectorAsAngle()) + 180).toFixed()}°`;
    this.angleView.position = evt.hand.position.addPt(pt(10, 10));
  }

  onDragEnd(evt) {
    this.angleView.remove();
  }
}

class GradientDirectionHandle extends Ellipse {

   /* Used to configure the direction of a linear gradient (degrees) */

  static get properties() {
    return {
      target: {},
      styleSheets: {
        initialize() {
          this.styleSheets = this.styler;
        }
      },
      submorphs: {
        initialize() {
          this.initRotationPoint();
          this.relayout();
        }
      }
    }
  }

  get styler() {
    return new StyleSheet({
      '.GradientDirectionHandle': {
        borderColor: Color.orange,
        fill: Color.transparent,
        borderWidth: 1,
        origin: pt(25, 25),
        extent: pt(50, 50)
      },
      '.GradientDirectionHandle .RotationPoint': {
        fill: Color.orange,
        extent: pt(10, 10),
        nativeCursor: "-webkit-grab",
        tooltip: "Adjust direction of linear gradient"
      },
      '.GradientDirectionHandle .propertyView': {
        fill: Color.black.withA(0.7),
        borderRadius: 5,
        padding: Rectangle.inset(5),
        fontColor: Color.white
      }
    });
  }

  get isHaloItem() { return true }

  relayout() {
    if (this.owner)
      this.position = this.owner.localizePointFrom(this.target.extent.scaleBy(0.5), this.target);
    this.rotationPoint.relayout();
  }

  initRotationPoint() {
     this.rotationPoint = this.addMorph(new RotationPoint({gradientHandle: this}));
  }

}
