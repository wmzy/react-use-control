import * as React from 'react';
import {useFinalControl} from '../../src';

export const $step = Symbol('step');
export const $num = Symbol('num');

export default function Counter({control}) {
  const useState = useFinalControl(control);
  const [step, setStep] = useState($step, 1);
  const [num, setNum] = useState($num, 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}
