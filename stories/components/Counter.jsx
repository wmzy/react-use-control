import * as React from 'react';
import {useControlProp} from '../../src';

export const $step = Symbol('step');
export const $num = Symbol('num');

export default function Counter({control}) {
  const useProp = useControlProp(control);
  const [step, setStep] = useProp($step, 1);
  const [num, setNum] = useProp($num, 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}
