import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import {useControl, useControllableState, useControlState as useState} from '../src';

function Counter({control}) {
  const [step, setStep] = useControllableState(control, 'step', 1);
  const [num, setNum] = useControllableState(control, 'num', 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

function ResetCounter({control}) {
  const m = useControl(control);
  const [, setNum] = useState(m, 'num', 1);
  const [initialValue, setInitialValue] = useState(m, 'initialValue', 2);

  return (
    <div>
      <Counter control={m} />
      <button onClick={() => setNum(initialValue)}>Reset</button>
    </div>
  );
}

function ResetCounterTo() {
  const control = useControl();
  const [, setInitialValue] = useState(control, 'initialValue', 2);

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


const meta = {
  title: 'ReactUseControl/Extends',
  component: Counter,
  argTypes: {
    backgroundColor: {control: 'color'}
  }
} as Meta;

export default meta;

type Story = StoryObj<typeof Counter>;

export const ResetTo: Story = {
  render: () => <ResetCounterTo />,
}
