// src/features/termis/TermisPanel.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useTermisStore } from './store/termisStore';
import { useTerminalStore } from './components/terminal/store/terminalStore';
import type { ExecMode } from './components/terminal';
import { useExplorerStore } from '@/features/explorer/store/exploreStore';
import { OutputPanel } from './components/output/components/OutputPanel';
import { ProblemsPanel } from './components/problems/ProblemsPanel';
import { TerminalInstance } from './components/terminal/components/TerminalInstance';
import { terminalProcessRegistry } from './components/terminal/core/TerminalRegistry';
import { Icon } from '@/ui/components/Icon/IconRegistry';
import { useMenuStore, type MenuItem } from '@/store/menuStore';
import { Modal } from '@/ui/components/Modal/Modal';
import './TermisPanel.css';

const STATUS_COLOR: Record<string, string> = {
  initializing: '#888',
  ready:        '#4ec9b0',
  busy:         '#dcdcaa',
  exited:       '#888',
  error:        '#f44747',
};

export const TermisPanel: React.FC<{ mode?: 'panel' | 'fullscreen' }> = ({ mode = 'panel' }) => {
  const { isOpen, panelHeight, activeView, setActiveView, closePanel } = useTermisStore();

  const {
    instances,
    activeId,
    setActive,
    removeInstance,
    renameInstance,
    requestSpawn,
    confirmExclusiveSpawn,
    isSwitchingMode,
  } = useTerminalStore();

  const openMenuDirect = useMenuStore(s => s.openMenuDirect);
  const workspacePath = useExplorerStore(s => s.workspacePath);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Exclusive-kill confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [pendingMode, setPendingMode] = useState<ExecMode | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  if (!isOpen && mode === 'panel') return null;

  const spawnOpts = () => ({
    workingDir: workspacePath || '/storage/emulated/0',
    title: 'Terminal',
  });

  /** Picker result → exclusive plan → spawn or confirm. */
  const openNewTerminal = async (mode: ExecMode) => {
    if (isSwitchingMode) {
      setStatusToast('Cleaning up other sessions… please wait.');
      return;
    }

    const result = requestSpawn(mode, spawnOpts());

    if (result.blocked) {
      setStatusToast(result.blocked);
      return;
    }

    if (result.ok && result.id) {
      setActiveView('terminal');
      return;
    }

    const plan = result.plan;
    if (plan && plan.toKill.length > 0) {
      if (plan.needsConfirm) {
        setPendingMode(mode);
        setConfirmMsg(plan.confirmMessage);
        setConfirmOpen(true);
        return;
      }
      // Auto-kill without confirm (idle + SKIP_CONFIRM_IF_IDLE)
      setStatusToast('Closing other sessions…');
      const r = await confirmExclusiveSpawn(mode, spawnOpts());
      setStatusToast(r.ok ? null : r.error || null);
      if (r.ok) setActiveView('terminal');
      return;
    }

    if (result.blocked) setStatusToast(result.blocked);
  };

  const handleConfirmYes = async () => {
    setConfirmOpen(false);
    if (!pendingMode) return;
    setStatusToast('Closing other sessions…');
    const r = await confirmExclusiveSpawn(pendingMode, spawnOpts());
    setPendingMode(null);
    setStatusToast(r.ok ? null : r.error || null);
    if (r.ok) setActiveView('terminal');
  };

  const handleConfirmNo = () => {
    setConfirmOpen(false);
    setPendingMode(null);
    // User stays on picker conceptually — menu already closed; they can press + again
  };

  const handleNewTerminal = () => {
    void openNewTerminal('native');
  };

  const openNewTerminalMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSwitchingMode) {
      setStatusToast('Cleaning up other sessions… please wait.');
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.round(rect.left);
    const y = Math.round(rect.bottom + 4);

    const items: MenuItem[] = [
      {
        id: 'termis.new.native',
        label: 'Android bionic',
        description: 'Native shell',
        icon: 'terminal',
        onClick: () => { void openNewTerminal('native'); },
      },
      {
        id: 'termis.new.proot',
        label: 'Linux proot',
        description: 'Alpine (network rootfs)',
        icon: 'server',
        onClick: () => { void openNewTerminal('proot'); },
      },
    ];

    openMenuDirect(x, y, items);
  };

  const handleClear = () => {
    if (!activeId) return;
    terminalProcessRegistry.get(activeId)?.clear?.();
  };

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setEditTitle(current);
  };

  const commitRename = () => {
    if (editingId) {
      renameInstance(editingId, editTitle);
      setEditingId(null);
    }
  };

  const cancelRename = () => setEditingId(null);

  return (
    <div
      className={`ms-termis-panel ${mode}`}
      style={mode === 'panel' ? { height: panelHeight } : { height: '100%' }}
    >
      {mode === 'panel' && <div className="ms-panel-resizer" />}

      <div className="ms-panel-header">
        <div className="ms-panel-tabs">
          <div
            className={`ms-panel-tab ${activeView === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveView('problems')}
          >
            PROBLEMS
          </div>
          <div
            className={`ms-panel-tab ${activeView === 'output' ? 'active' : ''}`}
            onClick={() => setActiveView('output')}
          >
            OUTPUT
          </div>
          <div
            className={`ms-panel-tab ${activeView === 'terminal' ? 'active' : ''}`}
            onClick={() => {
              if (instances.length === 0) handleNewTerminal();
              setActiveView('terminal');
            }}
          >
            TERMINAL
          </div>
        </div>

        <div className="ms-panel-actions">
          {activeView === 'terminal' && (
            <>
              <button
                type="button"
                title="New Terminal"
                disabled={isSwitchingMode}
                onClick={openNewTerminalMenu}
              >
                <Icon name="add" size={14} />
              </button>
              <button type="button" title="Clear Terminal" onClick={handleClear}>
                <Icon name="clear-all" size={14} />
              </button>
              <button
                type="button"
                title="Toggle Terminal Sidebar"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Icon name="menu" size={14} />
              </button>
            </>
          )}
          {mode === 'panel' && (
            <button
              type="button"
              title="Close Panel"
              onClick={closePanel}
              style={{ marginLeft: '8px' }}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {(isSwitchingMode || statusToast) && (
        <div className="ms-termis-status-bar">
          {isSwitchingMode ? 'Cleaning up…' : statusToast}
          {statusToast && !isSwitchingMode && (
            <button type="button" onClick={() => setStatusToast(null)}>
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
      )}

      <div className="ms-panel-body">
        <div
          style={{
            display: activeView === 'terminal' ? 'flex' : 'none',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            className="ms-terminal-instances-container"
            style={{ flexGrow: 1, position: 'relative' }}
          >
            {instances.length === 0 && <EmptyTerminalState onNew={handleNewTerminal} />}
            {instances.map(inst => (
              <TerminalInstance
                key={inst.id}
                terminalId={inst.id}
                isActive={inst.id === activeId}
              />
            ))}
          </div>

          {isSidebarOpen && instances.length > 0 && (
            <div className="ms-terminal-inner-sidebar">
              {instances.map(inst => {
                const badge = inst.execMode === 'proot' ? 'linux' : 'native';
                const isEditing = editingId === inst.id;
                return (
                  <div
                    key={inst.id}
                    className={`ms-terminal-sidebar-item ${inst.id === activeId ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditing) setActive(inst.id);
                    }}
                  >
                    <div className="ms-terminal-sidebar-item-left">
                      <div
                        className="ms-terminal-status-dot"
                        style={{ backgroundColor: STATUS_COLOR[inst.status] ?? '#888' }}
                      />
                      <Icon name="terminal" size={14} />
                      <div className="ms-terminal-sidebar-title-block">
                        {isEditing ? (
                          <input
                            ref={renameInputRef}
                            className="ms-terminal-rename-input"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onBlur={commitRename}
                          />
                        ) : (
                          <span
                            className="ms-terminal-sidebar-title"
                            title="Double-click to rename"
                            onDoubleClick={e => {
                              e.stopPropagation();
                              startRename(inst.id, inst.title);
                            }}
                          >
                            {inst.title}
                          </span>
                        )}
                        <span className="ms-terminal-runtime-badge">{badge}</span>
                      </div>
                    </div>
                    <div className="ms-terminal-sidebar-item-actions">
                      <button
                        type="button"
                        title="Close"
                        onClick={e => {
                          e.stopPropagation();
                          removeInstance(inst.id);
                        }}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeView === 'output' && <OutputPanel />}
        {activeView === 'problems' && <ProblemsPanel />}
      </div>

      <Modal
        isOpen={confirmOpen}
        title="Switch terminal type"
        iconName="warning"
        onClose={handleConfirmNo}
        footerActions={
          <>
            <button type="button" className="ms-termis-modal-btn secondary" onClick={handleConfirmNo}>
              Cancel
            </button>
            <button type="button" className="ms-termis-modal-btn primary" onClick={() => { void handleConfirmYes(); }}>
              Continue
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ms-text-main)' }}>
          {confirmMsg}
        </p>
      </Modal>
    </div>
  );
};

const EmptyTerminalState: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="ms-empty-terminal">
    <Icon name="terminal" size={32} color="var(--ms-text-faded)" />
    <span>No terminal sessions</span>
    <button type="button" onClick={onNew}>
      New Terminal
    </button>
  </div>
);
