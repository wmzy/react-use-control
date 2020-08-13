import * as React from 'react';
import useModel, {usePropHook} from '../src';

function Counter({model}) {
  const useProp = usePropHook(model);
  const [step, setStep] = useProp('step', 1);
  const [num, setNum] = useProp('num', 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

function ResetCounter({model}) {
  const [m, useProp] = useModel(model);
  const [, setNum] = useProp('num', 1);
  const [initialValue, setInitialValue] = useProp('initialValue', 2);

  return (
    <div>
      <Counter model={m} />
      <button onClick={() => setNum(initialValue)}>Reset</button>
    </div>
  );
}

export function ResetDoubleCounter() {
  const [model, useProp] = useModel();
  const [, setInitialValue] = useProp('initialValue', 2);

  return (
    <div>
      <ResetCounter model={model} />
      <label>
        reset to
      <input
        type="number"
        defaultValue={1}
        onChange={(e) => setInitialValue(+e.target.value)}
      />
      </label>
    </div>
  );
}

export default {title: 'extends'};
