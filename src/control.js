import {useState, useRef, useCallback} from 'react';

// If the state change, control should update reference, so that the
// react memo not be broken.
const oldControls = new WeakSet();
const isControlSymbol = Symbol('is control');
const base = {useState, [isControlSymbol]: true};

function create(baseControl) {
  return Object.create(baseControl || base);
}

export function isControl(maybeControl) {
  return Boolean(
    maybeControl &&
      typeof maybeControl === 'object' &&
      maybeControl[isControlSymbol]
  );
}

const id = Symbol('id');

function useNewControl(baseControl) {
  const baseRef = useRef(baseControl);
  const newCtl = create(baseControl);
  const ref = useRef(newCtl);

  if (__DEV__) {
    const notSame = (a, b) => {
      if (a === b) return false;
      if (!(a && b)) return true;
      return a[id] !== b[id];
    };
    if (notSame(baseControl, baseRef.current)) {
      throw new Error('Should not call with different control');
    }
    const uniqueId = useRef(Symbol('unique id')).current;
    newCtl[id] = uniqueId;
  }

  if (baseRef.current !== baseControl) {
    baseRef.current = baseControl;
    ref.current = newCtl;
  } else if (oldControls.has(ref.current)) {
    ref.current = newCtl;
  }
  return ref.current;
}

export function useControl(control, initial) {
  const ctrl = useNewControl(control);
  const {state, useState} = ctrl;

  if (Object.getPrototypeOf(ctrl).state) return [...state, ctrl];

  const [value, setValue] = useState(initial);
  const wrappedSetValue = useCallback((v) => {
    setValue((oldValue) => {
      const newValue = typeof v === 'function' ? v(oldValue) : v;
      if (!Object.is(newValue, oldValue)) oldControls.add(ctrl);
      return newValue;
    });
  }, []);
  ctrl.state = [value, wrappedSetValue];

  return [value, wrappedSetValue, ctrl];
}

export function useThru(control, interceptor) {
  const ctrl = useNewControl(control);
  const {state, useState} = ctrl;
  if (Object.getPrototypeOf(ctrl).state) {
    ctrl.state = interceptor(state);
  } else {
    ctrl.useState = (...params) => interceptor(useState(...params));
  }
  return ctrl;
}
