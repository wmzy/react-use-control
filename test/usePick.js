import {renderHook, act} from '@testing-library/react-hooks';
import useControl, {usePick} from '../src';

describe('usePick', function () {
  it('should pick count2 state only', function () {
    const {result, rerender} = renderHook(() => {
      const [control, useProp] = useControl();
      const [count1, setCount1] = useProp('count1', 1);
      const [count2, setCount2] = useProp('count2', 2);
      return {control, count1, setCount1, count2, setCount2};
    });

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [control, useProp] = useControl(result.current.control);
      const [count, setCount] = useProp('count1', 1);
      const [pickControl] = usePick(control, ['count2']);
      return {pickControl, count, setCount};
    });

    const {result: grandchildResult, rerender: grandchildReRender} = renderHook(
      () => {
        const [control, useProp] = useControl(childResult.current.pickControl);
        const [count1, setCount1] = useProp('count1', 0);
        const [count2, setCount2] = useProp('count2', 0);

        return {control, count1, setCount1, count2, setCount2};
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
      const [control, useProp] = useControl();
      const [count1, setCount1] = useProp('count1', 1);
      const [count2, setCount2] = useProp('count2', 2);
      return {control, count1, setCount1, count2, setCount2};
    });

    const {result: childResult, rerender: childRerender} = renderHook(() => {
      const [control, useProp] = useControl(result.current.control);
      const [count, setCount] = useProp('count1', 1);
      const [pickControl] = usePick(control, [['count2', 'count']]);
      return {pickControl, count, setCount};
    });

    const {result: grandchildResult, rerender: grandchildReRender} = renderHook(
      () => {
        const [control, useProp] = useControl(childResult.current.pickControl);
        const [count, setCount] = useProp('count', 0);

        return {control, count, setCount};
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
