import type { Dispatch, SetStateAction } from 'react';
declare const s: unique symbol;
type S = typeof s;
export type Control<T> = {[s]: T};

type Nullish = null | undefined;

export function useControl<S>(control: Control<S> | Nullish, initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>, Control<S>];
export function useControl<S>(control: Control<S>): [S, Dispatch<SetStateAction<S>>, Control<S>];
export function useControl<S = undefined>(control: Control<S> | Nullish): [S | undefined, Dispatch<SetStateAction<S | undefined>>, Control<S>];

type State<S> = [S, Dispatch<SetStateAction<S>>];
export function useThru<S>(control: Control<S> | Nullish, interceptor: (state: State<S>) => State<S>): Control<S>;

export function isControl(maybeControl): maybeControl is Control<any>;
