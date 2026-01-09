import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, CheckCircle, AlertCircle, Cpu, Wifi } from 'lucide-react';

const App = () => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);

  const API_BASE = 'http://127.0.0.1:5000/api';

  // 檢查後端是否在線
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) setBackendOnline(true);
      else setBackendOnline(false);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const readCard = async () => {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch(`${API_BASE}/card/read`);
      const result = await response.json();

      if (result.success) {
        setCardData(result.data);
        setStatus('success');
      } else {
        setError(result.error);
        setStatus('error');
      }
    } catch (err) {
      setError('無法連線至後端伺服器，請確認 Python 程式已啟動');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">IC Card Reader</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-slate-400 font-medium">
                  {backendOnline ? '服務運作中' : '後端未啟動'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="relative aspect-[1.58/1] w-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-8 overflow-hidden border border-slate-600/50 flex flex-col items-center justify-center group">
            <div className="absolute top-4 right-6 text-slate-500 italic font-serif">SmartCard</div>
            
            {status === 'success' ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <CheckCircle className="w-16 h-16 text-green-400 mb-2" />
                <span className="text-green-400 font-bold tracking-widest text-sm uppercase">Card Detected</span>
              </div>
            ) : status === 'loading' ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-16 h-16 text-blue-400 animate-spin mb-2" />
                <span className="text-blue-400 font-medium animate-pulse">Reading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40 group-hover:opacity-60 transition-opacity">
                <CreditCard className="w-20 h-20 text-slate-400 mb-2" />
                <span className="text-sm">Waiting for action</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-6 flex gap-1">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-1 bg-slate-600 rounded-full"></div>)}
            </div>
          </div>

          {/* Results Info */}
          {status === 'success' && cardData && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">ATR Identifier</p>
                <p className="font-mono text-blue-400 text-sm break-all tracking-tight">
                  {cardData.atr}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Reader Device</p>
                <p className="text-slate-300 text-sm">
                  {cardData.reader}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={readCard}
            disabled={status === 'loading' || !backendOnline}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
              backendOnline 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {status === 'loading' ? '通訊中...' : '讀取 IC 卡'}
          </button>
        </div>
        
        <p className="mt-6 text-center text-slate-500 text-xs">
          Backend: Python Flask + PyScard | Frontend: React + Tailwind
        </p>
      </div>
    </div>
  );
};

export default App;