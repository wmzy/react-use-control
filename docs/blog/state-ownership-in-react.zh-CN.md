# 状态属于谁？重新思考 React 的受控/非受控组件

> 本文的[英文版](./state-ownership-in-react.md)

如果你给 `<Select>`、`<DatePicker>`、`<Dialog>` 写过包装——或者说，给任何一个
需要向父组件暴露内部状态的组件写过包装——你几乎一定写过 `value` /
`defaultValue` / `onChange` 三连。而且你几乎一定觉得：本来一个 prop 能说清的事，
不该有这么多样板。

本文解释这些样板为什么存在、代价是什么，以及一种不同的思考方式——它直接
消解样板，而不是给样板打补丁。

## 一个组件的两张面孔

接受用户输入的 React 组件通常要支持两种用法：

**非受控** —— 组件自己持有状态：

```jsx
<Select defaultValue="apple" />
```

**受控** —— 父组件持有状态：

```jsx
<Select value={selected} onChange={setSelected} />
```

简单场景用非受控最省事；父组件需要读取、校验状态、或与其他 UI 协调时，
受控必不可少。一个可复用组件必须同时支持两者——然而这两种模式的数据流
架构完全不同，渲染逻辑却一模一样。于是组件作者搭起一座桥：

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

数数这里的问题：

1. **两个数据源。** `value`（外部）和 `internal`（本地）并存，每次渲染都要
   运行时判断该用哪个。
2. **用 `useEffect` 同步。** 父组件改变 `value` 时，内部状态必须跟着同步——
   多一轮渲染、多一帧延迟。
3. **脆弱的边界情况。** `value` 在生命周期中途从 `undefined` 变成真实值，
   组件就在模式之间来回切换。React 会为此告警，但组件必须自己妥善处理。
4. **随状态数线性膨胀。** 一个有三个可控状态（`value`、`open`、`selectedIndex`）
   的组件要把这套模式重复三遍——九个 prop、三处分支、三个同步 effect。

根本原因很简单：**React 没有"可转移状态所有权"的原语。** `useState` 创建的状态
永远私有。父组件想接管时，子组件必须保留一份并行状态并手工保持同步。

## 现有方案

### 手写

就是上面的代码。繁琐、易错，而且每个代码库都写得略有不同。

### Radix UI：`useControllableState`

```jsx
const [value, setValue] = useControllableState({
  prop: valueProp,
  defaultProp: defaultValue,
  onChange: onValueChange,
});
```

真正的进步——模式被封装、被测试。但架构没变：两个数据源、运行时判断，
`onChange` 仍是唯一的观察通道。而且局限会层层放大：

- **点对点契约。** 两个兄弟组件共享状态，必须把状态提升到共同祖先，
  再分别下发 `value`/`onChange`。
- **无法拦截。** 中间层想对值做夹取或埋点，必须在每一层重建受控模式。
- **每个状态三个 prop**，永远如此。

## 换个问题：状态从哪里来？

受控/非受控的二元性之所以存在，是因为我们在问"父组件是否控制这个状态？"
并据此分支。但这个问题背后的问题更简单：

**这个状态从哪里来？**

如果父组件已经创建了状态，子组件就用它；如果没人创建，子组件就自己创建。
没有两个数据源，没有同步，没有模式判断。

