// src/core/bootstrap/actions/snippetsActions.ts
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { userSnippetsService } from '@/core/services/userSnippetsService';
import { useLanguageStore } from '@/store/languageStore';
import { usePaletteStore } from '@/store/paletteStore';

export function registerSnippetsActions(): void {
  commands.registerCommand(
    'workbench.action.openSnippets',
    () => {
      const langs = useLanguageStore.getState().getAvailableLanguages();
      const items = langs.map(l => ({
        id: l.id,
        label: l.aliases?.[0] || l.id,
        description: `Configure snippets for ${l.id}`,
        leftIcon: 'json',
        onSelect: () => userSnippetsService.openSnippetFile(l.id),
      }));
      usePaletteStore.getState().openQuickPick(
        'Select Language for Snippet',
        items,
        sel => sel.onSelect?.(),
      );
    },
    {
      title: 'Preferences: Configure User Snippets',
      category: 'Preferences',
      icon: 'json',
    },
  );
}
