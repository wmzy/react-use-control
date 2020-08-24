// TODO: combine multiple models

import * as React from 'react';

const modelType = Symbol('modelType');

export function isModel(obj) {
  return obj && obj[modelType];
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

export default function useModel(model, transforms) {
  const m = isModel(model) ? Object.create(model) : {[modelType]: true};
  // eslint-disable-next-line no-unused-expressions
  transforms &&
    Object.keys(transforms).forEach((prop) => {
      const t = transforms[prop];
      const {state, transform} = m[prop] || {};
      m[prop] = {state, transform: transform ? (s) => transform(t(s)) : t};
    });

  return [
    m,
    function useProp$(prop, initial) {
      const state = useProp(model, prop, initial);
      m[prop] = {transform: transforms && transforms[prop], state};
      return state;
    }
  ];
}

export function usePropHook(model) {
  return function useProp$(prop, initial) {
    return useProp(model, prop, initial);
  };
}

export function usePick(model, props) {
  const [m, useProp] = useModel();
  if (model) {
    props.forEach((prop) => {
      const [from, to] = typeof prop === 'string' ? [prop, prop] : prop;
      m[to || from] = model[from];
    });
  }
  return [m, useProp];
}

export function createModel(props) {
  return function $useModel($model) {
    const [model, useProp] = useModel($model);

    return {
      model,
      ...props.reduce(
        (pre, cur) => ({
          ...cur,
          [`use${pre}`]: (initial, transform) =>
            useProp(pre, initial, transform)
        }),
        {}
      )
    };
  };
}

// TODO:  useWatch
