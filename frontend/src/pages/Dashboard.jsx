import React, { useState, useEffect } from 'react';
import { getTransactions, getAnalytics, deleteAllTransactions } from '../services/api';
import { Activity, AlertTriangle, ShieldCheck, DollarSign, ArrowUpRight, ArrowDownRight, Fingerprint, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState({ alerts: [], securityScore: 100 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txs = await getTransactions();
        setTransactions(txs);
        
        let inc = 0, exp = 0;
        let unlockedCount = 0;
        txs.forEach(tx => {
            const amt = parseFloat(tx.data.amount) || 0;
            if (tx.data.type === 'income') inc += amt;
            else if (tx.data.type === 'expense') exp += amt;
            
            if (!tx.data.isLocked) {
              unlockedCount++;
            }
        });
        setStats({ income: inc, expense: exp, balance: inc - exp });
        
        if (unlockedCount > 0) {
            const unlockedTxs = txs.filter(tx => !tx.data.isLocked);
            const analyticsData = await getAnalytics(unlockedTxs);
            setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = async () => {
    if (window.confirm("CRITICAL WARNING: This will permanently delete ALL secured ciphers and database records. This action cannot be undone. Proceed?")) {
      try {
        setLoading(true);
        await deleteAllTransactions();
        setTransactions([]);
        setStats({ income: 0, expense: 0, balance: 0 });
        setAnalytics({ alerts: [], securityScore: 100 });
      } catch (error) {
        console.error("Failed to reset database", error);
        alert("Failed to perform factory reset.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-full space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-2 border-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-accent font-mono text-sm uppercase tracking-widest animate-pulse">Decrypting Vault...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Intelligence Hub</h2>
          <p className="text-gray-400 mt-2">Real-time telemetry of your secured assets.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Fingerprint className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-gray-300">{transactions.length} Ciphers Decrypted</span>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 px-4 py-2 rounded-full transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Vault</span>
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Net Balance</p>
          <h3 className="text-3xl font-bold relative z-10">${stats.balance.toFixed(2)}</h3>
          <DollarSign className="absolute bottom-4 right-4 w-12 h-12 text-white/10" />
        </div>
        
        <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-green-500/50">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Total Income</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-3xl font-bold text-green-400">${stats.income.toFixed(2)}</h3>
            <ArrowUpRight className="w-5 h-5 text-green-400 mb-1" />
          </div>
        </div>
        
        <div className="glass-card p-6 relative overflow-hidden group border-b-4 border-b-red-500/50">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Total Expenses</p>
          <div className="flex items-end space-x-2 relative z-10">
            <h3 className="text-3xl font-bold text-red-400">${stats.expense.toFixed(2)}</h3>
            <ArrowDownRight className="w-5 h-5 text-red-400 mb-1" />
          </div>
        </div>
        
        <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Security Score</p>
              <div className="flex items-baseline space-x-1">
                <h3 className="text-4xl font-black text-accent text-glow">{analytics.securityScore}</h3>
                <span className="text-gray-500 font-mono">/100</span>
              </div>
            </div>
            <ShieldCheck className="w-10 h-10 text-accent drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {analytics.alerts.length > 0 && (
        <div className="bg-gradient-to-r from-danger/20 to-danger/5 border border-danger/30 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(255,51,102,0.15)] animate-fade-in">
          <div className="absolute top-0 left-0 w-2 h-full bg-danger"></div>
          <h4 className="flex items-center text-danger font-bold mb-4 text-lg">
            <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" /> SECURITY ANOMALIES DETECTED
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.alerts.map((alert, idx) => (
              <div key={idx} className="bg-black/40 px-4 py-3 rounded-lg border border-danger/20 flex items-start">
                <div className="w-2 h-2 rounded-full bg-danger mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-red-100">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold">Decrypted Ledger</h3>
          <span className="text-xs bg-white/10 px-3 py-1 rounded text-gray-300 font-mono">LIVE SYNC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Timestamp</th>
                <th className="p-5 font-semibold">Category</th>
                <th className="p-5 font-semibold">Description</th>
                <th className="p-5 font-semibold">Flow</th>
                <th className="p-5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-white/5 transition-colors group cursor-default">
                  <td className="p-5 text-sm text-gray-400 font-mono">
                    {new Date(tx.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  {tx.data.isLocked ? (
                    <td colSpan="4" className="p-5">
                      <div className="flex items-center text-gray-500 font-mono text-sm bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg w-max">
                        <ShieldCheck className="w-4 h-4 mr-2" /> ENCRYPTED PAYLOAD (Requires Manual Decrypt)
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-5">
                        <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium capitalize border border-white/5 group-hover:border-white/20 transition-colors">
                          {tx.data.category}
                        </span>
                      </td>
                      <td className="p-5 text-sm text-gray-300">{tx.data.note || <span className="text-gray-600 italic">No description</span>}</td>
                      <td className="p-5">
                        {tx.data.type === 'income' ? (
                          <div className="flex items-center text-green-400 text-sm font-medium">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> Income
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400 text-sm font-medium">
                            <ArrowDownRight className="w-4 h-4 mr-1" /> Expense
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-right font-bold text-lg">
                         ${parseFloat(tx.data.amount).toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">The vault is empty. Encode a transaction to populate the ledger.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
