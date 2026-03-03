"use client";

import Link from "next/link";
import { ArrowLeft, Code, Terminal, Copy, CheckCircle2, Leaf, Zap, Shield, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion } from "framer-motion";

export default function APIDocsPage() {
  const { user } = useAuth();
  const backLink = user ? "/api-keys" : "/";
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CodeBlock = ({ code, section, language = "bash" }: { code: string; section: string; language?: string }) => (
    <div className="relative group">
      <div className="bg-stone-900 dark:bg-stone-950 rounded-xl p-4 font-mono text-sm text-emerald-400 overflow-x-auto">
        <pre className="whitespace-pre-wrap">{code}</pre>
      </div>
      <button
        onClick={() => copyToClipboard(code, section)}
        className="absolute top-3 right-3 p-2 bg-stone-800 hover:bg-stone-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedSection === section ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-stone-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={backLink}
                className="text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900 dark:text-white">API Documentation</h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400">LeafLens Plant Disease Detection API</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-8 h-8" />
              <h2 className="text-2xl font-bold">LeafLens API</h2>
            </div>
            <p className="text-emerald-100 text-lg mb-6">
              Integrate AI-powered plant disease detection into your applications. Our API uses an EfficientNetV2S + CBAM 
              attention model trained on 87,000+ PlantVillage images with 99.98% accuracy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <Zap className="w-6 h-6 mb-2" />
                <h3 className="font-semibold mb-1">Fast Response</h3>
                <p className="text-sm text-emerald-100">Results in under 2 seconds</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Shield className="w-6 h-6 mb-2" />
                <h3 className="font-semibold mb-1">99.98% Accuracy</h3>
                <p className="text-sm text-emerald-100">38 disease classes detected</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Code className="w-6 h-6 mb-2" />
                <h3 className="font-semibold mb-1">Easy Integration</h3>
                <p className="text-sm text-emerald-100">Simple REST API</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Authentication */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Authentication
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            All API requests require authentication using a Bearer token. Get your API key from the{" "}
            <Link href="/api-keys" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              API Keys page
            </Link>.
          </p>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 font-mono text-sm text-stone-800 dark:text-stone-200">
            Authorization: Bearer llai_your_api_key_here
          </div>
        </motion.section>

        {/* Base URL */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            Base URL
          </h2>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 font-mono text-sm text-stone-800 dark:text-stone-200">
            https://leaflens-six.vercel.app/api/predict
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">
            This is the production endpoint. All images are validated using Google Gemini AI to ensure they contain a plant before disease analysis. Non-plant images are rejected with an error response.
          </p>
        </motion.section>

        {/* Endpoint: Predict */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg font-mono text-sm font-bold">
              POST
            </span>
            <code className="text-lg font-mono text-stone-900 dark:text-white">/predict</code>
          </div>
          
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            Analyze a plant image for diseases. Send a base64-encoded image and receive disease detection results.
          </p>

          {/* Request Headers */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3">Request Headers</h3>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 dark:text-stone-400">
                  <th className="pb-2 pr-4">Header</th>
                  <th className="pb-2 pr-4">Value</th>
                  <th className="pb-2">Required</th>
                </tr>
              </thead>
              <tbody className="font-mono text-stone-800 dark:text-stone-200">
                <tr>
                  <td className="py-1 pr-4">Authorization</td>
                  <td className="py-1 pr-4">Bearer YOUR_API_KEY</td>
                  <td className="py-1 text-emerald-600">Yes</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Content-Type</td>
                  <td className="py-1 pr-4">application/json</td>
                  <td className="py-1 text-emerald-600">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Request Body */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3">Request Body</h3>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 dark:text-stone-400">
                  <th className="pb-2 pr-4">Field</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Required</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-stone-800 dark:text-stone-200">
                <tr>
                  <td className="py-1 pr-4 font-mono">image</td>
                  <td className="py-1 pr-4">string</td>
                  <td className="py-1 pr-4 text-emerald-600">Yes</td>
                  <td className="py-1">Base64-encoded image (JPEG, PNG, WebP)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Example Request - cURL */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3">Example Request (cURL)</h3>
          <CodeBlock 
            section="curl"
              code={`curl -X POST https://leaflens-six.vercel.app/api/v1/predict \\
  -H "Authorization: Bearer llai_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'`}
          />

          {/* Example Request - JavaScript */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3 mt-6">Example Request (JavaScript)</h3>
          <CodeBlock 
            section="javascript"
            code={`// Convert image to base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

// Make API request
const analyzeImage = async (imageFile, apiKey) => {
  const base64Image = await fileToBase64(imageFile);
  
  const response = await fetch('https://leaflens-six.vercel.app/api/v1/predict', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: base64Image })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return await response.json();
};

// Usage
const apiKey = 'llai_xxxxxxxxxxxxxxxxxxxx';
const result = await analyzeImage(myImageFile, apiKey);
console.log(\`Disease: \${result.disease}\`);
console.log(\`Confidence: \${result.confidence}\`);
console.log(\`Severity: \${result.severity}\`);`}
          />

          {/* Example Request - Python */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3 mt-6">Example Request (Python)</h3>
          <CodeBlock 
            section="python"
            code={`import requests
import base64

# Your API key
API_KEY = "llai_xxxxxxxxxxxxxxxxxxxx"

# Read and encode image
with open("plant_image.jpg", "rb") as image_file:
    base64_image = base64.b64encode(image_file.read()).decode('utf-8')

# Make API request
response = requests.post(
    "https://leaflens-six.vercel.app/api/v1/predict",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={"image": f"data:image/jpeg;base64,{base64_image}"}
)

# Check response
if response.status_code == 200:
    result = response.json()
    print(f"Disease: {result['disease']}")
    print(f"Plant: {result['plant']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Severity: {result['severity']}")
    print(f"\\nRecommendations:")
    for i, rec in enumerate(result['recommendations'], 1):
        print(f"{i}. {rec}")
else:
    error = response.json()
    print(f"Error: {error.get('error', 'Unknown error')}")`}
          />

          {/* Response */}
          <h3 className="font-semibold text-stone-900 dark:text-white mb-3 mt-6">Response</h3>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 font-mono text-sm text-stone-800 dark:text-stone-200 overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`{
  "success": true,
  "disease": "Apple Scab",
  "plant": "Apple", 
  "condition": "Apple Scab",
  "confidence": "98.5%",
  "severity": "medium",
  "description": "Fungal disease caused by Venturia inaequalis...",
  "recommendations": [
    "Remove and destroy infected leaves",
    "Apply fungicide during wet periods",
    "Improve air circulation around trees",
    "Avoid overhead watering"
  ],
  "predictions": [
    {"class": "Apple___Apple_scab", "plant": "Apple", "condition": "Apple Scab", "confidence": 98.5},
    {"class": "Apple___healthy", "plant": "Apple", "condition": "Healthy", "confidence": 1.2}
  ]
}`}</pre>
          </div>
        </motion.section>

        {/* Error Responses */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4">Error Responses</h2>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-mono text-sm">401</span>
                <span className="font-semibold text-red-800 dark:text-red-200">Unauthorized</span>
              </div>
              <code className="text-sm text-red-700 dark:text-red-300">{"{ \"error\": \"Invalid or missing API key\" }"}</code>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-mono text-sm">400</span>
                <span className="font-semibold text-orange-800 dark:text-orange-200">Bad Request</span>
              </div>
              <code className="text-sm text-orange-700 dark:text-orange-300">{"{ \"error\": \"No image provided\" }"}</code>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded font-mono text-sm">429</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">Rate Limited</span>
              </div>
              <code className="text-sm text-purple-700 dark:text-purple-300">{"{ \"error\": \"Too many requests\", \"retryAfter\": 60 }"}</code>
            </div>
            
            <div className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded font-mono text-sm">503</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">Service Unavailable</span>
              </div>
              <code className="text-sm text-stone-700 dark:text-stone-300">{"{ \"error\": \"AI model service is currently unavailable\" }"}</code>
            </div>
          </div>
        </motion.section>

        {/* Rate Limits */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4">Rate Limits</h2>
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 dark:text-stone-400">
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Requests/min</th>
                  <th className="pb-2">Requests/day</th>
                </tr>
              </thead>
              <tbody className="text-stone-800 dark:text-stone-200">
                <tr>
                  <td className="py-2 pr-4 font-medium">Free</td>
                  <td className="py-2 pr-4">10</td>
                  <td className="py-2">100</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Pro</td>
                  <td className="py-2 pr-4">60</td>
                  <td className="py-2">5,000</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Enterprise</td>
                  <td className="py-2 pr-4">Unlimited</td>
                  <td className="py-2">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Support */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Need Help?</h2>
          <p className="text-emerald-800 dark:text-emerald-200 mb-4">
            Have questions about the API or need help integrating? Contact our support team.
          </p>
          <a 
            href="mailto:jarrarhaider26@gmail.com" 
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Contact Support
          </a>
        </motion.section>
      </main>
    </div>
  );
}
