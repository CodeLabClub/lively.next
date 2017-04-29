import { obj, arr } from "lively.lang";

export class Plugin {}

class CustomSerializePlugin {

  // can realObj be manually serialized, e.g. into an expression?
  serializeObject(realObj, isProperty, pool, serializedObjMap, path) {
    if (typeof realObj.__serialize__ !== "function") return null;
    let serialized = realObj.__serialize__(pool, serializedObjMap, path);
    if (serialized.hasOwnProperty("__expr__")) {
      let expr = pool.expressionSerializer.exprStringEncode(serialized);
      serialized = isProperty ? expr : {__expr__: expr};
    }
    return serialized;
  }

  deserializeObject(pool, ref, snapshot, path) {
    let {__expr__} = snapshot;
    return __expr__ ? pool.expressionSerializer.deserializeExpr(__expr__) : null;
  }

}

class ClassPlugin {

  // record class meta info for re-instantiating
  additionallySerialize(pool, ref, snapshot, addFn) {
    pool.classHelper.addClassInfo(ref, ref.realObj, snapshot);
  }

  deserializeObject(pool, ref, snapshot, path) {
    return pool.classHelper.restoreIfClassInstance(ref, snapshot);
  }

}

class AdditionallySerializePlugin {
  // for objects with __additionally_serialize__(snapshot, ref, pool, addFn) method

  additionallySerialize(pool, ref, snapshot, addFn) {
    let {realObj} = ref;
    if (realObj && typeof realObj.__additionally_serialize__  === "function")
      realObj.__additionally_serialize__(snapshot, ref, pool, addFn);
  }

  additionallyDeserializeBeforeProperties(pool, ref, newObj, props, snapshot, serializedObjMap, path) {
    if (typeof newObj.__deserialize__ === "function")
      newObj.__deserialize__(snapshot, ref, serializedObjMap, pool, path);
  }

  additionallyDeserializeAfterProperties(pool, ref, newObj, snapshot, serializedObjMap, path) {
    if (typeof newObj.__after_deserialize__ === "function")
      newObj.__after_deserialize__(snapshot, ref);
  }

}

class OnlySerializePropsPlugin {

 propertiesToSerialize(pool, ref, snapshot, keysSoFar) {
   let {realObj} = ref;
   return (realObj && realObj.__only_serialize__) || null;
 }
}

class DontSerializePropsPlugin {

 propertiesToSerialize(pool, ref, snapshot, keysSoFar) {
   let {realObj} = ref;
   if (!realObj || !realObj.__dont_serialize__) return null;
   let ignoredKeys = obj.mergePropertyInHierarchy(realObj, "__dont_serialize__"),
       keys = [];
   for (let i = 0; i < keysSoFar.length; i++) {
     let key = keysSoFar[i];
     if (!ignoredKeys.includes(key))
       keys.push(key);
   }
   return keys;
 }

}

class LivelyClassPropertiesPlugin {

  propertiesToSerialize(pool, ref, snapshot, keysSoFar) {
    // serialize class properties as indicated by realObj.constructor.properties
    let {realObj} = ref,
        classProperties = realObj.constructor[Symbol.for("lively.classes-properties-and-settings")];

    if (!classProperties) return null;

    let {properties, propertySettings} = classProperties,
        valueStoreProperty = propertySettings.valueStoreProperty || "_state",
        valueStore = realObj[valueStoreProperty],
        only = !!realObj.__only_serialize__,
        keys = [];

    if (!valueStore) return;

    // if __only_serialize__ is defined we will only consider those properties
    // that are in keysSoFar – it is expected that the OnlySerializePropsPlugin
    // was producing that list.

    if (only) {
      for (var i = 0; i < keysSoFar.length; i++) {
        let key = keysSoFar[i], spec = properties[key];
        if (key === valueStoreProperty) continue;
        if (spec) {
          if (spec && (spec.derived || spec.readOnly
                    || (spec.hasOwnProperty("serialize") && !spec.serialize))) continue;
        }
        keys.push(key);
      }
      return keys;
    }

    // Otherwise properties add to keysSoFar
    var valueStoreKeyIdx = keysSoFar.indexOf(valueStoreProperty);
    if (valueStoreKeyIdx > -1) keysSoFar.splice(valueStoreKeyIdx, 1);

    for (var key in properties) {
      var spec = properties[key],
          idx = keysSoFar.indexOf(key);
      if (spec.derived || spec.readOnly ||
          (spec.hasOwnProperty("serialize") && !spec.serialize)) {
        if (idx > -1) keysSoFar.splice(idx, 1);
      } else if (idx === -1) keys.push(key);
    }
    return keys.concat(keysSoFar);

  }


  additionallyDeserializeBeforeProperties(pool, ref, newObj, props, snapshot, serializedObjMap, path) {
    // deserialize class properties as indicated by realObj.constructor.properties
    var classProperties = newObj.constructor[Symbol.for("lively.classes-properties-and-settings")];
    if (!classProperties) return props;

    var {properties, propertySettings} = classProperties,
        valueStoreProperty = propertySettings.valueStoreProperty || "_state",
        props = snapshot.props;

    // if props has a valueStoreProperty then we directly deserialize that.
    // As of 2017-02-26 this is for backwards compat.
    if (props[valueStoreProperty]) return props;

    props = obj.clone(props);

    if (!newObj.hasOwnProperty(valueStoreProperty))
      newObj.initializeProperties();

    var valueStore = newObj[valueStoreProperty],
        sortedKeys = obj.sortKeysWithBeforeAndAfterConstraints(properties);
    for (var i = 0; i < sortedKeys.length; i++) {
      var key = sortedKeys[i],
          spec = properties[key];
      if (!props.hasOwnProperty(key)) continue;
      ref.recreatePropertyAndSetProperty(newObj, props, key, serializedObjMap, pool, path);
      delete props[key];
    }

    return props;
  }
}

export var plugins = {
  livelyClassPropertiesPlugin: new LivelyClassPropertiesPlugin(),
  dontSerializePropsPlugin:    new DontSerializePropsPlugin(),
  onlySerializePropsPlugin:    new OnlySerializePropsPlugin(),
  additionallySerializePlugin: new AdditionallySerializePlugin(),
  classPlugin:                 new ClassPlugin(),
  customSerializePlugin:       new CustomSerializePlugin(),
}

export var allPlugins = [
  plugins.customSerializePlugin,
  plugins.classPlugin,
  plugins.additionallySerializePlugin,
  plugins.onlySerializePropsPlugin,
  plugins.dontSerializePropsPlugin,
  plugins.livelyClassPropertiesPlugin
]
