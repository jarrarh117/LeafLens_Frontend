"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DetectionResult } from "@/lib/types";

interface UploadSectionProps {
  onDetectionComplete: (result: DetectionResult) => void;
}

export default function UploadSection({ onDetectionComplete }: UploadSectionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("File is too large. Please upload an image under 5MB.");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("Invalid file type. Please upload a JPG, JPEG, or PNG image.");
      } else {
        setError("Failed to upload file. Please try again.");
      }
      return;
    }
    
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
  });

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed. Please try again.");
      }
      
      // Save to Firebase if user is authenticated
      if (typeof window !== 'undefined') {
        const { db } = await import("@/lib/firebase");
        const { collection, addDoc } = await import("firebase/firestore");
        
        // Get current user from auth context
        const auth = await import("firebase/auth");
        const currentUser = auth.getAuth().currentUser;
        
        if (currentUser && db) {
          try {
            const { doc, updateDoc, increment } = await import("firebase/firestore");
            
            await addDoc(collection(db, "detections"), {
              userId: currentUser.uid,
              imageUrl: selectedImage,
              plant: result.topPrediction.plant,
              condition: result.topPrediction.condition,
              confidence: result.topPrediction.confidence,
              predictions: result.predictions,
              timestamp: new Date(),
            });
            
            // Increment user's totalScans
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userRef, {
                totalScans: increment(1)
              });
            } catch (incrementError) {
              console.error('Error incrementing totalScans:', incrementError);
            }
          } catch (saveError) {
            console.error("Error saving to Firebase:", saveError);
            // Don't show error to user, just log it
          }
        }
      }
      
      onDetectionComplete(result);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze image. Please check your internet connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setError(null);
  };

  return (
    <section id="detect" className="py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upload Plant Image
          </h2>
          <p className="text-gray-600">
            Take a clear photo of the affected leaf for accurate diagnosis
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {!selectedImage ? (
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  {isDragActive ? (
                    <Camera className="w-10 h-10 text-green-600" />
                  ) : (
                    <Upload className="w-10 h-10 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragActive
                      ? "Drop your image here"
                      : "Drag & drop your plant image"}
                  </p>
                  <p className="text-gray-600">
                    or click to browse from your device
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports: JPG, JPEG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  className="w-full h-96 object-contain"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isAnalyzing}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">📸 Tips for Best Results:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Use good lighting - natural daylight works best</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Focus on the affected area of the leaf</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Ensure the image is clear and not blurry</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Fill the frame with the leaf for better accuracy</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
