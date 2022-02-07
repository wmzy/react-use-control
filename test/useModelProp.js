import {renderHook, act} from '@testing-library/react-hooks';
import useControl, {useControlProp} from '../src';

describe('useControlProp', function () {
  it('should reuse count state', function () {
    const {result, rerender} = renderHook(() => {
      const [control, useProp] = useControl();
      const [count, setCount] = useProp('count', 0);
      return {control, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const useProp = useControlProp(result.current.control);
      const [count, setCount] = useProp('count', 1);
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
