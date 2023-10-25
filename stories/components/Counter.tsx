import * as React from 'react';
import {useControl} from '../../src/index';

export default function Counter({step: s, count}:{step?: any; count?: any}) {
  const [step, setStep] = useControl(s, 1);
  const [num, setNum] = useControl(count, 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

