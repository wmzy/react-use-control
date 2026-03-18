import {useState, useRef, useCallback} from 'react';

// Tracks controls whose state has changed. On the next render, useNewControl
// detects the dirty mark and creates a fresh control object, ensuring the
// reference update propagates through props. After the first state change the
// control identity stabilizes — subsequent re-renders reuse the same object.
// This is intentional: `controlEqual` compares state VALUES (not identity),
// so React.memo works correctly when paired with controlEqual.
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

function getState(ctrl) {
  return ctrl.state || Object.getPrototypeOf(ctrl).state;
}

export function controlEqual(prev, next) {
  const keys = Object.keys(next);
  if (keys.length !== Object.keys(prev).length) return false;
  return keys.every((key) => {
    const a = prev[key];
    const b = next[key];
    if (isControl(a) && isControl(b))
      return Object.is(getState(a)[0], getState(b)[0]);
    return Object.is(a, b);
  });
}

export function useThru(control, interceptor) {
  const ctrl = useNewControl(control);
  const proto = Object.getPrototypeOf(ctrl);
  if (proto.state) {
    ctrl.state = interceptor(proto.state);
  } else {
    const {useState} = proto;
    ctrl.useState = (...params) => interceptor(useState(...params));
  }
  return ctrl;
}
