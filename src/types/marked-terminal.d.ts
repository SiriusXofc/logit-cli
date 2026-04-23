declare module 'marked-terminal' {
  import type { MarkedExtension } from 'marked'

  export interface TerminalRendererOptions extends Record<string, unknown> {
    reflowText?: boolean
    width?: number
  }

  export default class TerminalRenderer {
    constructor(options?: TerminalRendererOptions)
  }

  export function markedTerminal(
    options?: TerminalRendererOptions,
    highlightOptions?: Record<string, unknown>
  ): MarkedExtension
}
