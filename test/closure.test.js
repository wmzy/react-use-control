import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useControl} from '../src/control';

describe('control identity — changes on every state update', () => {
  it('control ref updates on every state change', () => {
    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 0);
      return {value, setValue, control};
    });

    const firstControl = result.current.control;

    act(() => {
      result.current.setValue(1);
    });

    const secondControl = result.current.control;
    expect(secondControl).not.toBe(firstControl);

    act(() => {
      result.current.setValue(2);
    });

    const thirdControl = result.current.control;
    expect(thirdControl).not.toBe(secondControl);

    expect(result.current.value).toBe(2);
  });

  it('control ref stays stable when value does not change', () => {
    const {result} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 0);
      return {value, setValue, control};
    });

    const firstControl = result.current.control;

    act(() => {
      result.current.setValue(0);
    });

    expect(result.current.control).toBe(firstControl);
  });

  it('controlled child setValue works correctly across all renders', () => {
    const {result: parent, rerender: rerenderParent} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 0);
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

describe('independent roots do not interfere', () => {
  it('independent useControl roots do not share state', () => {
    const {result: rootA, rerender: rerenderA} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 'a');
      return {value, setValue, control};
    });

    const {result: rootB, rerender: rerenderB} = renderHook(() => {
      const [value, setValue, control] = useControl(undefined, 'b');
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

  it('rapid alternating updates between two roots', () => {
    const {result: rootA, rerender: rerenderA} = renderHook(() => {
      const [value, setValue] = useControl(undefined, 0);
      return {value, setValue};
    });

    const {result: rootB, rerender: rerenderB} = renderHook(() => {
      const [value, setValue] = useControl(undefined, 100);
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
