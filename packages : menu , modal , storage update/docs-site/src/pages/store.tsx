import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { supabase } from '@site/src/hooks/useAuth';
import { DS, GLOBAL_CSS } from '@site/src/components/publisher/_ds';

// ─── Inline SVGs (Premium Vercel/Linear Style) ───────────────────────────────
const Icons = {
  Search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Verified: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 4.5L18.5 4L19 7.5L22 9.5L20 12.5L22 15.5L19 17.5L18.5 21L15 20.5L12 23L9 20.5L5.5 21L5 17.5L2 15.5L4 12.5L2 9.5L5 7.5L5.5 4L9 4.5L12 2ZM10.5 16.5L17.5 9.5L16 8L10.5 13.5L8 11L6.5 12.5L10.5 16.5Z"/></svg>,
  Code: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Filter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Grid: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
};

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface StoreExtension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  category: string;
  description?: string;
  downloads: number;
  rating: number;
  icon?: string;
  created_at: string;
  publishers?: { display_name: string; avatar_url: string }; // Optional joined data
}

const CATEGORIES = ['All', 'Themes', 'Snippets', 'Formatters', 'Linters', 'AI', 'Other'];
type SortOption = 'popular' | 'newest' | 'az';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ExtensionStore() {
  const [extensions, setExtensions] = useState<StoreExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    fetchStoreData();
  }, []);

  // 🛡️ BULLETPROOF FETCHING LOGIC
  const fetchStoreData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // 1st Attempt: Try fetching with the relational JOIN
      const { data: joinedData, error: joinError } = await supabase
        .from('extensions')
        .select(`*, publishers(display_name, avatar_url)`);
        
      if (!joinError && joinedData) {
        setExtensions(joinedData as StoreExtension[]);
      } 
      else {
        // 2nd Attempt: If join fails (e.g. PGRST200), fallback to standard basic fetch
        console.warn("Relational JOIN failed. Falling back to basic fetch.", joinError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('extensions')
          .select('*');

        if (fallbackError) throw fallbackError;
        setExtensions((fallbackData || []) as StoreExtension[]);
      }
    } catch (err: any) {
      console.error("Store Fetch Error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Data Processing (Search, Filter, Sort) ───
  const processedData = useMemo(() => {
    let result = [...extensions];

    // Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(ext => 
        (ext.category || 'Other').toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Filter by Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(ext => 
        ext.name.toLowerCase().includes(q) || 
        ext.id.toLowerCase().includes(q) ||
        (ext.description || '').toLowerCase().includes(q) ||
        ext.publisher.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'popular') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'az') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [extensions, search, activeCategory, sortBy]);

  // ─── Sub-Components ───
  const SkeletonLoader = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{ height: '180px', background: DS.surface, borderRadius: DS.radius3, border: `1px solid ${DS.border}`, animation: 'ds-pulse 1.5s infinite ease-in-out' }} />
      ))}
    </div>
  );

  return (
    <Layout title="Extension Store | Mono Studio" description="Discover and install extensions for Mono Studio IDE.">
      <style>{GLOBAL_CSS}</style>
      
      <div className="ds-page" style={{ paddingBottom: '80px' }}>
        
        {/* ── HERO BANNER ── */}
        <div style={{ 
          background: `linear-gradient(180deg, ${DS.bg} 0%, ${DS.surface2} 100%)`, 
          borderBottom: `1px solid ${DS.border}`,
          padding: '80px 20px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: DS.accentGlow, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
          
          <div className="ds-animate-in" style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <div className="ds-tag ds-tag-accent" style={{ marginBottom: '20px', padding: '6px 12px', fontSize: '12px' }}>
              {Icons.Code} Mono Studio Ecosystem
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 16px 0', lineHeight: 1.1 }}>
              Supercharge your IDE.
            </h1>
            <p style={{ fontSize: '18px', color: DS.textMuted, margin: '0 0 40px 0', lineHeight: 1.6 }}>
              Discover powerful extensions, themes, and language servers built by the community to customize your mobile coding experience.
            </p>
            
            {/* Massive Search Bar */}
            <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', boxShadow: DS.shadow2, borderRadius: DS.radius3 }}>
              <div style={{ position: 'absolute', left: '20px', top: '18px', color: DS.textFaint }}>
                {Icons.Search}
              </div>
              <input 
                type="text" 
                placeholder="Search extensions, themes, or publishers..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '18px 20px 18px 52px', 
                  fontSize: '16px', background: DS.surface, border: `1px solid ${DS.borderBright}`, 
                  color: '#fff', borderRadius: DS.radius3, outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: DS.fontSans
                }}
                onFocus={(e) => e.target.style.borderColor = DS.accent}
                onBlur={(e) => e.target.style.borderColor = DS.borderBright}
              />
            </div>
          </div>
        </div>

        {/* ── MAIN STORE LAYOUT ── */}
        <div className="container" style={{ maxWidth: '1200px', marginTop: '40px' }}>
          
          {/* Controls / Filter Bar */}
          <div className="ds-slide-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
            
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    background: activeCategory === cat ? DS.text : DS.surface,
                    color: activeCategory === cat ? DS.bg : DS.textMuted,
                    border: `1px solid ${activeCategory === cat ? DS.text : DS.border}`,
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: DS.textMuted, fontSize: '13px' }}>{Icons.Filter} Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="ds-input"
                style={{ width: '160px', padding: '6px 12px' }}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Recently Added</option>
                <option value="az">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* ── ERROR STATE ── */}
          {fetchError && !loading && (
            <div style={{ padding: '20px', background: DS.dangerDim, border: `1px solid ${DS.danger}`, borderRadius: DS.radius2, color: DS.danger, marginBottom: '24px' }}>
              <strong>Error Loading Extensions:</strong> {fetchError}. Please check your database rules.
            </div>
          )}

          {/* ── EXTENSION GRID ── */}
          {loading ? (
            <SkeletonLoader />
          ) : processedData.length === 0 && !fetchError ? (
            <div className="ds-animate-in" style={{ textAlign: 'center', padding: '100px 20px', border: `1px dashed ${DS.border}`, borderRadius: DS.radius3, background: DS.surface }}>
              <div style={{ color: DS.borderHover, marginBottom: '20px' }}>{Icons.Grid}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff' }}>No extensions found</h3>
              <p style={{ color: DS.textMuted, margin: 0, fontSize: '15px' }}>
                {extensions.length === 0 ? "The registry is currently empty. Be the first to publish an extension!" : "Try adjusting your search or category filters."}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {processedData.map((ext, idx) => {
                // Defensive checks for UI robustness
                const publisherName = ext.publishers?.display_name || ext.publisher || 'Unknown';
                const isVerified = ext.publisher === 'cranonic'; // Custom logic for verified tag

                return (
                  <Link
                    key={ext.id}
                    to={`/store/item?id=${ext.id}`} // 🌟 THE FIX: Pass the ID correctly as a URL parameter
                    className="ds-slide-in ds-card-hover"
                    style={{
                      animationDelay: `${idx * 0.04}s`,
                      display: 'flex', flexDirection: 'column',
                      background: DS.surface, borderRadius: DS.radius3,
                      border: `1px solid ${DS.border}`, padding: '24px',
                      textDecoration: 'none', color: 'inherit',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                      {/* Icon */}
                      {ext.icon ? (
                        <img src={ext.icon} alt={ext.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: `1px solid ${DS.border}`, background: DS.surface3 }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: DS.surface3, border: `1px solid ${DS.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: DS.text }}>
                          {ext.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Headers */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ext.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: DS.textMuted }}>
                          <span>{publisherName}</span>
                          {isVerified && <span style={{ color: DS.accent, display: 'flex' }} title="Verified Publisher">{Icons.Verified}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: DS.textMuted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                      {ext.description || 'No description provided.'}
                    </p>

                    {/* Footer Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${DS.border}` }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="ds-tag">v{ext.version || '1.0.0'}</span>
                        <span className="ds-tag">{ext.category || 'Extension'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 600, color: DS.text }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: DS.warning }}>{Icons.Star}</span> {Number(ext.rating || 0).toFixed(1)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: DS.accent }}>{Icons.Download}</span> {(ext.downloads || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}