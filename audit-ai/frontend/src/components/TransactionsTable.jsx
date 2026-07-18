import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/transactions`);
      setTransactions(response.data.transaction_ids || []);
    } catch (err) {
      setError('Failed to load transactions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Transactions</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No transactions found in the database.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tid) => (
                // For simplicity, we fetch details on demand? In a real app, we'd have them already.
                // We'll just show the ID and a link to audit.
                <tr key={tid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/audit/${tid}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Audit
                    </Link>
                  </td>
                </tr>
              ))}

              {/* Add a row for auditing all transactions (placeholder) */}
              <tr className="bg-blue-50">
                <td colSpan="7" className="px-6 py-4 text-center">
                  <button
                    onClick={async () => {
                      // In a real implementation, you might want to batch audit
                      // For now, we'll just alert.
                      alert('In a full implementation, this would run audit on all transactions (or a selected set).');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Run Audit on Sample Transactions
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Back to Dashboard
        </Link>
        <Link to="/ask-regs" className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Ask the Regs
        </Link>
      </div>
    </div>
  );
};

export default TransactionsTable;