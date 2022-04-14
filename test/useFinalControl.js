import {renderHook, act} from '@testing-library/react-hooks';
import useControl, {useFinalControl} from '../src';

describe('useFinalControl', function () {
  it('should reuse count state', function () {
    const {result, rerender} = renderHook(() => {
      const [control, useState] = useControl();
      const [count, setCount] = useState('count', 0);
      return {control, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const useState = useFinalControl(result.current.control);
      const [count, setCount] = useState('count', 1);
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
