import React from "react";
import { Palette, User, Shirt, Sparkles, Heart, RefreshCw } from "lucide-react";

const features = [
  {
    icon: <Palette className="w-5 h-5" style={{ color: "var(--terracotta-soft)" }} />,
    iconBg: "rgba(208,135,112,0.2)",
    number: "01",
    title: "AI Skin Tone Detection",
    description:
      "Advanced image analysis to determine your exact skin tone and undertone for perfect color matching.",
  },
  {
    icon: <User className="w-5 h-5" style={{ color: "var(--sage-soft)" }} />,
    iconBg: "rgba(92,107,92,0.25)",
    number: "02",
    title: "Body Shape Analysis",
    description:
      "Identify your body type to find silhouettes and cuts that flatter your unique proportions.",
  },
  {
    icon: <Shirt className="w-5 h-5" style={{ color: "var(--taupe)" }} />,
    iconBg: "rgba(184,168,138,0.2)",
    number: "03",
    title: "Personalized Outfit Suggestions",
    description:
      "Get tailored recommendations for tops, bottoms, dresses, and outerwear that suit you.",
  },
  {
    icon: <Sparkles className="w-5 h-5" style={{ color: "var(--sage-soft)" }} />,
    iconBg: "rgba(92,107,92,0.25)",
    number: "04",
    title: "Color Matching Intelligence",
    description:
      "Discover which colors make you glow and which to avoid for a cohesive wardrobe.",
  },
  {
    icon: <Heart className="w-5 h-5" style={{ color: "var(--terracotta-soft)" }} />,
    iconBg: "rgba(208,135,112,0.2)",
    number: "05",
    title: "Smart AI Stylist Chat",
    description:
      "Ask our AI stylist anything — from wedding outfits to casual weekend looks.",
  },
  {
    icon: <RefreshCw className="w-5 h-5" style={{ color: "var(--sage-soft)" }} />,
    iconBg: "rgba(92,107,92,0.25)",
    number: "06",
    title: "Save & Update Profile",
    description:
      "Your style profile evolves with you. Update preferences anytime for fresh recommendations.",
  },
];

const FeaturesHighlight = () => {
  return (
    <section className="w-full py-20 px-6 features-section">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 features-eyebrow">
            AI Fashion Stylist
          </p>
          <h2 className="features-title font-light mb-3 tracking-tight">
            Features to Highlight
          </h2>
          <p className="text-sm font-light max-w-md mx-auto features-subtext">
            Everything you need for personalized style guidance
          </p>
          <div className="features-divider" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-2xl p-7 features-card"
            >
              <p className="text-[10px] font-bold tracking-[0.14em] mb-3 features-number">
                {feature.number}
              </p>

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: feature.iconBg }}
              >
                {feature.icon}
              </div>

              <h3 className="features-card-title font-semibold mb-2 leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed font-light features-card-desc">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesHighlight;
