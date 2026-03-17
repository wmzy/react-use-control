import React from 'react';
import {renderToString} from 'react-dom/server';
import {describe, it, expect} from 'vitest';
import {useControl, useThru} from '../src/control';
import {mapSetter} from '../src/transform';

function Counter({count}) {
  const [value] = useControl(count, 0);
  return React.createElement('span', null, value);
}

function Parent() {
  const [value, , control] = useControl(null, 42);
  return React.createElement(
    'div',
    null,
    React.createElement('p', null, `parent: ${value}`),
    React.createElement(Counter, {count: control})
  );
}

function WithTransform() {
  const [value, , control] = useControl(null, 5);
  const thru = useThru(
    control,
    mapSetter((v) => v * 2)
  );
  return React.createElement(
    'div',
    null,
    React.createElement('p', null, `root: ${value}`),
    React.createElement(Counter, {count: thru})
  );
}

describe('SSR — renderToString', () => {
  it('renders uncontrolled component', () => {
    const html = renderToString(React.createElement(Counter, {}));
    expect(html).toContain('0');
  });

  it('renders controlled parent-child', () => {
    const html = renderToString(React.createElement(Parent));
    expect(html).toContain('parent: 42');
    expect(html).toContain('42');
  });

  it('renders with useThru transform', () => {
    const html = renderToString(React.createElement(WithTransform));
    expect(html).toContain('root: 5');
    expect(html).toContain('5');
  });

  it('multiple independent roots in same server request do not interfere', () => {
    const html1 = renderToString(React.createElement(Parent));
    const html2 = renderToString(React.createElement(Parent));
    expect(html1).toContain('42');
    expect(html2).toContain('42');
    expect(html1).toBe(html2);
  });
});
