import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Camera, Loader2, Check, X, Heart,
  AlertTriangle, Sparkles, Sun, Zap, ArrowRight
} from "lucide-react";
import { SKIN_TONES, SKIN_TONE_RESULTS } from "../../Data/SkinToneData";

const API_URL = "http://localhost:8000/api/predict/skin-tone/";
const PROFILE_URL = "http://localhost:8000/api/users/profile/";

/* ─── Seasonal Color System ──────────────────────────────────────── */
const SEASONAL_MAP = {
  fair:   { season: "True Spring",   hue: "Warm",    value: "Light",  chroma: "Bright", palette: ["#FFD700","#FF6B6B","#98FB98","#87CEEB","#FFA500","#FFB6C1"], powerColors: ["Peach","Warm Coral","Golden Yellow"], neutrals: ["Ivory","Warm Beige","Soft Camel"] },
  medium: { season: "True Autumn",   hue: "Warm",    value: "Medium", chroma: "Muted",  palette: ["#8B4513","#D2691E","#CD853F","#A0522D","#6B8E23","#8FBC8F"], powerColors: ["Terracotta","Olive Green","Warm Brown"], neutrals: ["Camel","Warm Taupe","Chocolate"] },
  dark:   { season: "True Summer",   hue: "Neutral", value: "Dark",   chroma: "Muted",  palette: ["#8B008B","#FF4500","#00CED1","#32CD32","#FFD700","#FF1493"], powerColors: ["Rich Magenta","Bold Cobalt","Lime Green"], neutrals: ["Charcoal","Warm Brown","Mocha"] },
  black:  { season: "True Winter",   hue: "Cool",    value: "Deep",   chroma: "Bright", palette: ["#4169E1","#FF00FF","#FFFF33","#FF69B4","#2E8B57","#9B111E"], powerColors: ["Electric Blue","Magenta","Pure White"], neutrals: ["Black","Charcoal","Pure White"] },
};

/* ─── Contrast Level mapping ─────────────────────────────────────── */
const CONTRAST_MAP = {
  fair:   { level: "Low",    score: 28, label: "Delicate Harmony",   tip: "Monochromatic and tonal looks are your magic zone — avoid sharp high-contrast combinations which can overwhelm your natural softness.", patterns: ["Soft florals","Tonal gradients","Watercolour washes"], avoid: ["Bold stripes","High-contrast blocks","Graphic prints"] },
  medium: { level: "Medium", score: 55, label: "Balanced Radiance",  tip: "You sit in the sweet spot — you can rock both subtle tonal looks and bolder colour combinations without either extreme overpowering you.", patterns: ["Mixed prints","Colour blocking","Ethnic patterns"], avoid: ["Neon combinations","Stark black-and-white only"] },
  dark:   { level: "High",   score: 78, label: "Vivid Presence",     tip: "Your natural contrast is striking. Bold patterns, sharp colour blocks, and vivid hues all read with stunning clarity on your complexion.", patterns: ["Graphic prints","Bold stripes","Colour blocking"], avoid: ["Dusty muted tones","Washed-out pastels"] },
  black:  { level: "High",   score: 92, label: "Dramatic Statement", tip: "Maximum contrast is your signature. Jewel tones, bold graphics, and dramatic combinations look extraordinary against your deep complexion.", patterns: ["Bold graphics","Rich jewel tones","Metallic accents"], avoid: ["Nude tones that blend","Muted beige families"] },
};

