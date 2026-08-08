/**
 * ============================================================================
 * {{EXT_NAME}} - SIDEBAR ARCHITECTURE CORE
 * ============================================================================
 */

import * as React from 'react';
import { window, commands, workspace } from '@mscode/api';
import manifest from '../manifest.json';

/**
 * Called once when the extension activates.
 * @param {import('@mscode/api').ExtensionContext} context
 */
export async function activate(context) {
    const cPrefix = "{{CMD_PREFIX}}";
    const extName = manifest.name;

    console.log(` Extension [${extName}] Bootstrapping: Sidebar Pipeline Active.`);

    const activityBarId = `${cPrefix}-sidebar-panel`;

    /* ==========================================================================
     * DYNAMIC REGISTRATION SKIPPED (Recommended)
     * ==========================================================================
     * Since we have already declared the sidebar panel in manifest.json under
     * [contributes.activityBar], the core synchronization engine 
     * automatically registers this panel at boot time.
     * * We keep dynamic registration commented out to avoid duplicate panels.
     * Uncomment only if you need runtime header actions or custom title overrides.
     * ========================================================================== 
     
    window.sidebar.registerPanel({
        activityBarId: activityBarId,
        header: {
            title: `${extName} Engine`,
            maxOverflow: 2,
            actions: [
                {
                    id: `${cPrefix}.refreshSidebar`,
                    label: "Refresh Analytics",
                    icon: "refresh",
                    callback: () => {
                        window.showInformationMessage(`Refreshing ${extName} metrics workspace...`);
                    }
                }
            ]
        }
    });
    */

    // ==========================================================================
    // 1. Primary Section - Workspace Diagnostics
    // ==========================================================================
    const primarySectionDisposer = window.sidebar.addSection(activityBarId, {
        id: `${cPrefix}.primarySection`,
        title: "Workspace Diagnostics",
        defaultExpanded: true,
        fillHeight: true,
        scrollX: false,
        maxOverflow: 2, // 0 for ⋮ three dot menu 
        actions: [
            {
                id: `${cPrefix}.sectionSetting`,
                label: "Configure View",
                icon: "gear",
                callback: () => {
                    commands.executeCommand("workbench.action.openSettings", cPrefix);
                }
            }
        ],

        content: (ctx) => (
            <div style={{ padding: '12px', fontSize: '13px', color: 'var(--ms-text-normal, #cccccc)' }}>
                
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--ms-accent-color, #007acc)' }}>
                    Live Telemetry Channel
                </div>
                
                <p style={{ margin: '4px 0', fontSize: '11px', color: 'var(--ms-text-faded)' }}>
                    Sandbox Node State: <span style={{ color: '#4fc1ff' }}>Active</span>
                </p>
                
                <hr style={{ border: 0, borderTop: '1px solid var(--ms-border-color, #333333)', margin: '10px 0' }} />
                
                <button 
                    style={{ 
                        width: '100%', padding: '6px', background: 'var(--ms-button-bg, #007acc)', 
                        color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' 
                    }}
                    onClick={() => {
                        const config = workspace.getConfiguration(`${cPrefix}.sidebar.autoRefresh`);
                        window.showInformationMessage(`Diagnostic Hook Fired! Config Auto-Refresh is: ${config}`);
                    }}
                >
                    Execute Internal Trace
                </button>

            </div>
        )
    });

    // ==========================================================================
    // 2. Secondary Section - Active References
    // ==========================================================================
    const secondarySectionDisposer = window.sidebar.addSection(activityBarId, {
        id: `${cPrefix}.secondarySection`,
        title: "Active References",
        defaultExpanded: false,
        defaultHeight: 120,

        content: () => (
            <div style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--ms-text-faded)' }}>
                No active trace logs or dependencies declared in scope.
            </div>
        )
    });

    // ==========================================================================
    // 3. Command Registration
    // ==========================================================================
    const focusCmdDisposer = commands.registerCommand(`${cPrefix}.focusSidebar`, () => {
        window.sidebar.focusPanel(activityBarId);
        window.sidebar.setState('expanded');
    });

    // ==========================================================================
    // 4. Cleanup
    // ==========================================================================
    context.subscriptions.push({
        dispose: () => {
            primarySectionDisposer.dispose();
            secondarySectionDisposer.dispose();
            focusCmdDisposer.dispose();
        }
    });
}

export function deactivate() {}