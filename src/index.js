import * as React from 'react';

export function useProp(model, prop, initial) {
  const isSource = React.useRef(!model[prop]).current;
  if (isSource) {
    model[prop] = React.useState(initial);
  }
  return model[prop];
}

export default function useModel(model) {
  const modelRef = React.useRef(model || {});

  return [
    modelRef.current,
    function $useProp(prop, initial) {
      return useProp(modelRef.current, prop, initial);
    }
  ];
}
