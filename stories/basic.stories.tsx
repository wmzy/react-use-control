import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import {useControl} from '../src/control';
import Counter from './components/Counter';

function ResetCounter({count}: {count?: any}) {
  const [, setNum, control] = useControl(count, 1);

  return (
    <div>
      <Counter count={control} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}

function ResetAllCounters({count}: {count?: any}) {
  const [, setNum, control] = useControl(count, 1);

  return (
    <div>
      <Counter count={control} />
      <Counter count={control} />
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
