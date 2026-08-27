import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  return (
    <div className="page-shell">
      <Header />
      <div className="glass-panel">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
