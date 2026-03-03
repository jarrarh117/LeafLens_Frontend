"use client";

import React, { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load API keys from Firestore
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!user) return;
      
      try {
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!db) return;

        const q = query(
          collection(db, 'apiKeys'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const keys: ApiKey[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          keys.push({
            id: doc.id,
            name: data.name,
            key: data.key,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUsed: data.lastUsed?.toDate(),
            usageCount: data.usageCount || 0
          });
        });
        
        setApiKeys(keys);
      } catch (error: any) {
        console.error('Error loading API keys:', error);
        // If index error, try without orderBy
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          console.log('Trying fallback query without orderBy...');
          try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            const fallbackQuery = query(
              collection(db!, 'apiKeys'),
              where('userId', '==', user.uid)
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackKeys: ApiKey[] = [];
            
            fallbackSnapshot.forEach((doc) => {
              const data = doc.data();
              fallbackKeys.push({
                id: doc.id,
                name: data.name,
                key: data.key,
                createdAt: data.createdAt?.toDate() || new Date(),
                lastUsed: data.lastUsed?.toDate(),
                usageCount: data.usageCount || 0
              });
            });
            
            // Sort client-side
            fallbackKeys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setApiKeys(fallbackKeys);
          } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
          }
        }
      } finally {
        setLoadingKeys(false);
      }
    };

    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'llai_'; // LeafLens AI prefix
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !user) return;

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      const newKey = generateApiKey();
      
      const docRef = await addDoc(collection(db, 'apiKeys'), {
        userId: user.uid,
        name: newKeyName,
        key: newKey,
        status: 'active',
        createdAt: serverTimestamp(),
        usageCount: 0
      });

      const newApiKey: ApiKey = {
        id: docRef.id,
        name: newKeyName,
        key: newKey,
        createdAt: new Date(),
        usageCount: 0
      };

      setApiKeys([newApiKey, ...apiKeys]);
      setGeneratedKey(newKey);
      setNewKeyName('');
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      await deleteDoc(doc(db, 'apiKeys', keyId));
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 9) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          {/* 3D Animated Leaf Loader */}
          <div className="relative w-24 h-24" style={{ perspective: '200px' }}>
            {/* Rotating 3D container */}
            <motion.div
              className="w-full h-full"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{
                rotateY: [0, 360],
                rotateX: [0, 15, 0, -15, 0],
              }}
              transition={{
                rotateY: { duration: 3, repeat: Infinity, ease: 'linear' },
                rotateX: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              {/* Main leaf */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backfaceVisibility: 'visible' }}
              >
                <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-2xl">
                  <defs>
                    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    d="M50 10 C20 25, 10 50, 25 80 Q50 95 75 80 C90 50 80 25 50 10"
                    fill="url(#leafGradient)"
                    filter="url(#glow)"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Leaf veins */}
                  <motion.path
                    d="M50 20 Q50 50 50 75 M35 40 Q50 50 65 40 M30 55 Q50 62 70 55 M35 70 Q50 75 65 70"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                </svg>
              </motion.div>
            </motion.div>
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-emerald-400/60"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          
          {/* Animated text */}
          <motion.div
            className="flex items-center space-x-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-lg font-medium bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              Loading
            </span>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-lg font-medium text-emerald-600"
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                .
              </motion.span>
            ))}
          </motion.div>
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
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-white">API Keys</h1>
                <p className="text-sm text-stone-600 dark:text-stone-400">Manage your API keys for programmatic access</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg"
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
            <motion.div 
              className="relative w-16 h-16 mx-auto"
              style={{ perspective: '100px' }}
            >
              <motion.div
                className="w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-lg">
                  <defs>
                    <linearGradient id="miniLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M50 10 C20 25, 10 50, 25 80 Q50 95 75 80 C90 50 80 25 50 10"
                    fill="url(#miniLeafGrad)"
                  />
                  <path
                    d="M50 20 Q50 50 50 75 M35 40 Q50 50 65 40 M30 55 Q50 62 70 55"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity={0.5}
                  />
                </svg>
              </motion.div>
            </motion.div>
            <motion.p 
              className="mt-4 text-stone-500 dark:text-stone-400 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading your API keys...
            </motion.p>
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
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">{apiKey.name}</h3>
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
                    <code className="text-sm font-mono text-stone-900 dark:text-white flex-1">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-all"
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                        className="text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-all"
                      >
                        {copiedKey === apiKey.id ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-stone-600 dark:text-stone-400">
                    <span className="font-semibold">{apiKey.usageCount}</span> API calls
                  </div>
                  {apiKey.lastUsed && (
                    <div className="text-stone-600 dark:text-stone-400">
                      Last used {apiKey.lastUsed.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* API Documentation Link */}
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
                      disabled={!newKeyName.trim()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Key
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
