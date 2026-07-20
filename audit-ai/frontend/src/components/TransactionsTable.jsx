import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/transactions');
      // Handle different possible response formats
      if (response.data.transactions) {
        setTransactions(response.data.transactions);
      } else if (response.data.transaction_ids) {
        // If only IDs are returned, create basic transaction objects
        setTransactions(response.data.transaction_ids.map(id => ({ id })));
      } else {
        // Assume the data is already an array of transactions
        setTransactions(Array.isArray(response.data) ? response.data : [response.data]);
      }
    } catch (err) {
      setError('Failed to load transactions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading && !transactions.length) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: TOKENS.paperRaised,
          borderRadius: 8,
          border: `1px solid ${TOKENS.line}`
        }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, marginBottom: 16 }}>
          Loading transaction ledger...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: TOKENS.sealBg,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: 8,
          padding: '20px',
          marginBottom: 24
        }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, marginBottom: 8, color: TOKENS.seal }}>
          Error
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: TOKENS.inkMuted }}>
          {error}
        </div>
      </div>
    );
  }

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
          transaction ledger — audit trail & compliance
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
        {/* Controls header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 20,
              fontWeight: 600
            }}
          >
            Transaction Ledger
          </div>
          <Link
            to="/ask-regs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
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
            Ask a Regulatory Question
          </Link>
        </div>

        {/* Table container */}
        <div
          style={{
            overflowX: 'auto',
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 8,
            backgroundColor: '#fff'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              minWidth: 800
            }}
          >
            <thead>
              <tr>
                {/* Table headers - exact match from DesignReference */}
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  TXN ID
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Amount (INR)
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Timestamp
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    color: TOKENS.inkMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: TOKENS.paperRaised,
                    borderBottom: `1px solid ${TOKENS.line}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: index < transactions.length - 1 ? `1px solid ${TOKENS.line}` : 'none',
                      backgroundColor: index % 2 === 0 ? '#fff' : TOKENS.paperRaised
                    }}
                  >
                    <td
                      style={{
                        padding: '16px 20px',
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: TOKENS.ink,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tx.id}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: TOKENS.ink,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tx.type || '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: TOKENS.ink,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {typeof tx.amount === 'number'
                        ? '₹' + tx.amount.toLocaleString('en-IN')
                        : '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: TOKENS.ink,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '-'}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        textAlign: 'center'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor:
                            tx.status === 'flagged'
                              ? TOKENS.sealBg
                              : tx.status === 'pending'
                                ? TOKENS.citationBg
                                : TOKENS.verifiedBg,
                          border: `1px solid ${TOKENS.line}`,
                          borderRadius: 4,
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color:
                            tx.status === 'flagged'
                              ? TOKENS.seal
                              : tx.status === 'pending'
                                ? TOKENS.citation
                                : TOKENS.verified
                        }}
                      >
                        {tx.status ? tx.status.toUpperCase() : '-'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        textAlign: 'center'
                      }}
                    >
                      <Link
                        to={`/transactions/${tx.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${TOKENS.line}`,
                          borderRadius: 4,
                          fontFamily: FONT_MONO,
                          fontSize: 12,
                          color: TOKENS.ink,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = TOKENS.paperRaised;
                          e.target.style.borderColor = TOKENS.seal;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = TOKENS.line;
                        }}
                      >
                        View Details
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 5L5 1L9 5"
                            stroke={TOKENS.ink}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: TOKENS.inkMuted
                    }}
                  >
                    No transactions found. Run an audit to populate the ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {transactions.length > 0 && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 28,
              borderTop: `1px solid ${TOKENS.line}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: TOKENS.inkMuted
            }}
          >
            <div>
              Showing {transactions.length} transactions
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center'
              }}
            >
              <span
                style={{
                  backgroundColor: TOKENS.verifiedBg,
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: TOKENS.verified
                }}
              >
                Cleared
              </span>
              <span
                style={{
                  backgroundColor: TOKENS.citationBg,
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: TOKENS.citation
                }}
              >
                Pending
              </span>
              <span
                style={{
                  backgroundColor: TOKENS.sealBg,
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: TOKENS.seal
                }}
              >
                Flagged
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;