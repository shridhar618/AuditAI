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
  return (
    <Router>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px minmax(0, 1fr)',
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
            padding: '24px 20px',
            overflowY: 'auto',
            backgroundColor: TOKENS.paperRaised,
            borderRight: `1px solid ${TOKENS.line}`
          }}
          className="sidebar"
        >
          {/* Brand */}
          <NavLink
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 0',
              textDecoration: 'none'
            }}
            className="brand"
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${TOKENS.seal}, #8f4342)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: 18
              }}
              className="brand-mark"
            >
              A
            </span>
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
          </NavLink>

          {/* Navigation */}
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
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: TOKENS.inkMuted,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.target.style.backgroundColor = TOKENS.paper;
                    e.target.style.color = TOKENS.ink;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = TOKENS.inkMuted;
                  }
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Status indicator */}
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
        </aside>

        {/* Main content area */}
        <main
          style={{
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '32px',
            animation: 'fadeInUp 500ms ease-out forwards',
            opacity: 0,
            transform: 'translateY(16px)'
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