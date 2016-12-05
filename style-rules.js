import {arr, obj, properties} from "lively.lang";

export class StyleRules {

   /*
      Rules define how style properties of morphs within a certain
      submorph hierarchy are to be set.
      Rules are able to identify morphs either via their name or their
      morphClasses property.
      Rules are applied to a morph (including its submorphs) 
      once a style rule is assigned to it.
      Rules will also be refreshed upon a morph in case 
      its name or morphClasses property is changed.
      Rules can be nested, where the rule closest to a respective morph
      will override the property values of any other rules that affect that morph.
   */
   
   constructor(rules) {
      this.rules = rules;
   }

   applyToAll(root) {
      root.withAllSubmorphsDo(m => this.enforceRulesOn(m))
   }

   onMorphChange(morph, {selector, args, prop}) {
    if (selector == "addMorphAt") {
        this.applyToAll(args[0]);
    } else if (prop == "name" || prop == "morphClasses") {
        this.enforceRulesOn(morph);
    }
  }

  getShadowedProps(morph) {
     var props  = {};
     console.log("shadow...")
     while (morph && morph.styleRules != this) {
         console.log(morph)
         if (morph.styleRules) props = {...props, ...morph.styleRules.getStyleProps(morph)}
         morph = morph.owner;
     }
     return Object.keys(props);
  }

  getStyleProps(morph) {
    if (this.rules[morph.name]) {
          return this.rules[morph.name]; // name overrides morphClasses
    } else if (morph.morphClasses) {
          return obj.merge(arr.compact(morph.morphClasses.map(c => this.rules[c])));
    }
    return {}
  }

   enforceRulesOn(morph) {
     var styleProps = this.getStyleProps(morph), 
         shadowedProps = this.getShadowedProps(morph);
     styleProps && this.applyToMorph(morph, obj.dissoc(styleProps, shadowedProps));
   }

   applyToMorph(morph, styleProps) {
     return Object.assign(morph, styleProps);
   }
   
}
