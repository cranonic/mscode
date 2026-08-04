// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
import { toLspRange, workspaceEditToMonaco } from './helpers';
export function registerCodeAction(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerCodeActionProvider(state.languageId, {
      provideCodeActions: async (model, range, context) => {
        if (!state.initialized) return { actions: [], dispose: () => {} };
        try {
          const diagnostics = (context.markers || []).map((m: monaco.editor.IMarkerData) => ({
            range: {
              start: { line: m.startLineNumber - 1, character: m.startColumn - 1 },
              end:   { line: m.endLineNumber   - 1, character: m.endColumn   - 1 },
            },
            message: m.message,
            severity: m.severity === monaco.MarkerSeverity.Error ? 1
              : m.severity === monaco.MarkerSeverity.Warning ? 2
              : m.severity === monaco.MarkerSeverity.Info ? 3 : 4,
            source: m.source,
            code: typeof m.code === 'object' ? (m.code as any)?.value : m.code,
          }));

          const result: any = await sendRequest(state, 'textDocument/codeAction', {
            textDocument: { uri: getDocUri(model, state) },
            range: toLspRange(range),
            context: {
              diagnostics,
              only: context.only ? [context.only] : undefined,
              triggerKind: context.trigger === monaco.languages.CodeActionTriggerType.Invoke ? 1 : 2,
            },
          });

          if (!Array.isArray(result)) return { actions: [], dispose: () => {} };

          const actions: monaco.languages.CodeAction[] = [];
          for (const item of result) {
            // Command-only (no edit)
            if (item.command && !item.edit && !item.title) {
              // rare shape
            }
            const action: monaco.languages.CodeAction = {
              title: item.title || item.command?.title || 'Code Action',
              kind: item.kind || 'quickfix',
              isPreferred: item.isPreferred,
              diagnostics: context.markers,
            };

            if (item.edit) {
              action.edit = workspaceEditToMonaco(item.edit);
            }
            if (item.command) {
              action.command = {
                id: item.command.command || item.command.id,
                title: item.command.title || action.title,
                arguments: item.command.arguments,
              };
            }
            actions.push(action);
          }
          return { actions, dispose: () => {} };
        } catch {
          return { actions: [], dispose: () => {} };
        }
      },
    })
  );
}
