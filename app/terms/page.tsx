"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>

          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using LeafLens AI, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
              <p className="text-gray-600 mb-3">You agree to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide accurate information when creating an account</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to reverse engineer or copy our AI models</li>
                <li>Not upload malicious content or spam</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. AI Diagnosis Disclaimer</h2>
              <p className="text-gray-600">
                While our AI achieves high accuracy, plant disease diagnosis should not be considered a substitute 
                for professional agricultural advice. We recommend consulting with agricultural experts for critical 
                decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
              <p className="text-gray-600">
                All content, features, and functionality of LeafLens AI are owned by us and protected by international 
                copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-600">
                LeafLens AI is provided "as is" without warranties of any kind. We are not liable for any damages 
                arising from the use or inability to use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these terms at any time. Continued use of the service after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
              <p className="text-gray-600">
                For questions about these Terms of Service, contact us at jarrarhaider26@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
