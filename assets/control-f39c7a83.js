import{r as c}from"./index-1b03fe98.js";const d=new WeakSet,w=Symbol("is control"),p={useState:c.useState,[w]:!0};function y(e){return Object.create(e||p)}const i=Symbol("id");function m(e){const r=c.useRef(e),t=y(e),n=c.useRef(t);{if(((o,s)=>o===s?!1:o&&s?o[i]!==s[i]:!0)(e,r.current))throw new Error("Should not call with different control");const u=c.useRef(Symbol("unique id")).current;t[i]=u}return r.current!==e?(r.current=e,n.current=t):d.has(n.current)&&(n.current=t),n.current}function b(e,r){const t=m(e),{state:n,useState:a}=t;if(Object.getPrototypeOf(t).state)return[...n,t];const[u,o]=a(r),s=c.useCallback(f=>{o(l=>{const S=typeof f=="function"?f(l):f;return Object.is(S,l)||d.add(t),S})},[]);return t.state=[u,s],[u,s,t]}function h(e,r){const t=m(e),{state:n,useState:a}=t;return Object.getPrototypeOf(t).state?t.state=r(n):t.useState=(...u)=>r(a(...u)),t}export{h as a,b as u};
//# sourceMappingURL=control-f39c7a83.js.map
