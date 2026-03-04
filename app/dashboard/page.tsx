"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Upload, Camera, Search, AlertCircle, CheckCircle2, Info, RefreshCcw, Sprout, ShieldCheck, Zap, History, LogOut, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeafLoader from "@/components/LeafLoader";

// Utility for tailwind classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- Types ---
interface AnalysisResult {
  disease: string;
  plant?: string;
  condition?: string;
  confidence: string;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'none';
}

// --- Plant Analysis Service (uses trained EfficientNetV2S + CBAM model) ---
const analyzePlantImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Analysis failed');
    }
    
    const result = await response.json();
    return {
      disease: result.disease,
      plant: result.plant,
      condition: result.condition,
      confidence: result.confidence,
      description: result.description,
      recommendations: result.recommendations,
      severity: result.severity
    };
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze image. Please try again.");
  }
};

// --- Components ---
const Header = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-4 md:px-8 py-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 backdrop-blur-xl sticky top-0 z-50 shadow-sm"
    >
      <motion.div 
        className="flex items-center gap-3"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <Leaf size={22} className="md:w-[26px] md:h-[26px]" strokeWidth={2.5} />
        </motion.div>
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-stone-900 dark:text-white">
            LeafLens <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-semibold text-stone-400 dark:text-stone-500">
            Plant Health Intelligence
          </p>
        </div>
      </motion.div>
      <div className="flex items-center gap-4">
        {/* Desktop API Keys button */}
        <Link href="/api-keys" className="hidden md:block">
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:from-emerald-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2"
          >
            <Key size={18} />
            <span>API Keys</span>
          </motion.button>
        </Link>

        {/* User dropdown menu */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-3 md:px-5 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-sm">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs md:text-sm font-semibold text-stone-900 dark:text-white hidden sm:inline">
              {user?.displayName?.split(' ')[0] || 'User'}
            </span>
            <svg 
              className={cn(
                "w-4 h-4 text-stone-600 dark:text-stone-400 transition-transform duration-200",
                dropdownOpen && "rotate-180"
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-stone-200 dark:border-stone-700">
                  <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <div className="py-2">
                  <Link href="/api-keys" onClick={() => setDropdownOpen(false)}>
                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-3">
                      <Key size={18} className="text-emerald-600" />
                      <span>API Keys</span>
                    </button>
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="p-6 rounded-2xl flex flex-col gap-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", color)}>
      <Icon size={24} strokeWidth={2} />
    </div>
    <div>
      <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    healthyPlants: 0,
    diseasedPlants: 0,
    lastScanTime: 'N/A'
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && isMounted) {
      router.push('/login');
    }
  }, [user, loading, router, isMounted]);

  // Fetch user stats from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      // Only run on client-side after mount
      if (!user || !isMounted || typeof window === 'undefined') return;
      
      try {
        const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!db) {
          console.error('Firestore database not initialized');
          setLoadingStats(false);
          return;
        }

        console.log('Fetching stats for user:', user.uid);

        const q = query(
          collection(db, 'detections'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found documents:', querySnapshot.size);
        
        let healthy = 0;
        let diseased = 0;
        let lastScan = 'N/A';

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Document data:', data);
          const condition = data.condition?.toLowerCase() || data.disease?.toLowerCase() || '';
          
          if (condition.includes('healthy')) {
            healthy++;
          } else {
            diseased++;
          }
        });

        // Get last scan time
        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          const timestamp = lastDoc.timestamp?.toDate();
          if (timestamp) {
            const now = new Date();
            const diffMs = now.getTime() - timestamp.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 0) {
              lastScan = `${diffDays}d`;
            } else if (diffHours > 0) {
              lastScan = `${diffHours}h`;
            } else {
              const diffMins = Math.floor(diffMs / (1000 * 60));
              lastScan = diffMins > 0 ? `${diffMins}m` : 'Just now';
            }
          }
        }

        console.log('Stats:', { total: querySnapshot.size, healthy, diseased, lastScan });

        setStats({
          totalScans: querySnapshot.size,
          healthyPlants: healthy,
          diseasedPlants: diseased,
          lastScanTime: lastScan
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // If orderBy fails, try without it
        try {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          if (!db) return;

          const q = query(
            collection(db, 'detections'),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          console.log('Found documents (without orderBy):', querySnapshot.size);
          
          let healthy = 0;
          let diseased = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const condition = data.condition?.toLowerCase() || data.disease?.toLowerCase() || '';
            
            if (condition.includes('healthy')) {
              healthy++;
            } else {
              diseased++;
            }
          });

          setStats({
            totalScans: querySnapshot.size,
            healthyPlants: healthy,
            diseasedPlants: diseased,
            lastScanTime: querySnapshot.size > 0 ? 'Recently' : 'N/A'
          });
        } catch (err) {
          console.error('Error in fallback query:', err);
        }
      } finally {
        setLoadingStats(false);
      }
    };

    if (user && isMounted) {
      fetchStats();
    }
  }, [user, isMounted]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Show loader while auth is initializing or not mounted (AFTER all hooks)
  if (loading || !user || !isMounted) {
    return <LeafLoader />;
  }

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        setResult(null);
        setError(null);
        stopCamera();
      }
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysisResult = await analyzePlantImage(selectedImage);
      setResult(analysisResult);
      
      // Save to database
      if (user) {
        try {
          const { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, increment } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          if (db) {
            console.log('Saving detection to Firestore...');
            
            // Save the detection - must include 'plant' field for Firestore rules
            const docRef = await addDoc(collection(db, 'detections'), {
              userId: user.uid,
              plant: analysisResult.plant || 'Unknown',
              disease: analysisResult.disease,
              condition: analysisResult.disease,
              confidence: parseFloat(analysisResult.confidence.replace('%', '')),
              description: analysisResult.description,
              severity: analysisResult.severity,
              recommendations: analysisResult.recommendations,
              timestamp: serverTimestamp(),
              imageUrl: selectedImage
            });
            
            console.log('Detection saved with ID:', docRef.id);
            
            // Also increment user's totalScans counter
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                totalScans: increment(1)
              });
              console.log('User totalScans incremented');
            } catch (incrementError) {
              console.log('Could not increment user totalScans:', incrementError);
            }
            
            // Refresh stats - use simple query without orderBy to avoid index issues
            try {
              const q = query(
                collection(db, 'detections'),
                where('userId', '==', user.uid)
              );
              
              const querySnapshot = await getDocs(q);
              let healthy = 0;
              let diseased = 0;

              querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const condition = data.condition?.toLowerCase() || data.disease?.toLowerCase() || '';
                
                if (condition.includes('healthy')) {
                  healthy++;
                } else {
                  diseased++;
                }
              });

              console.log('Stats after scan:', { total: querySnapshot.size, healthy, diseased });

              setStats({
                totalScans: querySnapshot.size,
                healthyPlants: healthy,
                diseasedPlants: diseased,
                lastScanTime: 'Just now'
              });
            } catch (statsError) {
              console.error('Error refreshing stats:', statsError);
              // Increment current stats as fallback
              const isHealthy = analysisResult.disease?.toLowerCase().includes('healthy');
              setStats(prev => ({
                ...prev,
                totalScans: prev.totalScans + 1,
                healthyPlants: isHealthy ? prev.healthyPlants + 1 : prev.healthyPlants,
                diseasedPlants: isHealthy ? prev.diseasedPlants : prev.diseasedPlants + 1,
                lastScanTime: 'Just now'
              }));
            }
          } else {
            console.error('Firestore db is null');
          }
        } catch (dbError) {
          console.error('Error saving detection to database:', dbError);
          // Still update local stats even if DB save fails
          const isHealthy = analysisResult.disease?.toLowerCase().includes('healthy');
          setStats(prev => ({
            ...prev,
            totalScans: prev.totalScans + 1,
            healthyPlants: isHealthy ? prev.healthyPlants + 1 : prev.healthyPlants,
            diseasedPlants: isHealthy ? prev.diseasedPlants : prev.diseasedPlants + 1,
            lastScanTime: 'Just now'
          }));
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-12">
        {/* Hero Section - Unified Upload & Analysis Interface */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left Side - Text & Controls */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              <AnimatePresence mode="wait">
                {!selectedImage ? (
                  <motion.div
                    key="hero-text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h2 className="text-5xl md:text-6xl font-serif font-bold leading-[1.1] mb-6 text-stone-900 dark:text-white">
                      Protect your <span className="italic text-emerald-700 dark:text-emerald-400">greenery</span> with precision.
                    </h2>
                    <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-lg">
                      Upload a photo of your plant's leaves and our AI will identify diseases, pests, and nutrient deficiencies in seconds.
                    </p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Diagnosis Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Diagnosis Result</p>
                        <h3 className="text-4xl font-bold text-stone-900 dark:text-white">{result.disease}</h3>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2",
                        result.severity === 'high' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : 
                        result.severity === 'medium' ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                        result.severity === 'low' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : 
                        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {result.severity === 'none' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {result.severity.toUpperCase()}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.confidence}</p>
                      </div>
                      <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Status</p>
                        <p className="text-2xl font-bold text-stone-900 dark:text-white">
                          {result.severity === 'none' ? 'Healthy' : 'Infected'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                        <Info size={16} className="text-emerald-600 dark:text-emerald-400" />
                        Description
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{result.description}</p>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                        Recommended Actions
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {result.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle size={40} />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 text-stone-900 dark:text-white">Analysis Failed</h3>
                    <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-md mx-auto">{error}</p>
                  </motion.div>
                ) : isAnalyzing ? (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                    <motion.div 
                      className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sprout size={40} className="animate-bounce" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-3 text-stone-900 dark:text-white">Analyzing Plant...</h3>
                    <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                      Our neural networks are identifying species and scanning for diseases.
                    </p>
                    <div className="flex justify-center gap-1 mt-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-3 bg-emerald-500 rounded-full"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Zap size={40} />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 text-stone-900 dark:text-white">Ready to Scan</h3>
                    <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                      Your image is loaded. Click the button below to start AI analysis.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-wrap gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {!selectedImage ? (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-lg hover:shadow-xl group"
                    >
                      <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                      Upload Image
                    </button>
                    <button 
                      onClick={startCamera}
                      className="relative bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-lg hover:shadow-xl overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 animate-pulse"></span>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Camera size={20} />
                      </motion.div>
                      <span className="relative z-10">Live Scan</span>
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></span>
                    </button>
                  </>
                ) : (
                  <>
                    {!isAnalyzing && !result && (
                      <button 
                        onClick={startAnalysis}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 group"
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Search size={20} />
                        </motion.div>
                        Run Diagnosis
                      </button>
                    )}
                    {error && (
                      <button 
                        onClick={startAnalysis}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg"
                      >
                        <RefreshCcw size={20} />
                        Try Again
                      </button>
                    )}
                    <button 
                      onClick={reset}
                      className="bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-8 py-4 rounded-2xl font-bold hover:bg-stone-100 dark:hover:bg-stone-700 transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {result ? 'New Scan' : 'Cancel'}
                    </button>
                  </>
                )}
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </motion.div>

            {/* Right Side - Visual Area (Logo OR Selected Image) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative min-h-[500px]"
            >
              <AnimatePresence mode="wait">
                {selectedImage ? (
                  <motion.div
                    key="selected-image"
                    initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="h-full"
                  >
                    <div className="aspect-square max-h-[500px] rounded-[3rem] overflow-hidden shadow-2xl relative bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                      <img 
                        src={selectedImage} 
                        alt="Selected plant" 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Scanning Overlay */}
                      {isAnalyzing && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
                        >
                          {/* Scanning Line Effect */}
                          <motion.div
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                            initial={{ top: 0 }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          
                          {/* Corner Brackets */}
                          <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-emerald-400 rounded-tl-lg"></div>
                          <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-emerald-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-emerald-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-emerald-400 rounded-br-lg"></div>
                          
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-white mb-4"
                          >
                            <RefreshCcw size={48} />
                          </motion.div>
                          <p className="text-white font-bold text-lg">Scanning...</p>
                        </motion.div>
                      )}
                      
                      {/* Result Badge Overlay */}
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "absolute bottom-6 left-6 right-6 p-4 rounded-2xl backdrop-blur-md border",
                            result.severity === 'none' 
                              ? "bg-emerald-500/80 border-emerald-400 text-white"
                              : result.severity === 'high'
                              ? "bg-red-500/80 border-red-400 text-white"
                              : "bg-orange-500/80 border-orange-400 text-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {result.severity === 'none' ? (
                              <CheckCircle2 size={32} />
                            ) : (
                              <AlertCircle size={32} />
                            )}
                            <div>
                              <p className="font-bold text-lg">{result.disease}</p>
                              <p className="text-sm opacity-90">{result.confidence} confidence</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hero-visual"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                  >
                    <div className="aspect-square max-h-[500px] rounded-[3rem] overflow-hidden shadow-2xl relative bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center p-16"
                      >
                        <motion.img 
                          src="/images/LeafLens.png" 
                          alt="LeafLens Logo" 
                          className="w-full h-full object-contain drop-shadow-2xl"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </motion.div>
                      
                      <motion.div 
                        className="absolute top-10 right-10 w-20 h-20 bg-emerald-400/20 dark:bg-emerald-600/20 rounded-full blur-xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      ></motion.div>
                      <motion.div 
                        className="absolute bottom-10 left-10 w-32 h-32 bg-green-400/20 dark:bg-green-600/20 rounded-full blur-xl"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      ></motion.div>
                      
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-stone-800 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-700"
                      >
                        <motion.p 
                          className="text-sm font-bold text-stone-900 dark:text-white"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          87K+ Images Trained
                        </motion.p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1, y: [0, -10, 0] }}
                        transition={{ 
                          x: { duration: 0.8, delay: 0.8 },
                          opacity: { duration: 0.8, delay: 0.8 },
                          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
                        }}
                        className="absolute top-12 left-6 glass p-3 rounded-2xl flex items-center gap-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-lg"
                      >
                        <motion.div 
                          className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ShieldCheck size={16} />
                        </motion.div>
                        <div>
                          <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase">Status</p>
                          <p className="text-xs font-bold text-stone-900 dark:text-white">98% Healthy</p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
        {/* Stats Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Search, label: "Total Scans", value: loadingStats ? "..." : stats.totalScans.toString(), color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
            { icon: CheckCircle2, label: "Healthy Plants", value: loadingStats ? "..." : stats.healthyPlants.toString(), color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
            { icon: AlertCircle, label: "Diseases Found", value: loadingStats ? "..." : stats.diseasedPlants.toString(), color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
            { icon: History, label: "Recent Activity", value: loadingStats ? "..." : stats.lastScanTime, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.section>

        {/* Mobile Quick Actions - Only visible on mobile */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="md:hidden mb-16"
        >
          <div className="grid grid-cols-2 gap-4">
            <Link href="/api-keys" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 text-center"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Key size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm">API Keys</p>
                  <p className="text-xs opacity-90">Manage access</p>
                </div>
              </motion.div>
            </Link>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-stone-900 dark:bg-stone-800 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 text-center"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <LogOut size={24} />
              </div>
              <div>
                <p className="font-bold text-sm">Logout</p>
                <p className="text-xs opacity-75">Sign out</p>
              </div>
            </motion.button>
          </div>
        </motion.section>

        {/* Camera Modal */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={stopCamera}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
              >
                <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-stone-900 dark:text-white">Live Camera</h3>
                  <button
                    onClick={stopCamera}
                    className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-6 flex justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="bg-emerald-600 dark:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg"
                  >
                    <Camera size={20} />
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-300 dark:hover:bg-stone-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <section id="features" className="mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-serif font-bold mb-4 text-stone-900 dark:text-white">Why LeafLens AI?</h3>
            <p className="text-stone-500 dark:text-stone-400">Advanced technology for the modern gardener.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Results",
                desc: "Get diagnosis in under 5 seconds using our optimized neural networks.",
                icon: Zap,
                color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              },
              {
                title: "99.2% Accuracy",
                desc: "Trained on over 500,000 images of healthy and diseased plant species.",
                icon: ShieldCheck,
                color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              },
              {
                title: "Expert Advice",
                desc: "Actionable treatment plans curated by professional botanists.",
                icon: Sprout,
                color: "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="p-8 rounded-[2rem] bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 hover:shadow-xl transition-all group"
              >
                <motion.div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform", 
                    feature.color
                  )}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon size={28} />
                </motion.div>
                <h4 className="text-xl font-bold mb-3 text-stone-900 dark:text-white">{feature.title}</h4>
                <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
