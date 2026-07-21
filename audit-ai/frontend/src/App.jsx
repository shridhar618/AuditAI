import React from 'react';
import { BrowserRouter as Router, NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TransactionsTable from './components/TransactionsTable';
import AskRegs from './components/AskRegs';
import CoverageStripPage from './components/CoverageStripPage';

// EXACT COPY OF DESIGN REFERENCE TOKENS AND FONTS
const TOKENS = {
  paper: "#F5F3EE",
  paperRaised: "#FBFAF7",
  ink: "#1B2430",
  inkMuted: "#6B7280",
  line: "#D8D3C7",
  seal: "#A6332F",
  sealBg: "#F3E4E2",
  verified: "#3F6B4F",
  verifiedBg: "#E4ECE6",
  citation: "#9C7A32",
  citationBg: "#F1E9D6",
};

const FONT_DISPLAY = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/ask-regs', label: 'Ask the Regs' },
  { to: '/coverage', label: 'Coverage' },
];

const App = () => {
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isMobile = windowWidth < 640;

  // Sidebar width based on screen size
  const sidebarWidth = isDesktop ? 260 : isTablet ? 200 : sidebarCollapsed ? 60 : 200;
  const sidebarPadding = isDesktop ? '24px 20px' : isTablet ? '20px 16px' : '16px 12px';
  const mainPadding = isDesktop ? '32px' : isTablet ? '24px' : '16px';
  const mainBottomPadding = isDesktop ? '60px' : isTablet ? '40px' : '24px';

  return (
    <Router>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)`,
          minHeight: '100vh',
          backgroundColor: TOKENS.paper,
          fontFamily: FONT_BODY,
          color: TOKENS.ink
        }}
        className="app-shell"
      >
        {/* Sidebar */}
        <aside
          style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: sidebarPadding,
            overflowY: 'auto',
            backgroundColor: TOKENS.paperRaised,
            borderRight: `1px solid ${TOKENS.line}`,
            width: `${sidebarWidth}px`,
            flexShrink: 0
          }}
          className="sidebar"
        >
          {/* Mobile hamburger button */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: '16px',
                left: '16px',
                zIndex: 1000,
                backgroundColor: TOKENS.verified,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Toggle navigation"
            >
              &#9776;
            </div>
          )}

          {/* Brand */}
          <NavLink
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              padding: '16px 0',
              textDecoration: 'none',
              width: '100%'
            }}
            className="brand"
          >
            <span
              style={{
                width: isMobile ? 28 : 36,
                height: isMobile ? 28 : 36,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${TOKENS.seal}, #8f4342)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: isMobile ? 14 : 18
              }}
              className="brand-mark"
            >
              A
            </span>
            {!isMobile && (
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 18,
                    fontWeight: 600,
                    color: TOKENS.ink
                  }}
                  className="brand-title"
                >
                  AuditOS
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: TOKENS.inkMuted,
                    marginTop: 2
                  }}
                  className="brand-tagline"
                >
                  Control Center
                </span>
              </div>
            )}
          </NavLink>

          {/* Navigation links - show text on desktop/tablet, icons on mobile */}
          {(!isMobile || !sidebarCollapsed) && (
            <nav
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginTop: 'auto'
              }}
              className="nav-list"
              aria-label="Primary"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 8 : 10,
                    padding: isMobile ? '10px 12px' : '12px 16px',
                    borderRadius: 6,
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: 500,
                    color: TOKENS.inkMuted,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active') && !isMobile) {
                      e.target.style.backgroundColor = TOKENS.paper;
                      e.target.style.color = TOKENS.ink;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active') && !isMobile) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = TOKENS.inkMuted;
                    }
                  }}
                >
                  {isMobile ? (
                    <>
                      {item.to === '/' && <span>🏠</span>}
                      {item.to === '/transactions' && <span>💳</span>}
                      {item.to === '/ask-regs' && <span>❓</span>}
                      {item.to === '/coverage' && <span>📊</span>}
                    </>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Status indicator (hidden on mobile when collapsed) */}
          {(isDesktop || isTablet || !sidebarCollapsed) && (
            <div
              style={{
                marginTop: 'auto',
                padding: '20px',
                borderTop: `1px solid ${TOKENS.line}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14
              }}
              className="sidebar-status"
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: TOKENS.verified,
                  boxShadow: `0 0 0 2px rgba(63, 107, 79, 0.2)`
                }}
                className="status-dot"
              />
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: TOKENS.ink
                  }}
                >
                  Live Monitoring
                </strong>
                <small
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: TOKENS.inkMuted
                  }}
                >
                  4 services online
                </small>
              </div>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <main
          style={{
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: mainPadding,
            animation: 'fadeInUp 500ms ease-out forwards',
            opacity: 0,
            transform: 'translateY(16px)',
            paddingBottom: mainBottomPadding
          }}
          className="main-shell"
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsTable />} />
            <Route path="/ask-regs" element={<AskRegs />} />
            <Route path="/coverage" element={<CoverageStripPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;