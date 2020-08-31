import {renderHook, act} from '@testing-library/react-hooks';
import useModel, {usePick} from '../src';

describe('usePick', function () {
  it('should pick count2 state only', function () {
    const {result, rerender} = renderHook(() => {
      const [model, useProp] = useModel();
      const [count1, setCount1] = useProp('count1', 1);
      const [count2, setCount2] = useProp('count2', 2);
      return {model, count1, setCount1, count2, setCount2};
    });

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [model, useProp] = useModel(result.current.model);
      const [count, setCount] = useProp('count1', 1);
      const [pickModel] = usePick(model, ['count2']);
      return {pickModel, count, setCount};
    });

    const {result: grandchildResult, rerender: grandchildReRender} = renderHook(
      () => {
        const [model, useProp] = useModel(childResult.current.pickModel);
        const [count1, setCount1] = useProp('count1', 0);
        const [count2, setCount2] = useProp('count2', 0);

        return {model, count1, setCount1, count2, setCount2};
      }
    );

    grandchildResult.current.count1.should.equal(0);
    grandchildResult.current.count2.should.equal(2);

    act(() => {
      result.current.setCount1(4);
      result.current.setCount2(4);
    });

    rerender();
    childRerender();
    grandchildReRender();

    grandchildResult.current.count1.should.equal(0);
    grandchildResult.current.count2.should.equal(4);
  });

  it('should pick and rename prop', function () {
    const {result, rerender} = renderHook(() => {
      const [model, useProp] = useModel();
      const [count1, setCount1] = useProp('count1', 1);
      const [count2, setCount2] = useProp('count2', 2);
      return {model, count1, setCount1, count2, setCount2};
    });

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [model, useProp] = useModel(result.current.model);
      const [count, setCount] = useProp('count1', 1);
      const [pickModel] = usePick(model, [['count2', 'count']]);
      return {pickModel, count, setCount};
    });

    const {result: grandchildResult, rerender: grandchildReRender} = renderHook(
      () => {
        const [model, useProp] = useModel(childResult.current.pickModel);
        const [count, setCount] = useProp('count', 0);

        return {model, count, setCount};
      }
    );

    grandchildResult.current.count.should.equal(2);

    act(() => {
      result.current.setCount1(4);
      result.current.setCount2(4);
    });

    rerender();
    childRerender();
    grandchildReRender();

    grandchildResult.current.count.should.equal(4);
  });
});
