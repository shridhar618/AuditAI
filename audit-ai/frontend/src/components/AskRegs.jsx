import React, { useState } from 'react';
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

const sampleQuestions = [
  'What are the capital requirements under Basel III?',
  'What are the AML requirements for politically exposed persons?',
  'What does GDPR say about data subject rights?',
  'What are the liquidity coverage ratio requirements?',
  'What are the large exposure reporting requirements?',
];

const AskRegs = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regulation, setRegulation] = useState(null);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setRegulation(null);

    try {
      const response = await axios.post('/api/ask', { query: question });
      setAnswer(response.data.answer);
      setRegulation({
        id: response.data.regulation_id,
        text: response.data.regulation_text,
        title: response.data.regulation_text?.split(',')[0] || 'Regulation Reference',
        score: response.data.score,
      });
    } catch (err) {
      setError('Failed to get answer: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !question.trim()) {
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
          Loading regulatory answer...
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
          ask the regulations — policy corpus & compliance guidance
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
        {/* Layout */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginBottom: 24
          }}
        >
          {/* Left panel - Question */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                marginBottom: 4
              }}
            >
              Knowledge request
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: TOKENS.inkMuted,
                marginBottom: 4
              }}
            >
              Query the policy corpus and receive concise, citation-backed control guidance.
            </div>

            {/* Question bank */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16
              }}
            >
              {sampleQuestions.map((sample) => (
                <button
                  key={sample}
                  onClick={() => setQuestion(sample)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${TOKENS.line}`,
                    borderRadius: 6,
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    color: TOKENS.ink,
                    cursor: 'pointer',
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
                  {sample}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter a regulatory question..."
              style={{
                width: '100%',
                minHeight: 120,
                padding: '12px 16px',
                fontFamily: FONT_BODY,
                fontSize: 13.5,
                color: TOKENS.ink,
                backgroundColor: 'transparent',
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = TOKENS.seal;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = TOKENS.line;
              }}
            />

            {/* Submit button */}
            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: TOKENS.ink,
                color: TOKENS.paper,
                border: 'none',
                borderRadius: 6,
                fontFamily: FONT_BODY,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              {loading ? 'Searching corpus...' : 'Ask question'}
            </button>
          </div>

          {/* Right panel - Answer */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                marginBottom: 4
              }}
            >
              Grounded answer
            </div>
            {regulation && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: TOKENS.citationBg,
                  color: TOKENS.citation,
                  border: `1px solid ${TOKENS.citation}33`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontFamily: FONT_MONO,
                  fontSize: 11.5,
                  marginBottom: 8
                }}
              >
                📄 {regulation.id}
              </div>
            )}

            <div
              style={{
                flex: 1,
                minHeight: 0
              }}
            >
              {answer ? (
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: TOKENS.inkMuted
                  }}
                >
                  <p>
                    <span style={{ fontWeight: 600 }}>
                      {regulation?.title || 'Regulatory Guidance'}
                    </span> — {answer}
                  </p>
                  {regulation && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: `1px solid ${TOKENS.line}`
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: TOKENS.citationBg,
                          color: TOKENS.citation,
                          border: `1px solid ${TOKENS.citation}33`,
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontFamily: FONT_MONO,
                          fontSize: 11.5,
                          marginBottom: 8
                        }}
                      >
                        📄 {regulation.id}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {regulation.title}
                        </span> — {regulation.text}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '40px',
                    color: TOKENS.inkMuted
                  }}
                >
                  Ask a question to generate a regulatory answer.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskRegs;