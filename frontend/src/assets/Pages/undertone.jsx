import { useState, useRef, useEffect } from "react";
import {
  Upload, Camera, Sun, Moon, Loader2, Check, X,
  ShoppingBag, Heart, Sparkles, Droplets
} from "lucide-react";
import { under_TONE_RESULTS } from "../../Data/underToneData";
import SkinToneImage from "../skintone.jpg";

const API_URL = "http://localhost:8000/api/predict/undertone/";
const PROFILE_URL = "http://localhost:8000/api/users/profile/";

/* ─── Floating Orb Background ──────────────────────────────────── */
const OrbField = ({ type }) => {
  const configs = {
    warm: [
      { size: 340, top: "-80px", left: "-100px", color: "rgba(232,144,122,0.15)", delay: "0s" },
      { size: 220, top: "40%",   right: "-60px",  color: "rgba(232,144,122,0.1)",  delay: "1.5s" },
      { size: 160, bottom: "10%",left: "20%",     color: "rgba(232,144,122,0.08)",  delay: "3s" },
    ],
    cool: [
      { size: 340, top: "-80px", left: "-100px", color: "rgba(100,120,180,0.12)", delay: "0s" },
      { size: 220, top: "40%",   right: "-60px",  color: "rgba(100,120,180,0.08)", delay: "1.5s" },
      { size: 160, bottom: "10%",left: "20%",     color: "rgba(100,120,180,0.06)",  delay: "3s" },
    ],
    neutral: [
      { size: 340, top: "-80px", left: "-100px", color: "rgba(135,174,115,0.1)", delay: "0s" },
      { size: 220, top: "40%",   right: "-60px",  color: "rgba(232,144,122,0.08)", delay: "1.5s" },
      { size: 160, bottom: "10%",left: "20%",     color: "rgba(200,200,200,0.08)", delay: "3s" },
    ],
    default: [
      { size: 340, top: "-80px", left: "-100px", color: "rgba(232,144,122,0.12)", delay: "0s" },
      { size: 220, top: "40%",   right: "-60px",  color: "rgba(232,144,122,0.08)", delay: "2s" },
      { size: 180, bottom: "5%", left: "30%",     color: "rgba(135,174,115,0.06)", delay: "4s" },
    ],
  };
  const orbs = configs[type] || configs.default;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {orbs.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: o.size, height: o.size,
            top: o.top, left: o.left, right: o.right, bottom: o.bottom,
            background: o.color,
            animation: `floatOrb 8s ease-in-out infinite alternate`,
            animationDelay: o.delay,
          }}
        />
      ))}
      <style>{`
        @keyframes floatOrb {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-30px) scale(1.08); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.35s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.5s ease both; }
        .card-3d {
          transition: transform 0.4s cubic-bezier(.17,.67,.35,1.2), box-shadow 0.4s ease;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .card-3d:hover {
          transform: translateY(-8px) rotateX(4deg) rotateY(-2deg) scale(1.01);
          box-shadow: 0 32px 60px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(232,144,122,0.2);
        }
        .glass {
          background: rgba(43,26,26,0.6);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(232,144,122,0.25);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #e8907a, #d4845c, #e8907a, #f0b89a, #e8907a);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .gradient-border {
          position: relative;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(232,144,122,0.5), rgba(135,174,115,0.3), rgba(232,144,122,0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .color-swatch {
          transition: transform 0.3s cubic-bezier(.17,.67,.35,1.4), box-shadow 0.3s ease;
        }
        .color-swatch:hover {
          transform: translateY(-6px) scale(1.12) rotate(-3deg);
          box-shadow: 0 16px 32px -6px rgba(0,0,0,0.25);
        }
        .vein-btn {
          transition: all 0.35s cubic-bezier(.17,.67,.35,1.2);
        }
        .vein-btn:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 16px 40px -8px rgba(0,0,0,0.3);
        }
        .progress-bar {
          transition: width 1s cubic-bezier(.17,.67,.35,1);
        }
      `}</style>
    </div>
  );
};

