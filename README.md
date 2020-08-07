[![Build Status](https://travis-ci.org/wmzy/react-model-hooks.svg?branch=master)](https://travis-ci.org/wmzy/react-model-hooks)
[![Coverage Status](https://coveralls.io/repos/github/wmzy/react-model-hooks/badge.svg?branch=master)](https://coveralls.io/github/wmzy/react-model-hooks?branch=master)
[![install size](https://packagephobia.now.sh/badge?p=react-model-hooks)](https://packagephobia.now.sh/result?p=react-model-hooks)
# react-model-hooks

> Split state from view.

## Install

```bash
npm install react-model-hooks
```

## Usage

```jsx
import * as React from 'react';
import useModel from 'react-model-hooks';

function useCounter(counterModel) {
  const [model, useProp] = useModel(
    counterModel ? counterModel.model : undefined
  );

  return {
    model,
    useStep(step) {
      return useProp('step', step);
    },
    useNumber(num) {
      return useProp('num', num);
    }
  };
}

function Counter({model}) {
  const m = useCounter(model);
  const [step, setStep] = m.useStep(1);
  const [num, setNum] = m.useNumber(0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

export default function App() {
  const counter = useCounter();
  const [, setNum] = counter.useNumber(1);

  return (
    <div>
      <Counter model={counter} />
      <button onClick={() => setNum(1)}>Reset</button>
    </div>
  );
}
```

## Workflow

```bash
# develop
npm start

# build
npm run build

# test
npm test

# commit changes
npm run commit

# publish
npm publish
```
