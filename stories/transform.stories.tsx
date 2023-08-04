import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import {useControl, useControllableState, mapSetter} from '../src';

function Counter({control}) {
  const [total, setTotal] = useControllableState(control, 'total', 0);

  return (
    <div>
      <span> {total} </span>
      <button onClick={() => setTotal((n) => n + 1)}>ADD</button>
    </div>
  );
}

function DoubleCounter({control}: {control?: any}) {
  const m = useControl(control, {
    total: mapSetter(t => t + 1)
  });

  return <Counter control={m} />;
}

const meta = {
  title: 'ReactUseControl/Transform',
  component: Counter,
  argTypes: {
    count: {control: 'number'}
  }
} as Meta;

export default meta;

type Story = StoryObj<typeof Counter>;

export const Double: Story = {
  render: (props) => <DoubleCounter {...props} />,
}