这就是 [react-use-control](https://github.com/wmzy/react-use-control) 的核心思想。
它用一个 **control 对象**——一个携带状态权威、穿过组件树的不透明令牌——取代
`value`/`defaultValue`/`onChange` 三连：

```jsx
function Counter({ count }) {
  const [num, setNum] = useControl(count, 0);
  return <button onClick={() => setNum((n) => n + 1)}>{num}</button>;
}
```

`count` 是一个 control。父组件传了，组件就从它读状态；没传，组件就自建状态。
两种情况 API 完全一致——组件内部没有任何分支。

### 这不就是 signal 吗？

自然反应："这看着像 Solid 的 signal，或者 Jotai 的 atom。" 形似——都是到处传一个
令牌。但机制完全不同，而不同之处正是重点：

| | Signal（Solid/Jotai） | react-use-control |
|---|---|---|
| 状态在哪里 | 组件树之外——模块级创建的 store/闭包 | 组件树之内——一个普通的 `useState` |
| 更新如何流动 | 订阅；细粒度重渲染读者 | React 常规 setState 渲染流 |
| 生命周期 | 全局，比组件长寿；泄漏需要自行管理 | 随宿主组件消亡，和任何状态一样 |
| 能在模块作用域创建状态吗？ | 能——这正是它的意义 | 不能。状态需要挂载的组件。 |

control 不是状态的容器。它是一个**定位器**："我祖先中某个组件创建的 `useState`——
或者我现在创建的那个。" React 依旧是 store、调度器和唯一数据源。这一个决定
换来很多：

- 没有订阅机制、没有清理、没有内存泄漏隐患。
- SSR、StrictMode、并发渲染天然可用，因为状态就是普通 React 状态。
- React DevTools 就在状态实际所在的位置展示它。

代价只有一个：没有挂载的组件就没有状态。模块级共享状态——signal 的主场——
在这里不是用例。不同的工具，不同的问题。

### 工作原理

子组件调用 `useControl(control, initial)` 时，hook 检查上游是否已存在状态。
存在就直接复用——`initial` 被忽略，就像 React 在重渲染时忽略 `useState` 的
参数一样。不存在就创建本地状态，返回携带它的 control。

因为 control 只是个令牌，同一个令牌可以传给多个子组件：

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

两个 Counter 读写同一份状态。没有 Context、没有提升、没有回调接线。
父组件创建了权威，两个子组件都服从它。

### 中间件：只提供转换，不持有状态

一种常见需求：包装组件想在状态进出子组件时对它做变换——给计数器限幅、把滑杆
写入的值翻倍、记录日志。子组件是状态的管理者，也是变更的触发者；包装组件只想
贡献一个转换。

传统做法把包装组件逼回受控模式：

```jsx
function ClampedCounter() {
  const [internal, setInternal] = useState(0);   // 第二份数据源，归包装组件所有
  return (
    <Counter
      value={Math.max(0, internal)}
      onChange={(next) => setInternal(Math.max(0, next))}
    />
  );
}
```

每次点击都是一次往返：子组件调 `onChange` → 包装组件重渲染 → 子组件带着转换后的
值再次渲染。包装组件必须自己持有状态、监听、向上同步、转换、再向下同步。
再加一层转换，整套就得再重复一遍。

`useThru` 直接移除了包装组件的状态——包装组件只提供转换：

```jsx
function ClampedCounter({ count }) {
  const clamped = useThru(count, mapSetter((v) => Math.max(0, v)));
  return <Counter count={clamped} />;
}
```

`useThru` 本身从不创建状态。它把 `[value, setValue]` 状态对包一层——包的对象
要么是上游已经存在的状态，要么是下游子组件即将创建的状态——再把包装后的状态对
交给下游。子组件仍是状态的管理者和变更的触发者；它的 `setCount` 会先经过
`mapSetter` 的限幅，值才会抵达 `useState`，越界值根本进不了状态。没有监听、
没有第二份数据源、没有反向同步。

拦截器可以组合，并且作用于流的两个方向：

```jsx
const doubled = useThru(control, mapSetter((v) => v * 2));  // 写入路径
const shown = useThru(doubled, mapState((v) => `$${v}`));   // 读取路径
const logged = useThru(shown, watch((v) => console.log(v)));
```

- `mapSetter(fn)` — 在值**写入**前做变换（函数式更新同样生效）。
- `mapState(fn)` — 变换子组件**读到的**值，写入原样通过。
- `watch(fn)` — 观察写入路径，不改变值。

每一层只加自己的变换，对其他层一无所知。`value`/`onChange` 模式下同样的链条，
意味着每一层都要一份父级持有的状态和一个手工包装的回调。

## 什么时候不该用它

control 解决的是所有权问题——所以问题不存在的地方，它什么也加不了。

**表单库管理的字段是主要情形。** react-hook-form、formik、react-f0rm 这类库
天然拥有字段状态：校验模式、touched 状态、reset 语义都在表单 store 里。
绑定到它们的字段是**永久受控**的——不存在"谁拥有这个状态"的问题，答案
永远是表单。用 control 桥接等于给一个无事可做的适配器。读和写都走表单库的
API；这类字段保留 `value`/`onChange`（或表单库自带的绑定）。

诚实的表述是：**可能自建状态的组件用 control；所有权固定的场景用普通 props。**

## 对比

| | 手写 | Radix `useControllableState` | `react-use-control` |
|---|---|---|---|
| **数据源** | 两个（prop + 内部） | 两个（prop + 内部） | 一个（创建一次，处处接管） |
| **同步** | `useEffect` | `useEffect`（内部） | 无 |
| **模式判断** | 运行时 `isControlled` | 运行时判断（已封装） | 隐式：接管或创建 |
| **每个状态的 prop 数** | 3 | 3 | 1 |
| **兄弟共享** | 提升 + 逐个下发 | 提升 + 逐个下发 | 传同一个 control |
| **拦截** | 手工包装回调 | 手工包装回调 | `useThru` 组合 |
| **体积** | N/A | ~150 行，内部依赖 | ~80 行，0 依赖 |

实测（`pnpm bench`，jsdom，同一 DOM 产出）：受控 prop 更新场景，本库比手写
快 2.67 倍、比 radix 快 1.18 倍；挂载快 1.38 倍于手写；setter 更新路径三方
基本打平——那部分性能由 React 自身的 dispatch 主导。

## 结语

受控/非受控问题，本质是状态所有权问题。传统方案靠维护两份并行数据源并同步
它们来绕开它。`react-use-control` 通过让状态权威可转移来消解它：谁先创建状态
谁拥有，其余所有人服从。

实现上用到了 JavaScript 的原型链——这部分是实现细节。真正重要的是心智模型：
**找到唯一数据源，让它流动。**

兼容性来自简单：本库只建立在 `useState`、`useMemo`、`useRef` 之上，别无其他。
没有实验性 API，没有调度器内部实现，没有全局 store。React hooks 能跑的地方
它就能跑，未来的 React 特性对它免费生效——因为它的状态就是 React 的状态。

---

*[react-use-control](https://github.com/wmzy/react-use-control) 是开源项目——约
80 行代码，零依赖。它驱动着 [haze-ui](https://github.com/wmzy/haze-ui)，一个
每个有状态组件都只用"一个状态一个 prop"的组件库。*
