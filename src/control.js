import {useState, useRef, useMemo} from 'react';

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

function useDevCheckControl(control) {
  if (__DEV__) {
    const preRef = useRef(control);
    const notSame = (a, b) => {
      if (a === b) return false;
      if (!(a && b)) return true;
      return a[id] !== b[id];
    };
    if (notSame(control, preRef.current)) {
      throw new Error('Should not call with different control');
    }
  }
}

function useDevSetId(control) {
  if (__DEV__) {
    const uniqueId = useRef(Symbol('unique id')).current;
    control[id] = uniqueId;
  }
}

function useNewControl(baseControl, state) {
  useDevCheckControl(baseControl);

  const newCtl = useMemo(() => create(baseControl), [baseControl, state]);

  useDevSetId(newCtl);

  return newCtl;
}

export function useControl(controlOrInitial, maybeInitial) {
  const [control, initial] = isControl(controlOrInitial)
    ? [controlOrInitial, maybeInitial]
    : [null, controlOrInitial === undefined ? maybeInitial : controlOrInitial];
  // 上层组件创建了状态，直接使用
  if (control?.state) {
    const ctrl = useNewControl(control);
    return [...control.state, ctrl];
  }

  const state = (control?.useState || useState)(initial);
  const [value, setValue] = state;
  const ctrl = useNewControl(control, value);
  ctrl.state = state;

  return [value, setValue, ctrl];
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
