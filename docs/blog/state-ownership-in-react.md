# Who Owns the State? Rethinking Controlled/Uncontrolled Components in React

> [简体中文](./state-ownership-in-react.zh-CN.md)

If you've ever written a wrapper around a `<Select>`, a `<DatePicker>`, a `<Dialog>` — or any component that exposes internal state to its parent — you have almost certainly written the `value` / `defaultValue` / `onChange` triple. And you have almost certainly felt it was too much boilerplate for what should be one prop.

This article explains why that boilerplate exists, what it costs, and a different way to think about the problem — one that dissolves the boilerplate instead of papering over it.

## The Two Faces of a Component

React components that accept user input typically need to support two usage patterns:

**Uncontrolled** — the component owns its state:

```jsx
<Select defaultValue="apple" />
```

**Controlled** — the parent owns the state:

```jsx
<Select value={selected} onChange={setSelected} />
```

Uncontrolled is convenient for simple cases. Controlled is essential when the parent needs to read, validate, or coordinate state with the rest of the UI. A reusable component must support both — yet these two modes have completely different data-flow architectures, and the rendering logic is identical. So the component author builds a bridge:

```jsx
function Select({ value, defaultValue, onChange }) {
  const [internal, setInternal] = useState(defaultValue);

  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const handleChange = (next) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (isControlled) setInternal(value);
  }, [value, isControlled]);

  return <div>{current}</div>;
}
```

Count the problems:

1. **Two sources of truth.** `value` (external) and `internal` (local) coexist. A runtime check decides which one to use on every render.
2. **Synchronization via `useEffect`.** When the parent changes `value`, the internal state must be synced — an extra render cycle and a one-frame delay.
3. **Fragile edge cases.** `value` switching between `undefined` and a real value mid-lifecycle flips the component between modes. React warns about this, but the component must handle it.
4. **Linear in states.** A component with three controllable states (`value`, `open`, `selectedIndex`) repeats the pattern three times — nine props, three branches, three sync effects.

The root cause is simple: **React has no primitive for transferable state ownership.** `useState` always creates private state. If a parent wants to take over, the child must keep a parallel state and manually stay in sync.

## Existing Solutions

### The Manual Approach

The code above. Tedious, error-prone, subtly different in every codebase.

### Radix UI: `useControllableState`

```jsx
const [value, setValue] = useControllableState({
  prop: valueProp,
  defaultProp: defaultValue,
  onChange: onValueChange,
});
```

A real improvement — the pattern is encapsulated and tested. But the architecture is unchanged: two state sources, a runtime decision, `onChange` as the only observation channel. And the limitations compound:

- **Point-to-point contract.** Two sibling components sharing state require lifting to a common ancestor and passing `value`/`onChange` to each one separately.
- **No interception.** A middle layer that wants to clamp or log values must rebuild the controlled pattern at every level.
- **Three props per state**, forever.

## A Different Question: Where Does the State Come From?

The controlled/uncontrolled duality exists because we ask "does the parent control this state?" and branch on the answer. But the question behind the question is simpler:

**Where does this state originate?**

If a parent has already created the state, the child should use it. If nobody has, the child should create it. No two sources, no synchronization, no mode detection.

