// TODO: combine multiple controls

import * as React from 'react';

function create(control) {
  return Object.create(control || null);
}

/**
 * `useState` is a function that takes a control object and a key and returns a state object
 * @param control - The control object.
 * @param key - The key of the state in the control object.
 * @param initial - The initial value of the state.
 * @returns The state of the control.
 */
export function useState(control, key, initial) {
  if (!control) return React.useState(initial);

  const {state, transform} = control[key] || {};
  const hasInit = React.useRef(state).current;
  const s = hasInit ? state : React.useState(initial);
  return transform ? transform(s) : s;
}

/**
 * Create a control
 * @param {object} [control] state store
 * @param {object | array} [transforms] state transforms
 * @return {array} control and useState
 */
export default function useControl(control, transforms) {
  const ctrl = create(control);

  if (__DEV__) {
    const controlRef = control && control.ref;
    if (React.useRef(controlRef).current !== controlRef) {
      throw new Error('Control show be created by same `useControl`');
    }

    ctrl.ref = React.useRef();
  }

  transforms = React.useRef(transforms).current;

  if (transforms) {
    (Array.isArray(transforms)
      ? transforms
      : Object.entries(transforms)
    ).forEach(([prop, t]) => {
      const {state, transform} = ctrl[prop] || {};
      ctrl[prop] = {state, transform: transform ? (s) => transform(t(s)) : t};
    });
  }

  return [
    ctrl,
    function useState$(key, initial) {
      if (__DEV__) {
        if (
          React.useRef(Object.prototype.hasOwnProperty.call(ctrl, key)).current
        )
          throw new Error('Could not use prop multiple times.');
      }

      const state = useState(control, key, initial);
      ctrl[key] = {transform: ctrl[key] && ctrl[key].transform, state};
      return state;
    }
  ];
}

export function useFinalControl(control) {
  return function useState$(prop, initial) {
    return useState(control, prop, initial);
  };
}

// TODO: remove
export function usePick(control, props) {
  const [ctrl, useState] = useControl();
  if (control) {
    props.forEach((prop) => {
      const [from, to] = Array.isArray(prop) ? prop : [prop, prop];
      ctrl[to || from] = control[from];
    });
  }
  return [ctrl, useState];
}

// TODO:  useWatch
