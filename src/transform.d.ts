import type { Dispatch, SetStateAction } from 'react';

type State<T> = [T, Dispatch<SetStateAction<T>>];

export function mapState<T, U>(fn: (state: T) => U): (state: State<T>) => [U, Dispatch<SetStateAction<T>>];

export function mapSetter<T>(fn: (value: T) => T): (state: State<T>) => State<T>;

export function watch<T>(onChange: (value: T) => void): (state: State<T>) => State<T>;
