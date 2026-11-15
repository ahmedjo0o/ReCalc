import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HowToPage from './pages/HowToPage.jsx';
import BillPage from './pages/BillPage.jsx';

export default function App() {
  return (
    <div className="page-shell">
      <Header />
      <div className="glass-panel">
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
      </div>
      <Footer />
    </div>
  );
}