/* ─── Disclaimer ─────────────────────────────────────────────────── */
const DisclaimerPanel = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.1 }}
    className="mb-10 flex gap-4 items-start"
    style={{
      background: "rgba(212, 165, 116, 0.12)",
      borderLeft: "3px solid var(--state-warning-accent)",
      borderRadius: "0 8px 8px 0",
      padding: "16px 20px",
    }}
  >
    <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
      style={{ background: "rgba(212,165,116,0.2)", border: "1px solid var(--state-warning-accent)" }}
    >
      <AlertTriangle className="w-5 h-5" style={{ color: "var(--state-warning-accent)" }} />
    </div>
    <div>
      <p className="font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "var(--state-warning-accent)", fontSize: "0.65rem" }}>⚠ Important Disclaimer</p>
      <p className="leading-relaxed" style={{ color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "0.95rem" }}>
        Skin tone analysis is performed by an AI model and is intended as a{" "}
        <span style={{ color: "var(--terracotta-soft)", fontWeight: 700, fontStyle: "normal" }}>style guidance tool only</span>.
        Results may vary based on lighting, image quality, and camera calibration. This is{" "}
        <span style={{ color: "var(--terracotta-soft)", fontWeight: 700, fontStyle: "normal" }}>not a medical or dermatological assessment</span>.
        For best accuracy, use a well-lit, unfiltered photo in natural daylight.
      </p>
    </div>
  </motion.div>
);

/* ─── Scene orbs ─────────────────────────────────────────────────── */
const SceneOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div style={{ position: "absolute", top: "8%", right: "6%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(200,100,60,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", bottom: "12%", left: "3%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle at 60% 60%, rgba(80,140,90,0.14) 0%, transparent 70%)", filter: "blur(36px)" }} />
    <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(122,48,32,0.06) 0%, transparent 65%)", filter: "blur(60px)" }} />
  </div>
);

