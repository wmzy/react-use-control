import type {Dispatch, SetStateAction} from 'react';

declare const s: unique symbol;
type S = typeof s;

export type Control<T> = {[s]: T};

type Nullish = null | undefined;

export function useControl<T>(
  controlOrInitial: Control<T> | undefined | T | (() => T),
  maybeInitial?: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T>(
  control: Control<T>
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T>(
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T = undefined>(
  control?: Control<T> | undefined
): [
  T | undefined,
  Dispatch<SetStateAction<T | undefined>>,
  Control<T | undefined>
];

export function isControl(
  maybeControl: unknown
): maybeControl is Control<unknown>;

export function useThru<T>(
  control: Control<T> | Nullish,
  interceptor: (
    state: [T, Dispatch<SetStateAction<T>>]
  ) => [T, Dispatch<SetStateAction<T>>]
): Control<T>;
