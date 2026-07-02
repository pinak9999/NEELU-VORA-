import React, { useState } from 'react';
import { Lock, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

interface AdminPasswordPopupProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export default function AdminPasswordPopup({ onSuccess, onCancel }: AdminPasswordPopupProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess(data.token);
      } else {
        setError(data.error || 'Incorrect Password');
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        id="admin-password-container" 
        className="w-full max-w-md bg-luxury-black border border-gold-500/40 rounded shadow-2xl p-8 text-center space-y-6 relative overflow-hidden"
      >
        {/* Elegant gold corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-500/30"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-500/30"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-500/30"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-500/30"></div>

        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 bg-gold-950/40 border border-gold-500/30 rounded-full flex items-center justify-center text-gold-400">
          <Lock size={28} className="animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold tracking-widest text-gold-300 uppercase">
            Maison Vault
          </h2>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans font-medium">
            Atelier Administrative Access
          </p>
        </div>

        {/* Error message banner */}
        {error && (
          <div 
            id="password-error-alert" 
            className="bg-red-950/20 border border-red-500/30 text-red-400 px-4 py-3 rounded text-xs flex items-center justify-center space-x-2 animate-shake"
          >
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-500/50">
              <KeyRound size={16} />
            </div>
            <input
              id="admin-password-input"
              type="password"
              placeholder="Enter Administrative Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#121212] border border-gold-500/20 rounded pl-10 pr-4 py-3 text-sm text-center text-white placeholder-gold-700/50 tracking-widest focus:outline-none focus:border-gold-500 transition"
              autoFocus
            />
          </div>

          <button
            id="admin-submit-password-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold text-xs uppercase tracking-[0.25em] py-3.5 rounded transition flex items-center justify-center space-x-2 shadow-lg hover:shadow-gold-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Unlocking Vault...</span>
              </>
            ) : (
              <span>Verify credentials</span>
            )}
          </button>
        </form>

        {/* Cancel button */}
        <button
          id="admin-cancel-password-btn"
          onClick={onCancel}
          disabled={loading}
          className="text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-gold-400 transition cursor-pointer"
        >
          Cancel & Exit Vault
        </button>
      </div>
    </div>
  );
}
