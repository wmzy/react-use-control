[![Build Status](https://travis-ci.org/wmzy/react-use-control.svg?branch=master)](https://travis-ci.org/wmzy/react-use-control)
[![Coverage Status](https://coveralls.io/repos/github/wmzy/react-use-control/badge.svg?branch=master)](https://coveralls.io/github/wmzy/react-use-control?branch=master)
[![install size](https://packagephobia.now.sh/badge?p=react-use-control)](https://packagephobia.now.sh/result?p=react-use-control)
# react-use-control

> Make react component state controllable.

## Install

```bash
npm install react-use-control
```

## Usage

```jsx
import * as React from 'react';
import {useControl} from 'react-use-control';

export default function Counter({step: s, count}) {
  const [step, setStep] = useControl(s, 1);
  const [num, setNum] = useControl(count, 0);

  return (
    <div>
      <span> {num} </span>
      <button onClick={() => setNum((n) => n + step)}>add {step}</button>
      <button onClick={() => setStep((n) => n + 1)}>add step</button>
    </div>
  );
}

export default function App({count}) {
  const [, setNum, control] = useControl(count, 1);

  return (
    <div>
      <Counter count={control} />
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
