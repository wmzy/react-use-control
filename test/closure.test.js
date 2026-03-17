import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl} from '../src/control';

describe('useCallback closure — stale ctrl reference', () => {
  it('wrappedSetValue captures the ctrl from first render, not current render', () => {
    // useCallback(fn, []) means the closure captures `ctrl` from the initial render.
    // On subsequent renders where state changes, useNewControl creates a new ctrl object,
    // but wrappedSetValue still references the old one via closure.
    //
    // This means `oldControls.add(ctrl)` inside wrappedSetValue adds the *first-render* ctrl,
    // not the *current-render* ctrl.
    //
    // It still works because:
    // 1. After first setValue, the first-render ctrl is added to oldControls
    // 2. On next render, useNewControl checks `oldControls.has(ref.current)` — ref.current
    //    is the *previous* ctrl (which was the first-render ctrl), so it matches
    // 3. A new ctrl is created for the new render
    //
    // However, on the *third* setValue, the closure still adds the *first-render* ctrl
    // to oldControls (which is already there), while ref.current is now the *second* ctrl.
    // Since the second ctrl was never added to oldControls, `oldControls.has(ref.current)`
    // returns false, and the control reference is NOT refreshed.
    //
    // This means: after the first state change, control identity changes. After subsequent
    // changes, it may NOT change — the dirty tracking only works for the first transition.
    // This is a known limitation of the stale closure.

    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      return {value, setValue, control};
    });

    const firstControl = result.current.control;

    // First state change: control identity changes
    act(() => {
      result.current.setValue(1);
    });

    const secondControl = result.current.control;
    expect(secondControl).not.toBe(firstControl);

    // Second state change: control identity does NOT change because wrappedSetValue's
    // closure still adds the first-render ctrl to oldControls, not the second one.
    // oldControls.has(secondControl) is false, so ref.current stays the same.
    act(() => {
      result.current.setValue(2);
    });

    const thirdControl = result.current.control;
    expect(thirdControl).toBe(secondControl); // ← stale closure effect

    // State updates still work correctly despite the stale closure
    expect(result.current.value).toBe(2);
  });

  it('controlled child setValue still works after multiple parent re-renders', () => {
    const {result: parent, rerender: rerenderParent} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      return {value, setValue, control};
    });

    const {result: child, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parent.current.control, 999);
      return {value, setValue};
    });

    // Multiple rounds of state changes from child
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
    // oldControls is a module-level WeakSet shared across all useControl instances.
    // This test verifies that two independent roots don't interfere with each other.

    const {result: rootA, rerender: rerenderA} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 'a');
      return {value, setValue, control};
    });

    const {result: rootB, rerender: rerenderB} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 'b');
      return {value, setValue, control};
    });

    // Mutate A
    act(() => {
      rootA.current.setValue('a2');
    });
    rerenderA();

    // B should be unaffected
    expect(rootB.current.value).toBe('b');

    // Mutate B
    act(() => {
      rootB.current.setValue('b2');
    });
    rerenderB();

    // A should still hold its value
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
