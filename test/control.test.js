import {describe, it, expect, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru, isControl} from '../src/control';
import {mapSetter} from '../src/transform';

describe('useControl — multi-level nesting', () => {
  it('should propagate state through 3 levels', () => {
    const {result: grandparent} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 10);
      return {value, setValue, control};
    });

    const {result: parent, rerender: rerenderParent} = renderHook(() => {
      const [value, setValue, control] = useControl(
        grandparent.current.control,
        999
      );
      return {value, setValue, control};
    });

    const {result: child, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parent.current.control, 999);
      return {value, setValue};
    });

    expect(grandparent.current.value).toBe(10);
    expect(parent.current.value).toBe(10);
    expect(child.current.value).toBe(10);

    act(() => {
      child.current.setValue(20);
    });
    rerenderParent();
    rerenderChild();

    expect(child.current.value).toBe(20);
    expect(grandparent.current.value).toBe(20);
  });
});

describe('useControl — initial as function', () => {
  it('should accept a lazy initializer', () => {
    const initializer = vi.fn(() => 42);

    const {result} = renderHook(() => {
      const [value] = useControl(null, initializer);
      return value;
    });

    expect(result.current).toBe(42);
    expect(initializer).toHaveBeenCalledOnce();
  });

  it('should ignore initializer when controlled', () => {
    const initializer = vi.fn(() => 999);

    const {result: parentResult} = renderHook(() => {
      const [, , control] = useControl(null, 5);
      return control;
    });

    const {result: childResult} = renderHook(() => {
      const [value] = useControl(parentResult.current, initializer);
      return value;
    });

    expect(childResult.current).toBe(5);
    expect(initializer).not.toHaveBeenCalled();
  });
});

describe('useControl — Object.is semantics', () => {
  it('should not trigger re-render when setting same value', () => {
    let renderCount = 0;

    const {result} = renderHook(() => {
      renderCount++;
      const [value, setValue] = useControl(null, 0);
      return {value, setValue};
    });

    const countBefore = renderCount;

    act(() => {
      result.current.setValue(0);
    });

    expect(renderCount).toBe(countBefore);
    expect(result.current.value).toBe(0);
  });

  it('should distinguish NaN from NaN (Object.is)', () => {
    const {result} = renderHook(() => {
      const [value, setValue] = useControl(null, NaN);
      return {value, setValue};
    });

    const renderCountBefore = result.current.value;

    act(() => {
      result.current.setValue(NaN);
    });

    expect(result.current.value).toBeNaN();
  });
});

describe('useThru — chained transforms', () => {
  it('should compose multiple useThru in sequence', () => {
    // Chain: root → useThru(+10) → useThru(*2) → child
    // When child calls setValue(5): 5 → *2 → 10 → +10 → 20
    const {result, rerender} = renderHook(() => {
      const [value, setValue, control] = useControl(null, 0);
      const mid = useThru(
        control,
        mapSetter((v) => v + 10)
      );
      const leaf = useThru(
        mid,
        mapSetter((v) => v * 2)
      );
      return {value, setValue, leaf};
    });

    const {result: child, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(result.current.leaf, 0);
      return {value, setValue};
    });

    expect(child.current.value).toBe(0);

    act(() => {
      child.current.setValue(5);
    });
    rerender();
    rerenderChild();

    // setValue(5) → mapSetter(v * 2) → 10 → mapSetter(v + 10) → 20
    expect(child.current.value).toBe(20);
    expect(result.current.value).toBe(20);
  });
});

describe('useControl — setter with updater function', () => {
  it('should support functional updates', () => {
    const {result} = renderHook(() => {
      const [value, setValue] = useControl(null, 0);
      return {value, setValue};
    });

    act(() => {
      result.current.setValue((prev) => prev + 1);
      result.current.setValue((prev) => prev + 1);
      result.current.setValue((prev) => prev + 1);
    });

    expect(result.current.value).toBe(3);
  });
});

describe('useControl — uncontrolled siblings are independent', () => {
  it('should not share state between uncontrolled instances', () => {
    const {result: a} = renderHook(() => {
      const [value, setValue] = useControl(null, 0);
      return {value, setValue};
    });

    const {result: b} = renderHook(() => {
      const [value, setValue] = useControl(null, 0);
      return {value, setValue};
    });

    act(() => {
      a.current.setValue(100);
    });

    expect(a.current.value).toBe(100);
    expect(b.current.value).toBe(0);
  });
});
