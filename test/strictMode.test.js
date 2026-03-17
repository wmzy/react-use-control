import React from 'react';
import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru} from '../src/control';
import {mapSetter} from '../src/transform';

const strictWrapper = ({children}) =>
  React.createElement(React.StrictMode, null, children);

describe('Strict Mode — double invocation', () => {
  it('useControl works correctly under StrictMode', () => {
    const {result} = renderHook(
      () => {
        const [value, setValue, control] = useControl(null, 0);
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
        const [value, setValue, control] = useControl(null, 10);
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
        const [value, setValue, control] = useControl(null, 0);
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
        const [value, setValue] = useControl(null, 0);
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
