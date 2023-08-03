import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import useControl from '../src';
import Counter, * as props from './components/Counter';

function ResetCounter() {
  const [control, useState] = useControl();
  const [, setNum] = useState(props.$num, 1);

  return (
    <div>
      <Counter control={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

function ResetAllCounters() {
  const [control, useState] = useControl();
  const [, setNum] = useState(props.$num, 1);

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
