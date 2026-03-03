"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, TrendingUp, Leaf, Download, Share2 } from "lucide-react";
import { DetectionResult } from "@/lib/types";
import { getDiseaseInfo } from "@/lib/plantClasses";

interface ResultsSectionProps {
  result: DetectionResult;
}

export default function ResultsSection({ result }: ResultsSectionProps) {
  const { topPrediction, predictions } = result;
  const isHealthy = topPrediction.condition.toLowerCase().includes("healthy");
  const diseaseInfo = !isHealthy ? getDiseaseInfo(topPrediction.condition) : null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100";
    if (confidence >= 70) return "bg-yellow-100";
    return "bg-orange-100";
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Detection Results
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Result Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-white rounded-2xl shadow-xl p-8 border-2 ${
              isHealthy ? "border-green-500" : "border-orange-500"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                {isHealthy ? (
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="bg-orange-100 p-3 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isHealthy ? "Healthy Plant" : "Disease Detected"}
                  </h3>
                  <p className="text-gray-600">{topPrediction.plant}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Condition</p>
                <p className="text-xl font-semibold text-gray-900">
                  {topPrediction.condition}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Confidence Level</p>
                  <span
                    className={`text-lg font-bold ${getConfidenceColor(
                      topPrediction.confidence
                    )}`}
                  >
                    {topPrediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topPrediction.confidence}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      isHealthy ? "bg-green-500" : "bg-orange-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
              <button className="px-4 py-3 border-2 border-green-500 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Disease Info / Treatment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {isHealthy ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Plant Care Tips
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Continue regular watering schedule</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Maintain proper sunlight exposure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Monitor for any changes in leaf color</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Ensure good air circulation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Regular inspection for pests</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    About This Disease
                  </h3>
                  <p className="text-gray-700">
                    {diseaseInfo?.description ||
                      "This disease affects plant health and requires attention."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Treatment Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {(diseaseInfo?.treatment || [
                      "Consult with a plant specialist",
                      "Remove affected leaves",
                      "Apply appropriate treatment",
                      "Monitor plant progress",
                    ]).map((treatment, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Alternative Predictions */}
        {predictions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Alternative Predictions
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {predictions.slice(1, 4).map((pred, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {pred.plant}
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded ${getConfidenceBg(
                        pred.confidence
                      )} ${getConfidenceColor(pred.confidence)}`}
                    >
                      {pred.confidence.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{pred.condition}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
