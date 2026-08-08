// src/features/settings/components/SettingItem.tsx

import React, { memo, useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/features/settings/store/settingsStore';
import type { SettingDefinition } from '@/core/extensionAPI/registry/configurationRegistry';
import { Checkbox } from '@/ui/components/Checkbox/Checkbox';
import { Select } from '@/ui/components/Select/Select';
import { InputBox } from '@/ui/components/InputBox/InputBox';
import { Button } from '@/ui/components/Button/Button';
import { RichText } from '@/ui/components/RichText/RichText';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { ModalEditor } from '@/ui/components/ModalEditor/ModalEditor';
import { useMenuStore, type MenuItem } from '@/store/menuStore';
import './SettingItem.css';

interface ArrayEditorProps {
  value: unknown;
  onChange: (value: string[]) => void;
}

const ArrayEditor: React.FC<ArrayEditorProps> = ({ value, onChange }) => {
  const items = Array.isArray(value) ? (value as string[]) : [];

  const handleUpdate = (idx: number, newVal: string) => {
    const newArr = [...items];
    newArr[idx] = newVal;
    onChange(newArr);
  };

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    if (items.length > 0 && items[items.length - 1] === '') return;
    onChange([...items, '']);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxWidth: '400px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            value={item}
            onChange={(e) => handleUpdate(idx, e.target.value)}
            style={{
              flex: 1,
              background: 'var(--ms-bg-main)',
              color: 'var(--ms-text-main)',
              border: '1px solid var(--ms-border-light)',
              outline: 'none',
              padding: '4px 8px',
              fontSize: '13px',
              borderRadius: '0',
            }}
          />
          <div
            onClick={() => handleRemove(idx)}
            style={{ cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <Icon name="close" size={14} />
          </div>
        </div>
      ))}
      <button
        onClick={handleAdd}
        disabled={items.length > 0 && items[items.length - 1] === ''}
        style={{
          marginTop: '4px',
          background: 'transparent',
          border: '1px dashed var(--ms-border-dark)',
          color: 'var(--ms-text-main)',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '12px',
          borderRadius: '0',
          opacity: items.length > 0 && items[items.length - 1] === '' ? 0.4 : 0.8,
          textAlign: 'center',
        }}
      >
        + Add Item
      </button>
    </div>
  );
};

interface SettingItemProps {
  setting: SettingDefinition;
}

async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* fall through */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

