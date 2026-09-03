export function mapState(fn) {
  return ([state, setState]) => [fn(state), setState];
}

export function mapSetter(fn) {
  return ([state, setState]) => [
    state,
    (s) => setState(typeof s === 'function' ? (os) => fn(s(os)) : fn(s))
  ];
}

// `watch` must NOT be built on `mapSetter`: a side effect inside the state
// updater makes the updater impure, and React may double-invoke updaters
// (StrictMode, interrupted renders) — duplicating the side effect. Instead the
// setter wrapper calls `setState` with the untouched action and fires
// `onChange` outside the updater. For functional updates, `onChange` receives
// the value projected from the latest state seen by this layer.
export function watch(onChange) {
  return ([state, setState]) => [
    state,
    (s) => {
      setState(s);
      onChange(typeof s === 'function' ? s(state) : s);
    }
  ];
}
