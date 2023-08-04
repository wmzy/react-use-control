// TODO: combine multiple controls

import {useState, useRef} from 'react';

function create(control) {
  return Object.create(control || null);
}

/**
 * Create a control
 * @param {object} [control] a base control to be extended.
 * @param {object | array} [transforms] state transforms
 * @return {array} a control which stores state
 */
export function useControl(control, transforms) {
  const ctrl = create(control);

  if (__DEV__) {
    const controlRef = control && control.ref;
    if (useRef(controlRef).current !== controlRef) {
      throw new Error('Control show be created by same `useControl`');
    }

    ctrl.ref = useRef();
  }

  transforms = useRef(transforms).current;

  if (transforms) {
    (Array.isArray(transforms)
      ? transforms
      : Object.entries(transforms)
    ).forEach(([prop, t]) => {
      const {state, transform} = ctrl[prop] || {};
      ctrl[prop] = {state, transform: transform ? (s) => transform(t(s)) : t};
    });
  }

  return ctrl;
}

/**
 * Returns a controllable state,
 * and it can be controlled by another component.
 * @param control - The control object maybe undefined.
 * @param key - The key of the state in the control object.
 * @param initial - The initial value of the state. If this state has been controlled, it will be ignored.
 * @returns a stateful value, and a function to update it.
 */
export function useControllableState(control, key, initial) {
  if (!control) return useState(initial);

  const {state, transform} = control[key] || {};
  const hasInit = useRef(state).current;
  const s = hasInit ? state : useState(initial);
  return transform ? transform(s) : s;
}

/**
 * Returns a controllable state(which is same as `React.useState`),
 * and can be used to control another component's state.
 * @param control - The control object.
 * @param key - The key of the state in the control object.
 * @param initial - The initial value of the state. If this state has been controlled, it will be ignored.
 * @returns a stateful value, and a function to update it.
 */
export function useControlState(control, key, initial) {
  if (__DEV__) {
    if (useRef(Object.prototype.hasOwnProperty.call(control, key)).current)
      throw new Error('Could not use prop multiple times.');
  }

  const state = useControllableState(
    Object.getPrototypeOf(control),
    key,
    initial
  );
  control[key] = {transform: control[key] && control[key].transform, state};
  return state;
}

export function usePick(control, props) {
  const ctrl = useControl();
  if (control) {
    props.forEach((prop) => {
      const [from, to] = Array.isArray(prop) ? prop : [prop, prop];
      ctrl[to || from] = control[from];
    });
  }
  return ctrl;
}

// TODO:  useWatch
