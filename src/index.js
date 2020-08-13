// TODO: combine multiple models

import * as React from 'react';

const modelType = Symbol('modelType');

export function isModel(obj) {
  return obj && obj[modelType];
}

// TODO: 同一个组件内同一个 model 的 同一个 prop 调用多次
// TODO: 同一个 model 传给多个 组件实例
export function useProp(model, prop, initial, transform) {
  // if (__DEV__) {
  //   // eslint-disable-next-line no-prototype-builtins
  //   if (React.useRef(model.hasOwnProperty(prop)).current)
  //     throw new Error('Could not use prop multiple times.');
  // }

  const isSource = React.useRef(!model[prop]).current;
  if (isSource) {
    const state = React.useState(initial);
    model[prop] = transform ? transform(state) : state;
    return state;
  }

  const state = Object.getPrototypeOf(model)[prop];
  if (transform) {
    model[prop] = transform(state);
  }
  return state;
}

export default function useModel(model) {
  const modelRef = React.useRef(
    isModel(model) ? Object.create(model) : {[modelType]: true}
  );

  return [
    modelRef.current,
    function $useProp(prop, initial, transform) {
      return useProp(modelRef.current, prop, initial, transform);
    }
  ];
}

export function usePropHook(model) {
  if (!model) {
    return function useProp(prop, initial) {
      return React.useState(initial);
    };
  }

  return function useProp(prop, initial) {
    return React.useRef(model[prop]).current
      ? model[prop]
      : React.useState(initial);
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

// TODO: useTransform useWatch
