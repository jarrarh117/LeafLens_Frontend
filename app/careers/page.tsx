"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CareersPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers at LeafLens</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're building the future of plant health diagnostics. Join our team!
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <p className="text-emerald-800 font-semibold">
              We're currently setting up our careers page. Check back soon for exciting opportunities!
            </p>
          </div>
          <p className="text-gray-600">
            Interested in joining us? Send your resume to{" "}
            <a href="mailto:jarrarhaider26@gmail.com" className="text-green-600 hover:text-green-700 font-semibold">
              jarrarhaider26@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
