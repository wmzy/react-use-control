import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl} from '../src/control';

describe('useCallback closure — stale ctrl in oldControls tracking', () => {
  it('control identity only updates on the first state change, not subsequent ones', () => {
    // The root cause: useCallback(fn, []) captures `ctrl` from the first render.
    //
    // For an uncontrolled root, the useCallback branch (line 56-63) only executes on
    // the first render. On subsequent renders, useControl early-returns at line 54
    // because `Object.getPrototypeOf(ctrl).state` is truthy (for controlled children)
    // — but for the ROOT, the prototype is `base` which has no `state`.
    // So the root DOES re-execute useCallback's branch on every render... except
    // useCallback(fn, []) returns the same cached function, so the closure is stale.
    //
    // Timeline:
    // Render 1: ctrl = A, useCallback captures A, ref.current = A
    // setValue(1) → oldControls.add(A)
    // Render 2: oldControls.has(A) → true → ref.current = B (new ctrl)
    //           useCallback returns cached fn (still captures A)
    // setValue(2) → oldControls.add(A) (A is already there, B is never added)
    // Render 3: oldControls.has(B) → false → ref.current stays B
    //
    // Result: control identity changes after the 1st setValue but NOT after the 2nd.
    // This means React.memo children won't re-render on the 2nd+ state changes
    // if they only depend on control identity.
    //
    // However, state VALUES still update correctly because React's useState
    // triggers re-renders regardless of control identity.

    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      return {value, setValue, control};
    });

    const firstControl = result.current.control;

    // First state change: control identity DOES change
    act(() => {
      result.current.setValue(1);
    });

    const secondControl = result.current.control;
    expect(secondControl).not.toBe(firstControl);

    // Second state change: control identity does NOT change (stale closure effect)
    act(() => {
      result.current.setValue(2);
    });

    const thirdControl = result.current.control;
    expect(thirdControl).toBe(secondControl);

    // State values are still correct
    expect(result.current.value).toBe(2);
  });

  it('controlled child setValue works correctly despite stale closure in parent', () => {
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
