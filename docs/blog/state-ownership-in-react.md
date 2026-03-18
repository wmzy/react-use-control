# Who Owns the State? Rethinking Controlled/Uncontrolled Components in React

If you've ever built a reusable React component — a `<Select>`, a `<DatePicker>`, a `<Slider>` — you've likely wrestled with this question: should the component manage its own state, or should the parent?

The answer, of course, is "both." And that's where the pain begins.

## The Two Faces of a Component

React components that accept user input typically need to support two usage patterns:

**Uncontrolled** — the component owns its state. The consumer provides an initial value and forgets about it:

```jsx
<Select defaultValue="apple" />
```

**Controlled** — the parent owns the state. The component becomes a pure view of external data:

```jsx
<Select value={selected} onChange={setSelected} />
```

These two modes serve fundamentally different needs. Uncontrolled is convenient for simple cases — drop in a component and it just works. Controlled is essential when the parent needs to read, validate, or coordinate the state with other parts of the UI.

The problem? These two modes have **completely different data flow architectures**, yet the component's rendering logic is identical. The component author must bridge this gap.

## The Real Problem: State Ownership Is Not Transferable

React's `useState` creates state that is permanently bound to the component that calls it. There is no built-in mechanism to say "this state might belong to me, or it might belong to my parent."

This forces component authors into a pattern that looks roughly like this:

```jsx
function Select({ value, defaultValue, onChange }) {
  const [internal, setInternal] = useState(defaultValue);

  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const handleChange = (next) => {
    if (!isControlled) {
      setInternal(next);
    }
    onChange?.(next);
  };

  useEffect(() => {
    if (isControlled) {
      setInternal(value);
    }
  }, [value, isControlled]);

  return <div>{current}</div>;
}
```

Let's count the problems:

1. **Two sources of truth.** `value` (external) and `internal` (local) coexist. A runtime check decides which one to use on every render.

2. **Synchronization via `useEffect`.** When the parent changes `value`, the internal state must be synced. This introduces an extra render cycle and a one-frame delay.

3. **Fragile edge cases.** What happens when `value` transitions from `undefined` to a real value mid-lifecycle? The component silently switches from uncontrolled to controlled mode — React warns about this, but the component must handle it gracefully.

4. **Multiplicative boilerplate.** If the component has three controllable states (`value`, `open`, `selectedIndex`), the above pattern must be repeated three times.

The root cause is simple: **React has no primitive for transferable state ownership.** `useState` always creates private state. If a parent wants to take over, the child must maintain a parallel state and manually keep them in sync.

## Existing Solutions

### The Manual Approach

The code above is the manual approach. It works, but it's tedious, error-prone, and doesn't compose well. Every component library ends up writing its own version of this pattern, with subtle differences in edge case handling.

### Radix UI: `useControllableState`

