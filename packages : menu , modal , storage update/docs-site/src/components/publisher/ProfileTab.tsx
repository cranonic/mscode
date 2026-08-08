// src/components/publisher/ProfileTab.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@site/src/hooks/useAuth';
import { DS } from './_ds';

const roles = [
  { value: 'student',    label: 'Student / Hobbyist' },
  { value: 'developer',  label: 'Professional Developer' },
  { value: 'enterprise', label: 'Organization / Enterprise' },
];

export const ProfileTab: React.FC<{ user: any; profile: any }> = ({ user, profile }) => {
  const [displayName, setDisplayName] = useState('');
  const [email,       setEmail]       = useState('');
  const [role,        setRole]        = useState('developer');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setRole(profile.role || 'developer');
      setEmail(profile.email || user?.email || '');
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase.from('publishers').update({
        display_name: displayName, avatar_url: avatarUrl, role, email,
      }).eq('id', user.id);
      if (error) throw error;
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ds-animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Public Profile</h2>
        <p style={{ fontSize: '13px', color: DS.textMuted, margin: 0 }}>
          This information appears on your publisher page in the Mono Studio Marketplace.
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: DS.radius,
          marginBottom: '1.5rem',
          fontSize: '13px',
          background:   msg.type === 'success' ? DS.successDim : DS.dangerDim,
          color:        msg.type === 'success' ? DS.success : DS.danger,
          border:       `1px solid ${msg.type === 'success' ? DS.success + '30' : DS.danger + '30'}`,
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
        }}>
          {msg.type === 'success' ? '✓' : '✗'} {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Publisher ID — readonly */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="ds-label">Publisher ID</label>
          <input
            type="text"
            disabled
            value={profile?.publisher_id || ''}
            className="ds-input"
            style={{ opacity: 0.5, cursor: 'not-allowed', fontFamily: DS.fontMono, fontSize: '12px' }}
          />
          <div style={{ marginTop: '4px', fontSize: '11px', color: DS.textFaint }}>
            Permanent marketplace identifier — cannot be changed.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="ds-label">Display Name</label>
            <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} className="ds-input" />
          </div>
          <div>
            <label className="ds-label">Contact Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="ds-input" />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="ds-label">Account Type</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="ds-input">
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label className="ds-label">Avatar URL <span style={{ color: DS.textFaint, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {avatarUrl && (
              <img src={avatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${DS.border}`, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            )}
            <input type="url" placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="ds-input" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="ds-btn ds-btn-primary" style={{ padding: '9px 20px' }}>
          {saving ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Saving…
            </>
          ) : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};