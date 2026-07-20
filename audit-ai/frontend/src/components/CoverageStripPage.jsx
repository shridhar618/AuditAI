import React from 'react';
import { Link } from 'react-router-dom';
import CoverageStrip from './CoverageStrip/CoverageStrip';

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

const CoverageStripPage = () => {
  return (
    <div
      style={{
        backgroundColor: TOKENS.paper,
        minHeight: '100vh',
        padding: '32px 40px 60px',
        fontFamily: FONT_BODY,
        color: TOKENS.ink
      }}
    >
      {/* Header - exact match from DesignReference */}
      <div
        style={{
          borderBottom: `1px solid ${TOKENS.line}`,
          padding: '28px 40px 22px',
          marginBottom: 36
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 26,
            letterSpacing: '-0.01em'
          }}
        >
          AuditOS
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11.5,
            color: TOKENS.inkMuted,
            marginTop: 4
          }}
        >
          audit coverage — sampling to full population review
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36
        }}
      >
        {/* Coverage section */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginBottom: 24
          }}
        >
          {/* Left panel - Coverage visualization */}
          <div
            style={{
              flex: 1,
              minWidth: 0
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                marginBottom: 14
              }}
            >
              Coverage Progress
            </div>
            <CoverageStrip />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11.5,
                color: TOKENS.inkMuted,
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>5% initial sample</span>
              <span>100% coverage</span>
            </div>
          </div>

          {/* Right panel - Legend and stats */}
          <div
            style={{
              width: 280,
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                marginBottom: 14
              }}
            >
              Coverage Legend
            </div>
            <div
              style={{
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: TOKENS.paperRaised
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderBottom: `1px solid ${TOKENS.line}`
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: TOKENS.verified,
                    borderRadius: 2
                  }}
                />
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: TOKENS.ink }}>
                  Clean transactions
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderBottom: `1px solid ${TOKENS.line}`
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: TOKENS.seal,
                    borderRadius: 2
                  }}
                />
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: TOKENS.ink }}>
                  Flagged transactions
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px'
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: 'transparent',
                    border: `1px solid ${TOKENS.line}`,
                    borderRadius: 2
                  }}
                />
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: TOKENS.ink }}>
                  Pending review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 40
          }}
        >
          <Link
            to="/transactions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: TOKENS.seal,
              color: '#fff',
              fontFamily: FONT_MONO,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 4,
              border: `1px solid ${TOKENS.line}`,
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#8f4342'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = TOKENS.seal; }}
          >
            View Transactions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CoverageStripPage;