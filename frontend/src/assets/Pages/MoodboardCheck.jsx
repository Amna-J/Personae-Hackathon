import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Image as ImageIcon, User, Sparkles, ArrowRight, RefreshCw,
  Loader2, Check, X, AlertTriangle, Info, MessageCircle, LayoutGrid, Clock, Download,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/users/style-check/";
const REQUEST_TIMEOUT_MS = 420000; // server allows ~360s; give the browser a bit more headroom

/* ── Loading stages: the pipeline genuinely takes 30–90+ seconds, so the
      loading state communicates that with time-based stage copy. ─────────── */
const LOADING_STAGES = [
  { at: 0,  label: "Reading your style profile and moodboard…" },
  { at: 12, label: "Detecting every item in your moodboard…" },
  { at: 30, label: "Matching each item against your style profile…" },
  { at: 60, label: "Rendering your virtual try-on — this is the slow part…" },
];

/* ── Result status copy (mirrors the backend status field) ──────────────── */
const STATUS_META = {
  completed: {
    icon: Check,
    title: "Your moodboard has been checked",
    desc: "The items are scored against your style profile, and the matching garment has been rendered onto your photo.",
    color: "#7ec89a",
    bg: "rgba(80,160,100,0.12)",
    border: "rgba(80,160,100,0.3)",
  },
  no_items_passed: {
    icon: AlertTriangle,
    title: "None of the items in this moodboard matched your style profile",
    desc: "Every item was scored against your recommendation. Below is exactly why each one was rejected — and the chatbot can explain what would work instead.",
    color: "#e0b060",
    bg: "rgba(201,160,92,0.12)",
    border: "rgba(201,160,92,0.35)",
  },
  no_items_detected: {
    icon: ImageIcon,
    title: "No clear items were detected in this moodboard",
    desc: "Try a cleaner flat-lay or product-style image where each item is clearly separated on a plain background.",
    color: "#e0b060",
    bg: "rgba(201,160,92,0.12)",
    border: "rgba(201,160,92,0.35)",
  },
  no_core_items: {
    icon: Info,
    title: "Items matched, but none could be rendered",
    desc: "The passing items are categories the virtual try-on can't render onto a person photo (e.g. shoes, bags, jewelry). Their match reasoning is still shown below.",
    color: "#e0b060",
    bg: "rgba(201,160,92,0.12)",
    border: "rgba(201,160,92,0.35)",
  },
  vto_skipped_no_person_photo: {
    icon: User,
    title: "Matches found — virtual try-on needs your photo",
    desc: "Upload your own full-body photo (next to the moodboard) to render the passing garments onto it. Your match results are ready below.",
    color: "#e0b060",
    bg: "rgba(201,160,92,0.12)",
    border: "rgba(201,160,92,0.35)",
  },
  vto_skipped_no_usable_references: {
    icon: AlertTriangle,
    title: "Matching items found, but the try-on couldn't crop them cleanly",
    desc: "The moodboard items matched your style, but their areas in the image couldn't be turned into clean garment references. Try a flat-lay with clearer separation between items.",
    color: "#e0b060",
    bg: "rgba(201,160,92,0.12)",
    border: "rgba(201,160,92,0.35)",
  },
  vto_failed: {
    icon: AlertTriangle,
    title: "The render engine hit an error",
    desc: "Your match results are still valid below — the virtual try-on service just failed this time. You can retry, or ask the chatbot about the results.",
    color: "#e08a70",
    bg: "rgba(180,80,60,0.12)",
    border: "rgba(220,120,90,0.35)",
  },
};

/* ── Decorative background orbs (matches the earthen analysis pages) ────── */
const SceneOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div style={{ position: "absolute", top: "8%", right: "6%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(200,100,60,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", bottom: "12%", left: "3%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle at 60% 60%, rgba(80,140,90,0.14) 0%, transparent 70%)", filter: "blur(36px)" }} />
    <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(122,48,32,0.06) 0%, transparent 65%)", filter: "blur(60px)" }} />
  </div>
);

