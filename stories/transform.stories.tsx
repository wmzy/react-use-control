import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react';
import {useControl, useThru, mapSetter} from '../src';

function Counter({count}) {
  const [total, setTotal] = useControl(count, 0);

  return (
    <div>
      <span> {total} </span>
      <button onClick={() => setTotal((n) => n + 1)}>ADD</button>
    </div>
  );
}

function DoubleCounter({count}: {count?: any}) {
  const ref = React.useRef(1);
  const control = useThru(count, mapSetter(t => t + 1));

  return <div>
    parent render count: {ref.current++}
    <Counter count={control} />
    </div>;
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
