import type en from './locales/en';

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

/** Every locale must provide the same keys as English. */
export type Translation = DeepString<typeof en>;
