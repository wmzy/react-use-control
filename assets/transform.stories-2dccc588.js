import{j as c,a as s}from"./jsx-runtime-86dfebf6.js";import{r as m}from"./index-1b03fe98.js";import{u as d,a as f}from"./control-f39c7a83.js";function b(r){return([o,t])=>[o,e=>t(typeof e=="function"?i=>r(e(i)):r(e))]}function l({count:r}){const[o,t]=d(r,0);return s("div",{children:[s("span",{children:[" ",o," "]}),c("button",{onClick:()=>t(e=>e+1),children:"ADD"})]})}function C({count:r}){const o=m.useRef(1),t=f(r,b(e=>e+1));return s("div",{children:["parent render count: ",o.current++,c(l,{count:t})]})}const T={title:"ReactUseControl/Transform",component:l,argTypes:{count:{control:"number"}}},n={render:r=>c(C,{...r})};var a,u,p;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: props => <DoubleCounter {...props} />
}`,...(p=(u=n.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};const j=["Double"];export{n as Double,j as __namedExportsOrder,T as default};
//# sourceMappingURL=transform.stories-2dccc588.js.map