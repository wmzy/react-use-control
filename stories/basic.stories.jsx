import * as React from 'react';
import useControl from '../src';
import Counter, * as props from './components/Counter';

export function ResetCounter() {
  const [control, useProp] = useControl();
  const [, setNum] = useProp(props.$num, 1);

  return (
    <div>
      <Counter control={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

export function ResetAllCounters() {
  const [control, useProp] = useControl();
  const [, setNum] = useProp(props.$num, 1);

  return (
    <div>
      <Counter control={control} />
      <Counter control={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

export default {title: 'basic'}
