import React, { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../services/api';
import { Image as ImageIcon, Download, Code, Loader, Search, ExternalLink, Lock, Trash2 } from 'lucide-react';

const ImageViewer = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
        if (data.length > 0) setSelectedTx(data[0]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTxs();
  }, []);

  const filteredTxs = transactions.filter(tx => 
    tx._id.includes(searchTerm) || tx.data.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedTx) return;
    if (window.confirm("Are you sure you want to delete this cipher from the vault?")) {
      try {
        setLoading(true);
        await deleteTransaction(selectedTx._id);
        const updated = transactions.filter(tx => tx._id !== selectedTx._id);
        setTransactions(updated);
        setSelectedTx(updated.length > 0 ? updated[0] : null);
      } catch (error) {
        console.error("Failed to delete", error);
        alert("Failed to delete transaction.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-full space-y-4">
      <Loader className="animate-spin w-12 h-12 text-accent" />
      <p className="text-gray-400 font-mono text-sm">Accessing Secure Vault...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h2 className="text-4xl font-black mb-2 tracking-tight">Steganography Vault</h2>
        <p className="text-gray-400 text-lg">
          Browse the visual ciphers. Select an image to reveal its underlying AES-256 decrypted JSON payload.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Sidebar Vault List */}
        <div className="lg:col-span-4 flex flex-col glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search vault IDs or notes..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredTxs.map((tx) => (
              <div 
                key={tx._id} 
                onClick={() => setSelectedTx(tx)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center space-x-4 border ${
                  selectedTx?._id === tx._id 
                    ? 'bg-gradient-to-r from-accent/20 to-transparent border-accent text-white shadow-[0_0_15px_rgba(0,255,136,0.15)]' 
                    : 'bg-black/20 border-white/5 hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <div className="w-14 h-14 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-white/10">
                  <img src={tx.imageUrl} alt="cipher" className="w-full h-full object-cover opacity-90" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-mono text-accent mb-1 truncate">ID: {tx._id}</p>
                  {tx.data.isLocked ? (
                    <p className="text-sm font-semibold text-gray-500 flex items-center"><Lock className="w-3 h-3 mr-1"/> ENCRYPTED</p>
                  ) : (
                    <p className="text-sm font-semibold truncate">{tx.data.category.toUpperCase()} • ${tx.data.amount}</p>
                  )}
                  <p className="text-xs opacity-60 truncate">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {filteredTxs.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ciphers found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="lg:col-span-8 glass-card p-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
          {selectedTx ? (
            <div className="flex flex-col lg:flex-row gap-8 h-full animate-fade-in">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Visual Cipher</h3>
                  <a 
                    href={selectedTx.imageUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-semibold text-accent hover:text-white flex items-center transition-colors bg-accent/10 px-3 py-1.5 rounded-full"
                  >
                    View Original <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#050505] shadow-2xl flex-1 flex items-center justify-center min-h-[300px]">
                  <img 
                    src={selectedTx.imageUrl} 
                    alt="selected stego" 
                    className="max-w-full max-h-[500px] object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" 
                  />
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded text-[10px] font-mono border border-white/10 text-gray-400">
                    LSB Steganography Active
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Extracted Payload</h3>
                  <button 
                    onClick={handleDelete}
                    className="text-xs font-semibold text-danger hover:bg-danger/20 flex items-center transition-colors bg-danger/10 border border-danger/20 px-3 py-1.5 rounded-full"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Cipher
                  </button>
                </div>
                
                <div className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-2xl relative overflow-hidden flex flex-col">
                  <div className="bg-black/50 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center text-accent text-xs font-bold font-mono">
                      <Code className="w-4 h-4 mr-2"/> DECRYPTED_JSON
                    </div>
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <div className="p-5 overflow-auto custom-scrollbar flex-1 flex flex-col justify-center">
                    {selectedTx.data.isLocked ? (
                      <div className="text-center text-gray-500">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Payload is locked with a custom AES-256 passkey.</p>
                        <p className="text-xs mt-2 text-gray-600">Please use the Manual Decrypt tool to extract this data.</p>
                      </div>
                    ) : (
                      <pre className="text-[#00ff88] text-sm font-mono leading-relaxed">
                        {JSON.stringify(selectedTx.data, null, 2).replace(/"/g, '')}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center flex flex-col items-center justify-center h-full">
               <div className="relative mb-6">
                 <ImageIcon className="w-20 h-20 text-gray-600" />
                 <div className="absolute inset-0 bg-gray-500 blur-2xl opacity-10"></div>
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Select a Cipher</h3>
               <p className="text-gray-400 max-w-sm">Choose an image from the vault sidebar to extract and view its hidden transaction payload.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
