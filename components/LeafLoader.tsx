"use client";
import { motion } from "framer-motion";

export default function LeafLoader() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* 3D Animated Leaf Loader */}
        <div className="relative w-24 h-24" style={{ perspective: '200px' }}>
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
