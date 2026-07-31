
import { Upload, Cpu, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: Upload,
    title: "Upload a Photo",
    description: "Take a selfie or answer quick questions about your features",
    number: "01",
    tag: "Start here",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description: "Our AI analyzes your skin tone, undertone, and body type",
    number: "02",
    tag: "Instant results",
  },
  {
    icon: Sparkles,
    title: "Get Recommendations",
    description: "Receive personalized outfit and color recommendations",
    number: "03",
    tag: "Just for you",
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 overflow-hidden relative hiw-section">
      <div className="hiw-bg-orb-tl" />
      <div className="hiw-bg-orb-br" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          ref={ref}
        >
          <h2 className="text-5xl font-serif font-bold mb-4 leading-tight hiw-heading">
            How It Works
          </h2>
          <p className="max-w-md mx-auto text-base leading-relaxed hiw-subtext">
            Three simple steps to discover your perfect style
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute hiw-connector" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.65,
                delay: 0.2 + index * 0.13,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
              className="relative group"
            >
              <div className="rounded-3xl p-8 h-full flex flex-col relative overflow-hidden hiw-card">
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-3xl transition-opacity duration-300 hiw-card-hover-overlay"
                />

                <span className="absolute top-6 right-7 text-[11px] font-bold tracking-[0.18em] tabular-nums hiw-step-number">
                  {step.number}
                </span>

                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-7 relative z-10 hiw-icon-container"
                  whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }}
                >
                  <step.icon className="w-7 h-7 hiw-icon-color" />
                </motion.div>

                <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full mb-3 w-fit hiw-tag">
                  {step.tag}
                </span>

                <h3 className="text-xl font-semibold mb-2 leading-snug relative z-10 hiw-title">
                  {step.title}
                </h3>

                <p className="text-sm leading-relaxed relative z-10 hiw-desc">
                  {step.description}
                </p>

                <motion.div
                  className="absolute bottom-0 left-0 rounded-b-3xl hiw-bottom-line"
                  initial={{ width: "0%" }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
