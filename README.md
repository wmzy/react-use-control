[![Build Status](https://travis-ci.org/wmzy/react-use-control.svg?branch=master)](https://travis-ci.org/wmzy/react-use-control)
[![Coverage Status](https://coveralls.io/repos/github/wmzy/react-use-control/badge.svg?branch=master)](https://coveralls.io/github/wmzy/react-use-control?branch=master)
[![install size](https://packagephobia.now.sh/badge?p=react-use-control)](https://packagephobia.now.sh/result?p=react-use-control)

# react-use-control

> Make React component state controllable — a tiny (~80 LOC) utility for building components that seamlessly support both **controlled** and **uncontrolled** modes.

## Motivation

In React, component authors often need to support two usage patterns:

- **Uncontrolled**: the component manages its own state internally (`defaultValue`).
- **Controlled**: a parent component owns the state and passes it down (`value` + `onChange`).

Supporting both typically requires boilerplate: checking whether a prop is `undefined`, syncing internal state with external props via `useEffect`, and carefully handling edge cases. Libraries like `@radix-ui/react-use-controllable-state` solve this with a `prop` / `defaultProp` / `onChange` pattern.

**react-use-control** takes a different approach. Instead of passing values and callbacks separately, it introduces a **control object** — a lightweight reference that carries state through the component tree via prototype chain. This enables:

- Zero-boilerplate controlled/uncontrolled support
- State sharing across sibling components (not just parent → child)
- Middleware-style state transforms via `useThru`
- Automatic re-render optimization (compatible with `React.memo`)

## Install

```bash
npm install react-use-control
```

## Quick Start

### Basic: Uncontrolled Component

When no `control` is passed, the component manages its own state:

```jsx
import { useControl } from 'react-use-control';

function Counter() {
  const [count, setCount] = useControl(null, 0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// Usage: <Counter />  — works independently
```

### Controlled by Parent

Pass a `control` object to let a parent own the state:

```jsx
function Parent() {
  const [count, setCount, control] = useControl(null, 0);

  return (
    <div>
      <Counter count={control} />
      <button onClick={() => setCount(0)}>Reset</button>
      <p>Parent sees: {count}</p>
    </div>
  );
}

function Counter({ count }) {
  const [num, setNum] = useControl(count, 0);
  return <button onClick={() => setNum(n => n + 1)}>{num}</button>;
}
```

### Sharing State Across Siblings

The same `control` can be passed to multiple children — they all share the same state:

```jsx
function App() {
  const [, setCount, control] = useControl(null, 0);

  return (
    <div>
      <Counter count={control} />
      <Counter count={control} />
      <button onClick={() => setCount(0)}>Reset Both</button>
    </div>
  );
}
```

## How It Works

```
┌─────────────────────────────────────────────────────┐
│  Parent: useControl(null, 0)                        │
│  → creates control object with state [0, setState]  │
│  → returns [value, setValue, control]                │
│                                                     │
│         control (passed as prop)                    │
│           ┌──────┴──────┐                           │
│           ▼             ▼                           │
│  ┌─────────────┐ ┌─────────────┐                    │
│  │ Child A     │ │ Child B     │                    │
│  │ useControl  │ │ useControl  │                    │
│  │ (control,1) │ │ (control,1) │                    │
│  │             │ │             │                    │
│  │ Reads state │ │ Reads state │                    │
│  │ from proto  │ │ from proto  │                    │
│  │ chain — no  │ │ chain — no  │                    │
│  │ new state   │ │ new state   │                    │
│  │ created     │ │ created     │                    │
│  └─────────────┘ └─────────────┘                    │
└─────────────────────────────────────────────────────┘
```

Under the hood, `control` is a plain object linked via `Object.create()`. When a child calls `useControl(control, initial)`, it checks the prototype chain: if a parent already set `state`, the child reuses it; otherwise it creates local state. This means:

- **No context providers needed** — state flows through props
- **No `useEffect` synchronization** — it's the same state reference
- **`initial` is ignored** when controlled — just like React's `useState`

## API

### `useControl(control?, initial?)`

```ts
function useControl<S>(
  control: Control<S> | null | undefined,
  initial: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, Control<S>];
```

- `control` — a control object from a parent, or `null`/`undefined` for uncontrolled mode.
- `initial` — initial state value (ignored when controlled).
- Returns `[value, setValue, control]` — same shape as `useState`, plus the control object for passing to children.

### `useThru(control, interceptor)`

```ts
function useThru<S>(
  control: Control<S> | null | undefined,
  interceptor: (state: [S, SetState<S>]) => [S, SetState<S>]
): Control<S>;
```

Insert a middleware that transforms state or setter before passing to children:

```jsx
import { useThru, mapSetter } from 'react-use-control';

function DoubleOnSet({ count }) {
  const control = useThru(count, mapSetter(v => v * 2));
  return <Counter count={control} />;
}
```

### `mapState(fn)`

Transform the state value read by children:

```js
mapState(count => count * 100) // children see count × 100
```

### `mapSetter(fn)`

Transform the value before it reaches `setState`:

```js
mapSetter(v => Math.max(0, v)) // clamp to non-negative
```

### `watch(onChange)`

Side-effect on state changes (logging, analytics, etc.):

```js
watch(v => console.log('new value:', v))
```

### `isControl(value)`

Type guard to check if a value is a control object:

```js
isControl(someValue) // true | false
```

## Comparison with Other Approaches

| Feature | react-use-control | @radix-ui/react-use-controllable-state | Manual (useState + useEffect) |
|---|---|---|---|
| Controlled/Uncontrolled | ✅ Automatic via control object | ✅ Via `prop`/`defaultProp`/`onChange` | ⚠️ Manual boilerplate |
| State sharing (siblings) | ✅ Same control to multiple children | ❌ Not supported | ❌ Lift state + pass individually |
| Middleware transforms | ✅ `useThru` + composable transforms | ❌ Not supported | ❌ Manual wrappers |
| Re-render optimization | ✅ WeakSet-based dirty tracking | ✅ Standard React patterns | ⚠️ Depends on implementation |
| Bundle size | ~80 LOC, zero deps | ~150 LOC, 2 internal deps | N/A |
| Learning curve | Medium (control object concept) | Low (familiar prop pattern) | Low |
| Ecosystem adoption | Niche | Widely used (Radix, shadcn/ui) | Universal |

**When to choose react-use-control:**

- You're building a component library where components need to share state across siblings
- You want middleware-style transforms on state flow
- You prefer a single prop (`control`) over the `value`/`defaultValue`/`onChange` triple

**When to choose radix or manual approach:**

- You need maximum ecosystem familiarity
- Your controlled/uncontrolled needs are simple (single parent → single child)
- You're already using Radix UI primitives

## Workflow

```bash
# develop with watch mode
npm start

# run tests
npm test

# build
npm run build

# storybook
npm run storybook

# commit changes
npm run commit
```

## License

[MIT](LICENSE)