That is the core idea of [react-use-control](https://github.com/wmzy/react-use-control). Instead of the `value`/`defaultValue`/`onChange` triple, it introduces a **control object** — an opaque token that carries state authority through the component tree:

```jsx
function Counter({ count }) {
  const [num, setNum] = useControl(count, 0);
  return <button onClick={() => setNum((n) => n + 1)}>{num}</button>;
}
```

`count` is a control. If a parent passes one, the component reads state from it. If not, the component creates its own. The API is identical in both cases — there is no branching anywhere in the component.

### Is This Just Signals?

A natural reaction: "this looks like Solid's signals, or Jotai atoms." It looks similar — both pass a token around. The mechanism is entirely different, and the difference is the point:

| | Signals (Solid/Jotai) | react-use-control |
|---|---|---|
| Where the state lives | Outside the component tree — a store/closure created at module level | Inside the component tree — a plain `useState` |
| How updates flow | Subscription; fine-grained re-render of readers | React's normal setState render flow |
| Lifecycle | Global, survives components; leaks must be managed | Dies with the owning component, like any state |
| Can you create state at module scope? | Yes — that's the whole point | No. State requires a mounted component. |

A control is not a container of state. It is a **locator**: "the `useState` that somebody in my ancestry created — or the one I create right now." React remains the store, the scheduler, and the source of truth. That single decision buys a lot:

- No subscription machinery, no cleanup, no memory-leak footguns.
- SSR, StrictMode, and concurrent rendering work for free, because the state is ordinary React state.
- React DevTools shows the state exactly where it lives.

And it costs exactly one thing: state cannot exist without a mounted component. Module-level shared state — signals' home turf — is not a use case here. Different tool, different problem.

### How It Works

When a child calls `useControl(control, initial)`, the hook checks whether state already exists upstream. If so, it reuses it — `initial` is ignored, just as React ignores `useState`'s argument after the first render. If not, it creates local state and returns a control carrying it.

Because the control is just a token, the same one can go to many children:

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

Both counters read and write the same state. No Context, no lifting, no callback wiring. The parent created the authority; both children defer to it.

### Transforming State Without Owning It

A common need: a wrapper component wants to transform state as it flows to and from a
child — clamp a counter's range, double what a slider writes, log changes. The child is
the state's owner and the trigger of changes; the wrapper only wants to contribute a
transform.

The traditional way drags the wrapper back into the controlled pattern:

```jsx
function ClampedCounter() {
  const [internal, setInternal] = useState(0);   // a second source, owned by the wrapper
  return (
    <Counter
      value={Math.max(0, internal)}
      onChange={(next) => setInternal(Math.max(0, next))}
    />
  );
}
```

Every click makes a round trip: the child calls `onChange` → the wrapper re-renders →
the child re-renders with the transformed value. The wrapper must own state, listen,
sync up, transform, and sync back down. Add another transform layer and you repeat all
of it.

`useThru` removes the wrapper's state entirely — the wrapper contributes only the
transform:

```jsx
function ClampedCounter({ count }) {
  const clamped = useThru(count, mapSetter((v) => Math.max(0, v)));
  return <Counter count={clamped} />;
}
```

`useThru` itself never creates state. It wraps a `[value, setValue]` pair — either the
one that already exists upstream, or the one the child is about to create — and hands
the wrapped pair downstream. The child remains the state's owner and the trigger of
changes; its `setCount` runs through `mapSetter`'s clamp before the value ever reaches
`useState`, so out-of-range values never enter state at all. No listener, no second
source, no sync-back.

Interceptors compose, and they work on both directions of the flow:

```jsx
const doubled = useThru(control, mapSetter((v) => v * 2));  // write path
const shown = useThru(doubled, mapState((v) => `$${v}`));   // read path
const logged = useThru(shown, watch((v) => console.log(v)));
```

- `mapSetter(fn)` transforms values on the way **in** (functional updates included).
- `mapState(fn)` transforms what children **read** while writes pass through untouched.
- `watch(fn)` observes the write path without changing it.

Each layer adds one transform and knows nothing about the others. The `value`/`onChange`
equivalent of this chain is a hand-wrapped callback and a parent-owned state at every
level.

## When Not to Use It

Control solves the ownership problem — so it adds nothing where the problem doesn't exist.

**Form fields managed by a form library are the main case.** react-hook-form, formik, react-f0rm and friends own the field state by design: validation modes, touched state, reset semantics all live in the form store. A field bound to them is *permanently controlled* — there is no "who owns this" question, the answer is always the form. Bridging that through a control is an adapter with no job. Read and write through the form's API; reserve `value`/`onChange` (or the library's own binding) for those fields.

The honest formulation: **use controls for components that may own state; use plain props where ownership is fixed.**

## Comparison

| | Manual | Radix `useControllableState` | `react-use-control` |
|---|---|---|---|
| **State sources** | Two (prop + internal) | Two (prop + internal) | One (created once, adopted everywhere) |
| **Synchronization** | `useEffect` | `useEffect` (internal) | None |
| **Mode detection** | Runtime `isControlled` check | Runtime check (encapsulated) | Implicit: adopt or create |
| **Props per state** | 3 | 3 | 1 |
| **Sibling sharing** | Lift + pass individually | Lift + pass individually | Pass the same control |
| **Interception** | Manual callback wrapping | Manual callback wrapping | `useThru` composition |
| **Bundle** | N/A | ~150 LOC, internal deps | ~80 LOC, 0 deps |

## Closing Thought

The controlled/uncontrolled problem is, at its core, a state-ownership problem. Traditional solutions work around it by maintaining two parallel state sources and synchronizing them. `react-use-control` dissolves it by making state authority transferable: whoever creates the state first owns it; everyone else defers.

The implementation happens to use JavaScript's prototype chain — that part is an implementation detail. The mental model is what matters: **find the source of truth, and let it flow.**

And the compatibility story follows from the simplicity: the library is built on `useState`, `useMemo`, and `useRef` — nothing else. No experimental APIs, no scheduler internals, no global store. Wherever React hooks run, it runs, and future React features apply to it for free, because its state is just React state.

---

*[react-use-control](https://github.com/wmzy/react-use-control) is open source — ~80 lines of code, zero dependencies. It powers [haze-ui](https://github.com/wmzy/haze-ui), a component library where every stateful component takes one prop per state.*
