import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react-vite';
import {useControl, useThru, mapState, mapSetter, watch, type Control} from '../src';

function SimpleCounter({count}: {count?: Control<number>}) {
  const [total, setTotal] = useControl(count, 0);

  return (
    <div>
      <span style={{minWidth: 40, display: 'inline-block'}}>{total}</span>
      <button onClick={() => setTotal((n) => n + 1)}>+1</button>
    </div>
  );
}

function DoubleCounter() {
  const [, , control] = useControl<number>(null, 0);
  const doubled = useThru(control, mapSetter((t) => t * 2));

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        <code>mapSetter(v =&gt; v * 2)</code> — every +1 click actually adds 2.
      </p>
      <SimpleCounter count={doubled} />
    </div>
  );
}

function ClampedCounter() {
  const [, , control] = useControl<number>(null, 5);
  const clamped = useThru(
    control,
    mapSetter((v) => Math.max(0, Math.min(10, v)))
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        <code>mapSetter(v =&gt; clamp(0, 10, v))</code> — value is clamped between 0 and 10.
      </p>
      <ClampedDisplay count={clamped} />
    </div>
  );
}

function ClampedDisplay({count}: {count?: Control<number>}) {
  const [num, setNum] = useControl(count, 0);

  return (
    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
      <button onClick={() => setNum((n) => n - 1)}>-1</button>
      <span style={{minWidth: 40, textAlign: 'center'}}>{num}</span>
      <button onClick={() => setNum((n) => n + 1)}>+1</button>
      <span style={{fontSize: 12, color: '#888'}}>(range: 0–10)</span>
    </div>
  );
}

function MapStateDemo() {
  const [, , control] = useControl<number>(null, 0);
  const scaled = useThru(control, mapState((v) => v * 100));

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        <code>mapState(v =&gt; v * 100)</code> — child sees the value multiplied by 100.
      </p>
      <div style={{display: 'flex', gap: 16}}>
        <div>
          <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>Raw value</div>
          <SimpleCounter count={control} />
        </div>
        <div>
          <div style={{fontSize: 12, color: '#888', marginBottom: 4}}>Scaled (×100)</div>
          <ScaledDisplay count={scaled} />
        </div>
      </div>
    </div>
  );
}

function ScaledDisplay({count}: {count?: Control<number>}) {
  const [num] = useControl(count, 0);
  return <span style={{fontWeight: 'bold', fontSize: 18}}>{num}</span>;
}

function WatchDemo() {
  const [logs, setLogs] = React.useState<number[]>([]);
  const [, , control] = useControl<number>(null, 0);
  const watched = useThru(
    control,
    watch((v) => setLogs((prev) => [...prev.slice(-9), v]))
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        <code>watch(onChange)</code> — fires a side-effect whenever the value changes.
      </p>
      <SimpleCounter count={watched} />
      <div style={{padding: 8, background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12}}>
        {logs.length === 0
          ? <span style={{color: '#999'}}>Click +1 to see logged values…</span>
          : logs.map((v, i) => <div key={i}>onChange({v})</div>)
        }
      </div>
    </div>
  );
}

function ChainedTransforms() {
  const [, , control] = useControl<number>(null, 0);
  const transformed = useThru(
    useThru(control, mapSetter((v) => v + 10)),
    mapSetter((v) => v * 2)
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <p style={{margin: 0, fontSize: 14, color: '#666'}}>
        Chained: <code>mapSetter(v =&gt; v + 10)</code> then <code>mapSetter(v =&gt; v * 2)</code>
        — clicking +1 sets <code>(value + 10) * 2</code>.
      </p>
      <SimpleCounter count={transformed} />
    </div>
  );
}

const meta = {
  title: 'Transforms',
  component: SimpleCounter,
} satisfies Meta<typeof SimpleCounter>;

export default meta;

type Story = StoryObj<typeof SimpleCounter>;

export const Double: Story = {
  render: () => <DoubleCounter />,
  parameters: {
    docs: {
      description: {
        story: '`mapSetter` transforms the value before it reaches setState — every increment is doubled.',
      },
    },
  },
};

export const Clamped: Story = {
  render: () => <ClampedCounter />,
  parameters: {
    docs: {
      description: {
        story: '`mapSetter` with a clamp function to restrict the value range.',
      },
    },
  },
};

export const MapState: Story = {
  name: 'mapState',
  render: () => <MapStateDemo />,
  parameters: {
    docs: {
      description: {
        story: '`mapState` transforms the value that children see, without affecting the stored value.',
      },
    },
  },
};

export const Watch: Story = {
  name: 'watch',
  render: () => <WatchDemo />,
  parameters: {
    docs: {
      description: {
        story: '`watch` fires a side-effect callback whenever the value changes — useful for logging, analytics, or syncing.',
      },
    },
  },
};

export const Chained: Story = {
  name: 'Chained Transforms',
  render: () => <ChainedTransforms />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple `useThru` calls can be chained to compose transforms.',
      },
    },
  },
};