export const SettingItem: React.FC<SettingItemProps> = memo(({ setting }) => {
  const value = useSettingsStore(
    (state) => state.settings[setting.id] ?? setting.defaultValue ?? (setting as any).default,
  );

  const allSettings = useSettingsStore((state) => state.settings);
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const openMenu = useMenuStore((s) => s.openMenu);
  const openMenuDirect = useMenuStore((s) => s.openMenuDirect);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleChange = (val: unknown) => updateSetting(setting.id, val);

  // description is always treated as markdown (RichText); markdownDescription wins if both set
  let displayDescription =
    (setting as any).markdownDescription || setting.description || '';

  if (displayDescription.includes('${')) {
    displayDescription = displayDescription.replace(
      /\$\{([^}]+)\}/g,
      (match: string, settingKey: string) => {
        const replacementValue = allSettings[settingKey];
        return replacementValue !== undefined ? String(replacementValue) : match;
      },
    );
  }

  const defaultValue = setting.defaultValue ?? (setting as any).default;

  const handleLinkClick = (targetId: string) => {
    const el = document.getElementById(`setting-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background-color 0.3s';
      el.style.backgroundColor = 'var(--ms-activity-hover)';
      setTimeout(() => {
        el.style.backgroundColor = 'transparent';
      }, 1500);
    }
  };

  const openContextMenu = useCallback(
    (x: number, y: number) => {
      const menuItems: MenuItem[] = [
        {
          id: 'settings.item.reset',
          label: 'Reset Setting',
          icon: 'refresh',
          onClick: () => {
            updateSetting(setting.id, defaultValue);
          },
        },
        { id: 'settings.item.sep', type: 'separator' },
        {
          id: 'settings.item.copyId',
          label: 'Copy Setting ID',
          icon: 'copy',
          onClick: () => {
            void copyText(setting.id);
          },
        },
        {
          id: 'settings.item.copyJson',
          label: 'Copy Setting as JSON',
          icon: 'copy',
          onClick: () => {
            const payload = { [setting.id]: value };
            void copyText(JSON.stringify(payload, null, 2));
          },
        },
      ];

      try {
        if (typeof openMenuDirect === 'function') {
          openMenuDirect(x, y, menuItems);
        } else {
          openMenu('settings/item', x, y, menuItems);
        }
      } catch {
        openMenu('settings/item', x, y, menuItems);
      }
    },
    [defaultValue, openMenu, openMenuDirect, setting.id, updateSetting, value],
  );

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    clearLongPress();
    const t = e.touches[0];
    if (!t) return;
    const x = t.clientX;
    const y = t.clientY;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      openContextMenu(x, y);
    }, 550);
  };

  const onTouchEnd = () => clearLongPress();
  const onTouchMove = () => clearLongPress();

  const renderControl = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ paddingTop: '2px' }}>
              <Checkbox checked={!!value} onChange={handleChange} />
            </div>
            <div
              style={{
                color: 'var(--ms-settings-desc-color)',
                fontSize: '13px',
                lineHeight: '1.5',
                flex: 1,
              }}
            >
              <RichText text={displayDescription} onLinkClick={handleLinkClick} />
            </div>
          </div>
        );
      case 'select': {
        const selectedOption = setting.options?.find((opt) => String(opt.value) === String(value));
        // description always markdown
        const optionDescription =
          (selectedOption as any)?.markdownDescription || selectedOption?.description;
        return (
          <div style={{ marginTop: '8px', maxWidth: '300px' }}>
            <Select
              options={
                setting.options ||
                setting.enum?.map((e) => ({ value: String(e), label: String(e) })) ||
                []
              }
              value={String(value)}
              onChange={handleChange}
            />
            {optionDescription && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  marginTop: '8px',
                  color: 'var(--ms-code-fg)',
                  fontStyle: 'italic',
                  fontSize: '12px',
                  opacity: 0.9,
                }}
              >
                <span style={{ marginTop: '2px', minWidth: '14px', display: 'flex' }}>
                  <Icon name="info" size={14} />
                </span>
                <RichText text={optionDescription} onLinkClick={handleLinkClick} />
              </div>
            )}
          </div>
        );
      }
      case 'number':
      case 'string':
        return (
          <div style={{ marginTop: '8px', maxWidth: '300px' }}>
            <InputBox
              value={String(value ?? '')}
              onChange={(val) =>
                handleChange(setting.type === 'string' ? val : Number(val) || 0)
              }
            />
          </div>
        );

      case 'array': {
        const fallbackDefault = setting.defaultValue ?? (setting as any).default;
        const firstItem =
          Array.isArray(value) && value.length > 0
            ? value[0]
            : Array.isArray(fallbackDefault) && fallbackDefault.length > 0
              ? fallbackDefault[0]
              : null;

        const isComplexArray = typeof firstItem === 'object' && firstItem !== null;

        if (isComplexArray) {
          return (
            <div style={{ marginTop: '8px' }}>
              <Button
                variant="type2"
                onClick={() => setIsModalOpen(true)}
                icon={<Icon name="edit" size={14} />}
              >
                Edit JSON Array
              </Button>
              <ModalEditor
                isOpen={isModalOpen}
                title={`Edit: ${setting.title || setting.id}`}
                initialValue={value}
                type="array"
                onClose={() => setIsModalOpen(false)}
                onSave={handleChange}
              />
            </div>
          );
        }

        return <ArrayEditor value={value} onChange={handleChange} />;
      }

      case 'object':
        return (
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="type2"
              onClick={() => setIsModalOpen(true)}
              icon={<Icon name="edit" size={14} />}
            >
              Edit JSON Object
            </Button>
            <ModalEditor
              isOpen={isModalOpen}
              title={`Edit: ${setting.title || setting.id}`}
              initialValue={value}
              type="object"
              onClose={() => setIsModalOpen(false)}
              onSave={handleChange}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={rootRef}
      id={`setting-${setting.id}`}
      className={`ms-settings-item${focused ? ' ms-settings-item--focused' : ''}`}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // keep focus ring if focus moved inside the item
        if (rootRef.current?.contains(e.relatedTarget as Node)) return;
        setFocused(false);
      }}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onTouchCancel={onTouchEnd}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '14px',
            color: 'var(--ms-settings-title-color)',
            fontWeight: '600',
          }}
        >
          {setting.title || (setting as any).label || setting.id}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--ms-text-faded)',
            fontFamily: 'monospace',
            opacity: 0.6,
          }}
        >
          {setting.id}
        </span>
        {(setting as any).experimental && (
          <span
            style={{
              fontSize: '10px',
              backgroundColor: 'rgba(0, 122, 204, 0.2)',
              color: '#3794ff',
              padding: '2px 6px',
              borderRadius: '0',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            Experimental
          </span>
        )}
      </div>
      {renderControl()}
      {setting.type !== 'boolean' && displayDescription && (
        <div style={{ color: 'var(--ms-settings-desc-color)', fontSize: '13px', marginTop: '4px' }}>
          <RichText text={displayDescription} onLinkClick={handleLinkClick} />
        </div>
      )}
    </div>
  );
});
