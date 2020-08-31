import {renderHook, act} from '@testing-library/react-hooks';
import useModel, {useModelProp} from '../src';

describe('useModelProp', function () {
  it('should reuse count state', function () {
    const {result, rerender} = renderHook(() => {
      const [model, useProp] = useModel();
      const [count, setCount] = useProp('count', 0);
      return {model, count, setCount};
    });
    result.current.count.should.equal(0);

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const useProp = useModelProp(result.current.model);
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
