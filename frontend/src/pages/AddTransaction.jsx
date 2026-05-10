import React, { useState } from 'react';
import { addTransaction } from '../services/api';
import { ShieldCheck, Loader, Lock, ArrowRight, Download, Key, Eye, EyeOff } from 'lucide-react';

const AddTransaction = () => {
  const [formData, setFormData] = useState({ amount: '', type: 'expense', category: 'food', note: '' });
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { imageUrl, wrappedKey, id }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterPassphrase || masterPassphrase.trim().length < 6) {
      alert('Master passphrase must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await addTransaction({ ...formData, masterPassphrase });
      setResult(res);
      setFormData({ amount: '', type: 'expense', category: 'food', note: '' });
      setMasterPassphrase('');
    } catch (error) {
      alert(error.response?.data?.error || 'Encoding failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const downloadKeyFile = () => {
    if (!result?.wrappedKey) return;
    const blob = new Blob([JSON.stringify(result.wrappedKey, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hailmary-${result.id}.hailkey`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-black mb-4 tracking-tight">Encode Transaction</h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          Enter details and your master passphrase. A random&nbsp;
          <span className="text-accent font-mono text-sm px-2 py-1 bg-accent/10 rounded">DEK</span>
          &nbsp;is generated, wrapped with your passphrase via&nbsp;
          <span className="font-mono text-sm px-2 py-1 bg-white/10 rounded text-blue-300">PBKDF2+AES-256-GCM</span>
          , then the data is hidden in an image via&nbsp;
          <span className="font-mono text-sm px-2 py-1 bg-white/10 rounded text-purple-300">LSB Stego</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-blue-400 to-purple-500"></div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Amount ($)</label>
              <input type="number" required step="0.01" placeholder="0.00"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Type</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-all cursor-pointer"
                  value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Category</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-all cursor-pointer"
                  value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="shopping">Shopping</option>
                  <option value="crypto">Crypto</option>
                  <option value="gambling">Gambling</option>
                  <option value="salary">Salary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Note (Optional)</label>
              <input type="text" placeholder="Description..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-all"
                value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
            </div>

            {/* Master Passphrase */}
            <div className="pt-2 border-t border-white/10">
              <label className="block text-sm font-bold text-accent mb-2 uppercase tracking-wider flex items-center">
                <Key className="w-4 h-4 mr-2" /> Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required minLength={6}
                  placeholder="Your secret master key..."
                  className="w-full bg-black/60 border border-accent/30 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                  value={masterPassphrase}
                  onChange={e => setMasterPassphrase(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Used to wrap the DEK via PBKDF2 (200k iterations). <strong className="text-yellow-400">Never stored.</strong></p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-[#00cc7a] hover:from-[#00e67a] hover:to-[#00b36b] text-black font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] flex justify-center items-center transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? <Loader className="animate-spin w-6 h-6" /> : <><Lock className="w-5 h-5 mr-2" /> WRAP KEY & ENCODE</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1 flex items-center justify-center">
          <ArrowRight className="text-gray-600 w-10 h-10 hidden lg:block" />
        </div>

        {/* Result */}
        <div className="lg:col-span-6 flex flex-col h-full">
          {result ? (
            <div className="glass-card p-8 h-full flex flex-col items-center animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full"></div>
              <div className="flex items-center space-x-3 mb-6 z-10">
                <ShieldCheck className="text-accent w-10 h-10 drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]" />
                <div>
                  <h3 className="text-2xl font-bold">Cipher Package Ready</h3>
                  <p className="text-xs text-accent font-mono uppercase tracking-wider mt-1">DEK Wrapped · Payload Embedded</p>
                </div>
              </div>

              <div className="relative group rounded-xl overflow-hidden border border-white/20 w-full max-w-xs shadow-2xl z-10 mb-6">
                <img src={result.imageUrl} alt="Stego output" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                  <span className="text-xs font-mono text-accent bg-black/80 px-3 py-1 rounded border border-accent/30 mb-3">LSB_PAYLOAD_HIDDEN</span>
                  <a href={result.imageUrl} download="cipher.png" target="_blank" rel="noreferrer"
                    className="px-4 py-1.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">Download Image</a>
                </div>
              </div>

              {/* Key file download */}
              <div className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5 z-10">
                <div className="flex items-start space-x-3 mb-4">
                  <Key className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-300 uppercase tracking-wider">Download Your Key File</p>
                    <p className="text-xs text-gray-400 mt-1">
                      This <code className="text-yellow-300">.hailkey</code> file contains your wrapped DEK.
                      Without it + your master passphrase, the image <strong className="text-red-400">cannot be decrypted</strong>.
                    </p>
                  </div>
                </div>
                <button onClick={downloadKeyFile}
                  className="w-full flex items-center justify-center space-x-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 font-bold py-3 rounded-xl transition-all">
                  <Download className="w-5 h-5" />
                  <span>Download hailmary-{String(result.id).slice(-6)}.hailkey</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 w-full h-full min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 opacity-60">
              <div className="relative mb-6">
                <Lock className="w-16 h-16 text-gray-500" />
                <div className="absolute inset-0 bg-gray-500 blur-xl opacity-20"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Awaiting Input</h3>
              <p className="text-gray-400 text-sm max-w-xs">Fill the form and set a master passphrase to generate a secure cipher package.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
