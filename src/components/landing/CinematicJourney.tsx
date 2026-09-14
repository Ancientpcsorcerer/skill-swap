import { useState, useEffect } from 'react';
import '../../styles/cinematic-journey.css';

interface Props {
  onEnterCore: (targetCore?: string) => void;
  onExitJourney?: () => void;
}

export function CinematicJourney({ onEnterCore, onExitJourney }: Props) {
  const [activeChapter, setActiveChapter] = useState<number>(1);

  // Allow Escape key to exit or skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onExitJourney) {
          onExitJourney();
        } else {
          onEnterCore('connect');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnterCore, onExitJourney]);

  return (
    <div className="cinematic-journey-overlay" role="dialog" aria-modal="true" aria-label="Skill Swap Cinematic Journey">
      {/* Persistent HUD Navigation Bar */}
      <header className="journey-hud">
        <div className="journey-hud-brand">
          <span className="journey-hud-logo">SKILL SWAP</span>
          <span className="journey-hud-badge">✦ THE RECIPROCAL JOURNEY</span>
        </div>

        {/* Chapter Steps Navigator */}
        <nav className="journey-hud-steps" aria-label="Journey Chapters">
          <button
            type="button"
            className={`journey-step-btn ${activeChapter === 1 ? 'is-active' : ''}`}
            onClick={() => setActiveChapter(1)}
          >
            <span>01</span> Features
          </button>
          <button
            type="button"
            className={`journey-step-btn ${activeChapter === 2 ? 'is-active' : ''}`}
            onClick={() => setActiveChapter(2)}
          >
            <span>02</span> Swap Stories
          </button>
          <button
            type="button"
            className={`journey-step-btn ${activeChapter === 3 ? 'is-active' : ''}`}
            onClick={() => setActiveChapter(3)}
          >
            <span>03</span> Masteries
          </button>
          <button
            type="button"
            className={`journey-step-btn ${activeChapter === 4 ? 'is-active' : ''}`}
            onClick={() => setActiveChapter(4)}
          >
            <span>04</span> Core Gateway
          </button>
        </nav>

        <div className="journey-hud-actions">
          {onExitJourney && (
            <button
              type="button"
              className="journey-prev-btn"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={onExitJourney}
              aria-label="Return to Landing Portal"
            >
              ← Portal
            </button>
          )}
          <button
            type="button"
            className="journey-skip-btn"
            onClick={() => onEnterCore('connect')}
            aria-label="Skip journey directly to application"
          >
            Skip to Cores ↗
          </button>
        </div>
      </header>

      {/* Narrative Body Content */}
      <main className="journey-body">
        {/* ACT 1: The Barter Paradigm & Core Features */}
        {activeChapter === 1 && (
          <section className="journey-chapter" aria-labelledby="chapter-1-title">
            <div className="journey-kicker">
              <span className="journey-kicker-dot" />
              <span>01 / THE BARTER PARADIGM</span>
            </div>
            <h1 id="chapter-1-title" className="journey-title">
              Trade Your Craft, Not Your Currency.
            </h1>
            <p className="journey-subtitle">
              A peer-to-peer exchange ecosystem engineered for modern polymaths, builders, and designers. Swap your deepest mastery directly for the skills you need next.
            </p>

            <div className="journey-features-grid">
              <div className="journey-feature-card">
                <div className="journey-card-icon">⇄</div>
                <h3 className="journey-card-title">Direct Reciprocal Barter</h3>
                <p className="journey-card-desc">
                  Eliminate financial friction. Trade 1-on-1 knowledge with zero token speculation, zero transaction cuts, and 100% human intellectual capital.
                </p>
                <span className="journey-card-tag">Pure Knowledge Barter</span>
              </div>

              <div className="journey-feature-card">
                <div className="journey-card-icon">✦</div>
                <h3 className="journey-card-title">Reciprocal Fit Radar</h3>
                <p className="journey-card-desc">
                  Our mutual alignment engine scans community members to compute exact reciprocal symmetry—pairing what you teach with what your partner craves.
                </p>
                <span className="journey-card-tag">Algorithmic Fit</span>
              </div>

              <div className="journey-feature-card">
                <div className="journey-card-icon">⌘</div>
                <h3 className="journey-card-title">Synchronous Studios</h3>
                <p className="journey-card-desc">
                  Co-create in real time. Draft blueprints in the Studio Workbench, inspect live card previews, and track dual-sided exchange milestones.
                </p>
                <span className="journey-card-tag">Real-Time Co-Creation</span>
              </div>
            </div>
          </section>
        )}

        {/* ACT 2: Real Exchange Stories (Live Examples) */}
        {activeChapter === 2 && (
          <section className="journey-chapter" aria-labelledby="chapter-2-title">
            <div className="journey-kicker">
              <span className="journey-kicker-dot" />
              <span>02 / LIVE CASE STUDIES IN MOTION</span>
            </div>
            <h2 id="chapter-2-title" className="journey-title">
              Real Trades Between World-Class Creators.
            </h2>
            <p className="journey-subtitle">
              Discover how experts across disciplines partner up to build award-winning products and master new horizons.
            </p>

            <div className="journey-examples-deck">
              {/* Example 1 */}
              <div className="journey-story-card">
                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar">ML</div>
                    <div>
                      <h4 className="story-name">Maya Lin</h4>
                      <p className="story-role">Senior 3D & WebGL Artist</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Three.js shaders, GLSL raymarching, Canvas rendering pipeline
                  </div>
                </div>

                <div className="story-swap-nexus">
                  <div className="story-swap-icon">⇄</div>
                  <span className="story-fit-badge">✦ 98% Fit</span>
                </div>

                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar" style={{ background: '#254a32' }}>LC</div>
                    <div>
                      <h4 className="story-name">Leo Chen</h4>
                      <p className="story-role">Systems & Rust Architect</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Async Rust, Wasm compilation, memory-safe multi-threading
                  </div>
                </div>
              </div>

              {/* Example 2 */}
              <div className="journey-story-card">
                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar" style={{ background: '#593246' }}>ER</div>
                    <div>
                      <h4 className="story-name">Elena Rostova</h4>
                      <p className="story-role">Creative Director & Type Designer</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Editorial layout systems, Variable typography, Brand tokens
                  </div>
                </div>

                <div className="story-swap-nexus">
                  <div className="story-swap-icon">⇄</div>
                  <span className="story-fit-badge">✦ 96% Fit</span>
                </div>

                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar" style={{ background: '#1c3e59' }}>AP</div>
                    <div>
                      <h4 className="story-name">Aarav Patel</h4>
                      <p className="story-role">Fullstack Engineer</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Next.js App Router, TigerData PostgreSQL, Auth hardening
                  </div>
                </div>
              </div>

              {/* Example 3 */}
              <div className="journey-story-card">
                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar" style={{ background: '#614828' }}>SV</div>
                    <div>
                      <h4 className="story-name">Sofia Vega</h4>
                      <p className="story-role">AI Engineer & Researcher</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Agent orchestration, LangChain, LLM fine-tuning pipelines
                  </div>
                </div>

                <div className="story-swap-nexus">
                  <div className="story-swap-icon">⇄</div>
                  <span className="story-fit-badge">✦ 95% Fit</span>
                </div>

                <div className="story-creator-box">
                  <div className="story-creator-header">
                    <div className="story-avatar" style={{ background: '#35324b' }}>MV</div>
                    <div>
                      <h4 className="story-name">Marcus Vance</h4>
                      <p className="story-role">Sound & Motion Designer</p>
                    </div>
                  </div>
                  <div className="story-exchange-pill">
                    <strong>Offers in Swap</strong>
                    Micro-interaction sound design, SVG animation, Cubic easing
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACT 3: Curated Masteries & Courses */}
        {activeChapter === 3 && (
          <section className="journey-chapter" aria-labelledby="chapter-3-title">
            <div className="journey-kicker">
              <span className="journey-kicker-dot" />
              <span>03 / CURATED EXPEDITIONS</span>
            </div>
            <h2 id="chapter-3-title" className="journey-title">
              High-Demand Disciplines & Courses.
            </h2>
            <p className="journey-subtitle">
              Structured roadmaps crafted by the community. Swap hours with verified mentors ready to coach you right now.
            </p>

            <div className="journey-courses-grid">
              <div className="journey-course-card">
                <div className="course-card-meta">
                  <span>312 Active Mentors</span>
                  <span>3 Weeks Avg</span>
                </div>
                <h3 className="course-card-title">Autonomous AI Agents & Multi-Model Orchestration</h3>
                <div className="course-card-skills">
                  <span className="course-skill-pill">LangGraph</span>
                  <span className="course-skill-pill">RAG</span>
                  <span className="course-skill-pill">Fine-Tuning</span>
                </div>
              </div>

              <div className="journey-course-card">
                <div className="course-card-meta">
                  <span>185 Active Mentors</span>
                  <span>4 Weeks Avg</span>
                </div>
                <h3 className="course-card-title">Creative Computing, Shaders & 3D WebGL</h3>
                <div className="course-card-skills">
                  <span className="course-skill-pill">Three.js</span>
                  <span className="course-skill-pill">GLSL</span>
                  <span className="course-skill-pill">Raymarching</span>
                </div>
              </div>

              <div className="journey-course-card">
                <div className="course-card-meta">
                  <span>490 Active Mentors</span>
                  <span>2 Weeks Avg</span>
                </div>
                <h3 className="course-card-title">Distributed Systems & High-Throughput Rust</h3>
                <div className="course-card-skills">
                  <span className="course-skill-pill">Tokio</span>
                  <span className="course-skill-pill">Wasm</span>
                  <span className="course-skill-pill">PostgreSQL</span>
                </div>
              </div>

              <div className="journey-course-card">
                <div className="course-card-meta">
                  <span>260 Active Mentors</span>
                  <span>3 Weeks Avg</span>
                </div>
                <h3 className="course-card-title">Editorial Design Systems & Kinetic Typography</h3>
                <div className="course-card-skills">
                  <span className="course-skill-pill">Design Tokens</span>
                  <span className="course-skill-pill">Figma</span>
                  <span className="course-skill-pill">Micro-Grain</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACT 4: The Core Gateway (Entering the Cores) */}
        {activeChapter === 4 && (
          <section className="journey-chapter" aria-labelledby="chapter-4-title">
            <div className="journey-kicker">
              <span className="journey-kicker-dot" />
              <span>04 / THE GATEWAY IS OPEN</span>
            </div>
            <h2 id="chapter-4-title" className="journey-title">
              Enter the Skill Swap Ecosystem.
            </h2>
            <p className="journey-subtitle">
              Choose your destination. You will enter the application authenticated with your active session or guest passport.
            </p>

            <div className="journey-gateway-grid">
              <button
                type="button"
                className="journey-gateway-portal"
                onClick={() => onEnterCore('connect')}
              >
                <span className="portal-card-num">CORE 01</span>
                <h3 className="portal-card-title">Connect Core</h3>
                <p className="portal-card-desc">
                  Explore reciprocal peers, activate the Reciprocal Radar, and send exchange proposals.
                </p>
                <span className="portal-card-cta">Enter Connect ↗</span>
              </button>

              <button
                type="button"
                className="journey-gateway-portal"
                onClick={() => onEnterCore('create')}
              >
                <span className="portal-card-num">CORE 02</span>
                <h3 className="portal-card-title">Create Core</h3>
                <p className="portal-card-desc">
                  Open the Studio Workbench, draft blueprints, and publish live interactive swap cards.
                </p>
                <span className="portal-card-cta">Enter Create ↗</span>
              </button>

              <button
                type="button"
                className="journey-gateway-portal"
                onClick={() => onEnterCore('learn')}
              >
                <span className="portal-card-num">CORE 03</span>
                <h3 className="portal-card-title">Learn Core</h3>
                <p className="portal-card-desc">
                  Follow skill roadmaps, track your mastery meters, and check in on weekly study streaks.
                </p>
                <span className="portal-card-cta">Enter Learn ↗</span>
              </button>

              <button
                type="button"
                className="journey-gateway-portal"
                onClick={() => onEnterCore('discover')}
              >
                <span className="portal-card-num">CORE 04</span>
                <h3 className="portal-card-title">Discover Core</h3>
                <p className="portal-card-desc">
                  Browse the living editorial masonry feed of active community projects and discussions.
                </p>
                <span className="portal-card-cta">Enter Discover ↗</span>
              </button>
            </div>
          </section>
        )}

        {/* Bottom Persistent Navigation Bar */}
        <footer className="journey-bottom-bar">
          <button
            type="button"
            className="journey-prev-btn"
            disabled={activeChapter === 1}
            onClick={() => setActiveChapter((prev) => Math.max(1, prev - 1))}
          >
            ← Previous Chapter
          </button>

          {activeChapter < 4 ? (
            <button
              type="button"
              className="journey-next-btn"
              onClick={() => setActiveChapter((prev) => Math.min(4, prev + 1))}
            >
              Next: {activeChapter === 1 ? 'Swap Stories' : activeChapter === 2 ? 'Masteries' : 'Enter Cores'} →
            </button>
          ) : (
            <button
              type="button"
              className="journey-next-btn"
              onClick={() => onEnterCore('connect')}
            >
              Enter Skill Swap Cores ✦
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}
