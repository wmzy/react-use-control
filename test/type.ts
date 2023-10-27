import { useControl, useThru, type Control } from "..";

const ctrl = {} as Control<number>
const [value, setValue, control] = useControl(ctrl, 0);
const [value2, setValue2, control2] = useControl(null, 0);
const [value3, setValue3, control3] = useControl(control2);
