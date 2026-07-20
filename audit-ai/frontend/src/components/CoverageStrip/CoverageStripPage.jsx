import React from 'react';
import CoverageStrip from './CoverageStrip';
import { Link } from 'react-router-dom';

// Add Google Fonts to the document head
const addGoogleFonts = () => {
  if (document.getElementById('audit-os-fonts')) return;
  
  const link = document.createElement('link');
  link.id = 'audit-os-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,100..900;1,100..900&family=IBM+Plex+Mono:ital,wght@0,100..700;1,100..700&family=Inter:wght@100..900&display=swap';
  document.head.appendChild(link);
};

const CoverageStripPage = () => {
  // Add fonts when component mounts
  // Note: In a real app, this would be done in index.html or a layout component
  // For this isolated component demo, we'll add it here
  React.useEffect(() => {
    addGoogleFonts();
    return () => {
      // Clean up on unmount if needed
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4" 
              style={{ fontFamily: "'Fraunced', serif" }}>
            Audit Coverage Visualization
          </h1>
          <p className="text-center text-gray-600 mb-6" 
             style={{ fontFamily: "'Inter', sans-serif" }}>
            Visual representation of audit coverage progressing from initial 5% sampling to complete 100% coverage
          </p>
          
          {/* Navigation links */}
          <div className="flex justify-center space-x-4">
            <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
            <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-800">
              Transactions →
            </Link>
          </div>
        </div>
        
        {/* Explanation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" 
              style={{ fontFamily: "'Fraunces', serif" }}>
            How to Read This Visualization
          </h2>
          <div className="space-y-3 text-sm" 
               style={{ fontFamily: "'Inter', sans-serif" }}>
            <p>
              <span className="font-medium">Paper-colored bars:</span> Represent "clean" transactions that passed initial screening
            </p>
            <p>
              <span className="font-medium">Seal-red bars:</span> Represent "flagged" transactions requiring further review
            </p>
            <p>
              <span className="font-medium">Muted outline bars:</span> Represent "pending" transactions awaiting initial review
            </p>
            <p>
              <span className="font-medium">Animation:</span> Shows how audit coverage progresses from an initial 5% statistically significant sample to comprehensive 100% review
            </p>
            <p className="mt-2">
              <span className="font-medium">Note:</span> If you have <span className="underline">reduced motion preference</span> enabled in your system settings, the animation will be skipped for accessibility.
            </p>
          </div>
        </div>
        
        {/* The visualization */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4" 
              style={{ fontFamily: "'Fraunces', serif" }}>
            Audit Coverage Progress
          </h2>
          <CoverageStrip />
          
          <div className="mt-4 text-center text-sm text-gray-500" 
               style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            5% Initial Sample → <span id="progress-text">Animating to 100% Coverage</span>
          </div>
        </div>
        
        {/* Technical details */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4" 
              style={{ fontFamily: "'Fraunces', serif" }}>
            Technical Implementation
          </h2>
          <div className="space-y-2 text-sm" 
               style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <p><span className="font-muted">Colors:</span> Based on paper/ink/seal/citation token system</p>
            <p><span className="font-muted">Fonts:</span> Fraunces (headings), Inter (body), IBM Plex Mono (technical details)</p>
            <p><span className="font-muted">Layout:</span> Inspired by ledger/register visualization</p>
            <p><span className="font-muted">Accessibility:</span> Respects prefers-reduced-motion media query</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageStripPage;
