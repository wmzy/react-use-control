import {renderHook, act} from '@testing-library/react-hooks';
import {useControl, useThru} from '../src';

describe('useControl', () => {
  it('should reuse count state', () => {
    const {result, rerender} = renderHook(() => {
      const [count, setCount, control] = useControl(null, 0);
      return {control, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [count, setCount] = useControl(result.current.control, 1);
      return {count, setCount};
    });

    childResult.current.count.should.equal(0);

    act(() => {
      result.current.setCount(2);
    });

    result.current.count.should.equal(2);

    childRerender();
    childResult.current.count.should.equal(2);

    act(() => {
      childResult.current.setCount(3);
    });
    rerender();
    childRerender();

    childResult.current.count.should.equal(3);
    result.current.count.should.equal(3);
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

    childResult.current.count.should.equal(1);

    act(() => {
      childResult.current.setCount(2);
    });

    childResult.current.count.should.equal(4);
  });
});
