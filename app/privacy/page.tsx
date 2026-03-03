"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-600">
                We collect information you provide directly to us, including your name, email address, and plant images 
                you upload for analysis. We also collect usage data to improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide and improve our plant disease detection services</li>
                <li>Send you updates and notifications about your account</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Train and improve our AI models</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
              <p className="text-gray-600">
                We implement industry-standard security measures to protect your personal information. Your data is 
                encrypted in transit and at rest using Firebase's secure infrastructure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
              <p className="text-gray-600">
                We do not sell your personal information. We may share anonymized data for research purposes or with 
                service providers who help us operate our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at jarrarhaider26@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
