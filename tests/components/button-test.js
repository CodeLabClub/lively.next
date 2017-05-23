/*global System, declare, it, describe, beforeEach, afterEach, before, after*/
import { createDOMEnvironment } from "../../rendering/dom-helper.js";
import { MorphicEnv, StyleSheet, Icon, Hand, show } from "../../index.js";
import { expect } from "mocha-es6";
import { morph, Button, World } from "../../index.js";
import { pt, Color, Rectangle } from "lively.graphics";
import { num, promise, fun } from "lively.lang";
import { styleHaloFor } from "../../halo/stylization.js";

var button, world, eventLog, env;
const inactiveColor = Color.blue, activeColor = Color.red, triggerColor = Color.green;

function installEventLogger(morph, log) {
  var loggedEvents = [
    "onMouseDown","onMouseUp","onMouseMove",
    "onDragStart", "onDrag", "onDragEnd",
    "onGrab", "onDrop",
    "onHoverIn", "onHoverOut",
    "onFocus", "onBlur",
    "onKeyDown", "onKeyUp"]
  loggedEvents.forEach(name => {
    morph[name] = function(evt) {
      log.push(name + "-" + morph.name);
      this.constructor.prototype[name].call(this, evt);
    }
  });
}

function createDummyWorld() {
  world = new World({name: "world", extent: pt(300,300)})
  world.styleSheets = new StyleSheet({
    '.Button.activeStyle': {fill: activeColor},
    '.Button.inactiveStyle': {fill: inactiveColor},
    '.Button.triggerStyle': {fill: triggerColor},
  })
  world.submorphs = [new Button({
    center: pt(150,150)
  }), new Hand()];

  button = world.submorphs[0];
  eventLog = [];
  [button].forEach(ea => installEventLogger(ea, eventLog));

  return world;
}

async function setup() {
  env = MorphicEnv.pushDefault(new MorphicEnv(await createDOMEnvironment()));
  await env.setWorld(createDummyWorld());
}

function teardown() {
  MorphicEnv.popDefault().uninstall()
}

describe("buttons", function() {

    // jsdom sometimes takes its time to initialize...
  if (System.get("@system-env").node)
    this.timeout(10000);

  beforeEach(setup);
  afterEach(teardown);

  describe('button modes', () => {

     it ("allows to switch between modes", () => {
       button.activeMode = 'triggered';
       expect(button.fill).equals(triggerColor);
       button.activeMode = 'inactive';
       expect(button.fill).equals(inactiveColor);
       button.activeMode = 'active';
       expect(button.fill).equals(activeColor);
     })

     it ('leaving button on press releases', () => {
        env.eventDispatcher.simulateDOMEvents({type: "pointerdown", position: button.center, target: button});
        expect(button.activeMode).equals('triggered');
        env.eventDispatcher.simulateDOMEvents({type: "hoverout", target: button});
        expect(button.activeMode).equals('active');
     })
     
  });

  describe("button mode styles", () => {

    it('styles icon as labels correctly', () => {
       var b = new Button({label: Icon.makeLabel("times-circle-o")});
       b.styleSheets = new StyleSheet({
          '.activeStyle [name=label]': {
            fontSize: 22
          }
       })
       expect(b.label).equals(Icon.makeLabel("times-circle-o").textString);
       expect(b.labelMorph.fontSize).equals(22);
       b.activeMode = 'triggered';
       expect(b.label).equals(Icon.makeLabel("times-circle-o").textString);
       expect(b.labelMorph.fontSize).equals(12);
    });

    it('allows to change the label', () => {
       button.label = "Hello!";
       button.activeMode = "triggered";
       expect(button.label).equals("Hello!");
    });
    
    it("active style restored on mouse up", () => {
      button.styleSheets = new StyleSheet({
        ".Button.activeStyle": {
          fill: Color.orange
        },
        ".Button.activeStyle [name=label]": {
          fontSize: 15,
          fontColor: Color.black,
          fontStyle: "bold"
        },
        ".Button.triggerStyle": {
          fill: Color.red
        },
        ".Button.triggerStyle [name=label]": {
          fontSize: 50,
          fontStyle: "italic",
          fontColor: Color.blue
        }
      });
     button.activeMode = 'triggered';
     env.eventDispatcher.simulateDOMEvents({type: "pointerdown", target: button});
     expect(button.activeMode).equals('triggered');
     expect(button.styleClasses).to.include('triggerStyle');
     expect(button.fill).equals(Color.red);
     expect(button.labelMorph.fontStyle).equals('italic');
     expect(button.labelMorph.fontSize).equals(50);
     expect(button.labelMorph.fontColor).equals(Color.blue, "trigger font color")
     env.eventDispatcher.simulateDOMEvents({type: "pointerup", target: button});
     expect(button.activeMode).equals('active');
     expect(button.labelMorph.fontColor).equals(Color.black, "active font color")
     expect(button.labelMorph.fontSize).equals(15);
     expect(button.labelMorph.fontStyle).equals('bold');
     expect(button.fill).equals(Color.orange);
    });
    
  })
  
});