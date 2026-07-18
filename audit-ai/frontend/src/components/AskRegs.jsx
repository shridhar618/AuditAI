import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AskRegs = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regulation, setRegulation] = useState(null);

  const sampleQuestions = [
    "What are the capital requirements under Basel III?",
    "What are the AML requirements for politically exposed persons?",
    "What does GDPR say about data subject rights?",
    "What are the liquidity coverage ratio requirements?",
    "What are the large exposure reporting requirements?"
  ];

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setRegulation(null);

    try {
      const response = await axios.post(`/api/ask`, { query: question });
      setAnswer(response.data.answer);
      setRegulation({
        id: response.data.regulation_id,
        text: response.data.regulation_text,
        score: response.data.score
      });
    } catch (err) {
      setError('Failed to get answer: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">Ask the Regs</h1>
        <p className="text-gray-600">Ask questions about financial regulations and get grounded answers from our regulatory knowledge base.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample Questions:</label>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="question">
            Your Question:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your regulatory question here..."
          />
        </div>

        <button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
        >
          {loading ? 'Getting Answer...' : 'Ask Question'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded">
          <h3 className="font-semibold mb-4">Answer:</h3>
          <p className="mb-4">{answer}</p>

          {regulation && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold mb-2">Regulation Citation:</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Regulation ID:</strong> {regulation.id}</p>
                <p className="mt-2"><strong>Similarity Score:</strong> {regulation.score?.toFixed(3)}</p>
                <p className="mt-2 italic">{regulation.text}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!answer && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Ask a question to get started</p>
        </div>
      )}
    </div>
  );
};

export default AskRegs;