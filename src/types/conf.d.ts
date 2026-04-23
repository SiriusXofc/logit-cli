declare module 'conf' {
  export interface Options<T extends Record<string, unknown>> {
    projectName?: string
    cwd?: string
    configName?: string
    defaults?: Partial<T>
  }

  export default class Conf<T extends Record<string, unknown>> {
    constructor(options?: Options<T>)

    readonly path: string

    get<Key extends keyof T>(key: Key): T[Key] | undefined
    set<Key extends keyof T>(key: Key, value: T[Key]): void
    set(values: Partial<T>): void
    clear(): void
  }
}
