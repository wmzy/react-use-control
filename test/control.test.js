import {describe, it, expect, vi} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl, useThru, isControl} from '../src/control';
import {mapSetter} from '../src/transform';

describe('useControl — multi-level nesting', () => {
  it('should propagate state through 3 levels', () => {
    const {result: grandparent} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 10);
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
      const [value] = useControl(undefined, initializer);
      return value;
    });

    expect(result.current).toBe(42);
    expect(initializer).toHaveBeenCalledOnce();
  });

  it('should ignore initializer when controlled', () => {
    const initializer = vi.fn(() => 999);

    const {result: parentResult} = renderHook(() => {
      const [, , control] = useControl(undefined, 5);
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
      const [value, setValue] = useControl(undefined, 0);
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
      const [value, setValue] = useControl(undefined, NaN);
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
      const [value, setValue, control] = useControl(undefined, 0);
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
      const [value, setValue] = useControl(undefined, 0);
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
      const [value, setValue] = useControl(undefined, 0);
      return {value, setValue};
    });

    const {result: b} = renderHook(() => {
      const [value, setValue] = useControl(undefined, 0);
      return {value, setValue};
    });

    act(() => {
      a.current.setValue(100);
    });

    expect(a.current.value).toBe(100);
    expect(b.current.value).toBe(0);
  });
});

describe('useControl — single argument as initial value', () => {
  it('should use the first argument as initial when it is not a control', () => {
    const {result} = renderHook(() => {
      const [value, setValue] = useControl(42);
      return {value, setValue};
    });

    expect(result.current.value).toBe(42);
  });

  it('should accept a lazy initializer as the first argument', () => {
    const initializer = vi.fn(() => 'hello');

    const {result} = renderHook(() => {
      const [value] = useControl(initializer);
      return value;
    });

    expect(result.current).toBe('hello');
    expect(initializer).toHaveBeenCalledOnce();
  });

  it('should support setValue when using single-argument form', () => {
    const {result} = renderHook(() => {
      const [value, setValue] = useControl(0);
      return {value, setValue};
    });

    act(() => {
      result.current.setValue(10);
    });

    expect(result.current.value).toBe(10);
  });

  it('should return a control object that can be passed to children', () => {
    const {result: parent} = renderHook(() => {
      const [value, setValue, control] = useControl(5);
      return {value, setValue, control};
    });

    expect(isControl(parent.current.control)).toBe(true);

    const {result: child, rerender: rerenderChild} = renderHook(() => {
      const [value, setValue] = useControl(parent.current.control, 999);
      return {value, setValue};
    });

    expect(child.current.value).toBe(5);

    act(() => {
      child.current.setValue(20);
    });
    rerenderChild();

    expect(child.current.value).toBe(20);
    expect(parent.current.value).toBe(20);
  });

  it('should use maybeInitial as fallback when first arg is undefined', () => {
    const {result} = renderHook(() => {
      const [value] = useControl(undefined, 99);
      return value;
    });

    expect(result.current).toBe(99);
  });

  it('should prefer first arg over second when first is a non-control value', () => {
    const {result} = renderHook(() => {
      const [value] = useControl(7, 99);
      return value;
    });

    expect(result.current).toBe(7);
  });

  it('should pass maybeInitial through when first arg is a control', () => {
    const {result: parent} = renderHook(() => {
      const [, , control] = useControl(undefined, 0);
      return control;
    });

    const {result: child} = renderHook(() => {
      const [value] = useControl(parent.current, 42);
      return value;
    });

    // controlled — initial is ignored, parent state (0) is used
    expect(child.current).toBe(0);
  });
});
