import * as React from 'react';
import useModel from '../src';
import Counter, * as props from './components/Counter';

export function ResetCounter() {
  const [model, useProp] = useModel();
  const [, setNum] = useProp(props.$num, 1);

  return (
    <div>
      <Counter model={model} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

export function ResetAllCounters() {
  const [model, useProp] = useModel();
  const [, setNum] = useProp(props.$num, 1);

  return (
    <div>
      <Counter model={model} />
      <Counter model={model} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

export default {title: 'basic'}
