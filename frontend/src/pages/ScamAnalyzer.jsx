import React, { useState } from 'react';
import { analyzeScam } from '../services/api';
import { Search, AlertOctagon, ShieldCheck, Loader, MessageSquareWarning, Zap } from 'lucide-react';

const ScamAnalyzer = () => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeScam(message);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Analysis failed. Make sure backend is running and Gemini API key is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-10 flex-shrink-0">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 rounded-full border border-white/10 mb-4">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold tracking-widest text-blue-200 uppercase">Powered by Gemini AI</span>
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tight">Threat Analyzer</h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          Paste any suspicious email, SMS, or message. The AI engine will dissect the text for social engineering patterns and phishing tactics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="flex flex-col h-full">
          <div className="glass-card flex-1 flex flex-col p-2 relative">
            <div className="absolute top-4 left-6 flex items-center space-x-2">
              <MessageSquareWarning className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Input Payload</span>
            </div>
            <textarea
              className="w-full flex-1 bg-transparent border-none rounded-xl p-6 pt-12 text-white text-lg focus:outline-none custom-scrollbar resize-none placeholder-gray-700 font-medium leading-relaxed"
              placeholder="Paste suspicious text here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={loading || !message.trim()}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex justify-center items-center transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? <Loader className="animate-spin w-6 h-6" /> : <><Search className="w-6 h-6 mr-2" /> Dissect Threat</>}
          </button>
        </div>

        <div className="flex flex-col h-full">
          {result ? (
            <div className={`glass-card p-8 h-full flex flex-col relative overflow-hidden animate-fade-in border-t-4 ${result.isScam ? 'border-t-danger' : 'border-t-accent'}`}>
              <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none ${result.isScam ? 'bg-danger/20' : 'bg-accent/20'}`}></div>
              
              <div className="flex items-center space-x-5 mb-8 pb-8 border-b border-white/10 relative z-10">
                {result.isScam ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-danger blur-lg opacity-50 rounded-full animate-pulse"></div>
                    <div className="p-5 bg-danger/20 border border-danger/50 rounded-2xl relative"><AlertOctagon className="w-10 h-10 text-danger" /></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent blur-lg opacity-50 rounded-full animate-pulse"></div>
                    <div className="p-5 bg-accent/20 border border-accent/50 rounded-2xl relative"><ShieldCheck className="w-10 h-10 text-accent" /></div>
                  </div>
                )}
                <div>
                  <h3 className="text-3xl font-black">{result.isScam ? 'HIGH RISK' : 'LOW RISK'}</h3>
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="w-full max-w-[150px] h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${result.isScam ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${result.confidence}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-400 font-mono">{result.confidence}% Confidence</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col relative z-10">
                <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center">
                  <Zap className="w-3 h-3 mr-2" /> AI Dissection Report
                </h4>
                <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-6 overflow-auto custom-scrollbar">
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {result.explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
             <div className="glass-card p-8 w-full h-full flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 opacity-40">
               <div className="relative mb-6">
                 <Search className="w-16 h-16 text-gray-500" />
                 <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Awaiting Payload</h3>
               <p className="text-gray-400 max-w-sm text-sm">Provide a message and initiate the scan to receive an AI-generated threat dissection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScamAnalyzer;
