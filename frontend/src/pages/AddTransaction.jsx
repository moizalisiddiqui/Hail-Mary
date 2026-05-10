import React, { useState } from 'react';
import { addTransaction } from '../services/api';
import { ShieldCheck, Loader, Lock, ArrowRight } from 'lucide-react';

const AddTransaction = () => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [passkey, setPasskey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultImage('');
    setPasskey('');
    try {
      const result = await addTransaction(formData);
      setResultImage(result.imageUrl);
      setPasskey(result.passkey);
      setFormData({ amount: '', type: 'expense', category: 'food', note: '' });
    } catch (error) {
      console.error('Failed to add transaction', error);
      alert('Error: Make sure the backend is running and env variables are set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-black mb-4 tracking-tight">Encode Transaction</h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          Enter your transaction details. The data will be <span className="text-accent font-mono text-sm px-2 py-1 bg-accent/10 rounded">AES-256</span> encrypted and hidden via steganography into an abstract visual cipher.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-transparent to-transparent"></div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Amount ($)</label>
              <input 
                type="number" 
                required
                step="0.01"
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Type</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
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
              <input 
                type="text" 
                placeholder="Description..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-all"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-accent to-[#00cc7a] hover:from-[#00e67a] hover:to-[#00b36b] text-black font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] flex justify-center items-center transform hover:-translate-y-1"
            >
              {loading ? <Loader className="animate-spin w-6 h-6" /> : <><Lock className="w-5 h-5 mr-2"/> ENCRYPT & GENERATE</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1 flex items-center justify-center">
          <ArrowRight className="text-gray-600 w-10 h-10 hidden lg:block" />
        </div>

        <div className="lg:col-span-6 flex flex-col h-full">
          {resultImage ? (
            <div className="glass-card p-8 h-full flex flex-col items-center animate-fade-in relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full"></div>
               <div className="flex items-center space-x-3 mb-6 z-10">
                 <ShieldCheck className="text-accent w-10 h-10 drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]" />
                 <div>
                    <h3 className="text-2xl font-bold">Secure Cipher Created</h3>
                    <p className="text-xs text-accent font-mono uppercase tracking-wider mt-1">Payload Embedded Successfully</p>
                 </div>
               </div>
               
               <div className="relative group rounded-xl overflow-hidden border border-white/20 w-full max-w-sm shadow-2xl z-10 transition-transform duration-500 hover:scale-[1.02]">
                 <img src={resultImage} alt="Stego output" className="w-full aspect-square object-cover" />
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                    <span className="text-xs font-mono text-accent bg-black/80 px-3 py-1 rounded border border-accent/30 mb-4">ENCRYPTED_DATA_HIDDEN</span>
                    <a href={resultImage} download="secure_cipher.png" target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">Download Cipher</a>
                 </div>
               </div>

               {passkey && (
                 <div className="mt-6 p-4 bg-black/40 border border-white/10 rounded-xl w-full z-10 animate-fade-in">
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center"><Lock className="w-3 h-3 mr-1"/> Decryption Passkey (SAVE THIS)</p>
                   <div className="flex items-center justify-between bg-black/60 rounded px-4 py-3 border border-white/5">
                     <code className="text-accent font-mono text-lg tracking-widest">{passkey}</code>
                     <button 
                       onClick={() => navigator.clipboard.writeText(passkey)}
                       className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-white"
                     >Copy</button>
                   </div>
                   <p className="text-[10px] text-danger mt-2">Warning: Without this exact key, this image cannot be decoded. It is not saved in the database.</p>
                 </div>
               )}
            </div>
          ) : (
            <div className="glass-card p-8 w-full h-full min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 opacity-60">
               <div className="relative mb-6">
                 <Lock className="w-16 h-16 text-gray-500" />
                 <div className="absolute inset-0 bg-gray-500 blur-xl opacity-20"></div>
               </div>
               <h3 className="text-xl font-semibold text-white mb-2">Awaiting Data Input</h3>
               <p className="text-gray-400 text-sm max-w-xs">Fill out the form to generate a secure steganographic image containing your financial record.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
