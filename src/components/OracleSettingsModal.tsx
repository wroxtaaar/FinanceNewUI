import React, { useState } from 'react';
import { Storage } from '../data/storage';
import { OracleClient } from '../integration/oracleClient';
import { X, Server, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const OracleSettingsModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  if (!isOpen) return null;

  const currentSettings = Storage.getSyncSettings();
  const [baseUrl, setBaseUrl] = useState<string>(currentSettings.baseUrl || '');
  const [token, setToken] = useState<string>(currentSettings.token || '');
  const [testing, setTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSaveAndTest = async () => {
    setStatusMessage(null);
    setTesting(true);

    const cleanUrl = baseUrl.trim().replace(/\/$/, '');
    const cleanToken = token.trim();

    Storage.saveSyncSettings({
      baseUrl: cleanUrl,
      token: cleanToken,
    });

    if (!cleanUrl || !cleanToken) {
      setStatusMessage({
        type: 'success',
        text: 'Settings saved (Local mode enabled).',
      });
      setTesting(false);
      onSaved();
      return;
    }

    try {
      await OracleClient.fetchSummary();
      setStatusMessage({
        type: 'success',
        text: 'Connected successfully to Oracle ledger!',
      });
      onSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: 'Settings saved, but could not connect to Oracle endpoint. Operating in local mode.',
      });
      onSaved();
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Oracle Sync Settings</h2>
              <p className="text-xs text-slate-500">Configure central ledger synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Use your private Tailscale / Serve URL or local endpoint. The token is stored only in this browser's private local storage.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Oracle Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://oracle-finance.ts.net or http://localhost:8000"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Oracle Sync Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="X-Sync-Token secret"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
            />
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...
              </>
            ) : (
              'Save & Test'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
