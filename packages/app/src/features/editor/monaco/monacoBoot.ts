// Monaco boot removed. Use createMonoEditor from @mono/editor.
export async function bootMonaco(): Promise<void> {
  // no-op
}

/** Legacy name used by useMonacoSetup — no-op under Mono Editor. */
export function ensureMsCodeCoreConfig(): void {
  // no-op
}
