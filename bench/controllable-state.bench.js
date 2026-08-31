/**
 * Benchmarks: react-use-control vs the two dominant patterns.
 *
 * Methodology: identical DOM output (a value span + a +1 button) rendered
 * through @testing-library/react into jsdom. Three implementations of the
 * same component, one per pattern:
 *
 *   - manual  — useState + isControlled branch + useEffect sync
 *   - radix   — @radix-ui/react-use-controllable-state
 *   - control — react-use-control
 *
 * Scenarios (each bench sample does N work units, N=50):
 *   - mount (uncontrolled)   — first render of a self-managed component
 *   - controlled prop update — parent drives a new value, child follows
 *   - setter update          — user clicks; child writes state
 *
 * Run with: pnpm bench
 */
import {afterEach, bench, describe} from 'vitest';
import {act, cleanup, render} from '@testing-library/react';
import {createElement, useEffect, useState} from 'react';
import {useControllableState} from '@radix-ui/react-use-controllable-state';
import {useControl} from '../src/index.js';

const WORK = 50; // work units per sample
const SAMPLES = 20; // bench iterations per implementation

// ---------- manual: useState + isControlled + useEffect ----------

function ManualCounter({value, defaultValue = 0, onChange}) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  useEffect(() => {
    if (isControlled) setInternal(value);
  }, [value, isControlled]);

  const click = () => {
    const next = current + 1;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return createElement(
    'div',
    null,
    createElement('span', null, current),
    createElement('button', {onClick: click}, '+1')
  );
}

// ---------- radix: useControllableState ----------

function RadixCounter({value, defaultValue = 0, onChange}) {
  const [current, setCurrent] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange
  });

  return createElement(
    'div',
    null,
    createElement('span', null, current),
    createElement('button', {onClick: () => setCurrent(current + 1)}, '+1')
  );
}

// ---------- control: react-use-control ----------

function ControlCounter({value}) {
  const [current, setCurrent] = useControl(value, 0);

  return createElement(
    'div',
    null,
    createElement('span', null, current),
    createElement('button', {onClick: () => setCurrent((v) => v + 1)}, '+1')
  );
}

/** Parent that owns a control and exposes its setter (for controlled updates). */
function ControlHost({api}) {
  const [, setValue, control] = useControl(0);
  api.set = setValue;
  return createElement(ControlCounter, {value: control});
}

afterEach(cleanup);

describe(`mount (uncontrolled, ×${WORK})`, () => {
  bench(
    'manual',
    () => {
      for (let i = 0; i < WORK; i++) {
        const {unmount} = render(createElement(ManualCounter));
        unmount();
      }
    },
    {iterations: SAMPLES}
  );

  bench(
    'radix',
    () => {
      for (let i = 0; i < WORK; i++) {
        const {unmount} = render(createElement(RadixCounter));
        unmount();
      }
    },
    {iterations: SAMPLES}
  );

  bench(
    'react-use-control',
    () => {
      for (let i = 0; i < WORK; i++) {
        const {unmount} = render(createElement(ControlCounter));
        unmount();
      }
    },
    {iterations: SAMPLES}
  );
});

describe(`controlled prop update (parent-driven, ×${WORK})`, () => {
  bench(
    'manual',
    () => {
      const {rerender, unmount} = render(
        createElement(ManualCounter, {value: 0})
      );
      for (let i = 1; i <= WORK; i++) {
        rerender(createElement(ManualCounter, {value: i}));
      }
      unmount();
    },
    {iterations: SAMPLES}
  );

  bench(
    'radix',
    () => {
      const {rerender, unmount} = render(
        createElement(RadixCounter, {value: 0})
      );
      for (let i = 1; i <= WORK; i++) {
        rerender(createElement(RadixCounter, {value: i}));
      }
      unmount();
    },
    {iterations: SAMPLES}
  );

  bench(
    'react-use-control',
    () => {
      const api = {};
      const {unmount} = render(createElement(ControlHost, {api}));
      for (let i = 1; i <= WORK; i++) {
        act(() => api.set?.(i));
      }
      unmount();
    },
    {iterations: SAMPLES}
  );
});

describe(`setter update (child-driven click, ×${WORK})`, () => {
  bench(
    'manual',
    () => {
      const {container, unmount} = render(createElement(ManualCounter));
      const button = container.querySelector('button');
      for (let i = 0; i < WORK; i++) {
        act(() => button.click());
      }
      unmount();
    },
    {iterations: SAMPLES}
  );

  bench(
    'radix',
    () => {
      const {container, unmount} = render(createElement(RadixCounter));
      const button = container.querySelector('button');
      for (let i = 0; i < WORK; i++) {
        act(() => button.click());
      }
      unmount();
    },
    {iterations: SAMPLES}
  );

  bench(
    'react-use-control',
    () => {
      const {container, unmount} = render(createElement(ControlCounter));
      const button = container.querySelector('button');
      for (let i = 0; i < WORK; i++) {
        act(() => button.click());
      }
      unmount();
    },
    {iterations: SAMPLES}
  );
});
