import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import {useControl, useControlState as useState} from '../src';
import Counter, * as props from './components/Counter';

function ResetCounter() {
  const control = useControl();
  const [, setNum] = useState(control, props.$num, 1);

  return (
    <div>
      <Counter control={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

function ResetAllCounters() {
  const control = useControl();
  const [, setNum] = useState(control, props.$num, 1);

  return (
    <div>
      <Counter control={control} />
      <Counter control={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

const meta = {
  title: 'ReactUseControl/Basic',
  component: Counter,
  argTypes: {
    backgroundColor: {control: 'color'}
  }
} as Meta;

export default meta;

type Story = StoryObj<typeof Counter>;

export const Reset: Story = {
  render: () => <ResetCounter />,
};

export const ResetAll: Story = {
  render: () => <ResetAllCounters />,
};
