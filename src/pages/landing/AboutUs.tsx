import { FC } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import heroAnimation from "./assets/heroSystem.json";
import whoWeAreIllustration from "./assets/illustrations/systemFlow.png";
import { CogIcon, ChartBarIcon, CheckCircleIcon, CubeIcon } from "@heroicons/react/outline";
>>>>>>> 31e8572 (fix: correct heroSystem.json import path in AboutUs)

import heroAnimation from "@/assets/hero-system.json"; 
import whoWeAreIllustration from "@/assets/illustrations/system-flow.png";

import {
  CogIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

interface Feature {
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
}

interface Audience {
  title: string;
  description: string;
}

const About: FC = () => {
  const features: Feature[] = [
    {
      icon: CogIcon,
      title: "Operational Systems",
      description:
        "Robust platforms to streamline and automate organizational workflows.",
    },
    {
      icon: ChartBarIcon,
      title: "Data Intelligence Platforms",
      description:
        "Tools to gather, analyze, and visualize critical operational data.",
    },
    {
      icon: CheckCircleIcon,
      title: "Decision Verification & Forecasting",
      description:
        "Systems designed to validate actions and predict outcomes with high accuracy.",
    },
    {
      icon: CubeIcon,
      title: "Service Delivery Infrastructure",
      description:
        "Reliable frameworks that ensure consistent and scalable service execution.",
    },
  ];

  const audiences: Audience[] = [
    {
      title: "Enterprises",
      description:
        "Large-scale organizations seeking operational efficiency and insight.",
    },
    {
      title: "Institutions",
      description:
        "Public and private institutions requiring robust data and decision support.",
    },
    {
      title: "Professionals",
      description:
        "Individual experts leveraging intelligent systems to enhance services.",
    },
    {
      title: "Service Providers",
      description:
        "Organizations delivering value through scalable digital platforms.",
    },
  ];

  const principles: string[] = [
    "Security by Design – Every system is built with security embedded at its core.",
    "Reliability & Uptime – Commitment to continuous, uninterrupted service.",
    "Scalable Architecture – Platforms grow seamlessly with your needs.",
    "Responsible Intelligence – Systems act with transparency and ethical consideration.",
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center bg-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-6"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Amineva Global: Digital Infrastructure for Confident Decisions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We create and operate advanced digital systems that empower
            organizations and professionals to manage operations, harness
            intelligence, verify decisions, predict outcomes, and deliver
            services with trust and precision.
          </p>
        </motion.div>

        <div className="absolute inset-0">
          <Lottie animationData={heroAnimation} loop />
        </div>
      </section>

      {/* Who We Are */}
      <section className="max-w-7xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl font-semibold mb-4">Who We Are</h2>
          <p className="text-gray-700">
            Amineva Global is a technology-driven platform built to serve as the
            backbone of modern organizational operations. Our solutions empower
            enterprises, institutions, and professionals to act with confidence
            in complex digital environments.
          </p>
        </motion.div>

        <motion.div
          initial={{ x: 40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img
            src={whoWeAreIllustration}
            alt="System flow"
            className="max-w-md mx-auto"
          />
        </motion.div>
      </section>

      {/* What We Build */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">
          What We Build
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.05 }}
              className="p-6 border rounded-lg text-center shadow hover:shadow-lg"
            >
              <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who We Serve */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">
          Who We Serve
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          {audiences.map((aud) => (
            <div
              key={aud.title}
              className="p-6 border rounded-lg text-center shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{aud.title}</h3>
              <p className="text-gray-600">{aud.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="bg-gray-50 py-20 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-10">
          Principles & Standards
        </h2>
        <ul className="max-w-4xl mx-auto space-y-4 text-gray-700">
          {principles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default About;
