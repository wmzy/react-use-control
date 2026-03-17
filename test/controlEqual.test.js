import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, controlEqual} from '../src/control';

describe('controlEqual', () => {
  it('should return true when control state values are the same', () => {
    const {result} = renderHook(() => {
      const [, , control] = useControl(null, 42);
      return control;
    });

    expect(controlEqual({count: result.current}, {count: result.current})).toBe(
      true
    );
  });

  it('should return false when control state values differ', () => {
    const {result: a} = renderHook(() => {
      const [, , control] = useControl(null, 1);
      return control;
    });

    const {result: b} = renderHook(() => {
      const [, , control] = useControl(null, 2);
      return control;
    });

    expect(controlEqual({count: a.current}, {count: b.current})).toBe(false);
  });

  it('should detect state change across renders even when control ref is stale', () => {
    const {result} = renderHook(() => {
      const [, setValue, control] = useControl(null, 0);
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
      const [, , control] = useControl(null, 10);
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
});
