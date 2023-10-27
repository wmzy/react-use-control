import should from 'should';
import {renderHook, act} from '@testing-library/react-hooks';
import {useControl, useThru, isControl} from '../src';

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

describe('isControl', () => {
  it('should support isControl', () => {
    isControl({}).should.be.False();
    const {result} = renderHook(() => {
      const [, , control] = useControl(undefined);
      return control;
    });

    isControl(result.current).should.be.True();
  });
});

describe('dev check', () => {
  it('should throw if not same control', () => {
    const {rerender, result} = renderHook(({useControl1 = true} = {}) => {
      const [, , ctrl1] = useControl(undefined);
      const [, , ctrl2] = useControl(undefined);
      useControl(useControl1 ? ctrl1 : ctrl2);
    });

    rerender();

    rerender({useControl1: false});
    result.error.should.be.Error();
    result.error.should.match(/Should not call with different control/);
  });
});
