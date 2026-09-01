import type {Dispatch, SetStateAction} from 'react';

declare const s: unique symbol;

export type Control<T> = {[s]: T};

/** `Control<T> | T`: a state prop that accepts either a control (controlled)
 *  or a plain value (uncontrolled default) — the one-prop form used by
 *  component libraries built on react-use-control. */
export type ControlOrValue<T> = Control<T> | T;

type Nullish = null | undefined;

type State<T> = [T, Dispatch<SetStateAction<T>>];

// useControl

export function useControl<T>(
  control: Control<T> | Nullish,
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T>(
  control: Control<T>
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T = undefined>(
  control?: Control<T> | Nullish
): [
  T | undefined,
  Dispatch<SetStateAction<T | undefined>>,
  Control<T | undefined>
];

// Control<T> | T union — infers T from either member, no cast needed
export function useControl<T>(
  controlOrInitial: Control<T> | T | undefined,
  maybeInitial?: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, Control<T>];

export function useControl<T>(
  controlOrInitial: Control<T> | T
): [T, Dispatch<SetStateAction<T>>, Control<T>];

// useThru

export function useThru<T>(
  control: Control<T> | Nullish,
  interceptor: (state: State<T>) => State<T>
): Control<T>;

// isControl

export function isControl(
  maybeControl: unknown
): maybeControl is Control<unknown>;

// transform utilities

export function mapState<T, U>(
  fn: (state: T) => U
): (state: State<T>) => [U, Dispatch<SetStateAction<T>>];

export function mapSetter<T>(
  fn: (value: T) => T
): (state: State<T>) => State<T>;

export function watch<T>(
  onChange: (value: T) => void
): (state: State<T>) => State<T>;
