// src/components/publisher/TokensTab.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@site/src/hooks/useAuth';
import { DS } from './_ds';

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

export const TokensTab: React.FC<{ user: any }> = ({ user }) => {
  const [tokens,       setTokens]       = useState<any[]>([]);
  const [tokenName,    setTokenName]    = useState('');
  const [expDays,      setExpDays]      = useState('30');
  const [newToken,     setNewToken]     = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => { fetchTokens(); }, []);

  const fetchTokens = async () => {
    const { data } = await supabase
      .from('publisher_tokens')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTokens(data);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = `msce_${Array.from({ length: 40 }, () => Math.floor(Math.random() * 36).toString(36)).join('')}`;
      let expiresAt: string | null = null;
      if (expDays !== 'never') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expDays));
        expiresAt = d.toISOString();
      }
      const { error } = await supabase.from('publisher_tokens').insert([{
        user_id: user.id, name: tokenName, token, expires_at: expiresAt,
      }]);
      if (error) throw error;
      setNewToken(token);
      setTokenName('');
      fetchTokens();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newToken || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Revoke this token? Applications using it will lose access immediately.')) return;
    await supabase.from('publisher_tokens').delete().eq('id', id);
    fetchTokens();
  };

  const isExpired = (exp: string | null) => exp && new Date(exp) < new Date();

  return (
    <div className="ds-animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Personal Access Tokens</h2>
        <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0 }}>
          Authenticate with the Mono Studio Registry CLI using these tokens.
        </p>
      </div>

      {/* New token reveal */}
      {newToken && (
        <div style={{
          padding: '1rem 1.25rem',
          background: DS.warningDim,
          border: `1px solid ${DS.warning}40`,
          borderRadius: DS.radius2,
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: DS.warning, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚠</span> Save this token — it will never be shown again
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              readOnly
              value={newToken}
              className="ds-input"
              style={{ fontFamily: DS.fontMono, fontSize: '12px', background: DS.surface }}
              onFocus={e => e.target.select()}
            />
            <button onClick={handleCopy} className="ds-btn ds-btn-ghost" style={{ whiteSpace: 'nowrap', borderColor: DS.warning + '60', color: DS.warning }}>
              <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Generate form */}
      <form onSubmit={handleGenerate} style={{
        padding:      '1.25rem',
        background:   DS.surface2,
        borderRadius: DS.radius2,
        border:       `1px solid ${DS.border}`,
        marginBottom: '2rem',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textMuted, fontFamily: DS.fontMono, marginBottom: '1rem' }}>
          Generate New Token
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label className="ds-label">Description</label>
            <input
              type="text" required
              placeholder="e.g., CI/CD Pipeline, VS Code ext"
              value={tokenName}
              onChange={e => setTokenName(e.target.value)}
              className="ds-input"
            />
          </div>
          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="ds-label">Expiration</label>
            <select value={expDays} onChange={e => setExpDays(e.target.value)} className="ds-input">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="never">No expiry</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="ds-btn ds-btn-primary" style={{ height: '38px', flexShrink: 0 }}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>

      {/* Token list */}
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.textMuted, fontFamily: DS.fontMono, marginBottom: '10px' }}>
        Active Tokens
      </div>

      {tokens.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontSize: '13px', color: DS.textFaint, border: `1px dashed ${DS.border}`, borderRadius: DS.radius2 }}>
          No tokens generated yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tokens.map(t => {
            const expired = isExpired(t.expires_at);
            return (
              <div key={t.id} style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '12px 14px',
                border:        `1px solid ${expired ? DS.danger + '30' : DS.border}`,
                borderRadius:  DS.radius,
                background:    expired ? DS.dangerDim : DS.surface,
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: expired ? DS.danger : DS.text, marginBottom: '3px' }}>
                    {t.name}
                    {expired && <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, fontFamily: DS.fontMono, color: DS.danger }}>EXPIRED</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: DS.textFaint, fontFamily: DS.fontMono }}>
                    <span>Created {new Date(t.created_at).toLocaleDateString()}</span>
                    <span style={{ color: expired ? DS.danger : DS.textFaint }}>
                      Expires: {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleRevoke(t.id)} className="ds-btn ds-btn-danger" style={{ padding: '5px 12px', fontSize: '12px' }}>
                  Revoke
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};