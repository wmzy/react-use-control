import * as React from 'react';
import type {StoryObj, Meta} from '@storybook/react-vite';
import {useControl, type Control} from '../src';

/**
 * A component with THREE controllable states: open, keyword, selected.
 * The traditional implementation needs 9 props, a runtime isControlled
 * check per state, and an effect per state to stay in sync.
 * The control implementation needs 3 props and zero machinery.
 */

// ---------- The traditional way: value/defaultValue/onChange ----------

type TraditionalProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  keyword?: string;
  defaultKeyword?: string;
  onKeywordChange?: (v: string) => void;
  selected?: string;
  defaultSelected?: string;
  onSelectedChange?: (v: string) => void;
};

function TraditionalPanel(props: TraditionalProps) {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);
  const [keyword, setKeyword] = React.useState(props.defaultKeyword ?? '');
  const [selected, setSelected] = React.useState(props.defaultSelected ?? 'all');

  const openCtrl = props.open !== undefined;
  const keywordCtrl = props.keyword !== undefined;
  const selectedCtrl = props.selected !== undefined;

  const currentOpen = openCtrl ? props.open! : open;
  const currentKeyword = keywordCtrl ? props.keyword! : keyword;
  const currentSelected = selectedCtrl ? props.selected! : selected;

  // three sync effects — an extra render cycle and a one-frame delay each
  React.useEffect(() => {
    if (openCtrl) setOpen(props.open ?? false);
  }, [props.open, openCtrl]);
  React.useEffect(() => {
    if (keywordCtrl) setKeyword(props.keyword ?? '');
  }, [props.keyword, keywordCtrl]);
  React.useEffect(() => {
    if (selectedCtrl) setSelected(props.selected ?? 'all');
  }, [props.selected, selectedCtrl]);

  const toggleOpen = () => {
    if (!openCtrl) setOpen((v) => !v);
    props.onOpenChange?.(!currentOpen);
  };
  const changeKeyword = (v: string) => {
    if (!keywordCtrl) setKeyword(v);
    props.onKeywordChange?.(v);
  };
  const changeSelected = (v: string) => {
    if (!selectedCtrl) setSelected(v);
    props.onSelectedChange?.(v);
  };

  return (
    <PanelView
      open={currentOpen}
      keyword={currentKeyword}
      selected={currentSelected}
      toggleOpen={toggleOpen}
      changeKeyword={changeKeyword}
      changeSelected={changeSelected}
      badge="traditional: 9 props + 3 sync effects"
    />
  );
}

// ---------- The control way: one prop per state ----------

type ControlProps = {
  open?: Control<boolean> | boolean;
  keyword?: Control<string> | string;
  selected?: Control<string> | string;
};

function ControlPanel({open, keyword, selected}: ControlProps) {
  const [openValue, setOpen] = useControl(open as Control<boolean>, false);
  const [keywordValue, setKeyword] = useControl(keyword as Control<string>, '');
  const [selectedValue, setSelected] = useControl(selected as Control<string>, 'all');

  return (
    <PanelView
      open={openValue}
      keyword={keywordValue}
      selected={selectedValue}
      toggleOpen={() => setOpen((v) => !v)}
      changeKeyword={setKeyword}
      changeSelected={setSelected}
      badge="control: 3 props, 0 branches, 0 effects"
    />
  );
}

function PanelView({
  open,
  keyword,
  selected,
  toggleOpen,
  changeKeyword,
  changeSelected,
  badge,
}: {
  open: boolean;
  keyword: string;
  selected: string;
  toggleOpen: () => void;
  changeKeyword: (v: string) => void;
  changeSelected: (v: string) => void;
  badge: string;
}) {
  return (
    <div style={{padding: 12, border: '1px dashed #999', borderRadius: 8, maxWidth: 420}}>
      <div style={{fontSize: 12, color: '#999', marginBottom: 8}}>{badge}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <button onClick={toggleOpen}>{open ? 'Close' : 'Open'}</button>
          <span style={{fontSize: 12, color: '#666'}}>open: {String(open)}</span>
        </div>
        <label style={{display: 'flex', gap: 8, fontSize: 13}}>
          keyword
          <input value={keyword} onChange={(e) => changeKeyword(e.target.value)} />
        </label>
        <label style={{display: 'flex', gap: 8, fontSize: 13}}>
          selected
          <select value={selected} onChange={(e) => changeSelected(e.target.value)}>
            <option value="all">all</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
      </div>
    </div>
  );
}

// ---------- Story wiring ----------

function BeforeAfterDemo() {
  const [, setOpen, openCtl] = useControl(true);
  const [, setKeyword, keywordCtl] = useControl('');
  const [, , selectedCtl] = useControl('draft');

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16, padding: 12}}>
      <TraditionalPanel />
      <ControlPanel />
      <div style={{padding: 12, border: '2px solid #4a90d9', borderRadius: 8, maxWidth: 420}}>
        <div style={{fontSize: 12, color: '#4a90d9', marginBottom: 8}}>Parent — controls the panel below</div>
        <ControlPanel open={openCtl} keyword={keywordCtl} selected={selectedCtl} />
        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
          <button onClick={() => setOpen((v) => !v)}>toggle open</button>
          <button onClick={() => setKeyword('controlled')}>set keyword</button>
          <button onClick={() => setKeyword((k) => k + '!')}>append to keyword</button>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Example/BeforeAfter',
  component: ControlPanel,
  parameters: {layout: 'centered'},
} satisfies Meta<typeof ControlPanel>;

export default meta;

type Story = StoryObj<typeof ControlPanel>;

export const ThreeStates: Story = {
  render: () => <BeforeAfterDemo />,
};
