import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import useControl, {useFinalControl} from '../src';

function Counter({control}) {
  const useState = useFinalControl(control);
  const [step, setStep] = useState('step', 1);
  const [num, setNum] = useState('num', 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

function ResetCounter({control}) {
  const [m, useState] = useControl(control);
  const [, setNum] = useState('num', 1);
  const [initialValue, setInitialValue] = useState('initialValue', 2);

  return (
    <div>
      <Counter control={m} />
      <button onClick={() => setNum(initialValue)}>Reset</button>
    </div>
  );
}

function ResetCounterTo() {
  const [control, useState] = useControl();
  const [, setInitialValue] = useState('initialValue', 2);

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
