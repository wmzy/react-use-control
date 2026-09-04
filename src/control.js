import {useState, useRef, useMemo} from 'react';
import * as React from 'react';

// A string brand, not a module-local Symbol: when the library is bundled
// twice (common in monorepos), module-local Symbols differ per copy and
// isControl would misjudge controls created by the other copy. A shared
// string key is copy-independent; Symbol.toStringTag above stays for display.
const CONTROL_BRAND = '@@use-control';

const base = {
  useState,
  [CONTROL_BRAND]: true,
  get [Symbol.toStringTag]() {
    return 'Control';
  }
};

function create(baseControl) {
  return Object.create(baseControl || base);
}

export function isControl(maybeControl) {
  return Boolean(
    maybeControl &&
    typeof maybeControl === 'object' &&
    maybeControl[CONTROL_BRAND]
  );
}

const id = Symbol('id');

// DEV diagnostics: append the React component stack to guard messages so the
// user lands on the offending component directly instead of grepping for the
// message text. React 19 DEV exposes captureOwnerStack() — component frames
// with source positions. Older Reacts have no equivalent API; fall back to
// the current owner fiber's ancestor chain (component names only), which is
// all that is needed to identify the component. Returns '' when nothing is
// available (outside a render, SSR, or a production react build), leaving the
// original message untouched. Only ever called from __DEV__ blocks, so this
// whole section is tree-shaken from production builds.
function devComponentStack() {
  if (typeof React.captureOwnerStack === 'function') {
    const stack = React.captureOwnerStack();
    // Owner stacks include only the components that *created* the elements —
    // for nested offenders the innermost frame is the JSX creation site of
    // the offending component, which is React's own convention for warnings.
    if (stack) return stack.trim();
  }
  const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const lines = [];
  for (
    let fiber = internals?.ReactCurrentOwner?.current;
    fiber;
    fiber = fiber.return
  ) {
    const {type} = fiber;
    if (!type || typeof type === 'string') continue; // host components are noise
    const name =
      type.displayName ||
      type.name ||
      (type.type && (type.type.displayName || type.type.name)) || // memo()
      (type.render && (type.render.displayName || type.render.name)); // forwardRef()
    if (name) lines.push(`at ${name}`);
  }
  return lines.join('\n');
}

function withDevComponentStack(message) {
  const stack = devComponentStack();
  return stack ? `${message}\n\nComponent stack:\n${stack}` : message;
}

function useDevCheckControl(control) {
  if (__DEV__) {
    const preRef = useRef(control);
    const notSame = (a, b) => {
      if (a === b) return false;
      if (!(a && b)) return true;
      return a[id] !== b[id];
    };
    if (notSame(control, preRef.current)) {
      throw new Error(
        withDevComponentStack('Should not call with different control')
      );
    }
  }
}

// Switching controlled <-> uncontrolled mid-lifetime is an antipattern: the
// state's owner can never change, and both code paths call a different set of
// hooks, so React will also complain about the hook order. Detect it early and
// warn with the real cause. Must stay the first hook in useControl so its ref
// is read reliably on the render where the switch happens.
function useDevCheckControlledShape(control) {
  if (__DEV__) {
    const shape = (c) =>
      isControl(c) ? 'controlled (a control)' : 'uncontrolled (a plain value)';
    const prevShapeRef = useRef(shape(control));
    const current = shape(control);
    if (current !== prevShapeRef.current) {
      console.warn(
        withDevComponentStack(
          `Warning: useControl is switching from ${prevShapeRef.current} to ${current}. ` +
            'Switching between controlled and uncontrolled is not supported — ' +
            'a component must keep the same mode for its lifetime. ' +
            'Check the controlOrInitial prop: it changed between a control and a plain value.'
        )
      );
      prevShapeRef.current = current;
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
  useDevCheckControlledShape(control);
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
