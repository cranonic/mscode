// src/components/TabView/TabView.tsx
import React, { useState } from 'react';
import './TabView.css';

export interface Tab {
  id:      string;
  label:   string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs:         Tab[];
  defaultTabId?: string;
}

export const TabView: React.FC<TabViewProps> = ({ tabs, defaultTabId }) => {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id ?? '');

  const active = tabs.find(t => t.id === activeId) ?? tabs[0];

  return (
    <div className="tv-root">
      {/* ── Tab strip ───────────────────────────────────────────────── */}
      <div className="tv-strip" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeId}
            className={`tv-tab ${tab.id === activeId ? 'tv-tab--active' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="tv-body" role="tabpanel">
        {active?.content}
      </div>
    </div>
  );
};