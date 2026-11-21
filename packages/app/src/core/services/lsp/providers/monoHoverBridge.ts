import { languageFeatures } from '@mono/editor';

export function registerMonoHover(
  languageId: string,
  provide: (args: { line: number; character: number }) => Promise<string[] | null>,
): { dispose(): void } {
  return languageFeatures.registerHoverProvider(languageId, {
    provideHover: async (_model, position) => {
      const parts = await provide({
        line: position.lineNumber - 1,
        character: position.column - 1,
      });
      if (!parts?.length) return null;
      return { contents: parts };
    },
  });
}
