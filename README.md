[![CI](https://github.com/wmzy/react-use-control/actions/workflows/ci.yml/badge.svg)](https://github.com/wmzy/react-use-control/actions/workflows/ci.yml)
[![install size](https://packagephobia.now.sh/badge?p=react-use-control)](https://packagephobia.now.sh/result?p=react-use-control)

# react-use-control

> One prop per state. Make React component state controllable without the `value`/`defaultValue`/`onChange` triple.

**English** | [简体中文](./README-zh_CN.md)

If you've ever written a wrapper component, you've written this:

```jsx
function Panel({ open, defaultOpen, onOpenChange }) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internal;
  // ...plus an effect to sync, plus branchy setters
}
```

`react-use-control` removes the boilerplate. A component declares state with a single
`useControl` call and receives **one prop per state** instead of three:

```jsx
function Panel({ open }) {
  const [openValue, setOpen] = useControl(open, false);
  // no branch, no sync, no double source
}
```

Pass a plain value → uncontrolled, the value is the default. Pass a control → controlled,
parent and child share one source of truth. Same code path either way.

## The idea in one sentence

**A control is not a store, not a signal — it's a token that finds or creates the
`useState` at the right layer of the tree.** Whoever calls `useControl` first creates the
state; everyone downstream adopts it. React keeps being the store, the renderer, and the
owner of all state.

- Zero dependencies, ~80 LOC core
- Built on `useState` / `useMemo` / `useRef` only — nothing else
- Works with `React.memo`, StrictMode, SSR, concurrent rendering out of the box

## Install

```bash
npm install react-use-control
```

## Quick Start

### Uncontrolled

No `control` passed — the component owns its state:

```jsx
import {useControl} from 'react-use-control';

function Counter() {
  const [count, setCount] = useControl(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### Controlled by a parent

```jsx
function Parent() {
  const [count, setCount, countCtrl] = useControl(0);
  return (
    <div>
      <Counter count={countCtrl} />
      <button onClick={() => setCount(0)}>Reset</button>
      <p>Parent sees: {count}</p>
    </div>
  );
}

function Counter({count}) {
  const [num, setNum] = useControl(count, 0); // 0 ignored when controlled
  return <button onClick={() => setNum((n) => n + 1)}>{num}</button>;
}
```

### Shared across siblings

The same control passed to multiple children makes them share one state — no Context,
no state lifting:

```jsx
function App() {
  const [, setCount, countCtl] = useControl(0);
  return (
    <div>
      <Counter count={countCtl} />
      <Counter count={countCtl} />
      <button onClick={() => setCount(0)}>Reset Both</button>
    </div>
  );
}
```

## How it works

When a component calls `useControl(prop, initial)`:

1. If `prop` is a control whose state was **already created** upstream → adopt it. `initial` is ignored, exactly like React ignores `useState`'s argument after the first render.
2. Otherwise → create a fresh `useState(initial)` **in this component** and return a control carrying it.

So there is exactly one source of truth, hosted by the first component that needed the
state. There is no synchronization to write, because there are never two copies.

### What it is not

| Question | Answer |
| --- | --- |
| Is it a signal library (Solid, Preact, Jotai)? | No. No store, no subscription, no module-level state. The state is a plain React `useState` inside the component tree. Controls only route to it. |
| Can I create state outside a component, like a signal? | No. State lives inside a mounted component and dies with it — like any `useState`. |
| Is it a form-state adapter? | No. If a form library owns the state, read and write through that library's API. Control is for components that *may* own state. |

The control ref is stable while the value is unchanged, and changes identity when the
value changes — so `React.memo` skips re-renders of untouched children for free.

## API

### `useControl(controlOrInitial?, initial?)`

```ts
function useControl<S>(
  control: Control<S> | null | undefined,
  initial: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, Control<S>];

function useControl<S>(
  initial: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, Control<S>];
```

- `controlOrInitial` — a control from a parent, **or** an initial value (the single-argument form), **or** `null`/`undefined` for uncontrolled mode.
- `initial` — fallback initial value, used only when the first argument is not a control.
- Returns `[value, setValue, control]` — `useState`'s shape plus the control to pass down.

### `useThru(control, interceptor)`

```ts
function useThru<S>(
  control: Control<S> | null | undefined,
  interceptor: (state: [S, Dispatch<SetStateAction<S>>]) => [S, Dispatch<SetStateAction<S>>]
): Control<S>;
```

Wraps a control with a transform, middleware-style. `useThru` itself never creates
state — the child stays the state's owner and the trigger of changes; the wrapper
layer contributes only the transform. Writes run through the interceptor before they
reach `useState`, so transformed values never enter state. Compose with the built-in
helpers:

```jsx
import {useThru, mapSetter, mapState, watch} from 'react-use-control';

const doubled = useThru(countCtrl, mapSetter((v) => v * 2));
const clamped = useThru(doubled, mapSetter((v) => Math.max(0, v)));
const shown = useThru(clamped, mapState((v) => `$${v}`));
const logged = useThru(shown, watch((v) => console.log(v)));
```

- `mapSetter(fn)` — transform values on the way **into** state (functional updates included).
- `mapState(fn)` — transform the value children **read**.
- `watch(onChange)` — side effect on writes (logging, analytics).

### `isControl(value)`

Type guard: `isControl(x)` narrows to `Control<unknown>`.

## Comparison

| Feature | react-use-control | `@radix-ui/react-use-controllable-state` | Manual `value`/`onChange` |
| --- | --- | --- | --- |
| Controlled/uncontrolled | Automatic via one prop | Via `prop`/`defaultProp`/`onChange` | Manual boilerplate |
| Props per state | **1** | 3 | 3 |
| State sources | 1 (created once, adopted everywhere) | 2 (prop + internal, kept in sync) | 2 |
| Synchronization effect | None | Internal | Hand-written |
| Sibling sharing | Same control to N children | Lift state manually | Lift state manually |
| Middleware transforms | `useThru` + composable helpers | Not supported | Manual callback wrapping |
| `React.memo` friendly | Yes (ref stable when value unchanged) | Standard patterns | Depends on you |
| Bundle | ~80 LOC, 0 deps | ~150 LOC, internal deps | N/A |

## Benchmarks

Measured with `pnpm bench` (vitest `bench`, jsdom, 50 work units × 20 samples per
implementation). Identical DOM output across the three implementations. Higher hz = faster.

| Scenario | manual | radix | react-use-control |
| --- | --- | --- | --- |
| mount (uncontrolled) | baseline | 1.31× faster | **1.38× faster** |
| controlled prop update | baseline | 2.26× faster | **2.67× faster** |
| setter update (click) | baseline | 1.09× faster | tied (0.99×) |

The controlled-update path is where the architectures differ: manual and radix keep a
second state source to sync; a control reads the single source directly. The setter path
is dominated by React's own dispatch and is essentially a tie everywhere.

Run it yourself: `pnpm bench`.

## When to use it

- **Wrapper components** that expose internal state to a parent — dialogs, tabs, sliders, filters, anything with a `value` triple today.
- **Prop-heavy components**: three states means 3 props instead of 9, with zero branching inside.
- **Sibling sharing** without Context or lifting.
- **Middle layers** that transform state (clamp, map, log) without rebuilding the controlled pattern at every level.

## When not to use it

- **Form fields managed by a form library** (react-hook-form, react-f0rm, formik…). The form owns that state; read and write through the form's API. A control would be an unnecessary adapter — the controlled/uncontrolled question doesn't exist there.
- Permanently controlled components that never own state — a plain `value` + `onChange` prop is simpler and more conventional.

## Compatibility

The library uses only `useState`, `useMemo`, and `useRef` — the most basic hook APIs,
stable since hooks were introduced. No experimental features, no scheduling internals,
no global store to leak. If your React version has hooks, it works; new React features
(StrictMode, concurrent rendering, React Compiler) apply for free because the state is
ordinary React state.

## Used by

- [haze-ui](https://github.com/wmzy/haze-ui) — a full component library where every
  stateful component takes one `Control<T> | T` prop instead of a `value` triple.

## Further reading

- [Who Owns the State? Rethinking Controlled/Uncontrolled Components in React](docs/blog/state-ownership-in-react.md)
  ([简体中文](docs/blog/state-ownership-in-react.zh-CN.md)) — the problem, the design rationale,
  and how it differs from signals.

## Workflow

```bash
npm start        # vitest watch
npm test         # run tests
npm run build    # rollup build
npm run storybook
npm run commit
```

## License

[MIT](LICENSE)
