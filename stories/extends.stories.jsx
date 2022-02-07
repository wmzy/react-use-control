import * as React from 'react';
import useControl, {useControlProp} from '../src';

function Counter({control}) {
  const useProp = useControlProp(control);
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

function ResetCounter({control}) {
  const [m, useProp] = useControl(control);
  const [, setNum] = useProp('num', 1);
  const [initialValue, setInitialValue] = useProp('initialValue', 2);

  return (
    <div>
      <Counter control={m} />
      <button onClick={() => setNum(initialValue)}>Reset</button>
    </div>
  );
}

export function ResetCounterTo() {
  const [control, useProp] = useControl();
  const [, setInitialValue] = useProp('initialValue', 2);

  return (
    <div>
      <ResetCounter control={control} />
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
