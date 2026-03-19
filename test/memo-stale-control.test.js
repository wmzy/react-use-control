import React from 'react';
import {describe, it, expect} from 'vitest';
import {render, act, screen} from '@testing-library/react';
import {useControl} from '../src/control';

describe('React.memo — control ref updates on every state change', () => {
  it('child UI should update on every click', () => {
    const MemoChild = React.memo(function MemoChild({count}) {
      const [num, setNum] = useControl(count, 0);
      return React.createElement(
        'div',
        null,
        React.createElement('span', {'data-testid': 'value'}, String(num)),
        React.createElement(
          'button',
          {'data-testid': 'inc', onClick: () => setNum((n) => n + 1)},
          '+1'
        )
      );
    });

    function Parent() {
      const [, , control] = useControl(0);
      return React.createElement(MemoChild, {count: control});
    }

    const {unmount} = render(React.createElement(Parent));

    expect(screen.getByTestId('value').textContent).toBe('0');

    act(() => {
      screen.getByTestId('inc').click();
    });
    expect(screen.getByTestId('value').textContent).toBe('1');

    act(() => {
      screen.getByTestId('inc').click();
    });
    expect(screen.getByTestId('value').textContent).toBe('2');

    act(() => {
      screen.getByTestId('inc').click();
    });
    expect(screen.getByTestId('value').textContent).toBe('3');

    unmount();
  });

  it('parent-triggered re-render should not cause unnecessary child re-renders', () => {
    const childRenderCount = {current: 0};

    const MemoChild = React.memo(function MemoChild({count}) {
      childRenderCount.current++;
      const [num, setNum] = useControl(count, 0);
      return React.createElement(
        'div',
        null,
        React.createElement('span', {'data-testid': 'child-val'}, String(num)),
        React.createElement(
          'button',
          {'data-testid': 'child-inc', onClick: () => setNum((n) => n + 1)},
          '+1'
        )
      );
    });

    function Parent() {
      const [value, , control] = useControl(0);
      const [tick, setTick] = React.useState(0);
      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          {'data-testid': 'parent-val'},
          String(value)
        ),
        React.createElement('span', {'data-testid': 'tick'}, String(tick)),
        React.createElement(
          'button',
          {'data-testid': 'rerender', onClick: () => setTick((t) => t + 1)},
          'Re-render Parent'
        ),
        React.createElement(MemoChild, {count: control})
      );
    }

    const {unmount} = render(React.createElement(Parent));

    act(() => {
      screen.getByTestId('child-inc').click();
    });
    act(() => {
      screen.getByTestId('child-inc').click();
    });

    const rendersBeforeRerender = childRenderCount.current;
    act(() => {
      screen.getByTestId('rerender').click();
    });
    expect(childRenderCount.current).toBe(rendersBeforeRerender);

    act(() => {
      screen.getByTestId('child-inc').click();
    });
    expect(screen.getByTestId('child-val').textContent).toBe('3');
    expect(screen.getByTestId('parent-val').textContent).toBe('3');

    unmount();
  });
});
