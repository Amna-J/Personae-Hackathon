
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const PROFILE_URL = "http://localhost:8000/api/users/profile/";

const traitMeta = {
  "Skin Tone":  { emoji: "🎨", accent: "var(--taupe)",                key: "skin_tone" },
  "Undertone":  { emoji: "✨", accent: "var(--terracotta-soft)",     key: "undertone" },
  "Body Type":  { emoji: "🌿", accent: "var(--state-success-accent)", key: "body_type" },
  "Face Shape": { emoji: "💎", accent: "var(--state-info-accent)",   key: "face_shape" },
};

const ORDER_KEY = "trait_completion_order";

function getTraitOrder() {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || []; }
  catch { return []; }
}

function updateTraitOrder(prevData, nextData) {
  const order = getTraitOrder();
  const keys = ["skin_tone", "undertone", "body_type", "face_shape"];
  keys.forEach((key) => {
    const wasEmpty = !prevData?.[key] || prevData[key] === "-";
    const nowFilled = nextData?.[key] && nextData[key] !== "-";
    if (wasEmpty && nowFilled && !order.includes(key)) order.push(key);
  });
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  return order;
}

function sortTraitsByCompletion(traits, order) {
  const keyOf = (label) => traitMeta[label]?.key;
  return [...traits].sort((a, b) => {
    const ai = order.indexOf(keyOf(a.label));
    const bi = order.indexOf(keyOf(b.label));
    const aFilled = ai !== -1;
    const bFilled = bi !== -1;
    if (aFilled && bFilled) return ai - bi;
    if (aFilled) return -1;
    if (bFilled) return 1;
    return 0;
  });
}

const TraitCard = ({ label, value, index }) => {
  const meta = traitMeta[label];
  const isEmpty = !value || value === "-";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="rounded-2xl p-5 shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: isEmpty ? "#f5f0ed" : `${meta?.accent}22` }}
        >
          {meta?.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-espresso-soft mb-0.5">
            {label}
          </p>
          <p className={`text-sm font-semibold capitalize truncate ${isEmpty ? "profile-trait-empty-value" : "profile-trait-filled-value"}`}>
            {isEmpty ? "Not analyzed yet" : value}
          </p>
        </div>
        {!isEmpty && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${meta?.accent}20` }}
          >
            <Check className="w-3.5 h-3.5" style={{ color: meta?.accent }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const InfoRow = ({ label, value, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, delay: 0.5 + index * 0.06 }}
    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
  >
    <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-espresso-soft">
      {label}
    </span>
    <span className="text-sm font-medium profile-info-value">{value}</span>
  </motion.div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [traitOrder, setTraitOrder] = useState(getTraitOrder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) { navigate("/auth"); return; }

    const prevData = (() => {
      try { return JSON.parse(localStorage.getItem("prev_trait_snapshot")); } catch { return null; }
    })();

    fetch(`${PROFILE_URL}?user_id=${userId}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => {
        const newOrder = updateTraitOrder(prevData, data);
        setTraitOrder(newOrder);
        localStorage.setItem("prev_trait_snapshot", JSON.stringify({
          skin_tone:  data.skin_tone,
          undertone:  data.undertone,
          body_type:  data.body_type,
          face_shape: data.face_shape,
        }));
        setUserData(data);
      })
      .catch(() => {
        setUserData({
          username:   localStorage.getItem("username") || "User",
          email:      localStorage.getItem("email") || "",
          undertone:  "-", skin_tone: "-", body_type: "-", face_shape: "-",
        });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg profile-spinner" />
      </div>
    );
  }

  const name      = userData?.username   || "User";
  const email     = userData?.email      || "";
  const undertone = userData?.undertone  || "-";
  const skinTone  = userData?.skin_tone  || "-";
  const bodyType  = userData?.body_type  || "-";
  const faceShape = userData?.face_shape || "-";

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const rawTraits = [
    { label: "Skin Tone",  value: skinTone  },
    { label: "Undertone",  value: undertone },
    { label: "Body Type",  value: bodyType  },
    { label: "Face Shape", value: faceShape },
  ];

  const aiTraits = sortTraitsByCompletion(rawTraits, traitOrder);
  const analyzedCount = aiTraits.filter(t => t.value && t.value !== "-").length;

  return (
    <div className="min-h-screen bg-base-100">

      {/* Soft pastel blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="profile-bg-blob-tr" />
        <div className="profile-bg-blob-bl" />
        <div className="profile-bg-blob-center" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-sm text-espresso-soft hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <span className="text-lg font-bold tracking-wide text-black">Personae</span>
          <button
            onClick={() => { localStorage.clear(); navigate("/"); }}
            className="flex items-center gap-1.5 text-sm text-espresso-soft hover:text-black transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-12">

        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <div className="relative inline-flex mb-6">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white profile-avatar">
              {initials}
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: analyzedCount === 4 ? "var(--state-success-accent)" : "var(--taupe)" }}
            />
          </div>

          <h1 className="text-4xl font-bold text-black mb-1">{name}</h1>
          <p className="text-sm text-espresso-soft">{email}</p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-semibold shadow-sm border"
            style={{
              backgroundColor: analyzedCount === 4 ? "var(--state-success-bg)" : "var(--canvas)",
              color: analyzedCount === 4 ? "var(--state-success-accent)" : "var(--terracotta-deep)",
              borderColor: analyzedCount === 4 ? "var(--state-success-accent)" : "var(--taupe)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {analyzedCount === 4 ? "Style Profile Complete ✓" : `${analyzedCount} of 4 analyses complete`}
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-semibold text-espresso-soft mb-3">
            <span>Style Analysis Progress</span>
            <span>{analyzedCount}/4 Complete</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full profile-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${(analyzedCount / 4) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {aiTraits.map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: (!t.value || t.value === "-") ? "rgba(184,168,138,0.25)" : "var(--taupe)" }}
                />
                <span className="text-[9px] text-espresso-soft hidden sm:block">{t.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Trait Cards */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-espresso-soft mb-3">
            AI Style Analysis
          </p>
          <div className="grid grid-cols-2 gap-3">
            {aiTraits.map((trait, i) => (
              <TraitCard key={trait.label} {...trait} index={i} />
            ))}
          </div>
        </div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 mb-6"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-espresso-soft mb-3">
            Account Details
          </p>
          {[
            { label: "Full Name",    value: name },
            { label: "Email",        value: email || "—" },
            { label: "Member Since", value: memberSince },
          ].map((item, i) => (
            <InfoRow key={item.label} {...item} index={i} />
          ))}
        </motion.div>

        {/* CTA if incomplete */}
        <AnimatePresence>
          {analyzedCount < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              className="rounded-2xl p-6 text-center shadow-sm profile-cta-box"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 profile-cta-icon-bg">
                <Sparkles className="w-6 h-6 profile-cta-sparkle" />
              </div>
              <p className="text-sm font-bold text-black mb-1">Complete your style profile</p>
              <p className="text-xs text-espresso-soft mb-4">
                Run all 4 analyses to unlock your full persona
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 shadow-sm profile-cta-link"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Explore Analyses
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default ProfilePage;
