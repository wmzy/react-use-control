import * as React from 'react';
import useModel, {useModelProp} from '../src';
import {mapSetter} from '../src/transform';

function Counter({model}) {
  const useProp = useModelProp(model);
  const [total, setTotal] = useProp('total', 0);

  return (
    <div>
      <span> {total} </span>
      <button onClick={() => setTotal((n) => n + 1)}>ADD</button>
    </div>
  );
}

export function DoubleCounter({model}) {
  const [m] = useModel(model, {
    total: mapSetter(t => t + 1)
  });

  return <Counter model={m} />;
}

export default {title: 'transform'};
