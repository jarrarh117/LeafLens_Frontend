"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PricingPage() {
  const { user } = useAuth();
  const homeLink = user ? "/dashboard" : "/";
  const backText = user ? "Back to Dashboard" : "Back to Home";

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "10 scans per month",
        "Basic disease detection",
        "Treatment recommendations",
        "7-day history",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      features: [
        "Unlimited scans",
        "Advanced AI analysis",
        "Priority support",
        "Unlimited history",
        "Export reports",
        "API access",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: [
        "Everything in Pro",
        "Custom AI training",
        "Dedicated support",
        "Team collaboration",
        "White-label option",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-stone-950 dark:via-stone-900 dark:to-emerald-950/20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Link href={homeLink} className="inline-flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>{backText}</span>
        </Link>

        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/LeafLens.png"
              alt="LeafLens"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 dark:text-stone-400">Choose the plan that's right for you</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-stone-900 rounded-2xl shadow-lg dark:shadow-stone-900/50 p-8 border border-stone-100 dark:border-stone-800 ${
                plan.popular ? "ring-2 ring-emerald-500 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">{plan.price}</div>
                <div className="text-gray-600 dark:text-stone-400">{plan.period}</div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-stone-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/25"
                    : "border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
