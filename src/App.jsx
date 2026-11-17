import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
// Only the home page is part of the first download. The other pages are
// fetched when someone opens them, so phones have less code to process
// before the app appears.
const ManagePage = lazy(() => import('./pages/ManagePage.jsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'));
const HowToPage = lazy(() => import('./pages/HowToPage.jsx'));
const BillPage = lazy(() => import('./pages/BillPage.jsx'));

function PageLoading() {
  return (
    <main style={{ textAlign: 'center', padding: '24px 0' }}>
      <span className="auth-box__spinner" style={{ display: 'inline-block' }} aria-label="Loading" />
    </main>
  );
}

export default function App() {
  return (
    <div className="page-shell">
      <Header />
      <div className="glass-panel">
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/how-to-use" element={<HowToPage />} />
          <Route path="/bill" element={<BillPage />} />
          {/* Catches stray paths like /index.html (from the legacy static
              pages' hardcoded logo links) and GitHub Pages' 404 fallback. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </div>
      {/* Extra content shown below the main panel on some screens (the home
          page puts its "how it works" / FAQ box here via a portal). */}
      <div id="below-panel" />
      <Footer />
    </div>
  );
}
