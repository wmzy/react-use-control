import React from 'react';
import {describe, it, expect} from 'vitest';
import {render, renderHook, act, screen} from '@testing-library/react';
import {useControl, useThru} from '../src/control';
import {mapSetter} from '../src/transform';

const strictWrapper = ({children}) =>
  React.createElement(React.StrictMode, null, children);

describe('Strict Mode — double invocation', () => {
  it('useControl works correctly under StrictMode', () => {
    const {result} = renderHook(
      () => {
        const [value, setValue, control] = useControl(undefined, 0);
        return {value, setValue, control};
      },
      {wrapper: strictWrapper}
    );

    expect(result.current.value).toBe(0);

    act(() => {
      result.current.setValue(1);
    });
    expect(result.current.value).toBe(1);

    act(() => {
      result.current.setValue((v) => v + 1);
    });
    expect(result.current.value).toBe(2);
  });

  it('controlled child works under StrictMode', () => {
    const {result: parent} = renderHook(
      () => {
        const [value, setValue, control] = useControl(undefined, 10);
        return {value, setValue, control};
      },
      {wrapper: strictWrapper}
    );

    const {result: child, rerender: rerenderChild} = renderHook(
      () => {
        const [value, setValue] = useControl(parent.current.control, 999);
        return {value, setValue};
      },
      {wrapper: strictWrapper}
    );

    expect(child.current.value).toBe(10);

    act(() => {
      child.current.setValue(20);
    });
    rerenderChild();

    expect(child.current.value).toBe(20);
    expect(parent.current.value).toBe(20);
  });

  it('useThru works correctly under StrictMode', () => {
    const {result, rerender} = renderHook(
      () => {
        const [value, setValue, control] = useControl(undefined, 0);
        const thru = useThru(
          control,
          mapSetter((v) => v * 2)
        );
        return {value, setValue, thru};
      },
      {wrapper: strictWrapper}
    );

    const {result: child, rerender: rerenderChild} = renderHook(
      () => {
        const [value, setValue] = useControl(result.current.thru, 0);
        return {value, setValue};
      },
      {wrapper: strictWrapper}
    );

    expect(child.current.value).toBe(0);

    act(() => {
      child.current.setValue(5);
    });
    rerender();
    rerenderChild();

    expect(child.current.value).toBe(10);
    expect(result.current.value).toBe(10);
  });

  it('multiple state updates under StrictMode', () => {
    const {result} = renderHook(
      () => {
        const [value, setValue] = useControl(undefined, 0);
        return {value, setValue};
      },
      {wrapper: strictWrapper}
    );

    for (let i = 1; i <= 5; i++) {
      act(() => {
        result.current.setValue(i);
      });
      expect(result.current.value).toBe(i);
    }
  });
});

describe('Concurrent mode — sibling consistency', () => {
  it('siblings sharing a control see consistent state in the same render', () => {
    const snapshots = [];

    function Child({control, label}) {
      const [value] = useControl(control, 0);
      snapshots.push({label, value});
      return React.createElement('span', {'data-testid': label}, value);
    }

    function Parent() {
      const [value, setValue, control] = useControl(undefined, 0);
      return React.createElement(
        React.StrictMode,
        null,
        React.createElement(Child, {control, label: 'a'}),
        React.createElement(Child, {control, label: 'b'}),
        React.createElement(
          'button',
          {'data-testid': 'inc', onClick: () => setValue((v) => v + 1)},
          'inc'
        )
      );
    }

    const {unmount} = render(React.createElement(Parent));

    snapshots.length = 0;
    act(() => {
      screen.getByTestId('inc').click();
    });

    const aValues = snapshots
      .filter((s) => s.label === 'a')
      .map((s) => s.value);
    const bValues = snapshots
      .filter((s) => s.label === 'b')
      .map((s) => s.value);

    // Both siblings should see the same value in every render pass
    aValues.forEach((v, i) => {
      expect(v).toBe(bValues[i]);
    });

    expect(screen.getByTestId('a').textContent).toBe('1');
    expect(screen.getByTestId('b').textContent).toBe('1');

    unmount();
  });

  it('rapid updates maintain consistency between parent and children', () => {
    function Child({control}) {
      const [value, setValue] = useControl(control, 0);
      return React.createElement(
        'div',
        null,
        React.createElement('span', {'data-testid': 'child-val'}, value),
        React.createElement(
          'button',
          {'data-testid': 'child-inc', onClick: () => setValue((v) => v + 1)},
          '+'
        )
      );
    }

    function Parent() {
      const [value, setValue, control] = useControl(undefined, 0);
      return React.createElement(
        React.StrictMode,
        null,
        React.createElement('span', {'data-testid': 'parent-val'}, value),
        React.createElement(Child, {control}),
        React.createElement(
          'button',
          {'data-testid': 'parent-inc', onClick: () => setValue((v) => v + 1)},
          '+'
        )
      );
    }

    const {unmount} = render(React.createElement(Parent));

    for (let i = 0; i < 10; i++) {
      act(() => {
        screen.getByTestId(i % 2 === 0 ? 'child-inc' : 'parent-inc').click();
      });
    }

    const parentVal = screen.getByTestId('parent-val').textContent;
    const childVal = screen.getByTestId('child-val').textContent;
    expect(parentVal).toBe('10');
    expect(childVal).toBe('10');

    unmount();
  });
});
