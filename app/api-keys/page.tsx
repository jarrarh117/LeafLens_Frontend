"use client";

import React, { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only available when first created
  maskedKey: string;
  plan: 'free' | 'premium' | 'enterprise';
  usageCount: number;
  usageLimit: number;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load API keys
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!user) return;

      try {
        // Get the user's ID token
        const idToken = await user.getIdToken();
        
        const response = await fetch('/api/keys', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const keys = await response.json();
          // Convert date strings to Date objects
          const keysWithDates = keys.map((key: any) => ({
            ...key,
            createdAt: new Date(key.createdAt),
            lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
          }));
          setApiKeys(keysWithDates);
        } else {
          console.error('Failed to load API keys:', response.status);
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
      } finally {
        setLoadingKeys(false);
      }
    };

    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !user || creating) return;

    setCreating(true);
    try {
      // Get the user's ID token
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const { plainKey, keyData } = await response.json();
        setGeneratedKey(plainKey);
        setApiKeys([keyData, ...apiKeys]);
        setNewKeyName('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the user's ID token
      const idToken = await user!.getIdToken();
      
      const response = await fetch(`/api/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length < 20) return key;
    return key.substring(0, 12) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-stone-600 dark:text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-white">API Keys</h1>
                  <p className="text-sm text-stone-600 dark:text-stone-400">Manage your API access</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Create New Key
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">API Key Security</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Keep your API keys secure and never share them publicly. Each key provides full access to your account's API endpoints.
                If a key is compromised, delete it immediately and create a new one.
              </p>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        {loadingKeys ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-stone-500 dark:text-stone-400">Loading your API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} className="text-stone-400 dark:text-stone-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">No API Keys Yet</h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">Create your first API key to start using the LeafLens API</p>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <motion.div
                key={apiKey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-white">{apiKey.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        apiKey.plan === 'enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        apiKey.plan === 'premium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {apiKey.plan}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Created {apiKey.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-stone-900 dark:text-white flex-1 break-all">
                      {apiKey.key || maskKey(apiKey.maskedKey)}
                    </code>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => copyToClipboard(apiKey.key || apiKey.maskedKey, apiKey.id)}
                        className="text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-all"
                      >
                        {copiedKey === apiKey.id ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-stone-600 dark:text-stone-400">
                    <span className="font-semibold">{apiKey.usageCount}</span> / {apiKey.usageLimit} requests used
                  </div>
                  {apiKey.lastUsedAt && (
                    <div className="text-stone-600 dark:text-stone-400">
                      Last used {apiKey.lastUsedAt.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Documentation Link */}
        <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Need Help?</h3>
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
            Check out our API documentation to learn how to integrate LeafLens into your applications.
          </p>
          <Link
            href="/api-docs"
            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-sm"
          >
            View API Documentation →
          </Link>
        </div>
      </main>

      {/* Create New Key Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowNewKeyModal(false);
              setGeneratedKey(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-8 shadow-2xl"
            >
              {!generatedKey ? (
                <>
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Create New API Key</h2>
                  <p className="text-stone-600 dark:text-stone-400 mb-6">
                    Give your API key a descriptive name to help you identify it later.
                  </p>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Server, Mobile App"
                    className="w-full px-4 py-3 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-white mb-6"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateKey()}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNewKeyModal(false)}
                      className="flex-1 px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || creating}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Creating...' : 'Create Key'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">API Key Created!</h2>
                    <p className="text-stone-600 dark:text-stone-400">
                      Make sure to copy your API key now. You won't be able to see it again!
                    </p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 mb-6">
                    <code className="text-sm font-mono text-stone-900 dark:text-white break-all block mb-3">
                      {generatedKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedKey, 'new')}
                      className="w-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-900 dark:text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {copiedKey === 'new' ? (
                        <>
                          <CheckCircle2 size={18} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setGeneratedKey(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