/* ─── Cinematic Button ───────────────────────────────────────────── */
const CinematicButton = ({ onClick, disabled, icon, label, variant = "primary" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
    style={
      variant === "primary"
        ? { background: disabled ? "rgba(200,160,128,0.35)" : "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: disabled ? "rgba(255,255,255,0.45)" : "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: disabled ? "none" : "0 4px 18px rgba(180,80,40,0.28)", cursor: disabled ? "not-allowed" : "pointer" }
        : { background: "rgba(249,237,232,0.06)", color: disabled ? "rgba(240,190,160,0.35)" : "rgba(240,190,160,0.85)", border: "1px solid rgba(220,110,80,0.25)", cursor: disabled ? "not-allowed" : "pointer" }
    }
  >
    {icon}{label}
  </button>
);

/* ─── Login Prompt Modal ─────────────────────────────────────────── */
const LoginPromptModal = ({ onClose, onGoLogin }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background: "rgba(10,5,3,0.78)", backdropFilter: "blur(10px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="relative rounded-3xl overflow-hidden max-w-sm w-full"
      style={{ backgroundColor: "var(--espresso)", border: "1px solid rgba(184,168,138,0.25)", boxShadow: "var(--shadow-dark-modal)" }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.6), transparent)" }} />

      <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <X className="w-3.5 h-3.5" style={{ color: "rgba(240,190,160,0.6)" }} />
      </button>

      <div className="p-8 text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, rgba(200,160,128,0.18), rgba(180,80,40,0.12))", border: "1px solid rgba(220,110,80,0.25)", boxShadow: "0 0 40px rgba(200,100,50,0.22)" }}>
            <Heart className="w-9 h-9" style={{ color: "#e8907a" }} />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ffb840, #e07820)", boxShadow: "0 0 10px rgba(255,184,64,0.5)" }}>
            <span style={{ color: "#fff", fontSize: "10px", fontWeight: 800 }}>!</span>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "rgba(232,144,122,0.6)" }}>Almost there</p>
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.7rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "10px", lineHeight: 1.2 }}>
          Create your profile first
        </h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,190,160,0.6)" }}>
          Your style analysis deserves a home. Sign up to save your skin tone, body shape, and unlock a full personalised style profile — all in one place.
        </p>

        <div className="space-y-2.5 mb-7 text-left">
          {["Save your complete style profile", "Unlock personalised outfit recommendations", "Track your style evolution over time"].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(80,160,100,0.18)", border: "1px solid rgba(80,160,100,0.3)" }}>
                <Check className="w-2.5 h-2.5" style={{ color: "#7ec89a" }} />
              </div>
              <p className="text-xs" style={{ color: "rgba(240,190,160,0.72)" }}>{item}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onGoLogin}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 mb-3 transition-all duration-200 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 6px 24px rgba(180,80,40,0.32)" }}
        >
          Create My Profile <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="w-full py-2 text-xs transition-all" style={{ color: "rgba(240,190,160,0.38)", background: "transparent", border: "none" }}>
          Maybe later
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── Upload Card ────────────────────────────────────────────────── */
const UploadCard = ({ previewUrl, isAnalyzing, showCamera, videoRef, error, fileInputRef, onFileChange, onStartCamera, onCapturePhoto, onStopCamera }) => (
  <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(180,60,30,0.12), inset 0 1px 0 rgba(255,220,200,0.1)", backdropFilter: "blur(12px)" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
    <div className="p-7">
      <div
        className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300"
        style={{ aspectRatio: "1 / 1", background: showCamera || previewUrl ? "transparent" : "linear-gradient(145deg, rgba(42,21,10,0.6) 0%, rgba(61,32,32,0.4) 100%)", border: "1.5px dashed rgba(220,110,80,0.3)", cursor: showCamera ? "default" : "pointer", boxShadow: "inset 0 4px 24px rgba(0,0,0,0.2)" }}
        onClick={() => !showCamera && fileInputRef.current?.click()}
      >
        {showCamera && (
          <div className="w-full h-full relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <button onClick={(e) => { e.stopPropagation(); onStopCamera(); }} className="absolute top-3 right-3 rounded-full p-1.5" style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        {!showCamera && isAnalyzing && (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(220,110,80,0.12)", boxShadow: "0 0 24px rgba(220,110,80,0.35)", border: "1px solid rgba(220,110,80,0.25)" }}>
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#e8907a" }} />
            </div>
            <p style={{ color: "rgba(240,190,160,0.75)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem", fontStyle: "italic" }}>Analysing your photo…</p>
          </div>
        )}
        {!showCamera && !isAnalyzing && previewUrl && <img src={previewUrl} alt="Uploaded" className="w-full h-full object-cover" />}
        {!showCamera && !isAnalyzing && !previewUrl && (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(122,48,32,0.2)", border: "1px solid rgba(220,110,80,0.3)", boxShadow: "0 0 20px rgba(220,110,80,0.2)" }}>
              <Upload className="w-7 h-7" style={{ color: "#e8907a" }} />
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.15rem", fontWeight: 600, color: "var(--canvas)", marginBottom: "6px" }}>Upload a photo</p>
            <p style={{ color: "rgba(240,190,160,0.5)", fontSize: "0.8rem" }}>Drag & drop or click to browse</p>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {error && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(180,40,30,0.15)", border: "1px solid rgba(220,80,60,0.3)", color: "rgba(255,160,140,0.9)" }}>
          ⚠ {error}
        </motion.div>
      )}

      <div className="flex gap-3 mt-5">
        <CinematicButton onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing || showCamera} icon={<Upload className="w-4 h-4" />} label="Upload" variant="primary" />
        {showCamera
          ? <CinematicButton onClick={onCapturePhoto} disabled={isAnalyzing} icon={<Camera className="w-4 h-4" />} label="Capture" variant="primary" />
          : <CinematicButton onClick={onStartCamera} disabled={isAnalyzing} icon={<Camera className="w-4 h-4" />} label="Use Camera" variant="outline" />}
      </div>
    </div>
  </div>
);

