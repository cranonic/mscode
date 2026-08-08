// src/pages/publisher/index.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import { useAuth, supabase } from '@site/src/hooks/useAuth';
import { GLOBAL_CSS, DS } from '@site/src/components/publisher/_ds';
import { StatsGrid }      from '@site/src/components/publisher/StatsGrid';
import { ExtensionTable } from '@site/src/components/publisher/ExtensionTable';

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function PublisherDashboard() {
  const history = useHistory();
  const { user, profile, loading: authLoading } = useAuth();

  const [extensions, setExtensions] = useState<any[]>([]);
  const [stats,      setStats]      = useState({ totalExtensions: 0, totalDownloads: 0 });
  const [dataLoading,setDataLoading]= useState(true);

  useEffect(() => {
    if (!authLoading && !user) history.replace('/publisher/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user && profile?.publisher_id) fetchExtensions(profile.publisher_id);
  }, [user, profile]);

  const fetchExtensions = async (publisherId: string) => {
    setDataLoading(true);
    const { data, error } = await supabase
      .from('extensions')
      .select('*')
      .eq('publisher', publisherId)
      .order('version', { ascending: false });

    if (!error && data) {
      setExtensions(data);
      setStats({
        totalExtensions: data.length,
        totalDownloads:  data.reduce((a, b) => a + (b.downloads ?? 0), 0),
      });
    }
    setDataLoading(false);
  };

  const handleDelete = async (extId: string, fileUrl: string) => {
    if (!window.confirm('Permanently delete this extension? This cannot be undone.')) return;
    try {
      if (fileUrl) await supabase.storage.from('extensions').remove([fileUrl]);
      const { error } = await supabase.from('extensions').delete().eq('id', extId);
      if (error) throw error;
      setExtensions(p => p.filter(e => e.id !== extId));
      setStats(p => ({ ...p, totalExtensions: p.totalExtensions - 1 }));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

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
    <Layout title="Dashboard — Mono Studio">
      <style>{GLOBAL_CSS}</style>

      <div className="ds-page" style={{ padding: '2.5rem 0 4rem' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              {/* Breadcrumb */}
              <div style={{ fontSize: '11px', fontFamily: DS.fontMono, color: DS.textFaint, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>mono-studio</span>
                <span>/</span>
                <span style={{ color: DS.textMuted }}>{profile?.publisher_id || '...'}</span>
                <span>/</span>
                <span style={{ color: DS.accent }}>dashboard</span>
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: DS.text, margin: '0 0 6px', lineHeight: 1.2 }}>
                Welcome back, <span style={{ color: DS.accent }}>{profile?.display_name || 'Publisher'}</span>
              </h1>
              <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0 }}>
                Manage your packages and monitor analytics.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Link to="/publisher/settings" className="ds-btn ds-btn-ghost">
                <SettingsIcon /> Settings
              </Link>
              <Link to="/publisher/upload" className="ds-btn ds-btn-primary">
                <UploadIcon /> Publish Extension
              </Link>
            </div>
          </div>

          {/* ── Stats ──────────────────────────────────────────────────── */}
          <StatsGrid {...stats} loading={dataLoading} />

          {/* ── Extensions table ───────────────────────────────────────── */}
          <div style={{
            border:       `1px solid ${DS.border}`,
            borderRadius: DS.radius2,
            overflow:     'hidden',
            background:   DS.surface,
          }}>
            {/* Table header */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '14px 16px',
              borderBottom:   `1px solid ${DS.border}`,
              background:     DS.surface2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: DS.text }}>
                  Published Packages
                </span>
                {!dataLoading && (
                  <span className="ds-tag">
                    {extensions.length}
                  </span>
                )}
              </div>

              <Link to="/publisher/extensions" style={{ fontSize: '12px', color: DS.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Browse all extensions
              </Link>
            </div>

            <ExtensionTable
              extensions={extensions}
              loading={dataLoading}
              onDelete={handleDelete}
            />
          </div>

        </div>
      </div>
    </Layout>
  );
}