"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MobilePage() {
  const { user } = useAuth();
  const homeLink = user ? "/dashboard" : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Link href={homeLink} className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/LeafLens.png"
              alt="LeafLens"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mobile App Coming Soon</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're working on native iOS and Android apps for an even better experience.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-blue-800 font-semibold mb-4">
              In the meantime, our web app works great on mobile browsers!
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Try Web App
            </Link>
          </div>
          <p className="text-gray-600 text-sm">
            Want to be notified when we launch? Sign up and we'll keep you updated!
          </p>
        </div>
      </div>
    </div>
  );
}