/* ── Upload tile (moodboard or person photo) ────────────────────────────── */
/*  `accent` lets the two uploads be visually distinct so a user can't mix up
    the moodboard (warm terracotta) with the person photo (green/sage). */
const UploadTile = ({ id, icon, title, hint, preview, onSelect, required, tag, accent = {} }) => {
  const inputRef = useRef(null);
  const a = {
    color: "#e8907a",
    soft: "rgba(240,190,160,0.9)",
    hint: "rgba(240,190,160,0.5)",
    border: "rgba(220,110,80,0.3)",
    borderSoft: "rgba(220,110,80,0.2)",
    dashed: "rgba(220,110,80,0.3)",
    bgSoft: "rgba(122,48,32,0.2)",
    hairline: "rgba(232,144,122,0.5)",
    glow: "rgba(220,110,80,0.2)",
    ...accent,
  };
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)",
        border: `1px solid ${a.borderSoft}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,220,200,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${a.hairline}, transparent)` }} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: a.color }}>
            {tag}
          </span>
          {required && (
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
              style={{ background: `${a.borderSoft}`, color: a.color, border: `1px solid ${a.border}` }}>
              Required
            </span>
          )}
        </div>

        <div
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
          style={{
            aspectRatio: "1 / 1",
            background: preview ? "transparent" : "linear-gradient(145deg, rgba(42,21,10,0.6) 0%, rgba(61,32,32,0.4) 100%)",
            border: `1.5px dashed ${a.dashed}`,
            boxShadow: "inset 0 4px 24px rgba(0,0,0,0.2)",
          }}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: a.bgSoft, border: `1px solid ${a.border}`, boxShadow: `0 0 20px ${a.glow}` }}>
                {icon}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem", fontWeight: 600, color: "var(--canvas)", marginBottom: "6px" }}>
                {title}
              </p>
              <p style={{ color: a.hint, fontSize: "0.78rem" }}>{hint}</p>
            </div>
          )}
          {preview && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              className="absolute top-3 right-3 rounded-full p-1.5"
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Remove image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        <input ref={inputRef} id={id} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) onSelect(f); e.target.value = ""; }} />

        <button
          onClick={() => inputRef.current?.click()}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, rgba(200,160,128,0.18), rgba(180,120,80,0.12))",
            color: a.soft,
            border: `1px solid ${a.border}`,
          }}
        >
          <Upload className="w-3.5 h-3.5" style={{ color: a.color }} />
          {preview ? "Replace image" : "Choose image"}
        </button>
      </div>
    </div>
  );
};

