// src/core/bootstrap/actions/themeActions.ts
import { commands } from '@/core/extensionAPI/registry/commandRegistry';
import { usePaletteStore } from '@/store/paletteStore';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import { themeService } from '@/core/theme/service/themeService';
import { iconThemeService } from '@/core/theme/service/iconThemeService';

export function registerThemeActions(): void {
  commands.registerCommand('workbench.action.selectTheme', () => {
    const activeThemeId = themeService.getActiveThemeId();
    const items = themeService.getAllThemes().map(t => ({
      id:        t.definition.id,
      label:     t.definition.name,
      suffix:    t.definition.id === activeThemeId ? ' - configured color theme' : undefined,
      rightIcon: t.definition.id === activeThemeId ? 'check' : undefined,
      onSelect:  () => themeService.applyTheme(t.definition.id),
    }));
    usePaletteStore.getState().openQuickPick('Select Color Theme', items, sel => sel.onSelect?.());
  });

  commands.registerCommand('workbench.action.selectIconTheme', () => {
    const activeIconId =
      useSettingsStore.getState().settings['workbench.iconTheme'] || 'mscode-icons';
    const items = iconThemeService.getAllThemes().map(t => ({
      id:        t.id,
      label:     t.name,
      suffix:    t.id === activeIconId ? ' - configured icon theme' : undefined,
      rightIcon: t.id === activeIconId ? 'check' : undefined,
      onSelect:  () => iconThemeService.applyTheme(t.id),
    }));
    usePaletteStore.getState().openQuickPick('Select File Icon Theme', items, sel => sel.onSelect?.());
  });
}
