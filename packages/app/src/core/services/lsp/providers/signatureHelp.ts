// Auto-split from LspProviders.ts
import * as monaco from 'monaco-editor';
import type { LspState } from '../types';
import { sendRequest, sendNotify } from '../LspTransport';
import { getDocUri, fromLspUri } from '../utils/uriHelpers';
export function registerSignatureHelp(state: LspState): void {
  state.disposables.push(
    monaco.languages.registerSignatureHelpProvider(state.languageId, {
      signatureHelpTriggerCharacters:   ['(', ','],
      signatureHelpRetriggerCharacters: [',', ' '],

      provideSignatureHelp: async (model, position, _token, context) => {
        if (!state.initialized) return null;

        try {
          // JIT sync: push current content before requesting signature help
          sendNotify(state, 'textDocument/didChange', {
            textDocument:   { uri: getDocUri(model, state), version: model.getVersionId() },
            contentChanges: [{ text: model.getValue() }],
          });

          // Build the LSP context object from Monaco's context
          let lspContext: any;
          if (context) {
            lspContext = {
              triggerKind:
                context.triggerKind === monaco.languages.SignatureHelpTriggerKind.TriggerCharacter ? 2
                : context.triggerKind === monaco.languages.SignatureHelpTriggerKind.ContentChange  ? 3
                : 1,
              isRetrigger:      context.isRetrigger,
              triggerCharacter: context.triggerCharacter,
            };

            // Forward the currently displayed signature so the server can
            // preserve the active-signature index across retriggers
            if (context.activeSignatureHelp) {
              lspContext.activeSignatureHelp = {
                signatures: context.activeSignatureHelp.signatures.map(s => ({
                  label:           s.label,
                  documentation:   s.documentation,
                  parameters:      s.parameters.map(p => ({
                    label:         p.label,
                    documentation: p.documentation,
                  })),
                  activeParameter: s.activeParameter,
                })),
                activeSignature: context.activeSignatureHelp.activeSignature,
                activeParameter: context.activeSignatureHelp.activeParameter,
              };
            }
          }

          const result: any = await sendRequest(state, 'textDocument/signatureHelp', {
            textDocument: { uri: getDocUri(model, state) },
            position:     { line: position.lineNumber - 1, character: position.column - 1 },
            context:      lspContext,
          });

          if (!result?.signatures?.length) return null;

          const activeSignature = result.activeSignature ?? 0;
          const activeParameter =
            result.activeParameter ?? result.signatures[activeSignature]?.activeParameter ?? 0;

          return {
            value: {
              signatures: result.signatures.map((s: any) => ({
                label:         s.label,
                documentation: typeof s.documentation === 'string'
                  ? s.documentation
                  : s.documentation?.value ?? '',
                parameters: (s.parameters ?? []).map((p: any) => ({
                  label:         p.label,
                  documentation: typeof p.documentation === 'string'
                    ? p.documentation
                    : p.documentation?.value ?? '',
                })),
                activeParameter: s.activeParameter,
              })),
              activeSignature,
              activeParameter,
            },
            dispose: () => {},
          };
        } catch {
          return null;
        }
      },
    })
  );
}
