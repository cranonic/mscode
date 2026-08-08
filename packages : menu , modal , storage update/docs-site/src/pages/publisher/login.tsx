import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';
import { useAuth, supabase } from '@site/src/hooks/useAuth';

export default function PublisherLogin() {
  const history = useHistory();
  const { user, loading: authLoading, signInWithGitHub } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect to dashboard immediately if session detected
  useEffect(() => {
    if (!authLoading && user) {
      history.replace('/publisher');
    }
  }, [user, authLoading, history]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Check your email for the confirmation link to complete registration.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoadingAction(false);
    }
  };

  if (authLoading) {
    return (
      <Layout title="Loading Hub">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <div className="loading-spinner" style={{ border: '4px solid var(--ifm-color-emphasis-200)', borderTop: '4px solid var(--ifm-color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Publisher Portal Registration Suite">
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: 'var(--ifm-background-color)' }}>
        
        {/* Left Panel: Decorative Branding View */}
        <div className="ms-login-branding" style={{ flex: 1, backgroundColor: 'var(--ifm-color-primary-darker)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', backgroundImage: 'linear-gradient(135deg, var(--ifm-color-primary-darker) 0%, #1a1a2e 100%)' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', color: '#fff' }}>Mono Studio</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.85, lineHeight: 1.6, maxWidth: '500px' }}>
            Deploy custom telemetry syntax extensions, inject high-performance macro bindings, and monitor deployment analytics globally.
          </p>
        </div>

        {/* Right Panel: Active Form Interface Controls */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {isSignUp ? 'Create Publisher Account' : 'Sign In to Dashboard'}
              </h2>
              <p style={{ color: 'var(--ifm-color-emphasis-600)', margin: 0 }}>
                {isSignUp ? 'Get started by setting up your cloud environment.' : 'Manage your structural toolchain assets.'}
              </p>
            </div>

            {errorMsg && <div style={{ backgroundColor: 'rgba(255, 75, 75, 0.1)', borderLeft: '4px solid var(--ifm-color-danger)', color: 'var(--ifm-color-danger)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
            {successMsg && <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', borderLeft: '4px solid var(--ifm-color-success)', color: 'var(--ifm-color-success)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{successMsg}</div>}

            {/* ── Core OAuth Trigger Element: GitHub Native Button ── */}
            <button 
              onClick={signInWithGitHub}
              className="button button--outline button--block"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem', fontSize: '1rem', fontWeight: 600, border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.008.069-.008 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--ifm-color-emphasis-400)' }}>
              <hr style={{ flex: 1, borderColor: 'var(--ifm-color-emphasis-200)' }} />
              <span style={{ padding: '0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or use email</span>
              <hr style={{ flex: 1, borderColor: 'var(--ifm-color-emphasis-200)' }} />
            </div>

            {/* Email Form Fallback */}
            <form onSubmit={handleEmailAuth}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
                <input 
                  id="email" 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--ifm-color-emphasis-300)', backgroundColor: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
                <input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--ifm-color-emphasis-300)', backgroundColor: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loadingAction}
                className="button button--primary button--block" 
                style={{ padding: '0.75rem', marginTop: '0.5rem', opacity: loadingAction ? 0.7 : 1, cursor: loadingAction ? 'not-allowed' : 'pointer' }}
              >
                {loadingAction ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)' }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); setSuccessMsg(null); }} 
                style={{ background: 'none', border: 'none', color: 'var(--ifm-color-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {/* CSS Media Query Styles */}
      <style>{`
        @media (max-width: 996px) { .ms-login-branding { display: none !important; } }
      `}</style>
    </Layout>
  );
}