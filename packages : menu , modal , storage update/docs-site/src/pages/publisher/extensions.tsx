import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import { useAuth, supabase } from '@site/src/hooks/useAuth';
import { DS, GLOBAL_CSS } from '@site/src/components/publisher/_ds';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const Icons = {
  Search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Package: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Extension {
  id: string;
  name: string;
  version: string;
  category: string;
  description?: string;
  downloads?: number;
  icon?: string;
  file_url?: string;
  created_at: string;
}

type SortOption = 'newest' | 'downloads' | 'name';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublisherExtensions() {
  const history = useHistory();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) history.replace('/publisher/login');
  }, [user, authLoading, history]);

  // Fetch Data
  useEffect(() => {
    if (user && profile?.publisher_id) fetchExtensions(profile.publisher_id);
  }, [user, profile]);

  const fetchExtensions = async (publisherId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('extensions')
      .select('*')
      .eq('publisher', publisherId);

    if (!error && data) setExtensions(data);
    setLoading(false);
  };

  const handleDelete = async (extId: string, fileUrl?: string) => {
    if (!window.confirm(`Delete ${extId} permanently? This action cannot be reversed.`)) return;
    
    try {
      if (fileUrl) await supabase.storage.from('extensions').remove([fileUrl]);
      const { error } = await supabase.from('extensions').delete().eq('id', extId);
      if (error) throw error;
      setExtensions(prev => prev.filter(ext => ext.id !== extId));
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  // Derived State: Filtered & Sorted Extensions
  const processedExtensions = useMemo(() => {
    let result = [...extensions];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ext => 
        ext.name.toLowerCase().includes(q) || 
        ext.id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [extensions, searchQuery, sortBy]);


  // ─── Renderers ─────────────────────────────────────────────────────────────
  if (authLoading || !user) {
    return (
      <Layout title="Extensions | Mono Studio">
        <style>{GLOBAL_CSS}</style>
        <div className="ds-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${DS.border}`, borderTopColor: DS.accent, animation: 'ds-pulse 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Extensions | Mono Studio">
      <style>{GLOBAL_CSS}</style>
      <div className="ds-page" style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          
          {/* ── Page Header & Controls ── */}
          <div className="ds-animate-in" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#fff' }}>
                  My Extensions
                </h1>
                <p style={{ color: DS.textMuted, margin: 0, fontSize: '15px' }}>
                  Manage your deployed packages, analyze usage, and publish updates.
                </p>
              </div>
              
              <Link to="/publisher/upload" className="ds-btn ds-btn-primary">
                {Icons.Plus} Publish Extension
              </Link>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingBottom: '24px', borderBottom: `1px solid ${DS.border}` }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '10px', color: DS.textFaint }}>
                  {Icons.Search}
                </div>
                <input 
                  type="text" 
                  className="ds-input" 
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              
              <select 
                className="ds-input" 
                style={{ width: 'auto', appearance: 'none', cursor: 'pointer', paddingRight: '32px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">Sort by Latest</option>
                <option value="downloads">Sort by Downloads</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* ── Main Content Area ── */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '200px', background: DS.surface, borderRadius: DS.radius3, border: `1px solid ${DS.border}`, animation: 'ds-pulse 1.5s infinite ease-in-out' }} />
              ))}
            </div>
          ) : processedExtensions.length === 0 ? (
            <div className="ds-animate-in" style={{ textAlign: 'center', padding: '80px 20px', border: `1px dashed ${DS.border}`, borderRadius: DS.radius3, background: DS.surface }}>
              <div style={{ color: DS.borderHover, marginBottom: '16px' }}>{Icons.Package}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>No extensions found</h3>
              <p style={{ color: DS.textMuted, margin: '0 0 24px 0', fontSize: '14px' }}>
                {searchQuery ? 'Adjust your search filters to find what you are looking for.' : 'You have not published any extensions to the registry yet.'}
              </p>
              {!searchQuery && (
                <Link to="/publisher/upload" className="ds-btn ds-btn-primary">
                  Create First Extension
                </Link>
              )}
            </div>
          ) : (
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {processedExtensions.map((ext, idx) => (
                <div 
                  key={ext.id} 
                  className="ds-slide-in ds-card-hover"
                  onClick={() => history.push(`/store/item?id=${ext.id}`)}
                  style={{ 
                    animationDelay: `${idx * 0.05}s`,
                    background: DS.surface2, 
                    borderRadius: DS.radius3, 
                    border: `1px solid ${DS.border}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer' 
                  }}
                >
                  <div className="ds-scan-line" />
                  
                  {/* Card Body */}
                  <div style={{ padding: '20px', flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {ext.icon ? (
                        <img src={ext.icon} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${DS.border}` }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: DS.surface3, border: `1px solid ${DS.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: DS.text }}>
                          {ext.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ext.name}
                        </h3>
                        <div style={{ fontFamily: DS.fontMono, fontSize: '11px', color: DS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ext.id}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: DS.text, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ext.description || 'No description provided in manifest.'}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div style={{ padding: '16px 20px', borderTop: `1px solid ${DS.border}`, background: DS.surface, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="ds-tag ds-tag-success">v{ext.version}</span>
                      <span className="ds-tag">{ext.category || 'Extension'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: DS.textMuted, fontSize: '12px', fontWeight: 600 }}>
                        {Icons.Download} {(ext.downloads || 0).toLocaleString()}
                      </div>
                      
                      {/* Actions Split */}
                      <div style={{ width: '1px', height: '16px', background: DS.border }} />
                      
                      <Link 
                        to="/publisher/upload" 
                        title="Update Extension" 
                        onClick={(e) => e.stopPropagation()} // 🌟 Stop card click when editing
                        style={{ color: DS.textMuted, cursor: 'pointer', transition: 'color 0.15s ease' }} 
                        onMouseOver={e => e.currentTarget.style.color = '#fff'} 
                        onMouseOut={e => e.currentTarget.style.color = DS.textMuted}
                      >
                        {Icons.Edit}
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // 🌟 Stop card click when deleting
                          handleDelete(ext.id, ext.file_url);
                        }}
                        title="Delete Permanently"
                        style={{ background: 'none', border: 'none', padding: 0, color: DS.danger, cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.15s ease' }} 
                        onMouseOver={e => e.currentTarget.style.opacity = '1'} 
                        onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                      >
                        {Icons.Trash}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          )}
        </div>
      </div>
    </Layout>
  );
}