/* ── Individual item verdict card ───────────────────────────────────────── */
const ItemVerdictCard = ({ item, index }) => {
  const verdict = item.verdict || {};
  const passes = Boolean(item.passes_threshold);
  const rendered = item.render_status === "rendered";
  const superseded = item.render_status === "superseded_by_higher_confidence";
  const renderFailed = item.render_status === "render_failed";
  const attrs = [item.color, item.silhouette].filter(Boolean).join(" · ");
  const confidence = verdict.confidence != null ? Math.round(verdict.confidence * 100) : null;
  const matched = Array.isArray(verdict.matched_criteria) ? verdict.matched_criteria : [];
  const mismatched = Array.isArray(verdict.mismatched_criteria) ? verdict.mismatched_criteria : [];

  // Four visual states: green "Pass" only for items actually in render_url; a
  // neutral badge for items that matched but were never rendered (unsupported
  // category or superseded by a higher-confidence item in the same body
  // region); a warm "failed" badge for core items whose render didn't complete
  // this time (retryable, not structural); red "Reject" for items that didn't
  // pass the match.
  const status = passes && rendered
    ? {
        key: "pass",
        color: "#7ec89a",
        soft: "rgba(126,200,154,0.8)",
        iconBg: "rgba(80,160,100,0.15)",
        iconBorder: "rgba(80,160,100,0.35)",
        cardBorder: "1px solid rgba(80,160,100,0.3)",
        icon: <Check className="w-4 h-4" style={{ color: "#7ec89a" }} />,
      }
    : passes
      ? {
          key: "neutral",
          color: renderFailed ? "#f2c879" : "rgba(240,200,140,0.9)",
          soft: renderFailed ? "rgba(242,200,121,0.9)" : "rgba(240,200,140,0.85)",
          iconBg: renderFailed ? "rgba(232,180,100,0.2)" : "rgba(201,160,92,0.14)",
          iconBorder: renderFailed ? "rgba(232,180,100,0.42)" : "rgba(201,160,92,0.3)",
          cardBorder: renderFailed ? "1px solid rgba(232,180,100,0.32)" : "1px solid rgba(201,160,92,0.25)",
          icon: renderFailed
            ? <AlertTriangle className="w-4 h-4" style={{ color: "#e0a04a" }} />
            : <Info className="w-4 h-4" style={{ color: "rgba(232,180,100,0.9)" }} />,
        }
      : {
          key: "reject",
          color: "#e08a70",
          soft: "rgba(232,144,122,0.65)",
          iconBg: "rgba(180,80,60,0.14)",
          iconBorder: "rgba(220,110,80,0.3)",
          cardBorder: "1px solid rgba(220,110,80,0.2)",
          icon: <X className="w-4 h-4" style={{ color: "#e08a70" }} />,
        };

  const statusLabel = !passes
    ? "Reject — doesn't fit"
    : rendered
      ? "Pass — good match"
      : superseded
        ? "Matched — another item was shown"
        : renderFailed
          ? "Matched — try-on failed this time"
          : "Matched — not shown in photo";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(249,237,232,0.05) 0%, rgba(249,237,232,0.02) 100%)",
        border: status.cardBorder,
        boxShadow: "0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,220,200,0.07)",
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: status.iconBg, border: `1px solid ${status.iconBorder}` }}>
              {status.icon}
            </div>
            <div className="min-w-0">
              {status.key === "neutral" ? (
                <span className="inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full mb-1"
                  style={{ background: status.iconBg, color: status.color, border: `1px solid ${status.iconBorder}` }}
                  title={superseded ? "A higher-confidence item in the same body region was rendered instead" : renderFailed ? "This item matched, but the try-on didn't complete this time — retrying may fix it" : "This item matched but is a category the try-on doesn't render (e.g. shoes, bag, jewelry)"}>
                  {statusLabel}
                </span>
              ) : (
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: status.soft }}>
                  {statusLabel}
                </p>
              )}
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem", fontWeight: 600, color: "var(--canvas)", lineHeight: 1.2 }}>
                {item.label || `${item.category || "item"} ${index + 1}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(240,190,160,0.55)" }}>
                <span className="capitalize">{item.category || "item"}</span>
                {attrs ? <span> · {attrs}</span> : null}
                {confidence != null ? <span> · {confidence}% confidence</span> : null}
              </p>
            </div>
          </div>
        </div>

        {matched.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(126,200,154,0.7)" }}>
              Matched criteria
            </p>
            <ul className="space-y-1">
              {matched.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.7)" }}>
                  <span style={{ color: "#7ec89a", marginTop: "1px" }}>✓</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {mismatched.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(224,138,112,0.7)" }}>
              Mismatched criteria
            </p>
            <ul className="space-y-1">
              {mismatched.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.7)" }}>
                  <span style={{ color: "#e08a70", marginTop: "1px" }}>✕</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.reasoning && (
          <div className="mt-3 px-4 py-3 rounded-xl text-xs leading-relaxed"
            style={{ background: "rgba(122,48,32,0.12)", border: "1px solid rgba(220,110,80,0.15)", color: "rgba(240,190,160,0.75)" }}>
            {verdict.reasoning}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Recommendation context card (the profile the moodboard was scored against) ── */
const RecommendationCard = ({ recommendation }) => {
  const rows = [
    ["Recommended colors", recommendation?.recommended_clothing_colors],
    ["Avoid colors", recommendation?.avoid_clothing_colors],
    ["Fitting style", recommendation?.recommended_fitting_style],
  ].filter(([, value]) => value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="relative rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.18)", boxShadow: "0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,220,200,0.07)" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "rgba(232,144,122,0.6)" }}>
          Scored against your style profile
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="px-4 py-3 rounded-2xl"
              style={{ background: "rgba(122,48,32,0.1)", border: "1px solid rgba(220,110,80,0.14)" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(232,144,122,0.6)" }}>
                {label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.8)" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
/*  Main page                                                            */
/* ══════════════════════════════════════════════════════════════════════ */
const MoodboardCheck = () => {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const [moodboardFile, setMoodboardFile] = useState(null);
  const [moodboardPreview, setMoodboardPreview] = useState(null);
  const [personFile, setPersonFile] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Elapsed timer while the pipeline is running (it's genuinely slow).
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const stage = LOADING_STAGES.reduce((acc, s) => (elapsed >= s.at ? s : acc), LOADING_STAGES[0]);

  const selectMoodboard = (file) => {
    setMoodboardFile(file);
    setMoodboardPreview(file ? URL.createObjectURL(file) : null);
    setError(null);
  };

  const selectPerson = (file) => {
    setPersonFile(file);
    setPersonPreview(file ? URL.createObjectURL(file) : null);
    setError(null);
  };

  const downloadRenderedImage = async (url) => {
    setDownloadError(null);
    const filename = `personae-outfit-${Date.now()}.jpg`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setDownloadError("The render link has expired — please re-run the style check to download the image.");
    }
  };

  const runCheck = async () => {
    setError(null);
    setResult(null);
    if (!moodboardFile) {
      setError("Please choose a moodboard image first.");
      return;
    }
    if (!personFile) {
      setError("Please upload a full-length photo of yourself — it's required for the virtual try-on.");
      return;
    }

    setLoading(true);
    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortRef.current?.abort(), REQUEST_TIMEOUT_MS);

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("moodboard_image", moodboardFile);
    formData.append("person_photo", personFile);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData, signal: abortRef.current.signal });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || `Style check failed (HTTP ${res.status}).`);
      }
      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("The style check took too long and was cancelled. Please try again with a smaller moodboard.");
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const resetAll = () => {
    setResult(null);
    setError(null);
    setMoodboardFile(null);
    setMoodboardPreview(null);
    setPersonFile(null);
    setPersonPreview(null);
  };

  const askChatbot = () => {
    if (!result) return;
    navigate("/AIchat", {
      state: {
        recommendationContext: {
          ...result.recommendation,
          itemVerdicts: result.items || [],
        },
      },
    });
  };

  const statusMeta = result ? STATUS_META[result.status] || STATUS_META.no_items_passed : null;
  const passedCount = result?.passed_item_count ?? (result?.items || []).filter((i) => i.passes_threshold).length;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--espresso)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');`}</style>
      <SceneOrbs />

      <main className="relative z-10 pt-24 lg:pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "rgba(232,144,122,0.6)" }}>
              Personae · Style Check
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontStyle: "italic", fontWeight: 400, color: "var(--canvas)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "12px" }}>
              Check a Moodboard Against Your Style
            </h1>
            <p className="text-sm font-light max-w-xl mx-auto" style={{ color: "rgba(240,190,160,0.55)" }}>
              Upload your outfit-inspiration moodboard and a full-length photo of yourself. Personae detects
              every item in the moodboard, matches each one to your style profile, and renders the passing
              garment onto your photo.
            </p>
            <div className="mx-auto mt-5" style={{ width: 52, height: 1, background: "linear-gradient(90deg, transparent, #e8907a, transparent)" }} />
          </motion.div>

          {!userId ? (
            /* ── Auth gate ── */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl overflow-hidden max-w-md mx-auto text-center"
              style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.22)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,220,200,0.1)", backdropFilter: "blur(12px)" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(122,48,32,0.2)", border: "1px solid rgba(220,110,80,0.3)", boxShadow: "0 0 24px rgba(220,110,80,0.25)" }}>
                  <User className="w-8 h-8" style={{ color: "#e8907a" }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "rgba(232,144,122,0.6)" }}>
                  Sign in required
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.6rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "10px", lineHeight: 1.2 }}>
                  Create or sign in to your profile first
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,190,160,0.6)" }}>
                  A completed style profile (skin tone, undertone, body type) is what your moodboard gets matched against.
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 6px 24px rgba(180,80,40,0.32)" }}
                >
                  Go to Sign In <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {!result && (
                <>
                  {/* ── Upload tiles ── */}
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-6 items-start mb-8"
                  >
                    <UploadTile
                      id="moodboard-upload"
                      icon={<LayoutGrid className="w-6 h-6" style={{ color: "#e8907a" }} />}
                      title="Upload a moodboard or outfit inspiration"
                      hint="Flat-lay / product-style collage — items laid out clearly for detection"
                      tag="Moodboard"
                      required
                      preview={moodboardPreview}
                      onSelect={selectMoodboard}
                    />
                    <UploadTile
                      id="person-upload"
                      icon={<User className="w-6 h-6" style={{ color: "#7ec89a" }} />}
                      title="Upload a full-length photo of yourself"
                      hint="Standing full-body shot, plain background — becomes the try-on photo"
                      tag="Your photo"
                      required
                      preview={personPreview}
                      onSelect={selectPerson}
                      accent={{
                        color: "#7ec89a",
                        soft: "rgba(126,200,154,0.9)",
                        hint: "rgba(160,220,180,0.55)",
                        border: "rgba(126,200,154,0.35)",
                        borderSoft: "rgba(126,200,154,0.22)",
                        dashed: "rgba(126,200,154,0.35)",
                        bgSoft: "rgba(30,80,50,0.25)",
                        hairline: "rgba(126,200,154,0.5)",
                        glow: "rgba(126,200,154,0.25)",
                      }}
                    />
                  </motion.div>

                  {/* ── Guidance note ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-8 flex gap-3 items-start rounded-2xl px-5 py-4"
                    style={{ background: "rgba(201,160,92,0.08)", border: "1px solid rgba(201,160,92,0.22)" }}
                  >
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "rgba(232,180,100,0.8)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.75)" }}>
                      <strong>Both uploads are required.</strong> Use a <strong>flat-lay or product-style moodboard</strong> —
                      items laid out on a plain background, not a photo of a person wearing clothes (the garment crops come
                      straight from that image). Your <strong>full-length photo</strong> is used only for this virtual try-on —
                      like the rest of the app, it's processed on the spot and never stored. This check takes
                      <strong> 30–90+ seconds</strong> (decomposition, matching, and rendering).
                    </p>
                  </motion.div>

                  {/* ── Run button ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="text-center"
                  >
                    <button
                      onClick={runCheck}
                      disabled={loading}
                      className="inline-flex items-center gap-2 py-3.5 px-10 rounded-2xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)",
                        color: "#fff",
                        border: "1px solid rgba(220,160,100,0.4)",
                        boxShadow: "0 6px 24px rgba(180,80,40,0.32)",
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Run Style Check
                    </button>
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 mx-auto max-w-lg px-5 py-3 rounded-xl text-sm"
                        style={{ background: "rgba(180,40,30,0.15)", border: "1px solid rgba(220,80,60,0.3)", color: "rgba(255,160,140,0.9)" }}>
                        ⚠ {error}
                      </motion.p>
                    )}
                  </motion.div>
                </>
              )}

              {/* ── Loading state ── */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-3xl overflow-hidden max-w-2xl mx-auto"
                  style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,220,200,0.1)", backdropFilter: "blur(12px)" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
                  <div className="p-10 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ background: "rgba(220,110,80,0.12)", boxShadow: "0 0 30px rgba(220,110,80,0.35)", border: "1px solid rgba(220,110,80,0.25)" }}>
                      <Loader2 className="w-9 h-9 animate-spin" style={{ color: "#e8907a" }} />
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.35rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "14px" }}
                      >
                        {stage.label}
                      </motion.p>
                    </AnimatePresence>

                    <div className="flex items-center justify-center gap-2 mb-6">
                      <Clock className="w-3.5 h-3.5" style={{ color: "rgba(240,190,160,0.5)" }} />
                      <span className="text-xs" style={{ color: "rgba(240,190,160,0.6)" }}>
                        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
                      </span>
                    </div>

                    <div className="mx-auto max-w-sm rounded-full h-1.5 mb-6" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (elapsed / 90) * 100)}%`, background: "linear-gradient(90deg, #c8a080, #e8907a)" }} />
                    </div>

                    <div className="mx-auto max-w-sm px-5 py-4 rounded-2xl"
                      style={{ background: "rgba(201,160,92,0.1)", border: "1px solid rgba(201,160,92,0.25)" }}>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.85)" }}>
                        This usually takes <strong>30–90+ seconds</strong> — item detection, per-item style matching, and the
                        virtual try-on all run back-to-back. Please keep this tab open.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Results ── */}
              {result && statusMeta && (
                <div className="space-y-6">
                  {/* Status banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl overflow-hidden"
                    style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.border}` }}
                  >
                    <div className="flex items-start gap-4 p-6">
                      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${statusMeta.border}` }}>
                        <statusMeta.icon className="w-5 h-5" style={{ color: statusMeta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.35rem", fontStyle: "italic", fontWeight: 600, color: "var(--canvas)", lineHeight: 1.2, marginBottom: "6px" }}>
                          {statusMeta.title}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(240,190,160,0.72)" }}>
                          {statusMeta.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* VTO render */}
                  {result.render_url && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative rounded-3xl overflow-hidden"
                      style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.06) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,220,200,0.1)", backdropFilter: "blur(12px)" }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
                      <div className="p-7">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(80,160,100,0.15)", border: "1px solid rgba(80,160,100,0.3)" }}>
                            <Check className="w-4 h-4" style={{ color: "#7ec89a" }} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(126,200,154,0.8)" }}>
                              Virtual Try-On Result
                            </p>
                            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.2rem", fontStyle: "italic", color: "var(--canvas)", lineHeight: 1.2 }}>
                              See yourself in the matched outfit
                            </p>
                          </div>
                          <button
                            onClick={() => downloadRenderedImage(result.render_url)}
                            className="ml-auto inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "rgba(249,237,232,0.06)", color: "rgba(240,190,160,0.85)", border: "1px solid rgba(220,110,80,0.25)" }}
                            title="Download rendered image"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                        {downloadError && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 inline-flex items-center gap-1.5 text-xs"
                            style={{ color: "rgba(255,160,140,0.9)" }}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {downloadError}
                          </motion.p>
                        )}
                        <div className="relative rounded-2xl overflow-hidden"
                          style={{ border: "1px solid rgba(220,110,80,0.25)", boxShadow: "0 16px 48px rgba(0,0,0,0.35)" }}>
                          <img src={result.render_url} alt="Virtual try-on result" className="w-full h-auto max-h-[70vh] object-contain" style={{ background: "var(--espresso)" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendation context */}
                  <RecommendationCard recommendation={result.recommendation} />

                  {/* Item verdicts */}
                  {result.items && result.items.length > 0 && (
                    <div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(232,144,122,0.6)" }}>
                          Item-by-item results
                        </p>
                        <p className="text-sm mt-1" style={{ color: "rgba(240,190,160,0.6)" }}>
                          {passedCount} of {result.items.length} items passed your style profile.
                        </p>
                      </motion.div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {result.items.map((item, i) => (
                          <ItemVerdictCard key={i} item={item} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat + retry actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
                  >
                    <button
                      onClick={askChatbot}
                      className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 6px 24px rgba(180,80,40,0.32)" }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask Personae about these results
                    </button>
                    <button
                      onClick={resetAll}
                      className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                      style={{ background: "rgba(249,237,232,0.06)", color: "rgba(240,190,160,0.85)", border: "1px solid rgba(220,110,80,0.25)" }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Check another moodboard
                    </button>
                  </motion.div>
                </div>
              )}

              {/* Error shown above run button; also surface here if a result attempt errored */}
              {error && !loading && !result && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 mx-auto max-w-lg px-5 py-3 rounded-xl text-sm text-center"
                  style={{ background: "rgba(180,40,30,0.15)", border: "1px solid rgba(220,80,60,0.3)", color: "rgba(255,160,140,0.9)" }}>
                  ⚠ {error}
                </motion.p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MoodboardCheck;
