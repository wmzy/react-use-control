// TODO: combine multiple controls

import * as React from 'react';

const controlSymbol = Symbol('control');

export function isControl(obj) {
  return obj && obj[controlSymbol];
}

// TODO: 同一个 control 传给多个 组件实例
export function useProp(control, prop, initial) {
  // if (__DEV__) {
  //   // eslint-disable-next-line no-prototype-builtins
  //   if (React.useRef(control.hasOwnProperty(prop)).current)
  //     throw new Error('Could not use prop multiple times.');
  // }

  if (!control) return React.useState(initial);
  const {state, transform} = control[prop] || {};
  const isSource = React.useRef(!state).current;
  const s = isSource ? React.useState(initial) : state;
  return transform ? transform(s) : s;
}

/**
 * Create or reuse a control
 * @param {object} [control] state store
 * @param {object | array} [transforms] state transforms
 * @return {array} control and useProp
 */
export default function useControl(control, transforms) {
  const m = isControl(control)
    ? Object.create(control)
    : {[controlSymbol]: true};
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
      const state = useProp(control, prop, initial);
      m[prop] = {transform: transforms && transforms[prop], state};
      return state;
    }
  ];
}

export function useControlProp(control) {
  return function useProp$(prop, initial) {
    return useProp(control, prop, initial);
  };
}

export function usePick(control, props) {
  const [m, useProp] = useControl();
  if (control) {
    props.forEach((prop) => {
      const [from, to] = Array.isArray(prop) ? prop : [prop, prop];
      m[to || from] = control[from];
    });
  }
  return [m, useProp];
}

// TODO:  useWatch
