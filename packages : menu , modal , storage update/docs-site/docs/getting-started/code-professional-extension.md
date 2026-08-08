# Building a Professional Extension: The Masterclass

This section consolidates all previous concepts—lifecycle management, core APIs, and React UI integration—into a single, complex extension architecture.

## Architecture Overview

We will construct a "Command Center" extension demonstrating the following capabilities:
1. **Custom Tab Rendering:** Mounting a primary React dashboard.
2. **Native Modals:** Programmatically launching overlay dialogs containing persistent state.
3. **Complex Layouts:** Utilizing the `Collapsible` component in a static structural configuration.
4. **SidebarActions Engine:** Passing raw JSON configurations to render native drop-down menus within custom headers.
5. **Contextual Navigation:** Opening secondary tabs directly from within a nested Modal interaction.

## The Complete Implementation

Review the following implementation. It demonstrates the structural patterns required for AAA-grade extensions in Mono Studio.

```jsx
// src/main.jsx
import React, { useState } from 'react';
import { window, commands } from '@mscode/api';
import { Button, Modal, Collapsible, Icon } from '@mscode/ui';

// ─── SECONDARY VIEW ─────────────────────────────────────────────────────────

const DeepDiveReport = () => {
    return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ms-text-normal)' }}>
            <Icon name="check-all" size={64} color="var(--ms-success)" />
            <h1>Report Generated</h1>
            <p>This secondary view was instantiated programmatically from the modal interface.</p>
        </div>
    );
};

// ─── PRIMARY DASHBOARD VIEW ─────────────────────────────────────────────────

const CommandCenterDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [executionCount, setExecutionCount] = useState(0);

    // Define actions for the Collapsible header.
    // The SidebarActions engine automatically parses this array.
    const telemetryActions = [
        { id: 'act-run', icon: 'play', label: 'Run Diagnostic', onClick: () => setExecutionCount(c => c + 1) },
        { id: 'act-stop', icon: 'stop', label: 'Halt', onClick: () => window.showErrorMessage('Diagnostic halted.') },
        { id: 'sep-1', type: 'separator' },
        { id: 'act-reset', icon: 'sync', label: 'Reset Counter', onClick: () => setExecutionCount(0) },
        { id: 'act-settings', icon: 'settings-gear', label: 'Preferences', onClick: () => console.log('Preferences accessed.') },
    ];

    const launchSecondaryView = () => {
        setIsModalOpen(false); // Unmount modal before transition
        window.openTab({
            id: 'deep-dive-report-instance',
            title: 'Deep Dive Report',
            type: 'commandCenter.deepDive',
            icon: 'file-code'
        });
    };

    return (
        <div style={{ padding: '24px', color: 'var(--ms-text-normal)' }}>
            <h2>System Command Center</h2>
            <p>Initialize the diagnostic modal to monitor system states.</p>
            
            <Button 
                icon="rocket" 
                label="Launch Command Modal" 
                onClick={() => setIsModalOpen(true)} 
            />

            <Modal 
                iconName="dashboard" 
                title="Active Diagnostics" 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                footerActions={
                    <Button label="Acknowledge" variant="type2" onClick={() => setIsModalOpen(false)} />
                }
            >
                {/* Utilizing Collapsible as a static structural card.
                  Setting isCollapsible={false} disables the chevron and prevents collapsing.
                  Setting maxOverflow={2} forces the last 3 items into a native dropdown menu.
                */}
                <Collapsible 
                    title="Live Telemetry" 
                    isCollapsible={false} 
                    actions={telemetryActions} 
                    maxOverflow={2}
                    style={{ border: '1px solid var(--ms-border-color)', borderRadius: '6px', marginBottom: '20px' }}
                >
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '20px', 
                        padding: '16px',
                        backgroundColor: 'var(--ms-bg-side)'
                    }}>
                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{executionCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ms-text-faded)' }}>EXECUTIONS</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                                State management operates flawlessly within the modal boundaries.
                                Observe the header actions above: the engine automatically handles the layout
                                and overflow logic based on the provided configuration array.
                            </p>
                        </div>
                    </div>
                </Collapsible>

                <div style={{ borderTop: '1px solid var(--ms-border-color)', paddingTop: '15px' }}>
                    <Button 
                        fullWidth 
                        icon="arrow-right" 
                        iconPosition="right" 
                        label="Generate Detailed Report" 
                        onClick={launchSecondaryView}
                    />
                </div>
            </Modal>
        </div>
    );
};

// ─── EXTENSION LIFECYCLE ────────────────────────────────────────────────────

export function activate(context) {
    // 1. Register React components to the Window API
    const dashboardRegistration = window.registerCustomTab('commandCenter.dashboard', CommandCenterDashboard);
    const reportRegistration = window.registerCustomTab('commandCenter.deepDive', DeepDiveReport);

    // 2. Register the initialization command
    const initCommand = commands.registerCommand('commandCenter.start', () => {
        window.openTab({
            id: 'command-center-main',
            title: 'Command Center',
            type: 'commandCenter.dashboard',
            icon: 'layout'
        });
    });

    // 3. Ensure comprehensive memory cleanup
    context.subscriptions.push(dashboardRegistration, reportRegistration, initCommand);
}

export function deactivate() {}

```

## Summary

By understanding the execution lifecycle, leveraging the virtual module system, and utilizing the native React UI framework, you possess the capability to build highly performant, deeply integrated extensions for Mono Studio.

The architecture patterns demonstrated in these guides ensure that your extensions remain secure, memory-efficient, and visually indistinguishable from the core IDE interface.