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
      <div style={{fontSize: 12, color: '#999', marginBottom: 4}}>Child (memo) — renders: {renderCount.current}</div>
      <span>{num} </span>
      <button onClick={() => setNum(num + 1)}>+1</button>
    </div>
  );
}, controlEqual);

function ControlEqualDemo() {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const [countA, , controlA] = useControl<number>(0);
  const [countB, , controlB] = useControl<number>(0);
  const [tick, setTick] = React.useState(0);

  return (
    <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8}}>
      <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>Parent — renders: {renderCount.current}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <p style={{margin: 0, fontSize: 14, color: '#666'}}>
          Clicking "Re-render Parent" forces the parent to re-render (tick: {tick}),
          but the memoized children skip re-rendering because <code>controlEqual</code> sees
          their control values haven't changed.
        </p>
        <button onClick={() => setTick((t) => t + 1)}>Re-render Parent</button>
        <div style={{display: 'flex', gap: 16}}>
          <div>
            <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>countA: {countA}</div>
            <MemoCounter count={controlA} />
          </div>
          <div>
            <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>countB: {countB}</div>
            <MemoCounter count={controlB} />
          </div>
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
      source: {
        code: `function Counter({ step: s, count }) {
  const [step, setStep] = useControl(s, 1);
  const [num, setNum] = useControl(count, 0);

  return (
    <div>
      <span>{num}</span>
      <button onClick={() => setNum(n => n + step)}>add {step}</button>
      <button onClick={() => setStep(n => n + 1)}>add step</button>
    </div>
  );
}

// No control passed — Counter manages its own state internally
<Counter />`,
        language: 'tsx',
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
      source: {
        code: `function Counter({ step: s, count }) {
  const [step, setStep] = useControl(s, 1);
  const [num, setNum] = useControl(count, 0);
  return (
    <div>
      <span>{num}</span>
      <button onClick={() => setNum(n => n + step)}>add {step}</button>
      <button onClick={() => setStep(n => n + 1)}>add step</button>
    </div>
  );
}

function Parent() {
  // Parent creates a control and passes it to Counter
  const [count, setCount, control] = useControl(0);
  return (
    <div>
      <div>Parent sees count: {count}</div>
      <Counter count={control} />
      <button onClick={() => setCount(0)}>Reset from Parent</button>
    </div>
  );
}`,
        language: 'tsx',
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
      source: {
        code: `function Counter({ step: s, count }) {
  const [step, setStep] = useControl(s, 1);
  const [num, setNum] = useControl(count, 0);
  return (
    <div>
      <span>{num}</span>
      <button onClick={() => setNum(n => n + step)}>add {step}</button>
      <button onClick={() => setStep(n => n + 1)}>add step</button>
    </div>
  );
}

function SiblingCounters() {
  // Same control passed to both — they share state
  const [count, setCount, control] = useControl(0);
  return (
    <div>
      <div>Shared count: {count}</div>
      <Counter count={control} />
      <Counter count={control} />
      <button onClick={() => setCount(0)}>Reset All</button>
    </div>
  );
}`,
        language: 'tsx',
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
      source: {
        code: `const MemoCounter = React.memo(function MemoCounter({ count }) {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const [num, setNum] = useControl(count, 0);

  return (
    <div>
      <div>renders: {renderCount.current}</div>
      <span>{num}</span>
      <button onClick={() => setNum(num + 1)}>+1</button>
    </div>
  );
}, controlEqual);

function Parent() {
  const renderCount = React.useRef(0);
  renderCount.current++;
  const [countA, , controlA] = useControl(0);
  const [countB, , controlB] = useControl(0);
  const [tick, setTick] = React.useState(0);

  return (
    <div>
      <div>Parent renders: {renderCount.current}</div>
      <button onClick={() => setTick(t => t + 1)}>Re-render Parent</button>
      <MemoCounter count={controlA} />
      <MemoCounter count={controlB} />
    </div>
  );
}`,
        language: 'tsx',
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
      source: {
        code: `function TemperatureInput({ temperature }) {
  const [temp, setTemp] = useControl(temperature, 20);
  return (
    <div>
      <button onClick={() => setTemp(t => t - 1)}>-</button>
      <span>{temp}°C</span>
      <button onClick={() => setTemp(t => t + 1)}>+</button>
    </div>
  );
}

function TemperatureCard({ temperature }) {
  const [temp] = useControl(temperature, 20);
  return (
    <div>
      <div>{temp}°C</div>
      <TemperatureInput temperature={temperature} />
    </div>
  );
}

function TemperaturePanel({ temperature }) {
  return (
    <div>
      <TemperatureCard temperature={temperature} />
      <TemperatureCard temperature={temperature} />
    </div>
  );
}

function App() {
  const [temp, setTemp, control] = useControl(20);
  return (
    <div>
      <div>Top-level: {temp}°C</div>
      <TemperaturePanel temperature={control} />
      <button onClick={() => setTemp(20)}>Reset</button>
    </div>
  );
}`,
        language: 'tsx',
      },
    },
  },
};
