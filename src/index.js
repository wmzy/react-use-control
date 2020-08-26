// TODO: combine multiple models

import * as React from 'react';

const modelSymbol = Symbol('model');

export function isModel(obj) {
  return obj && obj[modelSymbol];
}

// TODO: 同一个组件内同一个 model 的 同一个 prop 调用多次
// TODO: 同一个 model 传给多个 组件实例
export function useProp(model, prop, initial) {
  // if (__DEV__) {
  //   // eslint-disable-next-line no-prototype-builtins
  //   if (React.useRef(model.hasOwnProperty(prop)).current)
  //     throw new Error('Could not use prop multiple times.');
  // }

  if (!model) return React.useState(initial);
  const {state, transform} = model[prop] || {};
  const isSource = React.useRef(!state).current;
  const s = isSource ? React.useState(initial) : state;
  return transform ? transform(s) : s;
}

/**
 * Create or reuse a model
 * @param {object} [model] state store
 * @param {object | array} [transforms] state transforms
 * @return {array} model and useProp
 */
export default function useModel(model, transforms) {
  const m = isModel(model) ? Object.create(model) : {[modelSymbol]: true};
  if (transforms) {
    (Array.isArray(transforms)
      ? transforms
      : Object.entries(transforms)
    ).forEach(([prop, t]) => {
      const {state, transform} = m[prop] || {};
      m[prop] = {state, transform: transform ? (s) => transform(t(s)) : t};
    });
  }

  return [
    m,
    function useProp$(prop, initial) {
      const state = useProp(model, prop, initial);
      m[prop] = {transform: transforms && transforms[prop], state};
      return state;
    }
  ];
}

export function useModelProp(model) {
  return function useProp$(prop, initial) {
    return useProp(model, prop, initial);
  };
}

export function usePick(model, props) {
  const [m, useProp] = useModel();
  if (model) {
    props.forEach((prop) => {
      const [from, to] = Array.isArray(prop) ? prop : [prop, prop];
      m[to || from] = model[from];
    });
  }
  return [m, useProp];
}

// TODO:  useWatch
