import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react-vite';
import {useControl, controlEqual, type Control} from '../src';
import Counter from './components/Counter';

function UncontrolledCounter() {
  return <Counter />;
}

function ControlledCounter() {
  const [count, setCount, control] = useControl<number>(null, 0);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <div>Parent sees count: <strong>{count}</strong></div>
      <Counter count={control} />
      <button onClick={() => setCount(0)}>Reset from Parent</button>
    </div>
  );
}

function SiblingCounters() {
  const [count, setCount, control] = useControl<number>(null, 0);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <div>Shared count: <strong>{count}</strong></div>
      <div style={{display: 'flex', gap: 16}}>
        <div style={{padding: 8, border: '1px solid #ddd', borderRadius: 4}}>
          <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>Counter A</div>
          <Counter count={control} />
        </div>
        <div style={{padding: 8, border: '1px solid #ddd', borderRadius: 4}}>
          <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>Counter B</div>
          <Counter count={control} />
        </div>
      </div>
      <button onClick={() => setCount(0)}>Reset All</button>
    </div>
  );
}

const MemoCounter = React.memo(function MemoCounter({count}: {count?: Control<number>}) {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const [num, setNum] = useControl(count, 0);

  return (
    <div style={{padding: 8, border: '1px solid #ddd', borderRadius: 4}}>
      <div style={{fontSize: 12, color: '#888'}}>renders: {renderCount.current}</div>
      <span>{num} </span>
      <button onClick={() => setNum((n) => n + 1)}>+1</button>
    </div>
  );
}, controlEqual);

function ControlEqualDemo() {
  const [, , countA] = useControl<number>(null, 0);
  const [, , countB] = useControl<number>(null, 0);
  const [label, setLabel] = React.useState('Hello');

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        Changing the label re-renders the parent but not the memoized counters,
        because <code>controlEqual</code> compares control state values instead of references.
      </p>
      <div>
        <label>Label: </label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div style={{display: 'flex', gap: 16}}>
        <MemoCounter count={countA} />
        <MemoCounter count={countB} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Basic',
  component: Counter,
} satisfies Meta<typeof Counter>;

export default meta;

type Story = StoryObj<typeof Counter>;

export const Uncontrolled: Story = {
  render: () => <UncontrolledCounter />,
  parameters: {
    docs: {
      description: {
        story: 'When no control prop is passed, the component manages its own internal state.',
      },
    },
  },
};

export const Controlled: Story = {
  render: () => <ControlledCounter />,
  parameters: {
    docs: {
      description: {
        story: 'A parent creates a control and passes it down. Both parent and child share the same state.',
      },
    },
  },
};

export const Siblings: Story = {
  render: () => <SiblingCounters />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple children share the same control — clicking +1 in either counter updates both.',
      },
    },
  },
};

export const WithControlEqual: Story = {
  name: 'controlEqual + memo',
  render: () => <ControlEqualDemo />,
  parameters: {
    docs: {
      description: {
        story: '`controlEqual` lets `React.memo` compare control props by their state values, avoiding unnecessary re-renders when the control reference changes but the value stays the same.',
      },
    },
  },
};
