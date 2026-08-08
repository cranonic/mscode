import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Icons } from '../icon/icons';
import mono from '../icon/mono.png';
import '../css/Styles.css';

// ─── Scroll Reveal Wrapper ───────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div ref={ref} className={`ms-reveal-${direction}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// ─── 3D Tilt Card Wrapper ────────────────────────────────────────────────────
function TiltCard({ children, className, style }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg tilt
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={cardRef} className={clsx("ms-tilt-card", className)} style={style}>
      <div className="ms-tilt-glow" />
      {children}
    </div>
  );
}

// ─── Hero with Advanced Parallax ─────────────────────────────────────────────
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const heroRef = useRef(null);
  
  useEffect(() => {
    let ticking = false;
    
    // Scroll Parallax (Hardware Accelerated via CSS Variables)
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY < 1000 && heroRef.current) {
            heroRef.current.style.setProperty('--scroll-offset', `${window.scrollY}px`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Mouse Tracking Parallax
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      heroRef.current.style.setProperty('--mouse-shift-x', `${x}px`);
      heroRef.current.style.setProperty('--mouse-shift-y', `${y}px`);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <header className="ms-hero" ref={heroRef}>
      <div className="ms-hero-bg">
        <div className="ms-hero-grid parallax-layer-1" />
        <div className="ms-hero-glow1 parallax-layer-2" />
        <div className="ms-hero-glow2 parallax-layer-3" />
      </div>
      
      <div className="ms-hero-inner parallax-layer-content">
        <Reveal delay={0.1}>
          <div className="ms-eyebrow">
            <div className="ms-eyebrow-dot" />
            Extension API v2 is live
          </div>
        </Reveal>
        
        <Reveal delay={0.2}>
          <img src={mono} alt="Mono Studio" className="ms-hero-logo ms-float" />
          <h1 className="ms-hero-title">
            <span className="ms-grad">{siteConfig.title}</span>
          </h1>
          <p className="ms-hero-sub">{siteConfig.tagline}</p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="ms-badges">
            <a href="https://github.com/monostudio-in/mscode" className="ms-badge">{Icons.github} Source Code</a>
            <a href="https://t.me/monostudio_in" className="ms-badge" target="_blank" rel="noopener noreferrer">
              {Icons.telegram} Telegram Channel
            </a>

            <Link to="/docs/getting-started/compile-and-build" className="ms-badge ms-badge-highlight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="16" y2="6"/><line x1="12" y1="2" x2="8" y2="6"/><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>
              Publish Extension
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="ms-ctas">
            <Link to="/docs/intro" className="ms-btn-primary ms-btn-glow">
              Read Documentation {Icons.arrowRight}
            </Link>
            <Link to="/docs/api" className="ms-btn-outline">
              API Reference
            </Link>
          </div>
        </Reveal>
      </div>
    </header>
  );
}

// ─── IDE Mockup ─────────────────────────────────────────────────────────────
function IDEMockup() {
  const [activeLine, setActiveLine] = useState(0);
  const codeLines = [
    { no: '1',  content: <><span className="c-cm">// Mono Studio Extension API</span></> },
    { no: '2',  content: <></> },
    { no: '3',  content: <><span className="c-kw">import</span><span className="c-tx"> {'{'} </span><span className="c-fn">registerMenuItem</span><span className="c-tx"> {'}'} </span><span className="c-kw">from</span><span className="c-str"> 'mono/api'</span></> },
    { no: '4',  content: <></> },
    { no: '5',  content: <><span className="c-kw">export function</span><span className="c-fn"> activate</span><span className="c-tx">(ctx) {'{'}</span></> },
    { no: '6',  content: <><span className="c-tx">{'  '}</span><span className="c-fn">registerMenuItem</span><span className="c-tx">(</span><span className="c-str">'editor/title'</span><span className="c-tx">, {'['}</span></> },
    { no: '7',  content: <><span className="c-tx">{'    {'} </span><span className="c-var">id</span><span className="c-tx">: </span><span className="c-str">'run'</span><span className="c-tx">, </span><span className="c-var">icon</span><span className="c-tx">: </span><span className="c-str">'play'</span><span className="c-tx">, </span><span className="c-var">order</span><span className="c-tx">: </span><span className="c-num">10</span><span className="c-tx"> {'}'}</span></> },
    { no: '8',  content: <><span className="c-tx">{'    {'} </span><span className="c-var">id</span><span className="c-tx">: </span><span className="c-str">'format'</span><span className="c-tx">, </span><span className="c-var">icon</span><span className="c-tx">: </span><span className="c-str">'zap'</span><span className="c-tx">, </span><span className="c-var">order</span><span className="c-tx">: </span><span className="c-num">20</span><span className="c-tx"> {'}'}</span></> },
    { no: '9',  content: <><span className="c-tx">{'  ]});'}</span></> },
    { no: '10', content: <><span className="c-tx">{'}'}</span></> },
  ];
  
  useEffect(() => {
    const id = setInterval(() => setActiveLine(l => (l + 1) % codeLines.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <Reveal delay={0.2} direction="up">
      <div className="ms-mockup-section">
        <div className="ms-mockup-frame ms-glass-panel">
          <div className="ms-titlebar">
            <div className="ms-titlebar-dots">
              <div className="ms-dot" style={{ background: '#ff5f57', boxShadow: '0 0 10px #ff5f5780' }} />
              <div className="ms-dot" style={{ background: '#febc2e', boxShadow: '0 0 10px #febc2e80' }} />
              <div className="ms-dot" style={{ background: '#28c840', boxShadow: '0 0 10px #28c84080' }} />
            </div>
            <div className="ms-titlebar-title">extension.ts — Mono Studio</div>
            <div className="ms-titlebar-badge">● TypeScript</div>
          </div>
          <div className="ms-editor-body">
            <div className="ms-sidebar-mini">
              <div className="ms-file-tree">
                {[
                  { name: 'extension.ts', color: '#3b82f6', active: true },
                  { name: 'manifest.json', color: '#f59e0b', active: false },
                  { name: 'commands.ts', color: '#3b82f6', active: false },
                  { name: 'package.json', color: '#10b981', active: false },
                  { name: 'README.md', color: '#94a3b8', active: false },
                ].map(f => (
                  <div key={f.name} className={`ms-file-item ${f.active ? 'active' : ''}`}>
                    <div className="ms-file-dot" style={{ background: f.color }} />
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="ms-code-area">
              {codeLines.map((line, i) => (
                <div
                  key={i}
                  className="ms-code-line"
                  style={{
                    background: i === activeLine ? 'rgba(59,130,246,0.1)' : 'transparent',
                    boxShadow: i === activeLine ? 'inset 2px 0 0 #3b82f6' : 'none',
                    borderRadius: '0 4px 4px 0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span className="ms-line-no">{line.no}</span>
                  <span>{line.content}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Bento Features ─────────────────────────────────────────────────────────
function BentoFeatures() {
  return (
    <div className="ms-section">
      <Reveal>
        <div className="ms-section-label">{Icons.zap} Core Engine</div>
        <h2 className="ms-section-title">Built for power.<br />Designed for mobile.</h2>
        <p className="ms-section-sub">Every tool a professional developer expects — reimagined for a touch-first, performance-obsessed runtime.</p>
      </Reveal>

      <div className="ms-bento">
        
      {/* Code Editor — span 2 */}
        <Reveal delay={0.1}>
          <TiltCard className="ms-bento-card span2" style={{ '--glow-color': 'rgba(99, 102, 241, 0.15)' }}> 
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div className="ms-bento-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--ms-accent-indigo)' }}>
                  {Icons.code}
                </div>
                <div className="ms-bento-title">Monaco Powered. Mobile First.</div>
                <p className="ms-bento-desc">
                  The VS Code editor engine, reimagined for mobile. Fully optimized for smooth navigation on massive codebases with automatic memory management. Features inbuilt Sticky Scroll, Diff Editor, and VS Code theme compatibility. Includes a unique vertical+horizontal hybrid menu support.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span className="ms-bento-tag">{Icons.check} Big Project Ready</span>
                    <span className="ms-bento-tag">{Icons.check} Diff Support</span>
                    <span className="ms-bento-tag">{Icons.check} Touch Optimized</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '240px' }} className="ms-terminal-mini monaco-mini-view">
                <div style={{ display: 'flex', gap: '8px', padding: '4px 8px', background: 'var(--ms-bg-activity)', borderBottom: '1px solid var(--ms-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--ms-green)' }}>
                        {Icons.tab} CodeEditor.tsx
                    </div>
                </div>

                <div style={{ padding: '10px', fontSize: '12px', fontFamily: 'var(--ms-mono)', lineHeight: '1.6', overflow: 'hidden' }}>
                    <div><span style={{color:'var(--ms-pink)'}}>import</span><span style={{color:'var(--ms-muted)'}}>{'{'}</span> <span style={{color:'var(--ms-green)'}}>fs</span> <span style={{color:'var(--ms-muted)'}}>{'}'}</span> <span style={{color:'var(--ms-pink)'}}>from</span> <span style={{color:'var(--ms-amber)'}}>'@/core/fileSystem'</span></div>
                    <div><span style={{color:'var(--ms-comment)'}}>// Native mobile keyboard handling loop</span></div>
                    <div><span style={{color:'var(--ms-green)'}}>editor</span><span style={{color:'var(--ms-muted)'}}>.</span><span style={{color:'var(--ms-green)'}}>onDidBlurEditorText</span><span style={{color:'var(--ms-muted)'}}>(() {'=> {'}</span></div>
                    <div>&nbsp;&nbsp;<span style={{color:'var(--ms-green)'}}>setKeyboardVisible</span><span style={{color:'var(--ms-muted)'}}>(</span><span style={{color:'var(--ms-green)'}}>false</span><span style={{color:'var(--ms-muted)'}}>)</span></div>
                    <div><span style={{color:'var(--ms-muted)'}}>{'}'})</span></div>
                    <div><span style={{color:'var(--ms-prompt)', animation: 'ms-blink 1s infinite'}}>_</span></div>
                </div>
              </div>
            </div>
          </TiltCard>
        </Reveal>


        {/* Terminal */}
        <Reveal delay={0.2}>
          <TiltCard className="ms-bento-card" style={{ '--glow-color': 'rgba(16,185,129,0.15)' }}>
            <div className="ms-bento-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--ms-green)' }}>
              {Icons.terminal}
            </div>
            <div className="ms-bento-title">Native PTY Terminal</div>
            <p className="ms-bento-desc">
              True Linux terminal emulation powered by JNI and PRoot. Features full ANSI support, Wakelocks for background persistence.
            </p>
            <div className="ms-terminal-mini">
              <div><span className="ms-prompt" style={{ color: 'var(--ms-green)' }}>root@mscode:~# </span><span className="ms-cmd">uname -a</span></div>
              <div><span className="ms-out">Linux localhost 4.14.113+ #1 SMP... </span></div>
              <div><span className="ms-prompt" style={{ color: 'var(--ms-green)' }}>root@mscode:~# </span><span className="ms-cmd ms-blink">_</span></div>
            </div>
          </TiltCard>
        </Reveal>

        {/* Git */}
        <Reveal delay={0.3}>
          <TiltCard className="ms-bento-card" style={{ '--glow-color': 'rgba(245,158,11,0.15)' }}>
            <div className="ms-bento-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--ms-amber)' }}>
              {Icons.git}
            </div>
            <div className="ms-bento-title">Native Git Integration</div>
            <p className="ms-bento-desc">
              Full Git client powered by Linux engine. Effortlessly stage, commit, branch, stash, and sync directly from the UI.
            </p>
            <span className="ms-bento-tag">{Icons.check} Background CLI Engine</span>
          </TiltCard>
        </Reveal>

        {/* LSP — span 2 */}
        <Reveal delay={0.4}>
          <TiltCard className="ms-bento-card span2" style={{ '--glow-color': 'rgba(59,130,246,0.15)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div className="ms-bento-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--ms-accent)' }}>
                  {Icons.lsp}
                </div>
                <div className="ms-bento-title">Language Server Protocol</div>
                <p className="ms-bento-desc">Full Language Server Protocol integration powered by a background Alpine Linux environment. Real-time autocompletion and diagnostics.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                {['Javascript','TypeScript', 'Python', 'Rust', 'Go', 'C/C++','PHP','...'].map((lang, i) => (
                  <div key={lang} className="ms-lang-item" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="ms-lang-dot" />
                    {lang}
                  </div>
                ))} 
              </div>
            </div>
          </TiltCard>
        </Reveal>

        {/* Plugin */}
        <Reveal delay={0.5}>
          <TiltCard className="ms-bento-card" style={{ '--glow-color': 'rgba(139,92,246,0.15)' }}>
            <div className="ms-bento-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--ms-accent2)' }}>
              {Icons.plugin}
            </div>
            <div className="ms-bento-title">Extension API & CLI</div>
            <p className="ms-bento-desc">
              Declarative manifests, shadowed global sandboxing, and a rich API. Scaffold, bundle, and instantly deploy to the cloud with <code>msce</code>.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
              <span className="ms-bento-tag">{Icons.check} msce package</span>
              <span className="ms-bento-tag" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--ms-accent2)', borderColor: 'rgba(139,92,246,0.2)' }}>
                {Icons.check} msce publish
              </span>
            </div>
          </TiltCard>
        </Reveal>
        
        {/* Search */}
        <Reveal delay={0.6}>
          <TiltCard className="ms-bento-card" style={{ '--glow-color': 'rgba(16,185,129,0.15)' }}> 
            <div className="ms-bento-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--ms-emerald)' }}>
              {Icons.search}
            </div>
            <div className="ms-bento-title">Native Search Engine</div>
            <p className="ms-bento-desc">
              High-speed workspace indexing powered by a native Android Java worker. Execute complex RegEx and isolate code scopes.
            </p>
            <span className="ms-bento-tag">{Icons.check} 2K Match Safety Cap</span>
          </TiltCard>
        </Reveal>

        {/* File System */}
        <Reveal delay={0.7}>
          <TiltCard className="ms-bento-card" style={{ '--glow-color': 'rgba(239,68,68,0.15)' }}>
            <div className="ms-bento-icon" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="ms-bento-title">Native Storage & VFS</div>
            <p className="ms-bento-desc">Unified Virtual File System with device storage routing, sandboxed workspaces, and custom protocol mapping.</p>
            <span className="ms-bento-tag">{Icons.check} Capacitor + I/O Bridge</span>
          </TiltCard>
        </Reveal>
        
        {/* Status Bar & Notifications */}
        <Reveal delay={0.8}>
          <TiltCard className="ms-bento-card span2" style={{ '--glow-color': 'rgba(236,72,153,0.15)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div className="ms-bento-icon" style={{ background: 'rgba(236,72,153,0.12)', color: 'var(--ms-pink)' }}>{Icons.notification}</div>
                <div className="ms-bento-title">Interactive Status & Notifications</div>
                <p className="ms-bento-desc">
                  Real-time telemetry tracking cursor position, encoding, and active language mode. Includes a centralized notification center for managing interactive dialogues, warnings, and background task progress.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' , width: '100%' }}>
                <div className="ms-terminal-mini" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ms-muted)', background: 'var(--ms-bg-activity)' }}>
                   <div style={{ display: 'flex', gap: '12px' }}>
                     <span style={{ color: '#a44e3c' }}>{Icons.error} 2</span>
                     <span style={{ color: '#6c5e1f' }}>{Icons.warning} 0</span>
                   </div>
                   <div style={{ display: 'flex', gap: '12px', alignItems: 'center' , textAlign: 'center'}}>
                     <span>Ln 42, Col 16</span>
                     <span>UTF-8</span>
                     <span>TypeScript</span>
                     <span style={{ color: 'var(--ms-accent)' , display: 'flex'}}>{Icons.bell}</span>
                   </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </Reveal>
        
        
        {/* Workflow Customization & Hyper-Productivity */}
        <Reveal delay={0.9}>
          <TiltCard className="ms-bento-card span2" style={{ '--glow-color': 'rgba(14,165,233,0.15)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div className="ms-bento-icon" style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--ms-sky)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="ms-bento-title">Tailored Speed: Shortcuts & Snippets</div>
                <p className="ms-bento-desc">
                  Accelerate your mobile development workflow with powerful keybinding overrides and intelligent snippets. Experience desktop-grade typing ergonomics right .
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <span className="ms-bento-tag">{Icons.check} Smart Conflict Resolver</span>
                  <span className="ms-bento-tag">{Icons.check} 3-Tier Tokenizer Fallback</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                <div className="ms-terminal-mini" style={{ padding: '10px', background: 'var(--ms-bg-input)' }}>
                  <div style={{ color: 'var(--ms-muted)', fontSize: '11px', marginBottom: '4px' }}>🔥 3-Tier Snippet Engine</div>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--ms-green)' }}>clg</span> → <span style={{ color: 'var(--ms-accent)' }}>console.log(</span><span style={{ color: 'var(--ms-amber)', animation: 'ms-blink 1s infinite' }}>_</span><span style={{ color: 'var(--ms-accent)' }}>)</span>
                  </div>
                </div>
                
                
                <div className="ms-terminal-mini" style={{ padding: '10px', background: 'var(--ms-bg-input)' }}>
                  <div style={{ color: 'var(--ms-muted)', fontSize: '11px', marginBottom: '4px' }}>⌨️ Macro Recorder & Conflict Guard</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span>Trigger Palette</span>
                    <span style={{ padding: '2px 6px', background: 'var(--ms-bg-activity)', borderRadius: '4px', border: '1px solid var(--ms-border)', fontSize: '11px' }}>Ctrl + Shift + P</span>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </Reveal>
        
      {/* Gesture Floating Tabs — span 2 */}
        <Reveal delay={0.10}>
          <TiltCard className="ms-bento-card span2" style={{ '--glow-color': 'rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', width: '100%' }}>
              
              {/* Left Side: Description of Gesture Flow */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div className="ms-bento-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--ms-accent-green)' }}>
                  {Icons.layout || (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  )}
                </div>
                <div className="ms-bento-title">Gesture Wrap Navigation</div>
                <p className="ms-bento-desc">
                  Fluid horizontal scroll transforms instantly. Just slide any active tab item to trigger the smart floating grid matrix. All open workspaces instantly wrap into a tight, accessible overlay layout right under your fingertips. Designed for lighting-fast cross-file mobile execution.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span className="ms-bento-tag" style={{ color: 'var(--ms-accent-green)' }}>✦ Extreme Mobile Comfort</span>
                    <span className="ms-bento-tag">⚡ One-Tap Matrix Switch</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '240px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', border: '1px solid var(--ms-border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', color: 'var(--ms-text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>Workspace Layer Preview</div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', contentVisibility: 'auto' }}>
                  <div style={{ padding: '6px 12px', background: 'var(--ms-bg-activity)', border: '1px solid var(--ms-border)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transform: 'translateY(-2px)' }}>
                    <span style={{ color: '#38bdf8' }}>◈</span> main.ts
                  </div>
                  <div style={{ padding: '6px 12px', background: 'var(--ms-bg-activity)', border: '1px solid var(--ms-border)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transform: 'translateY(-2px)' }}>
                    <span style={{ color: '#4ade80' }}>◈</span> GitBackend.ts
                  </div>
                  <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--ms-accent-green)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transform: 'scale(1.05)' }}>
                    <span style={{ color: 'var(--ms-accent-green)', animation: 'ms-blink 1.4s infinite' }}>●</span> CodeEditor.tsx
                  </div>
                  <div style={{ padding: '6px 12px', background: 'var(--ms-bg-activity)', border: '1px solid var(--ms-border)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.85 }}>
                    <span style={{ color: '#fbbf24' }}>◈</span> styles.css
                  </div>
                  <div style={{ padding: '6px 12px', background: 'var(--ms-bg-activity)', border: '1px solid var(--ms-border)', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                    <span style={{ color: '#a78bfa' }}>◈</span> terminal.java
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: '6px', right: '12px', fontSize: '10px', color: 'var(--ms-accent-green)', fontFamily: 'var(--ms-mono)' }}>
                  [ slide-wrap mode active ]
                </div>
              </div>

            </div>
          </TiltCard>
        </Reveal>
        
        
        
        {/* Schema-Driven Configuration Engine — span 1 */}
        <Reveal delay={0.11}>
          <TiltCard className="ms-bento-card span1" style={{ '--glow-color': 'rgba(139, 92, 246, 0.15)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              
              <div>
                <div className="ms-bento-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>
                  {Icons.settings || (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </div>
                <div className="ms-bento-title">JSONC Registry Core</div>
                <p className="ms-bento-desc">
                  A high-tier, fully decoupled configuration engine. Built on a schema-driven lifecycle registry that allows internal modules and third-party extensions to inject, manage, and isolate runtime configurations dynamically. Features native JSONC serialization with automated delta disk tracking layers.
                </p>
              </div>

              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px', border: '1px solid var(--ms-border)', fontFamily: 'var(--ms-mono)', fontSize: '10px' }}>
                <div style={{ color: '#a78bfa', marginBottom: '4px' }}>// Extension Delta Sync Active</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#94a3b8' }}>"workbench.statusBar.visible"</span>
                  <span style={{ color: '#4ade80' }}>true</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#94a3b8' }}>"editor.fontSize"</span>
                  <span style={{ color: '#f43f5e' }}>14</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#94a3b8' }}>"monoAI.model.selection"</span>
                  <span style={{ color: '#38bdf8' }}>"gpt-4o"</span>
                </div>
              </div>

            </div>
          </TiltCard>
        </Reveal>
        
        
                {/* i18n Localization Engine — span 1 */}
        <Reveal delay={0.12}>
          <TiltCard className="ms-bento-card span1" style={{ '--glow-color': 'rgba(56, 189, 248, 0.15)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              
              <div>
                <div className="ms-bento-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  {Icons.globe}</div>
                <div className="ms-bento-title">i18n Global Ready</div>
                <p className="ms-bento-desc">
                  Mono Studio is designed with a core localization architecture. Currently shipping with full, optimized English support. Dynamic language pack injections are in active development for a truly global developer experience.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span className="ms-bento-tag" style={{ border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', background: 'transparent' }}>
                      {Icons.check} en-US (Active)
                    </span>
                    <span className="ms-bento-tag" style={{ opacity: 0.7, background: 'rgba(255,255,255,0.05)' }}>
                      Coming Soon...
                    </span>
                </div>
              </div>

              <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px', border: '1px solid var(--ms-border)', fontFamily: 'var(--ms-mono)', fontSize: '10px' }}>
                <div style={{ color: '#38bdf8', marginBottom: '4px' }}>// i18n.registry.ts</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#94a3b8' }}>activeLocale:</span>
                  <span style={{ color: '#4ade80' }}>"en"</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#94a3b8' }}>supported:</span>
                  <span style={{ color: '#fcd34d' }}>["en"]</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#94a3b8' }}>upcomingPacks:</span>
                  <span style={{ color: '#a78bfa' }}>["bn", "hi", "es", "zh"]</span>
                </div>
              </div>

            </div>
          </TiltCard>
        </Reveal>





        
      </div>
    </div>
  );
}

// ─── Extension Section ───────────────────────────────────────────────────────
function ExtensionSection() {
  return (
    <div className="ms-ext-section">
      <Reveal>
        <div className="ms-section-label">{Icons.plugin} Extension Ecosystem</div>
        <h2 className="ms-section-title">Build once.<br />Ship everywhere.</h2>
        <p className="ms-section-sub">A first-class SDK that makes building IDE extensions as easy as writing a JSON file and a single TypeScript module.</p>
      </Reveal>

      <div className="ms-ext-layout">
        <div className="ms-ext-steps">
          {[
            { n: '01', title: 'Define the manifest', desc: 'Declare your extension\'s ID, permissions, and contribution points in manifest.json.' },
            { n: '02', title: 'Write the logic', desc: 'Use the Extension API to register commands, menu items, views, and language providers.' },
            { n: '03', title: 'Test in sandbox', desc: 'Run msce dev to launch a live-reload sandbox session inside the IDE.' },
            { n: '04', title: 'Publish', desc: 'A single msce publish command bundles, signs, and uploads to the Mono Extension Registry.' },
          ].map((s, i) => (
            <Reveal delay={0.1 * i} key={s.n} direction="right">
              <div className="ms-step ms-hover-lift">
                <div className="ms-step-num">{s.n}</div>
                <div className="ms-step-body">
                  <div className="ms-step-title">{s.title}</div>
                  <p className="ms-step-desc">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.5}>
            <div style={{ marginTop: 16 }}>
              <Link to="/docs/getting-started/compile-and-build" className="ms-btn-primary ms-btn-glow" style={{ width: 'fit-content' }}>
                Start Building {Icons.arrowRight}
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3} direction="left">
          <TiltCard className="ms-manifest-card ms-glass-panel">
            <div className="ms-manifest-header">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b80' }} />
              manifest.json
            </div>
            <div className="ms-manifest-body">
              <div><span className="j-br">{'{'}</span></div>
              <div>&nbsp;&nbsp;<span className="j-key">"id"</span><span className="j-br">: </span><span className="j-str">"mono-ai-chat"</span><span className="j-br">,</span></div>
              <div>&nbsp;&nbsp;<span className="j-key">"main"</span><span className="j-br">: </span><span className="j-str">"out/extension.js"</span><span className="j-br">,</span></div>
              <div>&nbsp;&nbsp;<span className="j-key">"contributes"</span><span className="j-br">: {'{'}</span></div>
              
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"themes"</span><span className="j-br">: </span><span className="j-str">"./config/mono-theme.json"</span><span className="j-br">,</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"snippets"</span><span className="j-br">: </span><span className="j-str">"./data/ai-snippets.json"</span><span className="j-br">,</span></div>
              
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"commands"</span><span className="j-br">: [</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-br">{'{'}</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"id"</span><span className="j-br">: </span><span className="j-str">"openai.explainCode"</span><span className="j-br">,</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"title"</span><span className="j-br">: </span><span className="j-str">"AI: Explain Code"</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-br">{'}'}</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-br">],</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="j-key">"menus"</span><span className="j-br">: </span><span className="j-str">"./menus/context.json"</span></div>
              <div>&nbsp;&nbsp;<span className="j-br">{'}'}</span></div>
              <div><span className="j-br">{'}'}</span></div>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  );
}

// ─── Platform Section ────────────────────────────────────────────────────────
function PlatformSection() { 
  return (
    <div className="ms-platform-section">
      <Reveal>
        <div className="ms-section-label">{Icons.mobile} Cross-Platform</div>
        <h2 className="ms-section-title">Desktop power.<br />Zero compromise.</h2>
        <p className="ms-section-sub">Mono Studio is engineered from the ground up for Android and Web — not a desktop port, but a native mobile-first IDE.</p>
      </Reveal>

      <div className="ms-platform-cards">
        <Reveal delay={0.1} direction="right">
          <TiltCard className="ms-platform-card android ms-glass-panel">
            <div className="ms-platform-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--ms-green)', fontSize: '28px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
              {Icons.android}
            </div>
            <div className="ms-platform-title">Android</div>
            <p className="ms-platform-desc">Full desktop-class IDE on Android. Monaco Editor, real filesystem access, and powerful task management — all native.</p>
            <ul className="ms-platform-feats">
              {[
                  'Hardware keyboard shortcuts & custom keybindings', 
                  'Background terminal sessions & Output panel', 
                  'Mono Command Palette integration', 
                  'Task management system'
              ].map(f => (
                <li key={f} className="ms-platform-feat">
                  <span className="ms-feat-check" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--ms-green)' }}>{Icons.check}</span>
                  {f}
                </li>
              ))}
            </ul>
          </TiltCard>
        </Reveal>

        <Reveal delay={0.3} direction="left">
          <TiltCard className="ms-platform-card web ms-glass-panel">
            <div className="ms-platform-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--ms-accent)', fontSize: '28px', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
               {Icons.web}
            </div>
            <div className="ms-platform-title">Web Sandbox (Beta)</div>
            <p className="ms-platform-desc">Currently an isolated mock environment for UI debugging and testing. Want to help make it fully workable? Join us on GitHub!</p>
            <ul className="ms-platform-feats">
              {[
                  'Mock file system & search engine', 
                  'UI layout & component debugging', 
                  'Instant preview without installation', 
                  'Open-source contributions welcome'
              ].map(f => (
                <li key={f} className="ms-platform-feat">
                  <span className="ms-feat-check" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--ms-accent)' }}>{Icons.check}</span>
                  {f}
                </li>
              ))}
            </ul>
          </TiltCard>
        </Reveal>
      </div>
    </div>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <Reveal direction="up">
      <div className="ms-final-cta ms-glass-panel" style={{ '--glow-color': 'rgba(139,92,246,0.2)' }}>
        <div className="ms-final-cta-label">
          {Icons.star} Ready to build
        </div>
        <h2 className="ms-final-cta-title">Ship your next extension<br />today.</h2>
        <p className="ms-final-cta-sub">Everything you need — docs, API reference, and a thriving ecosystem. Dive in and build something extraordinary.</p>
        <div className="ms-final-cta-btns">
          <Link to="/docs/intro" className="ms-btn-primary ms-btn-glow" style={{ background: 'var(--ms-accent2)' }}>
            Read the Docs {Icons.arrowRight}
          </Link>
          <Link to="/docs/api" className="ms-btn-outline ms-hover-lift">
            API Reference
          </Link>
          <a href="https://github.com/monostudio-in/mscode" className="ms-btn-outline ms-hover-lift">
            {Icons.github} GitHub
          </a>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Documentation and Extension API reference for Mono Studio IDE.">
      <div className="ms-page">
        <HomepageHeader />
        <IDEMockup />
        <BentoFeatures />
        <div className="ms-divider" />
        <ExtensionSection />
        <div className="ms-divider" />
        <PlatformSection />
        <FinalCTA />
      </div>
    </Layout>
  );
}