import { diff, patch, create, h } from "virtual-dom";
import "gsap";
import { num, obj, arr, properties, promise } from "lively.lang";
import { Color, RadialGradient, pt, Point, LinearGradient, rect } from "lively.graphics";
import { config } from "../index.js";

// move to lively.lang
function pad(array, n, getPadElement = arr.last) {
   return [...array, ...(new Array(Math.max(n - array.length, 0)).fill(getPadElement(array)))]
}

// await $world.env.renderer.ensureDefaultCSS()
export const defaultCSS = `

/*-=- html fixes -=-*/

textarea.lively-text-input.debug {
  z-index: 20 !important;
  opacity: 1 !important;
  background: rgba(0,255,0,0.5) !important;
}

.no-html-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.hiddenScrollbar::-webkit-scrollbar { 
  /* This is the magic bit */
  display: none;
}


/*-=- generic morphic -=-*/

.Morph {
  outline: none;
  /*for aliasing issue in chrome: http://stackoverflow.com/questions/6492027/css-transform-jagged-edges-in-chrome*/
  -webkit-backface-visibility: hidden;

  /*include border size in extent of element*/
  box-sizing: border-box;

  /*don't use dom selection on morphs*/
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.Tooltip {
  z-index: 3;
}

.Hand {
  z-index: 1;
}

/*-=- halos -=-*/

.Halo {
  z-index: 2;
}

.HaloItem:not(.NameHaloItem) {
  /*FIXME: we shouldn't need to hardcode the size...*/
  line-height: 24px !important;
  text-align: center;
  vertical-align: middle;
}

.halo-mesh {
  background-color:transparent;
  background-image: linear-gradient(rgba(0,0,0,.1) 2px, transparent 2px),
  linear-gradient(90deg, rgba(0,0,0,.1) 2px, transparent 2px),
  linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px);
  background-size:100px 100px, 100px 100px, 10px 10px, 10px 10px;
  background-position:-2px -2px, -2px -2px, -1px -1px, -1px -1px;
}

/*-=- text -=-*/

.center-text {
  text-align: center;
}

.v-center-text {
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}

div.text-layer span {
  line-height: normal;
}

/*-=- text -=-*/

.Label span {
  white-space: nowrap;
  float: left;
}

.Label .annotation {
/*  vertical-align: middle;
  height: 100%;*/
  /*vertical align*/
  float: right;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  text-align: right;
}

.truncated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;


export class ShadowObject {

    constructor(args) {
        if (obj.isBoolean(args)) args = config.defaultShadow;
        const {rotation, distance, blur, color, morph, inset, spread} = args;
        this.rotation = obj.isNumber(rotation) ? rotation : 45; // in degrees
        this.distance = obj.isNumber(distance) ? distance : 2;
        this.blur = obj.isNumber(blur) ? blur : 6;
        this.inset = inset || false;
        this.spread = spread || 0;
        this.color = color || Color.gray.darker();
        this.morph = morph;
    }

    get distance() { return this._distance }
    get blur() { return this._blur }
    get rotation() { return this._rotation }
    get color() { return this._color }
    get inset() { return this._inset }

    /*rms 5.3.17: This is a problem in general: mutating properties of
      morph properties that are themselves objects will not be tracked
      correctly by the change recording, since the reference does not change.
      Recreating a new property object on every set seems costly also.
      Maybe we should allow properties to communicate with the change recording
      to let it know when things about it (i.e. dropShadow.blur, vertices.at(0), gradient.stops....)
      have changed.*/

    set inset(v) {
      this._inset = v;
      if (this.morph) this.morph.dropShadow = this;
    }

    set distance(d) {
       this._distance = d;
       if (this.morph) this.morph.dropShadow = this;
    }

    set blur(b) {
       this._blur = b;
       if (this.morph) this.morph.dropShadow = this;
    }

    set rotation(r) {
       this._rotation = r;
       if (this.morph) this.morph.dropShadow = this;
    }

    set color(c) {
       this._color = c;
       if (this.morph) this.morph.dropShadow = this;
    }

    get isShadowObject() { return true; }

    toCss() {
       const {x, y} = Point.polar(this.distance, num.toRadians(this.rotation));
       return `${this.inset ? 'inset' : ''} ${this.color.toString()} ${x}px ${y}px ${this.blur}px ${this.spread}px`
    }

    toFilterCss() {
       const {x, y} = Point.polar(this.distance, num.toRadians(this.rotation));
       return `drop-shadow(${x}px ${y}px ${this.blur}px ${this.color.toString()})`;
    }

}

class StyleMapper {

  static getTransform({position, origin, scale, rotation}) {
    return {
       transform: `translate3d(${Math.round(position.x - origin.x)}px, ${Math.round(position.y - origin.y)}px, 0px) rotate(${rotation.toFixed(2)}rad) scale(${scale.toFixed(2)},${scale.toFixed(2)})`}
  }

  static getTransformOrigin({origin}) {
    return origin && {transformOrigin: `${origin.x}px ${origin.y}px`};
  }

  static getDisplay({visible}) {
    return (visible != null) && {display: visible ? "" : "none"};
  }

  static getBorderRadius({borderRadiusLeft, borderRadiusRight, borderRadiusBottom, borderRadiusTop}) {
    return {borderRadius: `${borderRadiusTop}px ${borderRadiusTop}px ${borderRadiusBottom}px ${borderRadiusBottom}px / ${borderRadiusLeft}px ${borderRadiusRight}px ${borderRadiusRight}px ${borderRadiusLeft}px`};
  }

  static getBorder({borderWidthLeft, borderColorLeft, borderStyleLeft,
             borderWidthRight, borderColorRight, borderStyleRight, borderColor,
             borderWidthBottom, borderColorBottom, borderStyleBottom,
             borderWidthTop, borderColorTop, borderStyleTop}) {
    return {
      "border-left-style":   `${borderStyleLeft}`,
      "border-right-style":  `${borderStyleRight}`,
      "border-bottom-style": `${borderStyleBottom}`,
      "border-top-style":    `${borderStyleTop}`,
      "border-left-width":   `${borderWidthLeft}px`,
      "border-right-width":  `${borderWidthRight}px`,
      "border-bottom-width": `${borderWidthBottom}px`,
      "border-top-width":    `${borderWidthTop}px`,
      "border-top-color": borderColorTop ? borderColorTop.toString() : "transparent",
      "border-right-color": borderColorRight ? borderColorRight.toString() : "transparent",
      "border-bottom-color": borderColorBottom ? borderColorBottom.toString() : "transparent",
      "border-left-color": borderColorLeft ? borderColorLeft.toString() : "transparent",
      ...(borderColor && borderColor.isGradient) ? {"border-image": borderColor.toString()} : {}
    }
  }

  static getFill({fill}) {
    return fill && (fill.isGradient ? {backgroundImage: fill.toString()} : {background: fill.toString()})
  }

  static getExtentStyle({width, height, extent}) {
    if(width && height) return {width: width + 'px', height: height + 'px'};
    if(extent) return {width: extent.x + 'px', height: extent.y + 'px'};
    return null;
  }

  static getShadowStyle(morph) {
    if (morph.isSvgMorph || morph.isImage) return {filter: shadowCss(morph)}
    return {boxShadow: morph.dropShadow ?
                    morph.dropShadow.toCss():
                    "none"}
  }

  static getSvgAttributes({width, height, borderWidth}) {
     return {width: width || 1, height: height || 1,
             viewBox: [0, 0, width || 1, height || 1].join(" ")};
  }

  static getPathAttributes(path, fill = false) {
    var vertices = path.vertices.map(({x, y, controlPoints}) => ({controlPoints, ...path.origin.addXY(x, y)})),
        {x: startX, y: startY, controlPoints: {next: {x: startNextX, y: startNextY}}} = vertices[0],
        startNext = pt(startX + startNextX, startY + startNextY),
        {x: endX, y: endY, controlPoints: {previous: {x: endPrevX, y: endPrevY}}} = arr.last(vertices),
        endPrev = pt(endX + endPrevX, endY + endPrevY),
        interVertices = vertices.slice(1, -1),

        {id, fill, borderColor, borderWidth} = path,
        fill = path.fill
             ? path.fill.isGradient ? "url(#gradient-fill" + id + ")" : fill.toString()
             : "transparent",
        stroke = borderColor.isGradient
          ? "url(#gradient-borderColor" + id + ")"
          : borderColor.toString(),
        d = `M${startX}, ${startY} C `
          + `${startNext.x}, ${startNext.y} `
          + interVertices.map(({x, y, controlPoints: {previous: p, next: n}}) => {
               return `${x + p.x},${y + p.y} ${x},${y} C ${x + n.x},${y + n.y}`;
             }).join(" ")
          + ` ${endPrev.x},${endPrev.y} ${endX},${endY}`;

    return {
      "stroke-width": borderWidth,
      ...this.getSvgBorderStyle(path),
      "paint-order": "stroke",
      fill, stroke, d
    };
  }

  static getSvgBorderStyle(svg) {
      const style = {
          solid: {},
          dashed: {"stroke-dasharray": svg.borderWidth * 1.61 + " " + svg.borderWidth},
          dotted: {"stroke-dasharray": "1 " + svg.borderWidth * 2,"stroke-linecap": "round", "stroke-linejoin": "round",}
      }
      return style[svg.borderStyle];
  }

  static getStyleProps(morph) {
    return {
      ...this.getFill(morph),
      ...this.getTransform(morph),
      ...this.getTransformOrigin(morph),
      ...this.getDisplay(morph),
      ...this.getExtentStyle(morph),
      ...this.getBorder(morph),
      ...this.getBorderRadius(morph),
      ...this.getShadowStyle(morph),
      ...(morph.opacity != null && {opacity: morph.opacity})
    }
  }

}

export class AnimationQueue {

  constructor(morph) {
    this.morph = morph;
    this.animations = [];
  }

  maskedProps(type) {
     const l = this.animations.length;
     if (l > 0) {
        return obj.merge(this.animations.map(a => a.getAnimationProps(type)[0]));
     } else {
        return {}
     }
  }

  get animationsActive() { return true }

  registerAnimation(config) {
    const anim = new PropertyAnimation(this, this.morph, config);
    return this.morph.withMetaDo({animation: anim}, () => {
      if (!this.animations.find(a => a.equals(anim)) && anim.affectsMorph) {
        anim.assignProps();
        this.animations.push(anim);
        return anim;
      }
    })
  }

  startAnimationsFor(node) { this.animations.forEach(anim => anim.start(node)); }
  startSvgAnimationsFor(svgNode, type) { this.animations.forEach(anim => anim.startSvg(svgNode, type)) }

  removeAnimation(animation) {
    arr.remove(this.animations, animation);
  }

}

export class PropertyAnimation {

  constructor(queue, morph, config) {
    this.queue = queue;
    this.morph = morph;
    this.config = this.convertGradients(this.convertBounds(config));
    this.needsAnimation = {svg: morph.isSvgMorph, path: morph.isPath, polygon: morph.isPolygon};
    this.capturedProperties = {...obj.select(this.morph, this.propsToCapture)};
  }

  get propsToCapture() {
     // GSAP has troubles with interpolating between some properties,
     // which requires us to do some magic in order to let the animations
     // play nicely. This usually involves that we capture the original
     // value of a property, before it was animated
     return ['fill', 'origin']
  }

  asPromise() {
     return new Promise((resolve, reject) => {
         this.resolvePromise = () => {
              this.onFinish(this);
              if (this.subAnimations) {
                 this.subAnimations.then(resolve);
              } else {
                 resolve(this.morph);
              }
         }
     })
  }

  finish() {
    this.queue.removeAnimation(this);
    this.resolvePromise ? this.resolvePromise() : this.onFinish();
  }

  convertGradients(config) {
    // FIXME: Support proper gradient animation for svg morphs
    if (this.morph.isSvgMorph && config.fill) {
      this.morph.fill = config.fill;
      return obj.dissoc(config, ['fill']);
    }
    if (config.fill && config.fill.isGradient && this.morph.fill.isGradient) {
      // linear -> radial
        var fillBefore = this.morph.fill,
            fillAfter = config.fill,
            d = config.duration || 1000;
        if (fillBefore.type == "linearGradient" && fillAfter.type == "radialGradient") {
            this.subAnimation = (async () => {
              await this.morph.animate({
                  fill: new LinearGradient({...fillBefore, vector: rect(0,0,0,1)}),
                  duration: d  / 2, easing: Power4.easeIn});
              this.morph.fill = new RadialGradient({
                     stops: fillBefore.stops,
                     focus: pt(.5,0),
                     bounds: rect(0,0, this.morph.width * 100, this.morph.height * 2)})
              await this.morph.animate({
                    fill: fillAfter,
                    duration: d / 2,
                    easing: Power4.easeOut});
              return this.morph;
            })()
            return obj.dissoc(config, ['fill']);
        }
        // radial -> linear
        if (fillBefore.type == "radialGradient" && fillAfter.type == "linearGradient") {
           // fix easing
            this.subAnimations = (async () => {
              await this.morph.animate({fill: new RadialGradient({
                     stops: fillBefore.stops,
                     focus: pt(.5,0),
                     bounds: rect(0,0, this.morph.width * 100, this.morph.height * 2),
                     }),
                     duration: d / 2, easing: Power4.easeIn})
              this.morph.fill = new LinearGradient({...fillBefore, vector: rect(0,0,0,1)});
              await this.morph.animate({
                    fill: fillAfter,
                    duration: d / 2,
                    easing: Power4.easeOut});
              return this.morph;
            })();
            return obj.dissoc(config, ['fill']);
        }
    }
    return config;
  }

  convertBounds(config) {
    var {bounds, origin, rotation, scale, layout, fill} = config,
         origin = origin || this.morph.origin,
         rotation = rotation || this.morph.rotation,
         scale = scale || this.morph.scale;
    if (bounds) {
      return {...obj.dissoc(config, ["bounds"]),
              origin, rotation, scale,
              position: bounds.topLeft().addPt(origin),
              extent: bounds.extent()};
    } else {
      return config
    }
  }

  equals(animation) {
    return obj.equals(this.animatedProps, animation.animatedProps);
  }

  get affectsMorph() {
    return properties.any(this.animatedProps, (animatedProps, prop) => !obj.equals(animatedProps[prop], this.morph[prop]));
  }

  get animatedProps() {
    return obj.dissoc(this.config, ["easing", "onFinish", "duration"]);
  }

  get easing() { return this.config.easing || Power4.easeInOut }
  get onFinish() { return this.config.onFinish || (() => {})}
  setonFinish(cb) { this.config.onFinish = cb }
  get duration() { return this.config.duration || 1000 }


  getChangedProps(before, after) {
    const unchangedProps = [];
    for (var prop in before) {
      if (obj.equals(after[prop], before[prop])) {
         unchangedProps.push(prop);
      }
    }
    return [obj.dissoc(before, unchangedProps),
            obj.dissoc(after, unchangedProps)];
  }

  getAnimationProps(type) {
    const [before, after] = this.getChangedProps(this.beforeProps[type], this.afterProps[type]),
          {fill: fillBefore} = this.capturedProperties,
          {fill: fillAfter} = this.morph;
    // FIXME: properly interpolate vertices if there are control points added removed....
    // if (before.d) {
    //     // var before_d = before.d.splitBy(" "), after_d = after.d.splitBy(" ");
    //     // repeat last element until points are of equal number
    // }
    // if (before.points) {
    //     // var before_points = before.points.splitBy(" "), after_points = after.points.splitBy(" ");
    //     // repeat last element until points are of equal number
    // }
    if (fillBefore && fillAfter) {
      // gradient -> gradient
      if (fillBefore.isGradient && fillAfter.isGradient) {
        // first tween radial gradient into 180deg approximation, then set fillBefore to approximate linear gradient
        // linear -> linear && radial -> radial
        const numStops = Math.max(fillAfter.stops.length, fillBefore.stops.length),
              beforeStops = pad(fillBefore.stops, numStops),
              beforeGradient = new fillBefore.__proto__.constructor({
                  ...fillBefore,
                  vector: fillBefore.vector && fillBefore.vectorAsAngle() + .00001,
                  stops: beforeStops}).toString(),
              afterStops = pad(fillAfter.stops, numStops),
              afterGradient = new fillAfter.__proto__.constructor({
                  ...fillAfter,
                  vector: fillAfter.vector && fillAfter.vectorAsAngle(),
                  stops: afterStops}).toString();
        before.backgroundImage = beforeGradient;
        after.backgroundImage = afterGradient;
      }
      // solid -> gradient
      if (fillBefore.isColor && fillAfter.isGradient) {
        const gradientClass = fillAfter.__proto__.constructor,
              stops = fillAfter.stops,
              solidGradient = new gradientClass({
                  ...fillAfter,
                  vector: fillAfter.g && fillAfter.vectorAsAngle() + .00001,
                  stops: stops.map(({offset}) => { return {color: fillBefore, offset}})}).toString()
        delete before['background'];
        delete after['background'];
        before.backgroundImage = solidGradient;
      }
      // gradient -> solid
      if (fillBefore.isGradient && fillAfter.isColor) {
        const g = fillBefore,
              gradientClass = g.__proto__.constructor,
              stops = g.stops,
              originalGradient = new gradientClass({
                  ...g,
                  vector: g.vector && g.vectorAsAngle() + 0.001,
                  stops: g.stops}).toString(),
              solidGradient = new gradientClass({
                  ...g,
                  vector: g.vector && g.vectorAsAngle(),
                  stops: stops.map(({offset}) => { return {color: fillAfter, offset}})}).toString()
        delete after['background'];
        delete before['background'];
        after.backgroundImage = solidGradient;
        before.backgroundImage = originalGradient;
      }
    }
    return [obj.isEmpty(before) ? false : before, obj.isEmpty(after) ? false : after]
  }
  
  gatherAnimationProps() {
     return {css: StyleMapper.getStyleProps(this.morph),
             svg: this.morph.isSvgMorph && StyleMapper.getSvgAttributes(this.morph),
             path: this.morph.isPath && StyleMapper.getPathAttributes(this.morph),
             polygon: this.morph.isPolygon && StyleMapper.getPathAttributes(this.morph)}
  }

  assignProps() {
    this.beforeProps = this.gatherAnimationProps();
    Object.assign(this.morph, this.animatedProps);
    this.afterProps = this.gatherAnimationProps();
  }

  startSvg(svgNode, type) {
     if (this.needsAnimation[type]) {
       this.needsAnimation[type] = false;
       const [before, after] = this.getAnimationProps(type);
       this.tween(svgNode, {attr: before}, {attr: after}, false);
     }
  }

  start(node) {
    if (!this.active) {
      this.active = true;
      let [before, after] = this.getAnimationProps("css");
      this.tween(node, before, after);
      if (this.config.origin) {
        let b = this.capturedProperties.origin,
            a = this.config.origin;
        this.tween(node.childNodes[0], {
          transform: `translate3d(${b.x}px, ${b.y}px, 0px)`
        },{
          transform: `translate3d(${a.x}px, ${a.y}px, 0px)`
       });
      }
    }
  }

  tween(node, before, after, remove=true) {
      const onComplete = () => {
         if (!remove) return;
         this.finish();
         this.morph.makeDirty();
      };
      if (TweenMax && before && after) {
        TweenMax.fromTo(node, this.duration / 1000,
                   before,
                  {...after,
                   ease: this.easing,
                   overwrite: false,
                   onComplete});
      } else {
         onComplete();
      }
  }
}

export function defaultStyle(morph) {

  var { opacity, reactsToPointer, nativeCursor, clipMode } = morph,
      styleProps = StyleMapper.getStyleProps(morph),
      maskedProps = morph._animationQueue.maskedProps("css");

  if ('backgroundImage' in maskedProps) delete styleProps['background'];

  if (clipMode !== "visible") {
    styleProps.overflow = clipMode;
    // Fix for Chrome scroll issue, see
    // https://github.com/noraesae/perfect-scrollbar/issues/612
    // https://developers.google.com/web/updates/2016/04/scroll-anchoring
    styleProps["overflow-anchor"] = "none";
  }

  return {
    ...styleProps,
    ...maskedProps,
    position: "absolute",
    "pointer-events": reactsToPointer ? "auto" : "none",
    cursor: nativeCursor
  };
}

// Sets the scroll later...
// See https://github.com/Matt-Esch/virtual-dom/issues/338 for why that is necessary.
// See https://github.com/Matt-Esch/virtual-dom/blob/dcb8a14e96a5f78619510071fd39a5df52d381b7/docs/hooks.md
// for why this has to be a function of prototype
function MorphAfterRenderHook(morph, renderer) { this.morph = morph; this.renderer = renderer; }
MorphAfterRenderHook.prototype.hook = function(node, propertyName, previousValue) {
  // 1. wait for node to be really rendered, i.e. it's in DOM
  promise.waitFor(400, () => !!node.parentNode).catch(err => false).then(isInDOM => {
    if (isInDOM) {
      // 2. update scroll of morph itself
      // 3. Update scroll of DOM nodes of submorphs
      if (this.morph._submorphOrderChanged && this.morph.submorphs.length) {
        this.morph._submorphOrderChanged = false;
        this.updateScrollOfSubmorphs(this.morph, this.renderer);
      } else if (this.morph.isClip()) this.updateScroll(this.morph, node);
    }
    this.morph._rendering = false; // see morph.makeDirty();
    this.morph.onAfterRender(node);
  });
}
MorphAfterRenderHook.prototype.updateScroll = function(morph, node) {
  // interactiveScrollInProgress: see morph.onMouseWheel
  var { interactiveScrollInProgress } = morph.env.eventDispatcher.eventState.scroll;
  if (interactiveScrollInProgress)
    return interactiveScrollInProgress.then(() => this.updateScroll(morph,node));

  if (node) {
    const {x, y} = morph.scroll;
    // prevent interference with bounce back animation
    node.scrollTop !== y && (node.scrollTop = y);
    node.scrollLeft !== x && (node.scrollLeft = x);
  }
}
MorphAfterRenderHook.prototype.updateScrollOfSubmorphs = function(morph, renderer) {
  morph.submorphs.forEach(m => {
    if (m.isClip())
      this.updateScroll(m, renderer.getNodeForMorph(m))
    this.updateScrollOfSubmorphs(m, renderer);
  });
}



// simple toplevel constructor, not a class and not wrapped for efficiency
function Animation(morph) { this.morph = morph; };
Animation.prototype.hook = function(node) {
  this.morph._animationQueue.startAnimationsFor(node);
}

export function SvgAnimation(morph, type) { this.morph = morph; this.type = type; };
SvgAnimation.prototype.hook = function(node) {
  this.morph._animationQueue.startSvgAnimationsFor(node, this.type);
}


export function defaultAttributes(morph, renderer) {
  return {
    animation: new Animation(morph),
    key: morph.id,
    id: morph.id,
    className: (morph.hideScrollbars ?
                morph.styleClasses.concat("hiddenScrollbar") :
                morph.styleClasses).join(" "),
    draggable: false,

    // rk 2016-09-13: scroll issues: just setting the scroll on the DOM node
    // doesn't work b/c of https://github.com/Matt-Esch/virtual-dom/issues/338
    // check the pull request mentioned in the issue, once that's merged we
    // might be able to remove the hook
    scrollLeft: morph.scroll.x,
    scrollTop: morph.scroll.y,
    "morph-after-render-hook": new MorphAfterRenderHook(morph, renderer)
  };
}

export function svgAttributes(svg) {
  return {
    animation: new SvgAnimation(svg, "svg"),
    attributes: {
      ...StyleMapper.getSvgAttributes(svg),
      ...svg._animationQueue.maskedProps("svg")
    }
  };
}

export function pathAttributes(path) {
  return {
    animation: new SvgAnimation(path, "path"),
    attributes: {
      ...StyleMapper.getPathAttributes(path),
      ...path._animationQueue.maskedProps("path")
    }
  };
}

function shadowCss(morph) {
  return morph.dropShadow ?
            morph.dropShadow.toFilterCss() :
            ``;
}

export function renderGradient(morph, prop) {
  const gradient = morph[prop],
        {bounds, focus, vector} = gradient;
  return h(gradient.type, {
               namespace: "http://www.w3.org/2000/svg",
               attributes: {id: "gradient-" + prop + morph.id,
                            gradientUnits: "userSpaceOnUse",
                            r: "50%",
                            ...(vector && {gradientTransform: `rotate(${num.toDegrees(vector.extent().theta())}, ${morph.width / 2}, ${morph.height / 2})`}),
                            ...(focus && bounds && {gradientTransform: `matrix(
                                    ${bounds.width / morph.width}, 0, 0, ${bounds.height / morph.height},
                                    ${((morph.width / 2) - (bounds.width / morph.width) * (morph.width / 2)) + (focus.x * morph.width) - (morph.width / 2)},
                                    ${((morph.height / 2) - (bounds.height / morph.height) * (morph.height / 2)) + (focus.y * morph.height) - (morph.height / 2)})`})}},
               gradient.stops.map(({offset, color}) =>
                        h("stop",
                            {namespace: "http://www.w3.org/2000/svg",
                              attributes:
                                {offset: (offset * 100) + "%",
                                 "stop-color": color.toString()}})));
}

function initDOMState(renderer, world) {
  renderer.rootNode.appendChild(renderer.domNode);
  renderer.ensureDefaultCSS()
    .then(() => promise.delay(500))
    .then(() => world.env.fontMetric && world.env.fontMetric.reset())
    .then(() => world.withAllSubmorphsDo(ea => (ea.isText || ea.isLabel) && ea.forceRerender()))
    .catch(err => console.error(err));
}

export function renderMorph(morph, renderer = morph.env.renderer) {
  // helper that outputs a dom element for the morph, independent from the
  // morph being rendered as part of a world or not. The node returned *is not*
  // the DOM node that represents the morph as part of its world! It's a new node!
  return create(morph.render(renderer), renderer.domEnvironment);
}

export function renderRootMorph(world, renderer) {
  if (!world.needsRerender()) return;

  var tree = renderer.renderMap.get(world) || renderer.render(world),
      domNode = renderer.domNode || (renderer.domNode = create(tree, renderer.domEnvironment)),
      newTree = renderer.render(world),
      patches = diff(tree, newTree);

  if (!domNode.parentNode) initDOMState(renderer, world);

  patch(domNode, patches);
}
