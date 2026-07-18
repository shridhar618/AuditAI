import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TransactionsTable from './components/TransactionsTable';
import AskRegs from './components/AskRegs';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Link to="/" className="flex items-center">
                    <span className="text-xl font-semibold text-indigo-600">AuditOS</span>
                  </Link>
                </div>
                <div className="hidden md:block ml-10">
                  <div className="flex space-x-4">
                    <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900">
                      Dashboard
                    </Link>
                    <Link to="/transactions" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900">
                      Transactions
                    </Link>
                    <Link to="/ask-regs" className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900">
                      Ask the Regs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="px-4 py-6 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionsTable />} />
              <Route path="/ask-regs" element={<AskRegs />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;