/* ─── Result Panel ───────────────────────────────────────────────── */
const ResultPanel = ({ result, resultData, resultTone, allScores, saving, saved, onSave, onViewFullRecommendations, crossCheck }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="space-y-5">

      {/* Main result card */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.07) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.22)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(180,60,30,0.1), inset 0 1px 0 rgba(255,220,200,0.08)", backdropFilter: "blur(12px)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
        <div className="p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(80,160,100,0.15)", border: "1px solid rgba(80,160,100,0.3)", boxShadow: "0 0 14px rgba(80,160,100,0.3)" }}>
              <Check className="w-4 h-4" style={{ color: "#7ec89a" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(232,144,122,0.6)" }}>Analysis Complete</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.25rem", fontStyle: "italic", color: "var(--canvas)", lineHeight: 1.2 }}>Your Skin Tone Profile</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-5 rounded-2xl mb-6" style={{ background: "rgba(42,21,10,0.45)", border: "1px solid rgba(220,110,80,0.15)" }}>
            <div className="w-20 h-20 rounded-2xl shrink-0" style={{ backgroundColor: resultTone?.color, boxShadow: `0 0 28px ${resultTone?.color}55, 0 8px 24px rgba(0,0,0,0.3)`, border: "2px solid rgba(255,255,255,0.12)" }} />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(232,144,122,0.55)" }}>Detected Tone</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.7rem", fontWeight: 600, color: "var(--canvas)", lineHeight: 1.1 }}>{resultData.title}</p>
              <p className="text-sm mt-1" style={{ color: "rgba(240,190,160,0.6)" }}>{resultData.description}</p>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={saving || saved}
            className="w-full mb-6 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            style={saved ? { background: "rgba(80,160,100,0.18)", color: "#7ec89a", border: "1px solid rgba(80,160,100,0.3)", cursor: "default" } : saving ? { background: "rgba(200,160,128,0.3)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(220,160,100,0.2)", cursor: "not-allowed" } : { background: "linear-gradient(135deg, rgba(200,160,128,0.2), rgba(180,120,80,0.15))", color: "rgba(240,190,160,0.9)", border: "1px solid rgba(220,110,80,0.35)", boxShadow: "0 4px 18px rgba(180,80,40,0.15)", cursor: "pointer" }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : saved ? <><Check className="w-4 h-4" /> Saved to Profile</> : <><Heart className="w-4 h-4" /> Save to Profile</>}
          </button>

          {/* Confidence bars */}
          {allScores && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(232,144,122,0.55)" }}>Confidence Scores</p>
              {Object.entries(allScores).sort((a, b) => b[1] - a[1]).map(([cls, score]) => (
                <div key={cls}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="capitalize" style={{ color: "rgba(240,190,160,0.6)" }}>{cls}</span>
                    <span style={{ color: cls === result ? "#e8907a" : "rgba(240,190,160,0.45)", fontWeight: cls === result ? 700 : 400 }}>{score}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <motion.div className="h-1.5 rounded-full" style={{ background: cls === result ? "linear-gradient(90deg, #c8a080, #e8907a)" : "rgba(255,255,255,0.12)" }} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* YouCam cross-check note — supporting signal, never the recommendation source */}
      {crossCheck && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="rounded-2xl px-5 py-4"
          style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.25)", borderLeft: "3px solid rgba(212,165,116,0.6)" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "rgba(232,180,100,0.8)" }} />
            <div className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.8)" }}>
              {crossCheck.status === "ok" ? (
                crossCheck.skin_tone?.toLowerCase() === result ? (
                  <p>
                    <span style={{ fontWeight: 700 }}>YouCam cross-check:</span> confirms{" "}
                    <span style={{ color: "var(--canvas)", fontWeight: 700 }}>{resultData.title}</span> skin tone · undertone read:{" "}
                    <span style={{ color: "var(--canvas)", fontWeight: 700 }}>{crossCheck.undertone}</span> · YouCam's skin color:{" "}
                    {crossCheck.skin_color_hex}
                  </p>
                ) : (
                  <p>
                    <span style={{ fontWeight: 700 }}>YouCam cross-check:</span> YouCam's read is {crossCheck.skin_tone}{" "}
                    (Personae's model: {resultData.title}). Personae's read is used for recommendations · undertone read:{" "}
                    {crossCheck.undertone} · YouCam's skin color: {crossCheck.skin_color_hex}
                  </p>
                )
              ) : crossCheck.status === "disabled" ? (
                <p><span style={{ fontWeight: 700 }}>YouCam cross-check:</span> disabled for this build — Personae's model result stands.</p>
              ) : (
                <p><span style={{ fontWeight: 700 }}>YouCam cross-check:</span> unavailable for this photo (face not detected or service error) — Personae's model result stands.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations card */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.18)", boxShadow: "0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,220,200,0.07)", backdropFilter: "blur(10px)" }}>
        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: "rgba(232,144,122,0.55)" }}>Characteristics</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {resultData.characteristics.map((item, i) => (
              <div key={i} className="px-3 py-2.5 rounded-xl text-xs" style={{ background: "rgba(122,48,32,0.12)", border: "1px solid rgba(220,110,80,0.15)", color: "rgba(240,190,160,0.75)", lineHeight: 1.5 }}>{item}</div>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "rgba(232,144,122,0.55)" }}>Best Colours</p>
          <div className="flex flex-wrap gap-2.5 mb-5">
            {resultData.bestColors.map((color) => (
              <div key={color.name} className="group relative">
                <div className="w-10 h-10 rounded-xl cursor-help" style={{ backgroundColor: color.hex, boxShadow: `0 4px 14px ${color.hex}44`, border: "1.5px solid rgba(255,255,255,0.1)" }} />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ background: "rgba(20,10,5,0.85)", color: "var(--canvas)" }}>{color.name}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "rgba(232,144,122,0.55)" }}>Makeup Tips</p>
          <ul className="space-y-2 mb-5">
            {resultData.makeupTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.65)" }}>
                <span style={{ color: "#e8907a", marginTop: "1px" }}>◆</span>{tip}
              </li>
            ))}
          </ul>

          <div className="p-4 rounded-2xl mb-6" style={{ background: "linear-gradient(135deg, rgba(106,72,24,0.22), rgba(122,48,32,0.16))", border: "1px solid rgba(200,150,80,0.25)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "rgba(232,180,100,0.7)" }}>Foundation Match</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.75)" }}>{resultData.foundationMatch}</p>
          </div>

          {/* ── See Full Recommendations → navigates to JewelryRecommendations page ── */}
          <button
            onClick={onViewFullRecommendations}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, rgba(122,48,32,0.35), rgba(180,80,40,0.25))",
              color: "rgba(240,190,160,0.95)",
              border: "1px solid rgba(220,110,80,0.4)",
              boxShadow: "0 4px 20px rgba(120,50,20,0.25), inset 0 1px 0 rgba(255,220,200,0.08)"
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#e8907a" }} />
            See Full Recommendations
            <ArrowRight className="w-4 h-4" style={{ color: "#e8907a" }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Tone Guide (pre-upload) ────────────────────────────────────── */
const ToneGuide = () => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,220,200,0.07)", backdropFilter: "blur(12px)" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.45), transparent)" }} />
    <div className="p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(232,144,122,0.6)" }}>Reference Guide</p>
      <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "24px" }}>Skin Tone Spectrum</h3>
      <div className="space-y-3">
        {SKIN_TONES.map((tone, i) => (
          <motion.div key={tone.name} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.35 + i * 0.07 }} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200" style={{ background: "rgba(122,48,32,0.08)", border: "1px solid rgba(220,110,80,0.12)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(122,48,32,0.18)"; e.currentTarget.style.borderColor = "rgba(220,110,80,0.28)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(122,48,32,0.08)"; e.currentTarget.style.borderColor = "rgba(220,110,80,0.12)"; }}>
            <div className="w-11 h-11 rounded-xl shrink-0" style={{ backgroundColor: tone.color, boxShadow: `0 4px 16px ${tone.color}40`, border: "1.5px solid rgba(255,255,255,0.1)" }} />
            <div className="flex-1">
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--canvas)", marginBottom: "2px" }}>{tone.name}</p>
              <p className="text-xs" style={{ color: "rgba(240,190,160,0.55)" }}>{tone.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 px-4 py-4 rounded-2xl" style={{ background: "rgba(106,72,24,0.15)", border: "1px solid rgba(200,150,80,0.2)" }}>
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(232,180,100,0.7)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.7)" }}>For best results, upload a photo in natural daylight — no filters, no heavy makeup, face fully visible.</p>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════ */
/*  Main Page                                                        */
/* ══════════════════════════════════════════════════════════════════ */
const SkinTonePage = () => {
  const navigate = useNavigate();

  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [result, setResult]                 = useState(null);
  const [previewUrl, setPreviewUrl]         = useState(null);
  const [error, setError]                   = useState(null);
  const [showCamera, setShowCamera]         = useState(false);
  const [confidence, setConfidence]         = useState(null);
  const [allScores, setAllScores]           = useState(null);
  const [saved, setSaved]                   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [crossCheck, setCrossCheck]         = useState(null);

  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const streamRef    = useRef(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setError("Camera access denied. Please allow camera permission."); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
      await sendToAPI(new File([blob], "camera_photo.jpg", { type: "image/jpeg" }));
    }, "image/jpeg");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null); setError(null); setConfidence(null); setAllScores(null); setSaved(false); setCrossCheck(null);
    await sendToAPI(file);
  };

  const sendToAPI = async (file) => {
    setIsAnalyzing(true);
    setResult(null); setError(null); setConfidence(null); setAllScores(null); setSaved(false); setCrossCheck(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Prediction failed"); }
      const data = await response.json();
      const detectedTone = data.predicted_class.toLowerCase();
      setResult(detectedTone);
      setConfidence(data.confidence);
      setAllScores(data.all_scores);
      setCrossCheck(data.youcam_cross_check || null);
      // Store in localStorage so JewelryRecommendations can also read it as fallback
      localStorage.setItem("detected_skin_tone", detectedTone);
    } catch (err) { setError(err.message); }
    finally { setIsAnalyzing(false); }
  };

  const saveToProfile = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) { setShowLoginModal(true); return; }
    if (!result) { setError("No result to save."); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch(PROFILE_URL, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: parseInt(userId), skin_tone: result }) });
      const data = await response.json();
      if (response.ok) { setSaved(true); setTimeout(() => navigate("/profile"), 800); }
      else { setError(data?.detail || data?.message || "Failed to save to profile."); }
    } catch { setError("Network error. Is Django running?"); }
    finally { setSaving(false); }
  };

  // Navigate to the full recommendations (jewelry) page, passing skin tone via state
  const handleViewFullRecommendations = () => {
    navigate("/jewelry-recommendations", { state: { skinTone: result } });
  };

  const resultData = result ? SKIN_TONE_RESULTS[result] : null;
  const resultTone = result ? SKIN_TONES.find(t => t.name.toLowerCase() === result) : null;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--espresso)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');`}</style>

      <SceneOrbs />

      {/* Login prompt modal */}
      <AnimatePresence>
        {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} onGoLogin={() => navigate("/auth")} />}
      </AnimatePresence>

      <main className="relative z-10 pt-24 lg:pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "rgba(232,144,122,0.6)" }}>Personae · AI Analysis</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontStyle: "italic", fontWeight: 400, color: "var(--canvas)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "12px" }}>
              Skin Tone Detection
            </h1>
            <p className="text-sm font-light max-w-md mx-auto" style={{ color: "rgba(240,190,160,0.55)" }}>
              Upload a clear face photo to discover your unique tone and receive personalised style guidance
            </p>
            <div className="mx-auto mt-5" style={{ width: 52, height: 1, background: "linear-gradient(90deg, transparent, #e8907a, transparent)" }} />
          </motion.div>

          <DisclaimerPanel />

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.2 }}>
              <UploadCard
                previewUrl={previewUrl} isAnalyzing={isAnalyzing} showCamera={showCamera}
                videoRef={videoRef} error={error} fileInputRef={fileInputRef}
                onFileChange={handleFileChange} onStartCamera={startCamera}
                onCapturePhoto={capturePhoto} onStopCamera={stopCamera}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {resultData
                ? <ResultPanel
                    key="result"
                    result={result}
                    resultData={resultData}
                    resultTone={resultTone}
                    allScores={allScores}
                    saving={saving}
                    saved={saved}
                    onSave={saveToProfile}
                    onViewFullRecommendations={handleViewFullRecommendations}
                    crossCheck={crossCheck}
                  />
                : <ToneGuide key="guide" />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkinTonePage;