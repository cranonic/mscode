// src/pages/store/item.tsx
import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import { useLocation, useHistory } from '@docusaurus/router';
import { supabase, useAuth } from '@site/src/hooks/useAuth';
import { DS, GLOBAL_CSS } from '@site/src/components/publisher/_ds';
import { MarkdownRenderer } from '@site/src/utils/parseMarkdown';

// ─── Inline SVGs ─────────────────────────────────────────────────────────────
const Icons = {
  Download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  StarOutline: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Code: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Package: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Reply: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>,
  Trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
};

export default function ExtensionDetail() {
  const { search } = useLocation();
  const history = useHistory();
  const extId = new URLSearchParams(search).get('id');
  const { user } = useAuth();

  const [ext, setExt] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'readme' | 'changelog' | 'license' | 'contributes'>('readme');

  // Rating & Review State
  const [userReview, setUserReview] = useState({ ux: 0, perf: 0, bug: 0, text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Reply State
  const [activeReplyBox, setActiveReplyBox] = useState<{ reviewId: string; parentId: string | null } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (extId) {
      fetchExtensionDetails();
      fetchReviews();
    } else {
      history.replace('/store');
    }
  }, [extId, user]);

  const fetchExtensionDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('extensions')
      .select('*, publishers(display_name, avatar_url)')
      .eq('id', extId)
      .single();
    if (!error && data) setExt(data);
    setLoading(false);
  };

  const fetchReviews = async () => {
    // 🌟 THE FIX: Fetching reviews AND nested replies together perfectly!
    const { data } = await supabase
      .from('extension_reviews')
      .select('*, extension_replies(*)')
      .eq('extension_id', extId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setReviews(data);
      // Check if logged in user already reviewed to allow Editing
      if (user) {
        const existing = data.find(r => r.user_id === user.id);
        if (existing) {
          setHasExistingReview(true);
          setUserReview({ ux: existing.ux_rating, perf: existing.perf_rating, bug: existing.bug_rating, text: existing.comment_text || '' });
        }
      }
    }
  };

  // ─── Post / Update Review ───
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Please login to submit a review."); return; }
    if (userReview.ux === 0 || userReview.perf === 0 || userReview.bug === 0) {
      alert("Please provide star ratings for all 3 categories."); return;
    }
    
    setIsSubmitting(true);
    try {
      // Upsert automatically Updates if user_id + extension_id exists!
      const { error } = await supabase.from('extension_reviews').upsert({
        extension_id: extId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url || '',
        ux_rating: userReview.ux,
        perf_rating: userReview.perf,
        bug_rating: userReview.bug,
        comment_text: userReview.text
      });
      if (error) throw error;
      
      setShowReviewForm(false);
      fetchReviews();
      fetchExtensionDetails(); // Refresh total average rating
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Post Reply (Nested) ───
  const submitReply = async (reviewId: string, parentId: string | null) => {
    if (!user) return alert("Login required to reply.");
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const { error } = await supabase.from('extension_replies').insert({
        review_id: reviewId,
        parent_id: parentId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url || '',
        reply_text: replyText
      });
      if (error) throw error;
      setReplyText('');
      setActiveReplyBox(null);
      fetchReviews();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsReplying(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    if(!confirm("Delete this reply?")) return;
    await supabase.from('extension_replies').delete().eq('id', replyId);
    fetchReviews();
  };

  const renderStars = (rating: number, setRating?: (r: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '4px', cursor: setRating ? 'pointer' : 'default' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => setRating && setRating(star)} style={{ color: star <= rating ? DS.warning : DS.borderBright, transition: 'color 0.2s' }}>
            {star <= rating ? Icons.Star : Icons.StarOutline}
          </span>
        ))}
      </div>
    );
  };

  // ─── Recursive Reply Tree Builder ───
  const renderReplies = (replies: any[], reviewId: string, parentId: string | null = null, depth = 0) => {
    const children = replies.filter(r => r.parent_id === parentId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: depth > 0 ? '16px' : '0', borderLeft: depth > 0 ? `2px solid ${DS.border}` : 'none', paddingLeft: depth > 0 ? '16px' : '0', marginTop: '12px' }}>
        {children.map(reply => (
          <div key={reply.id} style={{ marginBottom: '12px', background: depth === 0 ? DS.surface2 : 'transparent', padding: depth === 0 ? '12px' : '0', borderRadius: DS.radius2 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <img src={reply.avatar_url || 'https://via.placeholder.com/24'} style={{ width: 20, height: 20, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{reply.user_name}</span>
                  <span style={{ fontSize: '10px', color: DS.textFaint }}>{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '13px', color: DS.text, margin: '4px 0 8px' }}>{reply.reply_text}</p>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setActiveReplyBox({ reviewId, parentId: reply.id }); setReplyText(''); }} style={{ background: 'none', border: 'none', color: DS.textMuted, fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', gap: '4px' }}>
                    {Icons.Reply} Reply
                  </button>
                  {user && user.id === reply.user_id && (
                    <button onClick={() => deleteReply(reply.id)} style={{ background: 'none', border: 'none', color: DS.danger, fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', gap: '4px' }}>
                      {Icons.Trash} Delete
                    </button>
                  )}
                </div>

                {/* Inline Reply Box for this comment */}
                {activeReplyBox?.parentId === reply.id && (
                  <div className="ds-animate-in" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <input type="text" autoFocus value={replyText} onChange={e => setReplyText(e.target.value)} className="ds-input" placeholder="Write a reply..." style={{ padding: '6px 12px', fontSize: '12px' }} onKeyDown={e => e.key === 'Enter' && submitReply(reviewId, reply.id)} />
                    <button onClick={() => submitReply(reviewId, reply.id)} disabled={isReplying} className="ds-btn ds-btn-primary" style={{ padding: '6px 12px' }}>Send</button>
                  </div>
                )}
                
                {/* Recursive Children */}
                {renderReplies(replies, reviewId, reply.id, depth + 1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading || !ext) {
    return <Layout title="Loading..."><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', background: DS.bg }}><div style={{ width: 40, height: 40, border: `3px solid ${DS.border}`, borderTopColor: DS.accent, borderRadius: '50%', animation: 'ds-pulse 1s linear infinite' }}/></div></Layout>;
  }

  const pubName = ext.publishers?.display_name || ext.publisher;

  return (
    <Layout title={`${ext.name} | Mono Studio Store`}>
      <style>{GLOBAL_CSS}</style>
      <div className="ds-page">
        
        {/* ── HERO BANNER ── */}
        <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, padding: '40px 0', position: 'relative', overflow: 'hidden' }}>
          <div className="container" style={{ maxWidth: '1000px', position: 'relative', zIndex: 1 }}>
            
            <button onClick={() => history.push('/store')} style={{ background: 'none', border: 'none', color: DS.textMuted, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, marginBottom: '32px', fontSize: '14px', fontWeight: 600 }}>
              {Icons.Back} Back to Store
            </button>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
              {ext.icon ? (
                <img src={ext.icon} alt="Icon" style={{ width: '120px', height: '120px', borderRadius: '24px', objectFit: 'cover', boxShadow: DS.shadow2, border: `1px solid ${DS.borderBright}` }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: DS.surface3, border: `1px solid ${DS.borderBright}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 800, color: DS.text, boxShadow: DS.shadow2 }}>
                  {ext.name.charAt(0)}
                </div>
              )}
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className="ds-tag ds-tag-accent">{ext.category || 'Extension'}</span>
                  {ext.is_built_in && <span className="ds-tag">Official</span>}
                </div>
                
                <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', color: '#fff', lineHeight: 1.1 }}>{ext.name}</h1>
                <p style={{ fontSize: '16px', color: DS.textMuted, margin: '0 0 16px 0' }}>{ext.description || 'No description provided.'}</p>
                
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', color: DS.textMuted, fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {ext.publishers?.avatar_url ? <img src={ext.publishers.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: DS.borderBright }} />}
                    <span style={{ fontWeight: 600, color: DS.text }}>{pubName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{Icons.Code} v{ext.version}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: DS.accent }}>{Icons.Download} {(ext.downloads || 0).toLocaleString()} DLs</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: DS.warning }}>{Icons.Star} {Number(ext.rating || 0).toFixed(1)} / 5.0</div>
                </div>
              </div>

              {/* Action Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <button className="ds-btn ds-btn-primary" style={{ padding: '12px 24px', justifyContent: 'center', fontSize: '15px' }} onClick={() => alert("Installation protocol via CLI/App pending.")}>
                  {Icons.Package} Install in MS Code
                </button>
                <div style={{ fontSize: '12px', color: DS.textFaint, textAlign: 'center', fontFamily: DS.fontMono }}>
                  msce install {ext.id}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: '1000px', padding: '40px 20px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* ── LEFT COL (Tabs & Content) ── */}
          <div style={{ flex: '1 1 600px', width:'100%' , minWidth: '0' }}>
            <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${DS.border}`, marginBottom: '32px', overflowX: 'auto' }}>
              {['readme', 'changelog', 'license', 'contributes'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? DS.accent : 'transparent'}`, padding: '0 0 12px 0', color: activeTab === tab ? DS.text : DS.textMuted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="ds-animate-in" key={activeTab} style={{ background: DS.surface, padding: '32px', borderRadius: DS.radius3, border: `1px solid ${DS.border}` }}>
              {activeTab === 'readme' && (ext.readme ? <MarkdownRenderer content={ext.readme} /> : <p style={{ color: DS.textMuted }}>No README.md provided.</p>)}
              {activeTab === 'changelog' && (ext.changelog ? <MarkdownRenderer content={ext.changelog} /> : <p style={{ color: DS.textMuted }}>No CHANGELOG.md provided.</p>)}
              {activeTab === 'license' && (ext.license ? <pre style={{ whiteSpace: 'pre-wrap', color: DS.textMuted, fontSize: '13px', fontFamily: DS.fontMono }}>{ext.license}</pre> : <p style={{ color: DS.textMuted }}>No LICENSE provided.</p>)}
              {activeTab === 'contributes' && (
                <pre style={{ background: DS.surface2, padding: '16px', borderRadius: DS.radius2, overflowX: 'auto', color: DS.text, fontSize: '13px', fontFamily: DS.fontMono }}>
                  {JSON.stringify(ext.contributes || {}, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* ── RIGHT COL (Reviews & Ratings) ── */}
          <div style={{ width: '100%' }}>
            
            {/* Rating Overview & Form */}
            <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius3, padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Ratings & Reviews</h3>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1, color: '#fff' }}>{Number(ext.rating || 0).toFixed(1)}</span>
                <div style={{ paddingBottom: '6px' }}>
                  {renderStars(Math.round(ext.rating || 0))}
                  <div style={{ fontSize: '12px', color: DS.textMuted, marginTop: '4px' }}>Based on {reviews.length} reviews</div>
                </div>
              </div>

              {user ? (
                showReviewForm ? (
                  <form onSubmit={handleReviewSubmit} className="ds-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: DS.surface2, borderRadius: DS.radius2, border: `1px solid ${DS.borderBright}` }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: DS.accent, marginBottom: '-8px' }}>
                      {hasExistingReview ? 'Update Your Review' : 'Write a Review'}
                    </div>
                    <div>
                      <div className="ds-label">User Experience</div>
                      {renderStars(userReview.ux, (r) => setUserReview(p => ({...p, ux: r})))}
                    </div>
                    <div>
                      <div className="ds-label">Performance</div>
                      {renderStars(userReview.perf, (r) => setUserReview(p => ({...p, perf: r})))}
                    </div>
                    <div>
                      <div className="ds-label">Bug Free</div>
                      {renderStars(userReview.bug, (r) => setUserReview(p => ({...p, bug: r})))}
                    </div>
                    <textarea 
                      className="ds-input" 
                      placeholder="Share your experience (optional)..." 
                      rows={3}
                      value={userReview.text}
                      onChange={e => setUserReview(p => ({...p, text: e.target.value}))}
                      style={{ resize: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" disabled={isSubmitting} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>{isSubmitting ? 'Saving...' : 'Post Review'}</button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="ds-btn ds-btn-ghost">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button className="ds-btn ds-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviewForm(true)}>
                    {hasExistingReview ? (<span>{Icons.Edit} Edit My Review</span>) : 'Write a Review'}
                  </button>
                )
              ) : (
                <div style={{ fontSize: '13px', color: DS.textMuted, textAlign: 'center', padding: '16px', background: DS.surface2, borderRadius: DS.radius2 }}>
                  <Link to="/publisher/login" style={{ color: DS.accent, textDecoration: 'none' }}>Log in</Link> to rate and review.
                </div>
              )}
            </div>

            {/* Main Review Threads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviews.map(rev => (
                <div key={rev.id}>
                  {/* Parent Review Card */}
                  <div style={{ padding: '20px', background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius3, position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <img src={rev.avatar_url || 'https://via.placeholder.com/40'} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{rev.user_name || 'Anonymous'}</span>
                          <span style={{ fontSize: '11px', color: DS.textFaint }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ marginTop: '2px' }}>{renderStars(Math.round(rev.avg_rating))}</div>
                      </div>
                    </div>
                    {rev.comment_text && <p style={{ fontSize: '14px', color: DS.text, margin: '0 0 12px 0', lineHeight: 1.6 }}>{rev.comment_text}</p>}
                    
                    <button onClick={() => { setActiveReplyBox({ reviewId: rev.id, parentId: null }); setReplyText(''); }} style={{ background: 'none', border: 'none', color: DS.textMuted, fontSize: '12px', cursor: 'pointer', padding: 0, display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 600 }}>
                      {Icons.Reply} Reply
                    </button>

                    {/* Root Reply Box */}
                    {activeReplyBox?.reviewId === rev.id && activeReplyBox?.parentId === null && (
                      <div className="ds-animate-in" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input type="text" autoFocus value={replyText} onChange={e => setReplyText(e.target.value)} className="ds-input" placeholder="Add a reply..." onKeyDown={e => e.key === 'Enter' && submitReply(rev.id, null)} />
                        <button onClick={() => submitReply(rev.id, null)} disabled={isReplying} className="ds-btn ds-btn-primary">Post</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Render Nested Replies under this Review */}
                  {rev.extension_replies && renderReplies(rev.extension_replies, rev.id, null, 0)}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
}