/* ─── 3D Tone Badge ─────────────────────────────────────────────── */
const ToneBadge = ({ type }) => {
  const configs = {
    warm: {
      grad: "linear-gradient(135deg, #e8907a, #d4845c, #c8705a)",
      icon: <Sun className="w-9 h-9 text-white drop-shadow-lg" />,
      glow: "rgba(232,144,122,0.4)",
    },
    cool: {
      grad: "linear-gradient(135deg, #7a8fb0, #5a6d8a, #8a9bb8)",
      icon: <Moon className="w-9 h-9 text-white drop-shadow-lg" />,
      glow: "rgba(100,120,180,0.4)",
    },
    neutral: {
      grad: "linear-gradient(135deg, #87AE73, #e8907a, #b8a89a)",
      icon: <Droplets className="w-9 h-9 text-white drop-shadow-lg" />,
      glow: "rgba(135,174,115,0.4)",
    },
  };
  const c = configs[type] || configs.neutral;

  return (
    <div className="relative w-20 h-20 shrink-0">
      <div
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{ background: c.glow, transform: "scale(1.3) translateY(6px)" }}
      />
      <div
        className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: c.grad,
          boxShadow: `0 8px 32px -4px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {c.icon}
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────── */
const Undertone = () => {
  const [step, setStep] = useState("upload");
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [allScores, setAllScores] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState(0);
  const fileInputRef = useRef(null);

  const sendToAPI = async (file) => {
    setStep("analyzing");
    setError(null);
    setAnalyzePhase(0);
    const t1 = setTimeout(() => setAnalyzePhase(1), 900);
    const t2 = setTimeout(() => setAnalyzePhase(2), 1800);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Prediction failed");
      }
      const data = await response.json();
      setResult(data.predicted_class.toLowerCase());
      setConfidence(data.confidence);
      setAllScores(data.all_scores);
      setStep("result");
    } catch (err) {
      setError(err.message);
      setStep("upload");
    } finally {
      clearTimeout(t1); clearTimeout(t2);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    await sendToAPI(file);
  };

  const handleVeinTest = (tone) => {
    setResult(tone);
    setConfidence(null);
    setAllScores(null);
    setStep("analyzing");
    setTimeout(() => setStep("result"), 2400);
  };

  const saveToProfile = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) { setError("Please log in to save your results."); return; }
    if (!result)  { setError("No result to save."); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch(PROFILE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId), undertone: result }),
      });
      const data = await response.json();
      if (response.ok) { setSaved(true); }
      else { setError(data?.detail || data?.message || "Failed to save."); }
    } catch { setError("Network error. Is Django running?"); }
    finally { setSaving(false); }
  };

  const selectedResult = result ? under_TONE_RESULTS[result] : null;

  const analyzeLabels = [
    "Reading skin tone signals…",
    "Mapping color frequencies…",
    "Generating your palette…",
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--espresso)" }}>
      <OrbField type={result || "default"} />

      <section className="pt-28 pb-24 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* ── PAGE HEADER ─────────────────────────────────── */}
          <div className="text-center mb-16 fade-up">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "rgba(232,144,122,0.6)" }}>
              Personae · Personalised Styling
            </p>
            <h1 className="font-bold mb-4" style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--canvas)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
            }}>
              Discover Your{" "}
              <span className="shimmer-text">Undertone</span>
            </h1>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "rgba(240,190,160,0.7)" }}>
              Unlock the colors that make you radiate — powered by skin science and AI
            </p>
            <div className="mx-auto mt-5" style={{ width: 52, height: 1, background: "linear-gradient(90deg, transparent, #e8907a, transparent)" }} />
          </div>

          {/* ── ERROR ───────────────────────────────────────── */}
          {error && (
            <div className="mb-8 p-4 rounded-2xl text-center fade-up glass gradient-border"
              style={{ borderColor: "rgba(239,68,68,0.3)" }}>
              <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              UPLOAD STEP
          ══════════════════════════════════════════════════ */}
          {step === "upload" && (
            <div className="space-y-6">

              {/* TOP: Upload card (full width, hero) */}
              <div className="card-3d glass gradient-border rounded-3xl overflow-hidden fade-up-1">
                <div className="grid md:grid-cols-2">
                  {/* Left: Info */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                      style={{ background: "rgba(232,144,122,0.15)" }}>
                      <Camera className="w-7 h-7" style={{ color: "#e8907a" }} />
                    </div>
                    <h3 className="font-bold text-2xl mb-3" style={{ letterSpacing: "-0.01em", color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
                      Photo Analysis
                    </h3>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,190,160,0.7)" }}>
                      Upload a clear selfie in natural light — no filters, no flash. Our AI reads subtle warm, cool, or neutral signals in your skin.
                    </p>
                    {previewUrl && (
                      <div className="mb-5 rounded-2xl overflow-hidden h-36 w-36 shadow-lg ring-2"
                        style={{ ringColor: "rgba(232,144,122,0.4)" }}>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 w-fit"
                      style={{ background: "linear-gradient(135deg, #e8907a, #c8705a)", boxShadow: "0 8px 24px -4px rgba(232,144,122,0.4)" }}
                    >
                      <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Upload Photo
                    </button>
                  </div>
                  {/* Right: Skin tone image */}
                  <div className="hidden md:flex items-center justify-center relative overflow-hidden" style={{ minHeight: 320 }}>
                    <img
                      src={SkinToneImage}
                      alt="Skin tone reference"
                      className="w-86 h-72 object-cover rounded-2xl shadow-xl"
                    />
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(to right, rgba(43,26,26,0.3) 0%, rgba(0,0,0,0) 40%), linear-gradient(to top, rgba(232,144,122,0.1) 0%, rgba(0,0,0,0) 60%)"
                    }} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 fade-up-2">
                <div className="flex-1 h-px" style={{ background: "rgba(232,144,122,0.2)" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-center" style={{ color: "rgba(240,190,160,0.5)" }}>or try the vein test</span>
                <div className="flex-1 h-px" style={{ background: "rgba(232,144,122,0.2)" }} />
              </div>

              {/* Vein test cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up-3">
                {/* Warm */}
                <button onClick={() => handleVeinTest("warm")}
                  className="vein-btn glass gradient-border rounded-2xl p-6 text-left cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(232,144,122,0.08), rgba(232,144,122,0.05))" }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg, #e8907a, #c8705a)", boxShadow: "0 8px 20px -4px rgba(232,144,122,0.4)" }}>
                      <Sun className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold mb-1 text-base" style={{ color: "var(--canvas)" }}>Warm Tone</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}>Veins appear <strong style={{ color: "#e8907a" }}>greenish</strong> — golden, peachy, or olive undertones</p>
                  </div>
                </button>

                {/* Cool */}
                <button onClick={() => handleVeinTest("cool")}
                  className="vein-btn glass gradient-border rounded-2xl p-6 text-left cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(100,120,180,0.08), rgba(100,120,180,0.05))" }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg, #7a8fb0, #5a6d8a)", boxShadow: "0 8px 20px -4px rgba(100,120,180,0.4)" }}>
                      <Moon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold mb-1 text-base" style={{ color: "var(--canvas)" }}>Cool Tone</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}>Veins look <strong style={{ color: "#7a8fb0" }}>blue or purple</strong> — pink, red, or bluish undertones</p>
                  </div>
                </button>

                {/* Neutral */}
                <button onClick={() => handleVeinTest("neutral")}
                  className="vein-btn glass gradient-border rounded-2xl p-6 text-left cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(135,174,115,0.08), rgba(232,144,122,0.05))" }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "linear-gradient(135deg, #87AE73, #e8907a)", boxShadow: "0 8px 20px -4px rgba(135,174,115,0.4)" }}>
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold mb-1 text-base" style={{ color: "var(--canvas)" }}>Neutral Tone</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}><strong style={{ color: "#87AE73" }}>Both or neither</strong> — a perfect blend of warm and cool</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              ANALYZING STEP
          ══════════════════════════════════════════════════ */}
          {step === "analyzing" && (
            <div className="max-w-md mx-auto text-center fade-up">
              <div className="glass gradient-border rounded-3xl p-14 shadow-2xl">
                <div className="relative w-28 h-28 mx-auto mb-8">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute inset-0 rounded-full border-2"
                      style={{
                        borderColor: "rgba(232,144,122,0.4)",
                        animation: `pulseRing 2s ${i * 0.5}s ease-out infinite`,
                        opacity: 0,
                      }} />
                  ))}
                  <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #e8907a, #c8705a, #b8604a)",
                      boxShadow: "0 16px 48px -8px rgba(232,144,122,0.5)",
                    }}>
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ letterSpacing: "-0.01em", color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
                  Analyzing Your Skin
                </h3>
                <p className="text-sm mb-6" style={{ color: "rgba(240,190,160,0.7)" }}>{analyzeLabels[Math.min(analyzePhase, 2)]}</p>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(232,144,122,0.15)" }}>
                  <div className="h-full rounded-full progress-bar"
                    style={{
                      width: `${[20, 60, 90][Math.min(analyzePhase, 2)]}%`,
                      background: "linear-gradient(90deg, #e8907a, #87AE73)",
                    }} />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              RESULT STEP
          ══════════════════════════════════════════════════ */}
          {step === "result" && selectedResult && (
            <div className="space-y-6">

              {/* Hero result card */}
              <div className="glass gradient-border rounded-3xl overflow-hidden shadow-2xl fade-up-1">
                <div className="h-1.5 w-full"
                  style={{
                    background: result === "warm"
                      ? "linear-gradient(90deg, #e8907a, #d4845c, #c8705a)"
                      : result === "cool"
                      ? "linear-gradient(90deg, #7a8fb0, #5a6d8a, #8a9bb8)"
                      : "linear-gradient(90deg, #87AE73, #e8907a, #b8a89a)",
                  }} />
                <div className="p-8 md:p-10">
                  {/* Header row */}
                  <div className="flex items-start gap-5 mb-6">
                    <ToneBadge type={result} />
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1"
                        style={{ color: result === "warm" ? "#e8907a" : result === "cool" ? "#7a8fb0" : "#87AE73" }}>
                        Your Undertone
                      </p>
                      <h2 className="font-bold text-2xl md:text-3xl mb-1" style={{ letterSpacing: "-0.02em", color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
                        {selectedResult.title}
                      </h2>
                      <p className="text-sm" style={{ color: "rgba(240,190,160,0.7)" }}>{selectedResult.depth}</p>
                      {confidence && (
                        <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: "rgba(232,144,122,0.15)", color: "#e8907a" }}>
                          <Sparkles className="w-3 h-3" />
                          {confidence}% AI Confidence
                        </span>
                      )}
                    </div>
                    {previewUrl && (
                      <div className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2"
                        style={{ ringColor: "rgba(232,144,122,0.4)", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.2)" }}>
                        <img src={previewUrl} alt="Your photo" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <p className="leading-relaxed mb-8 text-sm md:text-base" style={{ color: "rgba(240,190,160,0.7)" }}>
                    {selectedResult.description}
                  </p>

                  {/* Confidence Bars */}
                  {allScores && (
                    <div className="mb-8 p-5 rounded-2xl space-y-3"
                      style={{ background: "rgba(43,26,26,0.4)", border: "1px solid rgba(232,144,122,0.15)" }}>
                      <h4 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--canvas)" }}>
                        <Sparkles className="w-4 h-4" style={{ color: "#e8907a" }} />
                        AI Confidence Breakdown
                      </h4>
                      {Object.entries(allScores).sort((a, b) => b[1] - a[1]).map(([cls, score]) => (
                        <div key={cls}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="capitalize font-medium" style={{ color: "rgba(240,190,160,0.7)" }}>{cls}</span>
                            <span className="font-bold" style={{ color: cls === result ? "var(--terracotta-soft)" : "rgba(240,190,160,0.5)" }}>{score}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
                            <div className="h-full rounded-full progress-bar"
                              style={{
                                width: `${score}%`,
                                background: cls === result
                                  ? result === "warm" ? "linear-gradient(90deg, #e8907a, #d4845c)"
                                    : result === "cool" ? "linear-gradient(90deg, #7a8fb0, #5a6d8a)"
                                    : "linear-gradient(90deg, #87AE73, #e8907a)"
                                  : "rgba(255,255,255,0.1)",
                              }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Best Colors (NO GLOWS) ── */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-base mb-5 flex items-center gap-2" style={{ color: "var(--canvas)" }}>
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                        style={{ background: "rgba(135,174,115,0.2)", color: "#87AE73" }}>✓</span>
                      Colors That Flatter You
                    </h3>
                    <div className="flex flex-wrap gap-5">
                      {selectedResult.bestColors.map((color) => (
                        <div key={color.name} className="flex flex-col items-center gap-2 group">
                          <div className="color-swatch w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-md cursor-pointer"
                            style={{
                              backgroundColor: color.hex,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              border: "1px solid rgba(255,255,255,0.1)"
                            }}
                            title={color.name} />
                          <span className="text-[10px] font-medium text-center max-w-14 leading-tight" style={{ color: "rgba(240,190,160,0.6)", transition: "color 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--canvas)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,190,160,0.6)"}>
                            {color.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Avoid Colors (NO GLOWS) ── */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-base mb-5 flex items-center gap-2" style={{ color: "var(--canvas)" }}>
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                        style={{ background: "rgba(232,144,122,0.2)", color: "#e8907a" }}>✗</span>
                      Colors to Avoid
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {selectedResult.avoidColors.map((color) => (
                        <div key={color.name} className="flex flex-col items-center gap-2 opacity-55 hover:opacity-80 transition-opacity">
                          <div className="relative w-12 h-12 rounded-xl shadow-sm"
                            style={{ backgroundColor: color.hex, border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                              style={{ background: "rgba(0,0,0,0.3)" }}>
                              <X className="w-5 h-5 text-white drop-shadow" />
                            </div>
                          </div>
                          <span className="text-[10px] text-center max-w-12 leading-tight" style={{ color: "rgba(240,190,160,0.5)" }}>{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Save Button ── */}
                  <button
                    onClick={saveToProfile}
                    disabled={saving || saved}
                    className="w-full mb-4 py-3.5 px-5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: saved
                        ? "rgba(134,239,172,0.15)"
                        : saving
                        ? "rgba(232,144,122,0.5)"
                        : "linear-gradient(135deg, #e8907a, #c8705a)",
                      color: saved ? "#86efac" : "#fff",
                      border: saved ? "1px solid rgba(134,239,172,0.3)" : "none",
                      boxShadow: saved || saving ? "none" : "0 8px 24px -4px rgba(232,144,122,0.45)",
                    }}
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                      : saved  ? <><Check className="w-4 h-4" />Saved to Profile!</>
                      : <><Heart className="w-4 h-4" />Save to Profile</>}
                  </button>

                  {/* ── Actions ── */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => { setStep("upload"); setResult(null); setPreviewUrl(null); setAllScores(null); setConfidence(null); setSaved(false); }}
                      className="flex-1 py-3 px-5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(240,190,160,0.85)", border: "1px solid rgba(232,144,122,0.2)" }}
                    >
                      Try Again
                    </button>
                    {selectedResult?.makeupLink && (
                      <button
                        onClick={() => window.open(selectedResult.makeupLink, "_blank")}
                        className="flex-1 py-3 px-5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                        style={{
                          background: result === "warm"
                            ? "linear-gradient(135deg, #e8907a, #c8705a)"
                            : result === "cool"
                            ? "linear-gradient(135deg, #7a8fb0, #5a6d8a)"
                            : "linear-gradient(135deg, #87AE73, #e8907a)",
                          boxShadow: "0 8px 24px -4px rgba(0,0,0,0.3)",
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Browse Makeup for {selectedResult.title}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </section>
    </main>
  );
};

export default Undertone;