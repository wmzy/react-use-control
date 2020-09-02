export function mapState(fn) {
  return ([state, setState]) => [fn(state), setState];
}

export function mapSetter(fn) {
  return ([state, setState]) => [
    state,
    (s) => setState(typeof s === 'function' ? (os) => fn(s(os)) : fn(s))
  ];
}

export function watch(onChange) {
  return ([state, setState]) => [
    state,
    (s) => {
      const newState = setState(s);
      onChange(newState);
      return newState;
    }
  ];
}
