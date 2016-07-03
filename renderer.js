import vdom from "virtual-dom";

var {h, diff, patch, create} = vdom;

export class Renderer {

  static default() { return this._default || new this() }

  constructor(world, rootNode) {
    if (!world || !world.isMorph)
      throw new Error(`Trying to initialize renderer with an invalid world morph: ${world}`)
    if (!rootNode || !("nodeType" in rootNode))
      throw new Error(`Trying to initialize renderer with an invalid root node: ${rootNode}`)
    this.worldMorph = world;
    world._isWorld = true; // for world() method
    this.rootNode = rootNode;
    this.domNode = null;
    this.renderMap = new WeakMap();
    this.renderWorldLoopProcess = null;
  }

  clear() {
    this.stopRenderWorldLoop();
    this.domNode && this.domNode.parentNode.removeChild(this.domNode);
    this.domNode = null;
    this.renderMap = new WeakMap();
  }

  startRenderWorldLoop() {
    this.renderWorld();
    this.renderWorldLoopProcess = requestAnimationFrame(() =>
      this.startRenderWorldLoop());
  }

  stopRenderWorldLoop() {
    window.cancelAnimationFrame(this.renderWorldLoopProcess);
    this.renderWorldLoopProcess = null;
  }

  renderWorld() {
    var world = this.worldMorph;

    if (!world.needsRerender()) return;

    var tree = this.renderMap.get(world) || this.renderMorph(world),
        domNode = this.domNode || (this.domNode = create(tree)),
        newTree = this.renderMorph(world),
        patches = diff(tree, newTree);

    if (!domNode.parentNode)
      this.rootNode.appendChild(domNode);

    patch(domNode, patches);
  }

  renderMorph(morph) {
    if (!morph.needsRerender()) {
      var rendered = this.renderMap.get(morph);
      if (rendered) return rendered;
    }
    morph.aboutToRender();

    const shapedStyle = Object.assign({
        position: "absolute",
        left: morph.position.x + 'px',
        top: morph.position.y + 'px',
        width: morph.extent.x + 'px',
        height: morph.extent.y + 'px',
        backgroundColor: morph.fill ? morph.fill.toString() : "",
        overflow: morph.clipMode,
        "pointer-events": morph.reactsToPointer ? "auto" : "none"
    }, morph.shape().style);

    const attributes = Object.assign(
                  morph.shape(),
                  {id: morph.id,
                   style: shapedStyle});

    var tree = h(morph._nodeType,
                attributes,
                morph.submorphs.map(m => this.renderMorph(m)));

    this.renderMap.set(morph, tree);
    return tree;
  }

  getNodeForMorph(morph) {
    // Hmm, this also finds dom nodes not associated with this renderer, its
    // domNode... Is this a problem?
    return document.getElementById(morph.id);
  }

  getMorphForNode(node) {
    return this.worldMorph ?
      this.worldMorph.withAllSubmorphsDetect(morph => morph.id === node.id) :
      null;
  }
}
