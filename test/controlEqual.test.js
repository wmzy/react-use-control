import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru, controlEqual} from '../src/control';
import {mapSetter} from '../src/transform';

describe('controlEqual', () => {
  it('should return true when control state values are the same', () => {
    const {result} = renderHook(() => {
      const [, , control] = useControl(undefined, 42);
      return control;
    });

    expect(controlEqual({count: result.current}, {count: result.current})).toBe(
      true
    );
  });

  it('should return false when control state values differ', () => {
    const {result: a} = renderHook(() => {
      const [, , control] = useControl(undefined, 1);
      return control;
    });

    const {result: b} = renderHook(() => {
      const [, , control] = useControl(undefined, 2);
      return control;
    });

    expect(controlEqual({count: a.current}, {count: b.current})).toBe(false);
  });

  it('should detect state change across renders even when control ref is stale', () => {
    const {result} = renderHook(() => {
      const [, setValue, control] = useControl(undefined, 0);
      return {setValue, control};
    });

    const prevProps = {count: result.current.control};

    act(() => {
      result.current.setValue(1);
    });

    // control reference may or may not change, but controlEqual
    // compares the state value inside, which DID change
    const nextProps = {count: result.current.control};
    expect(controlEqual(prevProps, nextProps)).toBe(false);
  });

  it('should compare non-control props with Object.is', () => {
    expect(controlEqual({name: 'a', x: 1}, {name: 'a', x: 1})).toBe(true);
    expect(controlEqual({name: 'a'}, {name: 'b'})).toBe(false);
  });

  it('should return false when prop count differs', () => {
    expect(controlEqual({a: 1}, {a: 1, b: 2})).toBe(false);
    expect(controlEqual({a: 1, b: 2}, {a: 1})).toBe(false);
  });

  it('should handle mixed control and non-control props', () => {
    const {result} = renderHook(() => {
      const [, , control] = useControl(undefined, 10);
      return control;
    });

    expect(
      controlEqual(
        {count: result.current, label: 'hi'},
        {count: result.current, label: 'hi'}
      )
    ).toBe(true);

    expect(
      controlEqual(
        {count: result.current, label: 'hi'},
        {count: result.current, label: 'bye'}
      )
    ).toBe(false);
  });

  it('setter from useControl (wrappedSetValue) is referentially stable across renders', () => {
    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 0);
      return {value, setValue, control};
    });

    const setter1 = result.current.setValue;

    act(() => {
      result.current.setValue(1);
    });

    const setter2 = result.current.setValue;
    expect(setter2).toBe(setter1);

    act(() => {
      result.current.setValue(2);
    });

    const setter3 = result.current.setValue;
    expect(setter3).toBe(setter1);
  });

  it('setter from useThru + mapSetter changes reference each render but controlEqual still works', () => {
    const {result: parent} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 0);
      return {value, setValue, control};
    });

    const {result: child, rerender} = renderHook(() => {
      const thruControl = useThru(
        parent.current.control,
        mapSetter((v) => v * 2)
      );
      const state =
        thruControl.state || Object.getPrototypeOf(thruControl).state;
      return {control: thruControl, setter: state[1]};
    });

    const setter1 = child.current.setter;

    act(() => {
      parent.current.setValue(1);
    });
    rerender();

    const setter2 = child.current.setter;
    // mapSetter creates a new wrapper function each render
    expect(setter2).not.toBe(setter1);

    // but controlEqual only compares state values, not setters — this is correct
    // because setter identity change doesn't affect UI output
    const prevProps = {count: child.current.control};
    act(() => {
      parent.current.setValue(1); // same value
    });
    rerender();
    const nextProps = {count: child.current.control};
    expect(controlEqual(prevProps, nextProps)).toBe(true);
  });
});