[Radix UI](https://www.radix-ui.com/) extracted this pattern into a reusable hook:

```jsx
const [value, setValue] = useControllableState({
  prop: valueProp,           // controlled value (or undefined)
  defaultProp: defaultValue, // initial value for uncontrolled mode
  onChange: onValueChange,   // callback when value changes
});
```

This is a significant improvement. The hook encapsulates the `isControlled` check, the internal state, and the synchronization logic. Component authors write the pattern once and reuse it.

But the fundamental architecture hasn't changed. Under the hood, `useControllableState` still maintains two state sources — the external `prop` and an internal `useState`. It still needs to decide which one to use at runtime. The `onChange` callback is still the only way for the controlled parent to observe changes.

More importantly, this approach has inherent limitations:

- **One parent, one child.** The `prop`/`onChange` contract is a point-to-point connection. If two sibling components need to share the same state, you must lift state to their common ancestor and pass `value`/`onChange` to each one separately.

- **No interception.** If a middle layer wants to transform the state before passing it down (e.g., clamping a value, doubling it, logging changes), it must manually wrap the `onChange` callback and the `value` prop — essentially rebuilding the controlled pattern at every layer.

- **Three props per state.** Each controllable state requires a `value`/`defaultValue`/`onChange` triple. A component with three controllable states needs nine props.

## A Different Perspective: Find the Source, Pass the Authority

What if we reframe the problem?

The controlled/uncontrolled duality exists because we're asking the wrong question. We ask "does the parent control this state?" and branch accordingly. But the real question is simpler:

**Where does this state originate?**

If a parent has already created the state, the child should use it. If no one has created it yet, the child should create it locally. There's no need for two state sources, no need for synchronization, no need for mode detection.

This is the core idea behind [react-use-control](https://github.com/wmzy/react-use-control). Instead of the `value`/`defaultValue`/`onChange` triple, it introduces a single **control object** — an opaque token that carries state authority through the component tree:

```jsx
function Counter({ count }) {
  const [num, setNum] = useControl(count, 0);
  return <button onClick={() => setNum(n => n + 1)}>{num}</button>;
}
```

The `count` prop is a control object. If a parent passes one in, the component reads state from it. If `count` is `null` or `undefined`, the component creates its own state. The API is identical in both cases — there is no branching, no mode detection, no synchronization.

### How It Works (Conceptually)

Think of a control object as a **state authority token**. When you call `useControl(null, 0)`, you're saying "I am the authority for this state — create it here with initial value 0." The hook returns `[value, setValue, control]`, where `control` is a token you can pass to children.

When a child calls `useControl(control, 0)`, it's saying "someone else might already be the authority — check first." The hook looks up the token and finds that state already exists. It returns the same `[value, setValue]` without creating new state. The `0` is ignored, just like `useState`'s initial value is ignored on re-renders.

This means:

- **No two sources of truth.** There is exactly one state, either created locally or inherited from a parent.
- **No `useEffect` synchronization.** The child reads the same state reference as the parent. There's nothing to sync.
- **No mode detection.** The lookup is implicit. The component doesn't need to know whether it's controlled or not.

### Sibling Sharing for Free

Because the control object is just a token, you can pass it to multiple children:

```jsx
function App() {
  const [, setCount, countCtl] = useControl(null, 0);

  return (
    <div>
      <Counter count={countCtl} />
      <Counter count={countCtl} />
      <button onClick={() => setCount(0)}>Reset Both</button>
    </div>
  );
}
```

Both `Counter` components read from and write to the same state. No prop drilling, no Context, no state lifting gymnastics. The parent created the authority; both children defer to it.

With the traditional `value`/`onChange` approach, this would require the parent to pass `value` and `onChange` to each child separately, and each child would need to call `onChange` to notify the parent, who would then update state, triggering a re-render that flows back down. With a control object, the children write directly to the shared state.

### Middleware: Intercepting the State Flow

Sometimes a middle layer needs to transform state before passing it down. For example, a wrapper component might want to double every value set by its children, or clamp values to a valid range.

`react-use-control` provides `useThru` for this — a middleware that intercepts the state flow:

```jsx
function ClampedCounter({ count }) {
  const clamped = useThru(count, mapSetter(v => Math.max(0, v)));
  return <Counter count={clamped} />;
}
```

`useThru` takes a control object and an interceptor function, and returns a new control object with the transformation applied. The interceptor receives `[state, setState]` and returns a transformed `[state, setState]`. This composes naturally:

```jsx
const logged = useThru(control, watch(v => console.log(v)));
const doubled = useThru(logged, mapSetter(v => v * 2));
const display = useThru(doubled, mapState(v => `$${v}`));
```

Each layer adds a transformation without knowing about the others. This is impossible with the `value`/`onChange` pattern without manually wrapping callbacks at every level.

## Comparison

| | Manual | Radix `useControllableState` | `react-use-control` |
|---|---|---|---|
| **State sources** | Two (prop + internal) | Two (prop + internal) | One (inherited or created) |
| **Synchronization** | `useEffect` | `useEffect` (internal) | None needed |
| **Mode detection** | Runtime `isControlled` check | Runtime check (encapsulated) | Implicit via lookup |
| **Props per state** | 3 (`value`/`default`/`onChange`) | 3 (same, passed to hook) | 1 (control object) |
| **Sibling sharing** | Lift state + pass individually | Not supported | Pass same control to siblings |
| **State interception** | Manual callback wrapping | Not supported | `useThru` + composable transforms |
| **Bundle size** | N/A | ~150 LOC, 2 deps | ~80 LOC, 0 deps |

## When to Use What

**Use the manual approach or Radix's hook** when:
- Your component has a single controllable state with simple parent-child flow
- You're already in the Radix/shadcn ecosystem
- Maximum ecosystem familiarity matters more than API elegance

**Use `react-use-control`** when:
- You're building a component library with multiple controllable states
- Components need to share state across siblings
- You want middleware-style transforms on the state flow
- You prefer one prop per state over the `value`/`defaultValue`/`onChange` triple

## Closing Thought

The controlled/uncontrolled problem is, at its core, a state ownership problem. Traditional solutions work around it by maintaining two parallel state sources and synchronizing them. `react-use-control` dissolves the problem entirely by making state authority a first-class, transferable concept — whoever creates the state first owns it, and everyone else defers.

The implementation happens to use JavaScript's prototype chain, but that's an implementation detail. The mental model is what matters: **find the source of truth, and let it flow.**

---

*[react-use-control](https://github.com/wmzy/react-use-control) is an open-source library (~80 lines of code, zero dependencies) that supports React 16.8+.*
