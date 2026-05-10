import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Home, PlusCircle, Search, Image as ImageIcon, Unlock } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import ScamAnalyzer from './pages/ScamAnalyzer';
import ImageViewer from './pages/ImageViewer';
import DecryptImage from './pages/DecryptImage';

const NavLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-accent/20 to-transparent border-l-4 border-accent text-white' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]' : ''}`} />
      <span className="font-medium tracking-wide">{children}</span>
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primary text-white font-sans flex flex-col md:flex-row relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#FF3366]/5 blur-[120px] pointer-events-none"></div>

        {/* Sidebar */}
        <aside className="w-full md:w-72 glass-panel border-r border-white/5 p-6 flex flex-col z-10 relative shadow-2xl">
          <div className="flex items-center space-x-3 mb-12 mt-4 px-2">
            <div className="relative">
              <Shield className="text-accent w-10 h-10 drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
              <div className="absolute inset-0 bg-accent blur-xl opacity-20 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">HAIL MARY</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold mt-1">Secured by AES-256</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-3">
            <NavLink to="/" icon={Home}>Dashboard</NavLink>
            <NavLink to="/add" icon={PlusCircle}>Encode Transaction</NavLink>
            <NavLink to="/viewer" icon={ImageIcon}>Vault Viewer</NavLink>
            <NavLink to="/decrypt" icon={Unlock}>Manual Decrypt</NavLink>
            <div className="pt-6 pb-2">
              <p className="text-xs uppercase tracking-widest text-gray-600 font-bold px-3">AI Tools</p>
            </div>
            <NavLink to="/analyze" icon={Search}>Scam Analyzer</NavLink>
          </nav>

          <div className="mt-auto p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,255,136,1)]"></div>
              <span className="text-xs font-mono text-gray-300">SYSTEM ONLINE</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar h-screen z-10 relative">
          <div className="max-w-6xl mx-auto h-full fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddTransaction />} />
              <Route path="/analyze" element={<ScamAnalyzer />} />
              <Route path="/viewer" element={<ImageViewer />} />
              <Route path="/decrypt" element={<DecryptImage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
