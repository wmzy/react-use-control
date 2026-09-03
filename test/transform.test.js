import React from 'react';
import {describe, it, expect, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru} from '../src/control';
import {mapState, mapSetter, watch} from '../src/transform';

const strictWrapper = ({children}) =>
  React.createElement(React.StrictMode, null, children);

describe('mapState', () => {
  it('should transform the state value read by children', () => {
    const {result: parentResult} = renderHook(() => {
      const control = useThru(
        undefined,
        mapState((v) => v * 100)
      );
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 5);
      return {value, setValue};
    });

    expect(childResult.current.value).toBe(500);
  });

  it('should not affect the setter', () => {
    const {result: parentResult} = renderHook(() => {
      const control = useThru(
        undefined,
        mapState((v) => v * 10)
      );
      return {control};
    });

    const {result: childResult, rerender} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 3);
      return {value, setValue};
    });

    expect(childResult.current.value).toBe(30);

    act(() => {
      childResult.current.setValue(7);
    });
    rerender();

    expect(childResult.current.value).toBe(70);
  });
});

describe('mapSetter', () => {
  it('should transform the value before setState', () => {
    const {result: parentResult} = renderHook(() => {
      const control = useThru(
        undefined,
        mapSetter((v) => v * 2)
      );
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 1);
      return {value, setValue};
    });

    expect(childResult.current.value).toBe(1);

    act(() => {
      childResult.current.setValue(5);
    });

    expect(childResult.current.value).toBe(10);
  });

  it('should transform the value when setter receives a function', () => {
    const {result: parentResult} = renderHook(() => {
      const control = useThru(
        undefined,
        mapSetter((v) => Math.max(0, v))
      );
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 5);
      return {value, setValue};
    });

    act(() => {
      childResult.current.setValue((prev) => prev - 100);
    });

    expect(childResult.current.value).toBe(0);
  });
});

describe('watch', () => {
  it('should call onChange on state changes', () => {
    const onChange = vi.fn();

    const {result: parentResult} = renderHook(() => {
      const control = useThru(undefined, watch(onChange));
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 0);
      return {value, setValue};
    });

    act(() => {
      childResult.current.setValue(42);
    });

    expect(onChange).toHaveBeenCalledWith(42);
    expect(childResult.current.value).toBe(42);
  });

  it('should not alter the value', () => {
    const onChange = vi.fn();

    const {result: parentResult} = renderHook(() => {
      const control = useThru(undefined, watch(onChange));
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 0);
      return {value, setValue};
    });

    act(() => {
      childResult.current.setValue(99);
    });

    expect(childResult.current.value).toBe(99);
    expect(onChange).toHaveBeenCalledWith(99);
  });
});

describe('useThru — interceptor should not stack on re-renders', () => {
  it('mapSetter should not stack across re-renders', () => {
    const sideEffect = vi.fn();

    const {result: parentResult, rerender: rerenderParent} = renderHook(() => {
      const control = useThru(
        undefined,
        mapSetter((v) => {
          sideEffect(v);
          return v;
        })
      );
      return {control};
    });

    const {result: childResult, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 0);
      return {value, setValue};
    });

    rerenderParent();
    rerenderChild();
    sideEffect.mockClear();

    act(() => {
      childResult.current.setValue(1);
    });

    expect(childResult.current.value).toBe(1);
    expect(sideEffect).toHaveBeenCalledTimes(1);
  });

  it('watch onChange should fire exactly once per setValue after re-renders', () => {
    const onChange = vi.fn();

    const {result: parentResult, rerender: rerenderParent} = renderHook(() => {
      const control = useThru(undefined, watch(onChange));
      return {control};
    });

    const {result: childResult, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parentResult.current.control, 0);
      return {value, setValue};
    });

    rerenderParent();
    rerenderChild();
    onChange.mockClear();

    act(() => {
      childResult.current.setValue(42);
    });

    expect(childResult.current.value).toBe(42);
    expect(onChange).toHaveBeenCalledWith(42);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('watch — StrictMode behavior', () => {
  it('watch with direct value: onChange called with correct value under StrictMode', () => {
    const onChange = vi.fn();

    const {result: parentResult} = renderHook(
      () => {
        const control = useThru(undefined, watch(onChange));
        return {control};
      },
      {wrapper: strictWrapper}
    );

    const {result: childResult} = renderHook(
      () => {
        const [value, setValue] = useControl(parentResult.current.control, 0);
        return {value, setValue};
      },
      {wrapper: strictWrapper}
    );

    onChange.mockClear();

    act(() => {
      childResult.current.setValue(42);
    });

    expect(childResult.current.value).toBe(42);
    expect(onChange).toHaveBeenCalledWith(42);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('watch with updater function: onChange called with correct value under StrictMode', () => {
    const onChange = vi.fn();

    const {result: parentResult} = renderHook(
      () => {
        const control = useThru(undefined, watch(onChange));
        return {control};
      },
      {wrapper: strictWrapper}
    );

    const {result: childResult} = renderHook(
      () => {
        const [value, setValue] = useControl(parentResult.current.control, 0);
        return {value, setValue};
      },
      {wrapper: strictWrapper}
    );

    onChange.mockClear();

    act(() => {
      childResult.current.setValue((prev) => prev + 10);
    });

    expect(childResult.current.value).toBe(10);
    expect(onChange).toHaveBeenCalledWith(10);
    // the updater handed to setState stays pure — StrictMode double-invokes
    // it without duplicating the side effect
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('watch — side effect outside the updater', () => {
  it('onChange fires exactly once even when the updater is double-invoked', () => {
    const onChange = vi.fn();
    const rawSetState = vi.fn();
    const [, watchedSet] = watch(onChange)([5, rawSetState]);

    watchedSet((prev) => prev + 10);

    // React may double-invoke the updater it received (StrictMode,
    // interrupted renders) — the updater must stay pure
    const updater = rawSetState.mock.calls[0][0];
    expect(typeof updater).toBe('function');
    updater(5);
    updater(5);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('onChange receives the projected value for functional updates', () => {
    const onChange = vi.fn();
    const rawSetState = vi.fn();
    const [state, watchedSet] = watch(onChange)([5, rawSetState]);
    expect(state).toBe(5);

    watchedSet((prev) => prev * 2);

    expect(rawSetState).toHaveBeenCalledTimes(1);
    // the action passes through untouched — transforms stay lazy
    expect(rawSetState.mock.calls[0][0]).toBeTypeOf('function');
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('watch above mapSetter: onChange sees the caller-facing value, transform still applies', () => {
    const onChange = vi.fn();
    const rawSetState = vi.fn((action) =>
      typeof action === 'function' ? action(0) : action
    );
    // watch layered above mapSetter, like the README composition
    const interceptor = (state) =>
      watch(onChange)(mapSetter((v) => v * 2)(state));
    const [, outerSet] = interceptor([0, rawSetState]);

    outerSet(21);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(21);
    // the raw state still receives the transformed value
    expect(rawSetState).toHaveLastReturnedWith(42);
  });
});
