import * as React from 'react';
import Counter, {useCounter} from './components/Counter';

export function Demo() {
  const counter = useCounter();
  const [, setNum] = counter.useNumber(1);

  return (
    <div>
      <Counter model={counter} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

export default {title: 'Counter'}
