import React, { useState } from 'react';
import { decryptImage } from '../services/api';
import { Upload, FileKey, Loader, ShieldCheck, AlertCircle, Key, CheckCircle2, Circle } from 'lucide-react';

const STAGES = [
  { id: 1, label: 'Key Decryption',           desc: 'PBKDF2 derives master key → AES-GCM unwraps DEK' },
  { id: 2, label: 'Steganographic Extraction', desc: 'LSB algorithm extracts ciphertext from image' },
  { id: 3, label: 'AES-256 Decryption',        desc: 'DEK decrypts the extracted ciphertext' },
];

const DecryptImage = () => {
  const [imageFile, setImageFile]   = useState(null);
  const [keyFile, setKeyFile]       = useState(null);
  const [masterPass, setMasterPass] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading]       = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null); // { message, stage }

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); setResult(null); setError(null); }
  };

  const handleKeyFile = (e) => {
    const f = e.target.files[0];
    if (f) { setKeyFile(f); setResult(null); setError(null); }
  };

  const handleDecrypt = async () => {
    if (!imageFile)    { setError({ message: 'Please upload the cipher image.', stage: 0 }); return; }
    if (!keyFile)      { setError({ message: 'Please upload the .hailkey file.', stage: 0 }); return; }
    if (!masterPass.trim()) { setError({ message: 'Please enter your master passphrase.', stage: 0 }); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStage(1);

    try {
      const data = await decryptImage(imageFile, keyFile, masterPass);
      setActiveStage(3);
      setResult(data.data);
    } catch (err) {
      const errData = err.response?.data;
      setError({ message: errData?.error || 'Decryption failed.', stage: errData?.stage || 1 });
      setActiveStage(0);
    } finally {
      setLoading(false);
    }
  };

  const StageIndicator = () => (
    <div className="space-y-3 mb-6">
      {STAGES.map(s => {
        const done  = result && s.id <= 3;
        const errored = error && error.stage === s.id;
        const active  = loading && activeStage === s.id;
        return (
          <div key={s.id} className={`flex items-start space-x-3 p-3 rounded-xl border transition-all ${
            errored ? 'border-red-500/50 bg-red-500/10' :
            done    ? 'border-accent/40 bg-accent/10'   :
            active  ? 'border-blue-400/50 bg-blue-400/10 animate-pulse' :
                      'border-white/5 bg-white/2'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {errored ? <AlertCircle className="w-5 h-5 text-red-400" /> :
               done    ? <CheckCircle2 className="w-5 h-5 text-accent" /> :
               active  ? <Loader className="w-5 h-5 text-blue-400 animate-spin" /> :
                         <Circle className="w-5 h-5 text-gray-600" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${errored ? 'text-red-300' : done ? 'text-accent' : active ? 'text-blue-300' : 'text-gray-500'}`}>
                Stage {s.id}: {s.label}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{s.desc}</p>
              {errored && <p className="text-xs text-red-400 mt-1">{error.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-4xl font-black mb-4 tracking-tight">Manual Decryption</h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          A 3-stage pipeline: <span className="text-yellow-300">Unwrap DEK</span> →{' '}
          <span className="text-purple-300">Extract LSB payload</span> →{' '}
          <span className="text-accent">Decrypt with AES-256</span>.
          The process halts at Stage 1 if your passphrase is wrong.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="glass-card p-8 space-y-6">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">1. Cipher Image (PNG)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 group h-40">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium">
                    Change <input type="file" accept="image/png" className="hidden" onChange={handleImage} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-xl hover:border-accent hover:bg-accent/5 cursor-pointer transition-all group">
                <Upload className="w-7 h-7 text-gray-500 group-hover:text-accent transition-colors mb-2" />
                <span className="text-sm text-gray-400">Upload cipher image</span>
                <input type="file" accept="image/png" className="hidden" onChange={handleImage} />
              </label>
            )}
          </div>

          {/* Key file upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">2. Key File (.hailkey)</label>
            <label className={`flex items-center space-x-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${keyFile ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/5'}`}>
              <Key className={`w-6 h-6 flex-shrink-0 ${keyFile ? 'text-yellow-400' : 'text-gray-500 group-hover:text-yellow-400'} transition-colors`} />
              <span className={`text-sm ${keyFile ? 'text-yellow-300 font-medium' : 'text-gray-400'}`}>
                {keyFile ? keyFile.name : 'Upload .hailkey file'}
              </span>
              <input type="file" accept=".hailkey,application/json" className="hidden" onChange={handleKeyFile} />
            </label>
          </div>

          {/* Master passphrase */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">3. Master Passphrase</label>
            <input
              type="password"
              placeholder="Enter your master passphrase..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-all font-mono"
              value={masterPass}
              onChange={e => setMasterPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDecrypt()}
            />
          </div>

          <button onClick={handleDecrypt} disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-[#00cc7a] hover:from-[#00e67a] hover:to-[#00b36b] text-black font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] flex justify-center items-center transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {loading ? <Loader className="animate-spin w-6 h-6" /> : <><FileKey className="w-6 h-6 mr-2" /> Run Decryption Pipeline</>}
          </button>
        </div>

        {/* Status & Result */}
        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Pipeline Status</h3>
          <StageIndicator />

          {result ? (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-white/10">
                <ShieldCheck className="w-6 h-6 text-accent" />
                <span className="font-bold text-accent">Payload Decrypted Successfully</span>
              </div>
              <div className="flex-1 bg-black/40 rounded-xl p-5 border border-white/5 overflow-auto custom-scrollbar">
                <pre className="text-green-400 font-mono text-sm leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <FileKey className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-sm text-gray-400">Decrypted payload will appear here after a successful run.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecryptImage;
