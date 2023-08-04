import {renderHook, act} from '@testing-library/react-hooks';
import {
  useControl,
  useControllableState,
  useControlState as useState
} from '../src';

describe('useControl', () => {
  it('should reuse count state', () => {
    const {result, rerender} = renderHook(() => {
      const control = useControl();
      const [count, setCount] = useState(control, 'count', 0);
      return {control, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const control = useControl(result.current.control);
      const [count, setCount] = useState(control, 'count', 1);
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

  it('should support transforms', () => {
    const {result} = renderHook(() => {
      const control = useControl(undefined, {
        count: ([count, setCount]) => [
          count,
          (c) =>
            typeof c === 'function'
              ? setCount((cc) => c(cc) * 2)
              : setCount(c * 2)
        ]
      });
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const control = useControl(result.current.control);
      const [count, setCount] = useState(control, 'count', 1);
      return {count, setCount};
    });

    childResult.current.count.should.equal(1);

    act(() => {
      childResult.current.setCount(2);
    });

    childResult.current.count.should.equal(4);
  });

  it('should support transforms of array', () => {
    const countProp = Symbol('count');
    const {result} = renderHook(() => {
      const control = useControl(undefined, [
        [countProp, ([count, setCount]) => [count * 2, setCount]]
      ]);
      return {control};
    });

    const {result: childResult} = renderHook(() => {
      const control = useControl(result.current.control);
      const [count, setCount] = useState(control, countProp, 1);
      return {count, setCount};
    });

    childResult.current.count.should.equal(2);

    act(() => {
      childResult.current.setCount(2);
    });

    childResult.current.count.should.equal(4);
  });
});

describe('useControllableState', () => {
  it('should reuse count state', () => {
    const {result, rerender} = renderHook(() => {
      const control = useControl();
      const [count, setCount] = useState(control, 'count', 0);
      return {control, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [count, setCount] = useControllableState(
        result.current.control,
        'count',
        1
      );
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
