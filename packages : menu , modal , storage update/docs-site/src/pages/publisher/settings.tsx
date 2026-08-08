// src/pages/publisher/settings.tsx
import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';
import { useAuth } from '@site/src/hooks/useAuth';
import { GLOBAL_CSS, DS } from '@site/src/components/publisher/_ds';
import { SettingsSidebar } from '@site/src/components/publisher/SettingsSidebar';
import { ProfileTab }      from '@site/src/components/publisher/ProfileTab';
import { TokensTab }       from '@site/src/components/publisher/TokensTab';
import { ThemeTab }        from '@site/src/components/publisher/ThemeTab';

export default function PublisherSettings() {
  const history = useHistory();
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'theme'>('profile');

  useEffect(() => {
    if (!authLoading && !user) history.replace('/publisher/login');
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <Layout title="Loading...">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: DS.bg }}>
          <div style={{ width: '24px', height: '24px', border: `2px solid ${DS.border}`, borderTopColor: DS.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings — Mono Studio">
      <style>{GLOBAL_CSS}</style>

      <div className="ds-page" style={{ padding: '2.5rem 0 4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: '11px', fontFamily: DS.fontMono, color: DS.textFaint, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a href="/publisher" style={{ color: DS.textFaint, textDecoration: 'none' }}>dashboard</a>
              <span>/</span>
              <span style={{ color: DS.accent }}>settings</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: DS.text, margin: '0 0 4px' }}>Settings</h1>
            <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0 }}>
              Manage your profile, security tokens, and preferences.
            </p>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Content panel */}
            <div style={{
              flex:         1,
              minWidth:     '280px',
              background:   DS.surface,
              border:       `1px solid ${DS.border}`,
              borderRadius: DS.radius2,
              padding:      '2rem',
            }}>
              {activeTab === 'profile' && <ProfileTab user={user} profile={profile} />}
              {activeTab === 'tokens'  && <TokensTab user={user} />}
              {activeTab === 'theme'   && <ThemeTab />}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}