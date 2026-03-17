import {describe, it, expect, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru, isControl} from '../src';

describe('useControl', () => {
  it('should reuse count state', () => {
    const {result, rerender} = renderHook(() => {
      const [count, setCount, control] = useControl(null, 0);
      return {control, count, setCount};
    });
    expect(result.current.count).toBe(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [count, setCount] = useControl(result.current.control, 1);
      return {count, setCount};
    });

    expect(childResult.current.count).toBe(0);

    act(() => {
      result.current.setCount(2);
    });

    expect(result.current.count).toBe(2);

    childRerender();
    expect(childResult.current.count).toBe(2);

    act(() => {
      childResult.current.setCount(3);
    });
    rerender();
    childRerender();

    expect(childResult.current.count).toBe(3);
    expect(result.current.count).toBe(3);
  });
});

describe('useThru', () => {
  it('should support transforms', () => {
    const {result} = renderHook(() => {
      const control = useThru(undefined, ([count, setCount]) => [
        count,
        (c) =>
          typeof c === 'function'
            ? setCount((cc) => c(cc) * 2)
            : setCount(c * 2)
      ]);
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [count, setCount] = useControl(result.current.control, 1);
      return {count, setCount};
    });

    expect(childResult.current.count).toBe(1);

    act(() => {
      childResult.current.setCount(2);
    });

    expect(childResult.current.count).toBe(4);
  });
});

describe('isControl', () => {
  it('should support isControl', () => {
    expect(isControl({})).toBe(false);
    const {result} = renderHook(() => {
      const [, , control] = useControl(undefined);
      return control;
    });

    expect(isControl(result.current)).toBe(true);
  });
});

describe('dev check', () => {
  it('should throw if not same control', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const {rerender} = renderHook(({useControl1 = true} = {}) => {
      const [, , ctrl1] = useControl(undefined);
      const [, , ctrl2] = useControl(undefined);
      useControl(useControl1 ? ctrl1 : ctrl2);
    });

    rerender();

    expect(() => rerender({useControl1: false})).toThrow(
      /Should not call with different control/
    );

    spy.mockRestore();
  });
});
