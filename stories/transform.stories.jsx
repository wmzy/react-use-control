import * as React from 'react';
import useControl, {useControlProp} from '../src';
import {mapSetter} from '../src/transform';

function Counter({control}) {
  const useProp = useControlProp(control);
  const [total, setTotal] = useProp('total', 0);

  return (
    <div>
      <span> {total} </span>
      <button onClick={() => setTotal((n) => n + 1)}>ADD</button>
    </div>
  );
}

export function DoubleCounter({control}) {
  const [m] = useControl(control, {
    total: mapSetter(t => t + 1)
  });

  return <Counter control={m} />;
}

export default {title: 'transform'};
