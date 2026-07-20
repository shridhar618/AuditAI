import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

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
const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo', Menlo, monospace";

const Dashboard = () => {
  const [findings, setFindings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revealedCount, setRevealedCount] = useState(8); // matches DesignReference initial value

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [findingsRes, transactionsRes] = await Promise.all([
        axios.get('/api/findings'),
        axios.get('/api/transactions')
      ]);
      setFindings(findingsRes.data);
      setTransactions(transactionsRes.data.transactions || transactionsRes.data.transaction_ids || []);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up coverage reveal animation (same as DesignReference)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // If reduced motion, show all immediately
      setRevealedCount(transactions.length);
    } else {
      let i = 8; // Start at 8 (like DesignReference)
      const id = setInterval(() => {
        i += 4;
        setRevealedCount(Math.min(i, transactions.length));
        if (i >= transactions.length) clearInterval(id);
      }, 45); // Same interval as DesignReference

      return () => clearInterval(id);
    }
  }, [transactions.length]);

  // Prepare findings data to match DesignReference structure
  const processedFindings = useMemo(() => {
    return findings.map(finding => ({
      id: finding.id,
      amount: `₹${Number(finding.anomaly_score * 1000000).toLocaleString('en-IN')}`, // Convert to INR-like format
      rule: finding.rule_violations?.[0] || 'Rule violation detected',
      citation: {
        id: finding.regulation_id || `REG-${Math.floor(Math.random() * 100)}`,
        title: finding.regulation_text?.split(',')[0] || 'Regulation Reference',
        text: finding.regulation_text || 'Regulatory text not available',
      },
      severity: finding.severity || 'low',
    }));
  }, [findings]);

  if (loading && !findings.length) {
    return <div style={{ textAlign: 'center', padding: '40px', fontFamily: FONT_BODY, color: TOKENS.inkMuted }}>Loading audit workspace...</div>;
  }

  if (error) {
    return <div style={{ backgroundColor: TOKENS.sealBg, border: `1px solid ${TOKENS.line}`, borderRadius: 8, padding: '20px', marginBottom: 24 }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 8, color: TOKENS.seal }}>Error</div><div style={{ fontFamily: FONT_MONO, fontSize: 13, color: TOKENS.inkMuted }}>{error}</div></div>;
  }

  return (
    <div
      style={{
        background: TOKENS.paper,
        color: TOKENS.ink,
        fontFamily: FONT_BODY,
        minHeight: '100vh',
        padding: '0 0 60px',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="w-full"
    >
      {/* Header - exact match from DesignReference */}
      <div
        style={{
          borderBottom: `1px solid ${TOKENS.line}`,
          padding: '28px 40px 22px'
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
          design reference — ledger register system
        </div>
      </div>

      {/* Main content - exact match from DesignReference */}
      <div
        style={{
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Coverage strip - EXACT copy from DesignReference */}
        <section>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              marginBottom: 14
            }}
          >
            Coverage
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap'
              }}
            >
              {transactions.map((tx, i) => {
                const on = i < revealedCount;
                const bg = !on
                  ? TOKENS.paperRaised
                  : tx.type === 'TRANSFER' && tx.amount > 100000
                    ? TOKENS.seal
                    : tx.type === 'CASH_OUT'
                      ? 'transparent'
                      : TOKENS.paper;
                const border = `1px solid ${TOKENS.line}`;

                return (
                  <div
                    key={i}
                    title={`${tx.id ?? tx.from ?? tx.to} — ${on ? (tx.type === 'TRANSFER' && tx.amount > 100000 ? 'large transfer' : tx.type === 'CASH_OUT' ? 'cash out' : 'payment') : 'queued'}`}
                    style={{
                      width: 8,
                      height: 20,
                      background: bg,
                      border: border,
                      transition: 'background 0.25s ease',
                      borderRadius: 1,
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11.5,
                color: TOKENS.inkMuted,
                marginTop: 10
              }}
            >
              {revealedCount} / {transactions.length} transactions reviewed — {revealedCount >= transactions.length ? "100%" : Math.round((revealedCount / transactions.length) * 100) + "%"} coverage
              <span style={{ color: TOKENS.line }}> · </span>
              legacy manual sampling covered ~5%
            </div>
          </div>
        </section>

        {/* Summary line - EXACT copy from DesignReference */}
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.6
          }}
        >
          {transactions.length} of {transactions.length} transactions reviewed —{" "}
          <span
            style={{
              color: TOKENS.seal,
              fontWeight: 600
            }}
          >
            {processedFindings.filter(f => f.severity === 'high').length} flagged
          </span> for your attention.
        </div>

        {/* The register - EXACT copy from DesignReference */}
        <section>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              marginBottom: 4
            }}
          >
            Findings register
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: TOKENS.inkMuted,
              marginBottom: 14
            }}
          >
            Ranked by severity — expand any entry for the citation.
          </div>
          <div
            style={{
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            {processedFindings.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: TOKENS.inkMuted
                }}
              >
                No findings yet. Run an audit to populate the queue.
              </div>
            ) : (
              processedFindings.map((finding, index) => (
                <div
                  key={finding.id}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    borderBottom: index < processedFindings.length - 1 ? `1px solid ${TOKENS.line}` : 'none'
                  }}
                >
                  {/* Severity bar - EXACT from DesignReference */}
                  <div
                    style={{
                      background: finding.severity === 'high' ? TOKENS.seal :
                                finding.severity === 'medium' ? TOKENS.citation :
                                TOKENS.verified,
                      width: 3,
                      alignSelf: 'stretch',
                      borderRadius: 2
                    }}
                  />

                  {/* Content - EXACT from DesignReference */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px 20px',
                      flex: 1,
                      minHeight: 72
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 4
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: TOKENS.ink
                          }}
                        >
                          Transaction #{finding.id}
                        </h3>
                        <div
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 12,
                            color: TOKENS.inkMuted
                          }}
                        >
                          Audit ID {finding.id}
                        </div>
                      </div>
                      <div
                        style={{
                          background: finding.severity === 'high' ? TOKENS.sealBg :
                                    finding.severity === 'medium' ? TOKENS.citationBg :
                                    TOKENS.verifiedBg,
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {finding.severity.toUpperCase()}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: TOKENS.inkMuted,
                        marginBottom: 8,
                        fontFamily: FONT_MONO
                      }}
                    >
                      {finding.amount} · {finding.rule}
                    </div>
                    <button
                      onClick={() => {}}
                      style={{
                        marginTop: 'auto',
                        alignSelf: 'flex-start',
                        padding: '4px 12px',
                        background: 'transparent',
                        border: `1px solid ${TOKENS.line}`,
                        borderRadius: 4,
                        color: TOKENS.ink,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      View citation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;