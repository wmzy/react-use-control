import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react-vite';
import {useControl, controlEqual, type Control} from '../src';
import Counter from './components/Counter';

function UncontrolledCounter() {
  return <Counter />;
}

function ControlledCounter() {
  const [count, setCount, control] = useControl<number>(0);

  return (
    <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8}}>
      <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>Parent</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div>Parent sees count: <strong>{count}</strong></div>
        <div style={{padding: 8, border: '1px dashed #999', borderRadius: 4}}>
          <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>Child</div>
          <Counter count={control} />
        </div>
        <button onClick={() => setCount(0)}>Reset from Parent</button>
      </div>
    </div>
  );
}

function SiblingCounters() {
  const [count, setCount, control] = useControl<number>(0);

  return (
    <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8}}>
      <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>Parent</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div>Shared count: <strong>{count}</strong></div>
        <div style={{display: 'flex', gap: 16}}>
          <div style={{padding: 8, border: '1px dashed #999', borderRadius: 4}}>
            <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>Child A</div>
            <Counter count={control} />
          </div>
          <div style={{padding: 8, border: '1px dashed #999', borderRadius: 4}}>
            <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>Child B</div>
            <Counter count={control} />
          </div>
        </div>
        <button onClick={() => setCount(0)}>Reset All</button>
      </div>
    </div>
  );
}

const MemoCounter = React.memo(function MemoCounter({count}: {count?: Control<number>}) {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const [num, setNum] = useControl(count, 0);

  return (
    <div style={{padding: 8, border: '1px dashed #999', borderRadius: 4}}>
      <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>Child (memo)</div>
      <div style={{fontSize: 12, color: '#888'}}>renders: {renderCount.current}</div>
      <span>{num} </span>
      <button onClick={() => setNum((n) => n + 1)}>+1</button>
    </div>
  );
}, controlEqual);

function ControlEqualDemo() {
  const [, , countA] = useControl<number>(0);
  const [, , countB] = useControl<number>(0);
  const [label, setLabel] = React.useState('Hello');

  return (
    <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8}}>
      <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>Parent</div>
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
    </div>
  );
}

function TemperatureInput({temperature}: {temperature?: Control<number>}) {
  const [temp, setTemp] = useControl(temperature, 20);

  return (
    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
      <button onClick={() => setTemp((t) => t - 1)}>-</button>
      <span style={{minWidth: 40, textAlign: 'center'}}>{temp}°C</span>
      <button onClick={() => setTemp((t) => t + 1)}>+</button>
    </div>
  );
}

function TemperatureCard({temperature}: {temperature?: Control<number>}) {
  const [temp] = useControl(temperature, 20);
  const color = temp < 15 ? '#3b82f6' : temp > 30 ? '#ef4444' : '#22c55e';

  return (
    <div style={{padding: 12, border: '1px dashed #999', borderRadius: 4}}>
      <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>TemperatureCard</div>
      <div style={{fontSize: 24, fontWeight: 'bold', color, marginBottom: 8}}>{temp}°C</div>
      <div style={{padding: 8, border: '1px dashed #bbb', borderRadius: 4}}>
        <div style={{fontSize: 12, color: '#bbb', marginBottom: 4}}>TemperatureInput</div>
        <TemperatureInput temperature={temperature} />
      </div>
    </div>
  );
}

function TemperaturePanel({temperature}: {temperature?: Control<number>}) {
  return (
    <div style={{padding: 12, border: '1px dashed #999', borderRadius: 4}}>
      <div style={{fontSize: 12, color: '#999', marginBottom: 8}}>TemperaturePanel</div>
      <div style={{display: 'flex', gap: 16}}>
        <TemperatureCard temperature={temperature} />
        <TemperatureCard temperature={temperature} />
      </div>
    </div>
  );
}

function CrossLayerDemo() {
  const [temp, setTemp, control] = useControl<number>(20);

  return (
    <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8}}>
      <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>App (top-level)</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <p style={{margin: 0, fontSize: 14, color: '#666'}}>
          A single <code>control</code> flows through <strong>App → Panel → Card → Input</strong> (3 layers deep).
          Every component reads and writes the same state — no Context, no prop drilling callbacks.
        </p>
        <div>Top-level temperature: <strong>{temp}°C</strong></div>
        <TemperaturePanel temperature={control} />
        <button onClick={() => setTemp(20)}>Reset to 20°C</button>
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

export const CrossLayer: Story = {
  name: 'Cross-Layer Sharing',
  render: () => <CrossLayerDemo />,
  parameters: {
    docs: {
      description: {
        story: 'A single `control` flows through multiple layers of wrapper components (App → Panel → Card → Input). Every component at any depth can read and write the same state — no Context provider, no callback prop drilling.',
      },
    },
  },
};
