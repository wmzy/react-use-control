import * as React from 'react';
import useModel from '../../src';

export function useCounter(counterModel) {
  const [model, useProp] = useModel(
    counterModel ? counterModel.model : undefined
  );

  return {
    model,
    useStep(step) {
      return useProp('step', step);
    },
    useNumber(num) {
      return useProp('num', num);
    }
  };
}

export default function Counter({model}) {
  const m = useCounter(model);
  const [step, setStep] = m.useStep(1);
  const [num, setNum] = m.useNumber(0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}
