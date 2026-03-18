import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl} from '../src/control';

describe('useCallback closure — control identity stabilization (by design)', () => {
  it('control identity stabilizes after the first state change', () => {
    // useCallback(fn, []) captures `ctrl` from the first render (call it A).
    //
    // Timeline:
    // Render 1: ctrl = A, useCallback captures A, ref.current = A
    // setValue(1) → oldControls.add(A)
    // Render 2: oldControls.has(A) → true → ref.current = B (new ctrl)
    //           useCallback returns cached fn (still references A)
    // setValue(2) → oldControls.add(A) (A already in WeakSet, harmless no-op)
    // Render 3: oldControls.has(B) → false → ref.current stays B
    //
    // Result: control identity changes once (A → B), then stabilizes at B.
    //
    // This is BY DESIGN, not a bug:
    // - State values always update correctly (React's useState drives re-renders)
    // - The initial identity change (A → B) ensures the first update propagates
    // - Subsequent renders reuse B, which is efficient (no unnecessary object churn)
    // - For React.memo consumers, `controlEqual` compares state VALUES inside
    //   control objects, not control identity — so memo works correctly regardless
    // - This is part of the API contract: use `controlEqual` with `React.memo`

    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      return {value, setValue, control};
    });

    const firstControl = result.current.control;

    // First state change: control identity updates (A → B)
    act(() => {
      result.current.setValue(1);
    });

    const secondControl = result.current.control;
    expect(secondControl).not.toBe(firstControl);

    // Subsequent state changes: control identity stays stable at B
    act(() => {
      result.current.setValue(2);
    });

    const thirdControl = result.current.control;
    expect(thirdControl).toBe(secondControl);

    // State values are always correct — this is what matters
    expect(result.current.value).toBe(2);
  });

  it('controlled child setValue works correctly across all renders', () => {
    const {result: parent, rerender: rerenderParent} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      return {value, setValue, control};
    });

    const {result: child, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parent.current.control, 999);
      return {value, setValue};
    });

    for (let i = 1; i <= 5; i++) {
      act(() => {
        child.current.setValue(i);
      });
      rerenderParent();
      rerenderChild();

      expect(child.current.value).toBe(i);
      expect(parent.current.value).toBe(i);
    }
  });
});

describe('module-level WeakSet — cross-root behavior', () => {
  it('independent useControl roots do not interfere via shared WeakSet', () => {
    const {result: rootA, rerender: rerenderA} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 'a');
      return {value, setValue, control};
    });

    const {result: rootB, rerender: rerenderB} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 'b');
      return {value, setValue, control};
    });

    act(() => {
      rootA.current.setValue('a2');
    });
    rerenderA();

    expect(rootB.current.value).toBe('b');

    act(() => {
      rootB.current.setValue('b2');
    });
    rerenderB();

    expect(rootA.current.value).toBe('a2');
  });

  it('rapid alternating updates between two roots sharing the WeakSet', () => {
    const {result: rootA, rerender: rerenderA} = renderHook(() => {
      const [value, setValue] = useControl(null, 0);
      return {value, setValue};
    });

    const {result: rootB, rerender: rerenderB} = renderHook(() => {
      const [value, setValue] = useControl(null, 100);
      return {value, setValue};
    });

    for (let i = 0; i < 10; i++) {
      act(() => {
        rootA.current.setValue((v) => v + 1);
      });
      act(() => {
        rootB.current.setValue((v) => v - 1);
      });
      rerenderA();
      rerenderB();
    }

    expect(rootA.current.value).toBe(10);
    expect(rootB.current.value).toBe(90);
  });
});
