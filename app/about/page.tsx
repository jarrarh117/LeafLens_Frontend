"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AboutPage() {
  const { user } = useAuth();
  const homeLink = user ? "/dashboard" : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href={homeLink} className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-6">
            <img 
              src="/images/LeafLens.png" 
              alt="LeafLens Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-4xl font-bold text-gray-900">About LeafLens AI</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 text-lg mb-6">
              LeafLens AI is a cutting-edge plant disease detection platform powered by artificial intelligence. 
              Our mission is to help gardeners, farmers, and plant enthusiasts protect their plants with instant, 
              accurate disease diagnosis.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-6">
              Founded in 2024, LeafLens AI was born from a simple observation: plant diseases cause billions of 
              dollars in crop losses every year, yet early detection remains challenging for most people. We set 
              out to democratize plant health diagnostics using the power of AI.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Technology</h2>
            <p className="text-gray-600 mb-6">
              Our AI model is trained on over 87,000 images of healthy and diseased plants, achieving 98% accuracy 
              across 38 disease classes and 14 plant species. We use state-of-the-art deep learning techniques to 
              provide instant, reliable diagnoses.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Vision</h2>
            <p className="text-gray-600 mb-6">
              We envision a world where every plant owner has access to expert-level plant health diagnostics at 
              their fingertips. By combining AI technology with agricultural expertise, we're making plant care 
              easier and more effective for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
