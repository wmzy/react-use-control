import {
  useControl,
  useThru,
  isControl,
  controlEqual,
  mapState,
  mapSetter,
  watch,
  type Control
} from '..';

// --- useControl ---

// Controlled with initial value
const ctrl = {} as Control<number>;
const [value, setValue, control] = useControl(ctrl, 0);
value satisfies number;
setValue satisfies (v: number | ((prev: number) => number)) => void;
control satisfies Control<number>;

// Uncontrolled with initial value
const [value2, setValue2, control2] = useControl(null, 0);
value2 satisfies number;
control2 satisfies Control<number>;

// Controlled without initial (reuses parent state)
const [value3, setValue3, control3] = useControl(control2);
value3 satisfies number;

// Uncontrolled without initial — value can be undefined
const [value4, setValue4, control4] = useControl(undefined);
value4 satisfies number | undefined;

// Lazy initializer
const [value5] = useControl(null, () => 42);
value5 satisfies number;

// --- useThru ---

const thruControl = useThru(ctrl, ([s, setS]) => {
  s satisfies number;
  return [s * 2, setS] as [number, typeof setS];
});
thruControl satisfies Control<number>;

// useThru with nullish
const thruControl2 = useThru(undefined, ([s, setS]) => [s, setS]);

// --- isControl ---

const maybe: unknown = {};
if (isControl(maybe)) {
  maybe satisfies Control<unknown>;
}

// --- controlEqual ---

const eqResult = controlEqual({count: ctrl, label: 'hi'}, {count: ctrl, label: 'hi'});
eqResult satisfies boolean;

// --- mapState ---

const stateMapper = mapState((n: number) => String(n));
// Returns [string, Dispatch<SetStateAction<number>>]

// --- mapSetter ---

const setterMapper = mapSetter((n: number) => Math.abs(n));

// --- watch ---

const watcher = watch((n: number) => console.log(n));

// @ts-expect-error — cannot pass string control to number useControl
const [bad] = useControl({} as Control<string>, 0);

// @ts-expect-error — setValue type mismatch
setValue('not a number');
