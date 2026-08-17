
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";

const SECTION_META = {
  recommended_clothing_colors: {
    label: "Your Colors",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.25)",
  },
  avoid_clothing_colors: {
    label: "Avoid These",
    accent: "var(--terracotta)",
    bg: "rgba(168,101,79,0.06)",
    border: "rgba(168,101,79,0.2)",
  },
  recommended_fitting_style: {
    label: "Fitting Style",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.25)",
  },
  recommended_materials: {
    label: "Materials",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.22)",
  },
  recommended_patterns: {
    label: "Patterns",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.25)",
  },
  recommended_jewelry_metal: {
    label: "Jewelry Metal",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.1)",
    border: "rgba(208,135,112,0.3)",
  },
  recommended_color_wheel_region: {
    label: "Color Wheel — Go For",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.25)",
  },
  avoid_color_wheel_region: {
    label: "Color Wheel — Avoid",
    accent: "var(--terracotta)",
    bg: "rgba(168,101,79,0.06)",
    border: "rgba(168,101,79,0.18)",
  },
  do_exaggerate: {
    label: "Exaggerate",
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.25)",
  },
  dont_exaggerate: {
    label: "Tone Down",
    accent: "var(--terracotta)",
    bg: "rgba(168,101,79,0.06)",
    border: "rgba(168,101,79,0.18)",
  },
};

const DISPLAY_ORDER = [
  "recommended_clothing_colors",
  "avoid_clothing_colors",
  "recommended_fitting_style",
  "recommended_materials",
  "recommended_patterns",
  "recommended_jewelry_metal",
  "recommended_color_wheel_region",
  "avoid_color_wheel_region",
  "do_exaggerate",
  "dont_exaggerate",
];

const RecommendationCard = ({ field, value, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const meta = SECTION_META[field] || {
    label: field.replace(/_/g, " "),
    accent: "var(--terracotta-soft)",
    bg: "rgba(208,135,112,0.08)",
    border: "rgba(208,135,112,0.2)",
  };

  const tags = String(value)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 12,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: meta.accent,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {meta.label}
      </p>

      {tags.length > 1 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
          {tags.map((tag, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.05 + i * 0.04 + 0.15, duration: 0.28 }}
              className="text-black"
              style={{
                fontSize: 13,
                padding: "4px 12px",
                borderRadius: 100,
                background: "transparent",
                border: `1px solid ${meta.border}`,
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      ) : (
        <p
          className="text-black"
          style={{
            fontSize: 16,
            marginTop: 2,
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {value}
        </p>
      )}
    </motion.div>
  );
};

const ProfileChip = ({ label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "10px 20px",
      background: "rgba(206,146,126,0.08)",
      border: "1px solid rgba(206,146,126,0.25)",
      borderRadius: 10,
      minWidth: 90,
    }}
  >
    <span
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--terracotta-soft)",
        fontWeight: 600,
        marginBottom: 4,
      }}
    >
      {label}
    </span>
    <span className="text-black" style={{ fontSize: 14, fontWeight: 500 }}>
      {value}
    </span>
  </motion.div>
);

const ConfidenceMeter = ({ confidence }) => {
  const pct = Math.round((confidence || 0) * 100);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
        className="text-gray-600"
      >
        <span>Match Confidence</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          style={{ color: "var(--terracotta-soft)", fontWeight: 600 }}
        >
          {pct}%
        </motion.span>
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(206,146,126,0.15)",
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", background: "var(--terracotta-soft)", borderRadius: 100 }}
        />
      </div>
    </div>
  );
};

const ResultsPage = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:8000/api/users/recommendations/?user_id=${user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) setError(data.detail);
        else setRecommendations(data.recommendations);
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      });
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1.5px solid rgba(206,146,126,0.2)",
            borderTopColor: "var(--terracotta-soft)",
          }}
        />
        <p className="text-gray-600 text-sm tracking-widest uppercase">
          Curating your style…
        </p>
      </div>
    );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error)
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-black text-lg font-medium max-w-sm"
        >
          {error}
        </motion.p>
        <button
          onClick={() => navigate("/analyze")}
          className="btn border-none" style={{ backgroundColor: "var(--terracotta)", color: "var(--canvas)" }}
        >
          Complete Your Analysis
        </button>
      </div>
    );

  const r = recommendations || {};

  return (
    <div className="min-h-screen bg-base-100 relative overflow-hidden">
      {/* Background blobs — matching AuthPage */}
      <div className="absolute top-20 left-[-60px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "rgba(206,146,126,0.08)", filter: "blur(60px)" }} />
      <div className="absolute bottom-20 right-[-80px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "rgba(206,146,126,0.06)", filter: "blur(80px)" }} />

      <div
        className="relative z-10 max-w-3xl mx-auto"
        style={{ padding: "96px 24px 80px" }}
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <p
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--terracotta-soft)" }}
          >
            Personae · Style Profile
          </p>
          <h1 className="text-black text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Discover Your{" "}
            <span style={{ color: "var(--terracotta-soft)" }}>Perfect Style</span>
          </h1>
          <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
            Curated for your unique combination of tone, shade &amp; shape
          </p>
        </motion.div>

        {/* ── Profile chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 justify-center mb-6"
        >
          {r.skin_tone  && <ProfileChip label="Skin Tone"  value={r.skin_tone}  delay={0.25} />}
          {r.under_tone && <ProfileChip label="Undertone"  value={r.under_tone} delay={0.32} />}
          {r.body_shape && <ProfileChip label="Body Shape" value={r.body_shape} delay={0.39} />}
        </motion.div>

        {/* ── Confidence bar ── */}
        {r.confidence != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{
              maxWidth: 400,
              margin: "0 auto 40px",
              padding: "14px 18px",
              background: "rgba(206,146,126,0.06)",
              border: "1px solid rgba(206,146,126,0.18)",
              borderRadius: 10,
            }}
          >
            <ConfidenceMeter confidence={r.confidence} />
          </motion.div>
        )}

        {/* ── Divider ── */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: 1,
            background: "rgba(206,146,126,0.25)",
            marginBottom: 32,
            transformOrigin: "center",
          }}
        />

        {/* ── Cards grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {DISPLAY_ORDER.map((field, i) =>
            r[field] ? (
              <RecommendationCard key={field} field={field} value={r[field]} index={i} />
            ) : null
          )}
        </div>

        {/* ── Moodboard check CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
          style={{ marginTop: 40 }}
        >
          <button
            onClick={() => navigate("/moodboard-check")}
            className="btn border-none"
            style={{ backgroundColor: "var(--terracotta)", color: "var(--canvas)", padding: "12px 28px", fontSize: 14, fontWeight: 600 }}
          >
            Check a Moodboard Against My Style
          </button>
          <p className="text-gray-600 text-sm mt-3">
            Upload a flat-lay moodboard plus a full-length photo of yourself — Personae scores each item and renders the matching garment on your photo.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;