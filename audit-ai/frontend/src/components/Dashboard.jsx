import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latestFinding, setLatestFinding] = useState(null);
  const [showCitation, setShowCitation] = useState(false);
  const [expandedFid, setExpandedFid] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      // For demo purposes, we'll audit transaction ID 1
      // In a real app, you might want to select or run on latest
      const auditResponse = await axios.post(`/api/audit/1`);
      // Refresh findings after audit
      loadFindings();
    } catch (err) {
      setError('Failed to run audit: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFindings = async () => {
    try {
      const response = await axios.get(`/api/findings`);
      setFindings(response.data);
      if (response.data.length > 0) {
        setLatestFinding(response.data[0]); // Most recent due to ordering
      }
    } catch (err) {
      setError('Failed to load findings: ' + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  if (loading && !findings.length) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Dashboard</h2>
        <button
          onClick={runAudit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
        >
          {loading ? 'Running Audit...' : 'Run Audit'}
        </button>
      </div>

      {/* Latest Finding Highlight */}
      {latestFinding && (
        <div className="border-l-4 border-indigo-500 bg-gray-50 p-4">
          <h3 className="font-semibold mb-2">Latest Audit Result</h3>
          <div className="space-y-2">
            <p><strong>Transaction ID:</strong> {latestFinding.transaction_id}</p>
            <p><strong>Severity:</strong>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                latestFinding.severity === 'high' ? 'bg-red-100 text-red-800' :
                latestFinding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {latestFinding.severity.toUpperCase()}
              </span>
            </p>
            <p><strong>Anomaly Score:</strong> {latestFinding.anomaly_score.toFixed(2)}</p>
            {latestFinding.rule_violations.length > 0 && (
              <div className="mt-2">
                <strong>Rule Violations:</strong>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  {latestFinding.rule_violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setShowCitation(!showCitation)}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              {showCitation ? 'Hide Citation' : 'Show Regulation Citation'}
            </button>
            {showCitation && (
              <div className="mt-2 p-3 bg-blue-50 rounded">
                <p><strong>Regulation:</strong> {latestFinding.regulation_id}</p>
                <p className="text-sm italic">{latestFinding.regulation_text}</p>
                <p><strong>Analysis:</strong> {latestFinding.rag_answer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Findings Queue */}
      <div>
        <h3 className="font-semibold mb-2">Findings Queue</h3>
        {findings.length === 0 ? (
          <p className="text-gray-500">No audit findings yet. Run an audit to see results.</p>
        ) : (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">Transaction #{finding.transaction_id}</h4>
                    <p className="text-sm text-gray-600">Audit ID: {finding.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    finding.severity === 'high' ? 'bg-red-100 text-red-800' :
                    finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {finding.severity.toUpperCase()}
                  </span>
                </div>

                <div className="mb-2">
                  <p><strong>Anomaly Score:</strong> {finding.anomaly_score.toFixed(2)}</p>
                  {finding.rule_violations.length > 0 && (
                    <>
                      <p className="mt-1"><strong>Rule Violations:</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-sm">
                        {finding.rule_violations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setExpandedFid(finding.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {expandedFid === finding.id ? 'Hide Details' : 'Show Details'}
                </button>

                {expandedFid === finding.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p><strong>Regulation:</strong> {finding.regulation_id}</p>
                    <p className="text-sm italic">{finding.regulation_text}</p>
                    <p><strong>Analysis:</strong> {finding.rag_answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <Link to="/transactions" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
          View All Transactions
        </Link>
        <Link to="/ask-regs" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
          Ask the Regs
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;