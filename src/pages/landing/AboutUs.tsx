import React from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import heroAnimation from "./assets/animations/heroSystem.json";
import whoWeAreIllustration from "./assets/illustrations/systemFlow.png";
import { CogIcon, ChartBarIcon, CheckCircleIcon, CubeIcon } from "@heroicons/react/outline";

const AboutUs = () => {
  const features = [
    { icon: CogIcon, title: "Operational Systems", description: "Robust platforms to streamline and automate organizational workflows." },
    { icon: ChartBarIcon, title: "Data Intelligence Platforms", description: "Tools to gather, analyze, and visualize critical operational data." },
    { icon: CheckCircleIcon, title: "Decision Verification & Forecasting", description: "Systems designed to validate actions and predict outcomes with high accuracy." },
    { icon: CubeIcon, title: "Service Delivery Infrastructure", description: "Reliable frameworks that ensure consistent and scalable service execution." },
  ];

  const audiences = [
    { title: "Enterprises", description: "Large-scale organizations seeking operational efficiency and insight." },
    { title: "Institutions", description: "Public and private institutions requiring robust data and decision support." },
    { title: "Professionals", description: "Individual experts leveraging intelligent systems to enhance services." },
    { title: "Service Providers", description: "Organizations delivering value to clients through scalable digital platforms." },
  ];

  const principles = [
    "Security by Design – Every system is built with security embedded at its core.",
    "Reliability & Uptime – Commitment to continuous, uninterrupted service.",
    "Scalable Architecture – Platforms grow seamlessly with your needs.",
    "Responsible Intelligence – Systems act with transparency and ethical consideration.",
  ];

  return (
    <div className="w-full">

      {/* Hero Section */}
      <div className="relative w-full h-screen bg-white flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center px-4 z-10"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Amineva Global: Digital Infrastructure for Confident Decisions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We create and operate advanced digital systems that empower organizations and
            professionals to manage operations, harness intelligence, verify decisions, predict outcomes, and deliver services with trust and precision.
          </p>
        </motion.div>
        <div className="absolute inset-0">
          <Lottie animationData={heroAnimation} loop={true} />
        </div>
      </div>

      {/* Who We Are */}
      <div className="max-w-7xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-semibold mb-4">Who We Are</h2>
          <p className="text-gray-700">
            Amineva Global is a technology-driven platform built to serve as the backbone of modern organizational operations. Our solutions provide enterprises, institutions, and professionals with tools to streamline workflows, leverage data intelligence, and ensure operational excellence. With a focus on trust, reliability, and predictive insight, we enable our partners to act with confidence and foresight in an increasingly complex digital environment.
          </p>
        </motion.div>
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <img src={whoWeAreIllustration} alt="System Flow Illustration" className="w-full max-w-md" />
        </motion.div>
      </div>

      {/* What We Build */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">What We Build</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center p-6 border rounded-lg shadow hover:shadow-lg"
            >
              <feature.icon className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Who We Serve */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">Who We Serve</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {audiences.map((aud, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 border rounded-lg shadow text-center hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2">{aud.title}</h3>
              <p className="text-gray-600">{aud.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Principles & Standards */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-12">Principles & Standards</h2>
          <ul className="space-y-4 text-gray-700">
            {principles.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Platform Integrity */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">Platform Integrity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 border rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Uptime Commitment</h3>
            <p className="text-gray-600">99.99% availability across all critical systems.</p>
          </div>
          <div className="p-6 border rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Encryption Standards</h3>
            <p className="text-gray-600">End-to-end protection for sensitive data.</p>
          </div>
          <div className="p-6 border rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Monitoring Philosophy</h3>
            <p className="text-gray-600">Continuous oversight ensures operational health and trustworthiness.</p>
          </div>
        </div>
      </div>

      {/* Closing Statement */}
      <div className="bg-white py-20 text-center px-6">
        <h2 className="text-3xl font-semibold mb-4">Trusted Digital Infrastructure</h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Amineva Global enables organizations and professionals to make smarter decisions, optimize operations, and deliver services with confidence. We are the trusted foundation for digital infrastructure, where intelligence meets execution.
        </p>
      </div>

    </div>
  );
};

export default AboutUs;
