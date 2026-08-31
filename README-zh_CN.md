[![CI](https://github.com/wmzy/react-use-control/actions/workflows/ci.yml/badge.svg)](https://github.com/wmzy/react-use-control/actions/workflows/ci.yml)
[![install size](https://packagephobia.now.sh/badge?p=react-use-control)](https://packagephobia.now.sh/result?p=react-use-control)

# react-use-control

> 一个状态一个 prop。告别 `value`/`defaultValue`/`onChange` 三连，让组件状态天然可控。

**简体中文** | [English](./README.md)

只要写过包装组件，你就写过这样的代码：

```jsx
function Panel({ open, defaultOpen, onOpenChange }) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internal;
  // ……外加同步用的 effect，以及处处分支的 setter
}
```

`react-use-control` 删掉这些样板。组件用一次 `useControl` 声明状态，每个状态
**一个 prop** 而不是三个：

```jsx
function Panel({ open }) {
  const [openValue, setOpen] = useControl(open, false);
  // 没有分支，没有同步，没有双数据源
}
```

传普通值 → 非受控，该值即默认值。传 control → 受控，父子共享同一个数据源。
两条路走的是同一条代码路径。

## 一句话原理

**control 既不是 store，也不是 signal——它是一个令牌，在组件树中正确的层级
找到或创建那个 `useState`。** 谁先调用 `useControl` 谁创建状态，下游所有人
直接接管。React 依旧是 store、渲染器和所有状态的归属者。

- 零依赖，核心约 80 行
- 只用 `useState` / `useMemo` / `useRef` 三个基础 API，别无其他
- 开箱即用：`React.memo`、StrictMode、SSR、并发渲染

## 安装

```bash
npm install react-use-control
```

## 快速上手

### 非受控

不传 control —— 组件自己持有状态：

```jsx
import {useControl} from 'react-use-control';

function Counter() {
  const [count, setCount] = useControl(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### 父组件受控

```jsx
function Parent() {
  const [count, setCount, countCtrl] = useControl(0);
  return (
    <div>
      <Counter count={countCtrl} />
      <button onClick={() => setCount(0)}>Reset</button>
      <p>父组件看到: {count}</p>
    </div>
  );
}

function Counter({count}) {
  const [num, setNum] = useControl(count, 0); // 受控时 0 被忽略
  return <button onClick={() => setNum((n) => n + 1)}>{num}</button>;
}
```

### 兄弟组件共享

同一个 control 传给多个子组件，它们共享同一份状态——无需 Context，无需状态提升：

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

## 工作原理

组件调用 `useControl(prop, initial)` 时：

1. 若 `prop` 是一个 control，且其状态已在上游创建 → 直接接管。`initial` 被忽略，
   就像 React 在重渲染时忽略 `useState` 的参数一样。
2. 否则 → 在**本组件**创建一个全新的 `useState(initial)`，并返回携带它的 control。

因此数据源始终只有一个，由第一个需要该状态的组件持有。无需写同步代码——
因为永远不会出现两份拷贝。

### 它不是什么

| 问题 | 答案 |
| --- | --- |
| 是 signal 库吗（Solid、Preact、Jotai）？ | 不是。没有 store、没有订阅、没有模块级状态。状态就是组件树里的普通 React `useState`，control 只是指向它。 |
| 能像 signal 一样在组件外创建状态吗？ | 不能。状态寄宿于挂载的组件中，随组件消亡——和任何 `useState` 一样。 |
| 是表单状态适配器吗？ | 不是。表单库拥有状态时，读和写都应走表单库的 API。control 面向的是**可能**自建状态的组件。 |

control 引用在值不变时保持稳定，值变化时更新身份——因此 `React.memo`
无需任何额外处理就能跳过未受影响子组件的重渲染。

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

- `controlOrInitial` — 来自父组件的 control，**或**一个初始值（单参数形式），
  **或** `null`/`undefined` 表示非受控模式。
- `initial` — 兜底初始值，仅当第一个参数不是 control 时生效。
- 返回 `[value, setValue, control]` —— `useState` 的形状，外加用于向下传递的 control。

### `useThru(control, interceptor)`

```ts
function useThru<S>(
  control: Control<S> | null | undefined,
  interceptor: (state: [S, Dispatch<SetStateAction<S>>]) => [S, Dispatch<SetStateAction<S>>]
): Control<S>;
```

以中间件方式给 control 套一层变换。`useThru` 本身从不创建状态——子组件仍是
状态的管理者和变更的触发者，包装层只提供转换。写入在抵达 `useState` 之前先经过
拦截器，所以变换后的值根本不会进入状态。配合内置助手组合使用：

```jsx
import {useThru, mapSetter, mapState, watch} from 'react-use-control';

const doubled = useThru(countCtrl, mapSetter((v) => v * 2));
const clamped = useThru(doubled, mapSetter((v) => Math.max(0, v)));
const shown = useThru(clamped, mapState((v) => `$${v}`));
const logged = useThru(shown, watch((v) => console.log(v)));
```

- `mapSetter(fn)` — 在值**写入**状态前做变换（函数式更新同样生效）。
- `mapState(fn)` — 变换子组件**读到的**值。
- `watch(onChange)` — 写入时的副作用（日志、埋点）。

### `isControl(value)`

类型守卫：`isControl(x)` 可将类型收窄为 `Control<unknown>`。

## 对比

| 特性 | react-use-control | `@radix-ui/react-use-controllable-state` | 手写 `value`/`onChange` |
| --- | --- | --- | --- |
| 受控/非受控 | 一个 prop 自动支持 | 靠 `prop`/`defaultProp`/`onChange` | 手工样板 |
| 每个状态的 prop 数 | **1** | 3 | 3 |
| 数据源 | 1 个（创建一次，处处接管） | 2 个（prop + 内部，保持同步） | 2 个 |
| 同步 effect | 无 | 内部自带 | 手写 |
| 兄弟共享 | 同一 control 传 N 个子组件 | 手工提升状态 | 手工提升状态 |
| 中间件变换 | `useThru` + 可组合助手 | 不支持 | 手工包装回调 |
| `React.memo` 友好 | 是（值不变时引用稳定） | 常规模式 | 看你自己 |
| 体积 | ~80 行，0 依赖 | ~150 行，内部依赖 | N/A |

## 基准测试

用 `pnpm bench` 实测（vitest `bench`，jsdom 环境，每种实现 50 个工作单元 × 20 次
采样）。三种实现产出完全相同的 DOM。hz 越高越快。

| 场景 | 手写 | radix | react-use-control |
| --- | --- | --- | --- |
| 挂载（非受控） | 基线 | 快 1.31× | **快 1.38×** |
| 受控 prop 更新 | 基线 | 快 2.26× | **快 2.67×** |
| setter 更新（点击） | 基线 | 快 1.09× | 基本持平（0.99×） |

受控更新路径是三种架构真正拉开差距的地方：手写和 radix 都要维护第二份待同步
的数据源；control 直接读单一数据源。setter 路径的性能由 React 自身的 dispatch
主导，三方基本打平。

自己跑一遍：`pnpm bench`。

## 适用场景

- **包装组件**——凡是今天还在写 `value` 三连的对话框、标签页、滑杆、筛选器。
- **属性多的组件**——三个状态就是 3 个 prop 而不是 9 个，组件内零分支。
- **兄弟共享**——不用 Context、不用提升状态。
- **中间层变换**——夹取、映射、埋点，不必在每一层重建受控模式。

## 不适用场景

- **表单库管理的字段**（react-hook-form、react-f0rm、formik……）。状态归表单库所有，
  读和写都走表单库的 API。control 在这里只是多余的适配器——受控/非受控的问题
  在这种场景里根本不存在。
- 从不自建状态的纯受控组件——普通 `value` + `onChange` 更简单、更符合惯例。

## 兼容性

本库只使用 `useState`、`useMemo`、`useRef`——hooks 诞生以来最基础、最稳定的 API。
没有实验性特性，没有调度器内部实现，没有会泄漏的全局 store。你的 React 版本
有 hooks 就能跑；新的 React 特性（StrictMode、并发渲染、React Compiler）天然
适用，因为它的状态就是普通的 React 状态。

## 谁在用

- [haze-ui](https://github.com/wmzy/haze-ui) —— 一个完整组件库，其中每个有状态
  组件都用 `Control<T> | T` 单 prop 替代 `value` 三连。

## 延伸阅读

- [状态属于谁？重新思考 React 的受控/非受控组件](docs/blog/state-ownership-in-react.zh-CN.md)
  （[English](docs/blog/state-ownership-in-react.md)）—— 问题、设计动机，以及与 signal 的区别。

## 开发

```bash
npm start        # vitest watch
npm test         # 跑测试
npm run bench    # 跑基准测试
npm run build    # rollup 构建
npm run storybook
npm run commit
```

## License

[MIT](LICENSE)
