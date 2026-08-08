// src/theme/NavbarItem/AuthAvatar.tsx
import React from 'react';
import Link from '@docusaurus/Link';
import { useAuth } from '@site/src/hooks/useAuth';
import clsx from 'clsx'; // Docusaurus-এর বিল্ট-ইন ক্লাস মার্জার

export default function AuthAvatar({ mobile, className, ...props }: any) {
  const { user, profile, loading, signInWithGitHub, signOut } = useAuth();
  
  // Docusaurus Desktop এবং Mobile (Sidebar) এর জন্য আলাদা ক্লাস ব্যবহার করে
  const wrapperClass = mobile ? 'menu__list-item' : 'navbar__item';
  const linkClass = mobile ? 'menu__link' : 'navbar__link';

  // ── 1. Loading State ──
  if (loading) {
    return (
      <div className={clsx(wrapperClass, className)} {...props}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--ifm-color-emphasis-200)', animation: 'pulse 2s infinite', margin: '0 8px' }} />
      </div>
    );
  }

  // ── 2. Logged Out State (Sign In Button) ──
  // if (!user) {
  //   return (
  //     <div className={clsx(wrapperClass, className)} style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }} {...props}>
  //       <button 
  //         className="button button--primary button--sm" 
  //         onClick={signInWithGoogle}
  //         style={{ 
  //           display: 'flex', 
  //           alignItems: 'center', 
  //           gap: '8px', 
  //           width: mobile ? '100%' : 'auto', 
  //           justifyContent: mobile ? 'center' : 'flex-start' 
  //         }}
  //       >
  //         <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  //           <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  //           <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  //           <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
  //           <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  //         </svg>
  //         Sign In
  //       </button>
  //     </div>
  //   );
  // }
  
  // ── 2. Logged Out State (Sign In Button) ──
  if (!user) {
    return (
      <div className={clsx(wrapperClass, className)} style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }} {...props}>
        <button 
          className="button button--primary button--sm" 
          onClick={signInWithGitHub}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600
          }}
        >
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  // ── 3. Logged In State (Avatar & Dropdown) ──
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/0?d=mp';

  // Mobile Menu Layout
  if (mobile) {
    return (
      <div className={clsx(wrapperClass, className)} {...props}>
        <div className={linkClass} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px' }}>
          <img src={avatarUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span style={{ fontWeight: 600 }}>{profile?.display_name || 'Publisher'}</span>
        </div>
        <ul className="menu__list" style={{ paddingLeft: '1rem' }}>
          <li className="menu__list-item"><Link to="/publisher" className="menu__link">Dashboard</Link></li>
          <li className="menu__list-item"><Link to="/publisher/settings" className="menu__link">Settings</Link></li>
          <li className="menu__list-item">
            <button onClick={signOut} className="menu__link" style={{ background: 'none', border: 'none', color: 'var(--ifm-color-danger)', width: '100%', textAlign: 'left' }}>Logout</button>
          </li>
        </ul>
      </div>
    );
  }

  // Desktop Navbar Layout (Dropdown)
  return (
    <div className={clsx('navbar__item dropdown dropdown--right dropdown--hoverable', className)} {...props}>
      <a href="#" className="navbar__link" style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--ifm-color-emphasis-300)', objectFit: 'cover' }}
        />
      </a>
      <ul className="dropdown__menu">
        <li><Link to="/publisher" className="dropdown__link">Dashboard</Link></li>
        <li><Link to="/publisher/settings" className="dropdown__link">Settings</Link></li>
        <li>
          <hr style={{ margin: '0.5rem 0', borderColor: 'var(--ifm-color-emphasis-200)' }} />
          <button onClick={signOut} className="dropdown__link" style={{ background: 'none', border: 'none', color: 'var(--ifm-color-danger)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}