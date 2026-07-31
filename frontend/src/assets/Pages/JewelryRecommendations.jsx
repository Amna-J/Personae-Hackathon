import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Sparkles, ChevronLeft, ChevronRight, X, Gem, Info } from "lucide-react";
import { JEWELRY_MAP, SKIN_TONES, SKIN_TONE_RESULTS } from "../../Data/SkinToneData";

/* ─── Helper: group looks array by label ─────────────────────────── */
const groupByLabel = (looks) => {
  const groups = [];
  const seen = {};
  looks.forEach((look) => {
    if (seen[look.label] === undefined) {
      seen[look.label] = groups.length;
      groups.push({ label: look.label, images: [look.img] });
    } else {
      groups[seen[look.label]].images.push(look.img);
    }
  });
  return groups;
};

const JewelryRecommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxGroup, setLightboxGroup] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxLabel, setLightboxLabel] = useState("");
  const [showMetalGuide, setShowMetalGuide] = useState(false);

  const skinTone = location.state?.skinTone || localStorage.getItem("detected_skin_tone");
  const jewelryData = skinTone ? JEWELRY_MAP[skinTone] : null;
  const skinToneInfo = SKIN_TONES.find(t => t.name.toLowerCase() === skinTone);

  useEffect(() => {
    if (!skinTone || !jewelryData) navigate("/skin-tone");
  }, [skinTone, jewelryData, navigate]);

  /* ── Lightbox helpers ── */
  const openLightbox = (groupImages, index, label) => {
    setLightboxGroup(groupImages);
    setLightboxIndex(index);
    setSelectedImage(groupImages[index]);
    setLightboxLabel(label);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setLightboxGroup([]);
    setLightboxIndex(0);
    setLightboxLabel("");
  };

  const goNext = () => {
    const next = lightboxIndex + 1;
    if (next < lightboxGroup.length) {
      setLightboxIndex(next);
      setSelectedImage(lightboxGroup[next]);
    }
  };

  const goPrev = () => {
    const prev = lightboxIndex - 1;
    if (prev >= 0) {
      setLightboxIndex(prev);
      setSelectedImage(lightboxGroup[prev]);
    }
  };

  if (!jewelryData || !skinToneInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--espresso)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(220,110,80,0.12)" }}>
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#e8907a", borderTopColor: "transparent" }} />
          </div>
          <p style={{ color: "rgba(240,190,160,0.75)" }}>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  const groups = groupByLabel(jewelryData.looks);

  // Get the primary metal image - use the first image from the first category that matches the primary metal
  const getPrimaryMetalImage = () => {
    // Look for an image that matches the primary metal name in its label
    const primaryMetalLower = jewelryData.primaryMetal.toLowerCase();
    for (const look of jewelryData.looks) {
      if (look.label.toLowerCase().includes(primaryMetalLower)) {
        return look.img;
      }
    }
    // Fallback to the first image in the first category
    if (jewelryData.looks.length > 0) {
      return jewelryData.looks[0].img;
    }
    return jewelryData.featured;
  };

  const primaryMetalImage = getPrimaryMetalImage();

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--espresso)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');`}</style>

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "8%", right: "6%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(200,100,60,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "3%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle at 60% 60%, rgba(80,140,90,0.14) 0%, transparent 70%)", filter: "blur(36px)" }} />
        <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(122,48,32,0.06) 0%, transparent 65%)", filter: "blur(60px)" }} />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-24 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:opacity-80"
        style={{ background: "rgba(249,237,232,0.08)", border: "1px solid rgba(220,110,80,0.25)", backdropFilter: "blur(8px)" }}
      >
        <ArrowLeft className="w-4 h-4" style={{ color: "#e8907a" }} />
        <span className="text-sm" style={{ color: "rgba(240,190,160,0.8)" }}>Back</span>
      </button>

      <main className="relative z-10 pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "rgba(232,144,122,0.6)" }}>
              Personae · Personalised Styling
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontStyle: "italic", fontWeight: 400, color: "var(--canvas)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "12px" }}>
              Jewelry Recommendations
            </h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: skinToneInfo.color, boxShadow: `0 0 20px ${skinToneInfo.color}55` }} />
              <p className="text-sm" style={{ color: "rgba(240,190,160,0.7)" }}>
                Based on your <span style={{ color: "var(--canvas)", fontWeight: 600 }}>{skinToneInfo.name}</span> skin tone
              </p>
            </div>
            <div className="mx-auto mt-5" style={{ width: 52, height: 1, background: "linear-gradient(90deg, transparent, #e8907a, transparent)" }} />
          </motion.div>

          {/* ── Main Recommendation Card with Primary Metal Image ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden mb-12"
            style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.07) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.22)", backdropFilter: "blur(12px)" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
            <div className="p-8">

              {/* Horizontal: image left, text right */}
              <div className="flex flex-col sm:flex-row gap-7 items-stretch">
                {/* Featured image - now showing actual primary metal jewelry */}
                <div className="w-full sm:w-72 md:w-80 shrink-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden cursor-pointer" 
                    style={{ border: "1px solid rgba(220,110,80,0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", minHeight: "220px" }}
                    onClick={() => {
                      // Find all images that match this metal type and open in lightbox
                      const matchingImages = jewelryData.looks
                        .filter(look => look.label.toLowerCase().includes(jewelryData.primaryMetal.toLowerCase()))
                        .map(look => look.img);
                      if (matchingImages.length > 0) {
                        openLightbox(matchingImages, 0, jewelryData.primaryMetal);
                      } else if (jewelryData.looks.length > 0) {
                        const firstGroup = groupByLabel(jewelryData.looks)[0];
                        if (firstGroup) {
                          openLightbox(firstGroup.images, 0, firstGroup.label);
                        }
                      }
                    }}
                  >
                    <img
                      src={primaryMetalImage}
                      alt={jewelryData.primaryMetal}
                      style={{ width: "100%", height: "100%", minHeight: "220px", objectFit: "cover", objectPosition: "center", display: "block" }}
                    />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-5 h-5" style={{ color: "#e8907a" }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(232,144,122,0.6)" }}>Your Perfect Match</p>
                    </div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.8rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "16px", lineHeight: 1.2 }}>
                      {jewelryData.primaryMetal}
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,190,160,0.7)" }}>
                      {jewelryData.why}
                    </p>
                  </div>
                  <div>
                    <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(180,40,30,0.1)", border: "1px solid rgba(220,80,60,0.2)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#e8907a" }}>✕ Avoid</p>
                      <p className="text-sm" style={{ color: "rgba(240,190,160,0.6)" }}>{jewelryData.avoid}</p>
                    </div>
                    <button
                      onClick={() => setShowMetalGuide(v => !v)}
                      className="flex items-center gap-2 text-xs transition-all hover:opacity-80"
                      style={{ color: "rgba(232,144,122,0.7)" }}
                    >
                      <Info className="w-3.5 h-3.5" />
                      {showMetalGuide ? "Hide metal guide" : "Why these metals?"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Metal guide expanded */}
              <AnimatePresence>
                {showMetalGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 p-5 rounded-xl overflow-hidden"
                    style={{ background: "rgba(200,160,128,0.08)", border: "1px solid rgba(220,110,80,0.2)" }}
                  >
                    <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--canvas)" }}>Metal Compatibility Guide</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.7)" }}>
                      {skinTone === "fair" && "Fair skin with warm undertones glows beautifully in yellow and rose gold. These metals enhance your natural warmth without overwhelming your delicate complexion."}
                      {skinTone === "medium" && "Medium skin tones have the versatility to wear both warm and cool metals, but antique bronze and matte copper create an especially harmonious, grounded look that complements your natural warmth."}
                      {skinTone === "dark" && "Dark skin tones carry rich warmth that pairs exquisitely with matte silver and mixed metals. These finishes provide beautiful contrast without competing with your natural radiance."}
                      {skinTone === "black" && "Deep skin tones achieve maximum impact with high-polish silver and black rhodium. These bold finishes create stunning contrast and let your complexion take center stage."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Gallery — grouped by category ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>

            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(232,144,122,0.6)" }}>Style Gallery</p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.3rem", fontStyle: "italic", color: "var(--canvas)" }}>
                  Inspiration Looks
                </h3>
              </div>
              <Sparkles className="w-5 h-5" style={{ color: "rgba(232,180,100,0.6)" }} />
            </div>

            {/* One section per category */}
            <div className="space-y-12">
              {groups.map((group, gi) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.07 * gi }}
                >
                  {/* Category divider label — shown ONCE per group */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(220,110,80,0.3))" }} />
                    <span
                      className="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.16em] shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(122,48,32,0.28), rgba(80,32,16,0.2))",
                        border: "1px solid rgba(220,110,80,0.35)",
                        color: "#e8907a",
                        boxShadow: "0 2px 12px rgba(180,70,30,0.18)",
                      }}
                    >
                      {group.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(220,110,80,0.3), transparent)" }} />
                  </div>

                  {/* Images — square grid, no captions */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.images.map((img, ii) => (
                      <motion.div
                        key={ii}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.32, delay: 0.04 * ii }}
                        className="group cursor-pointer"
                        onClick={() => openLightbox(group.images, ii, group.label)}
                      >
                        <div
                          className="relative rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl"
                          style={{ border: "1px solid rgba(220,110,80,0.2)", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
                        >
                          <img
                            src={img}
                            alt={group.label}
                            className="w-full aspect-square object-cover"
                          />
                          {/* Subtle hover shine — no text label */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: "linear-gradient(135deg, rgba(232,144,122,0.1), rgba(0,0,0,0.28))" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Styling Tips ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="mt-14">
            <div className="relative rounded-2xl overflow-hidden p-6" style={{ background: "linear-gradient(135deg, rgba(106,72,24,0.15), rgba(122,48,32,0.1))", border: "1px solid rgba(200,150,80,0.2)" }}>
              <div className="flex items-start gap-3">
                <Gem className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#e8907a" }} />
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--canvas)" }}>Styling Tips for Your Skin Tone</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.7)" }}>
                    {skinTone === "fair" && "✨ Layer delicate chains in mixed lengths • Pair rose gold with soft pinks and lavenders • Yellow gold pops against jewel tones • Avoid chunky silver pieces that overwhelm"}
                    {skinTone === "medium" && "✨ Mix antique bronze with earthy tones like olive and rust • Matte finishes create sophisticated depth • Layer different textures for visual interest • Copper tones complement warm neutrals"}
                    {skinTone === "dark" && "✨ Matte silver creates elegant contrast with jewel tones • Mixed metals add versatility to any outfit • Statement pieces look balanced and intentional • Avoid overly yellow gold that can appear muddy"}
                    {skinTone === "black" && "✨ High-polish silver creates dramatic impact • Black rhodium adds edgy sophistication • Layer multiple pieces for bold statements • Pure white metals pop against deep complexions"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Action Buttons ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/profile")}
              className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 6px 24px rgba(180,80,40,0.32)" }}
            >
              Save to My Profile
            </button>
            <button
              onClick={() => navigate("/skin-tone")}
              className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:opacity-80"
              style={{ background: "rgba(249,237,232,0.08)", color: "rgba(240,190,160,0.85)", border: "1px solid rgba(220,110,80,0.3)" }}
            >
              Retake Analysis
            </button>
          </motion.div>

          {/* Makeup Recommendations Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="mt-6 flex justify-center">
            <button
              onClick={() => navigate("/makeup-recommendations", { state: { skinTone: skinTone } })}
              className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:opacity-90 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, rgba(200,100,80,0.8) 0%, rgba(180,70,50,0.8) 100%)", color: "#fff", border: "1px solid rgba(220,110,80,0.4)", boxShadow: "0 6px 24px rgba(180,80,40,0.2)" }}
            >
              <Sparkles className="w-4 h-4" />
              Makeup Recommendations
            </button>
          </motion.div>
        </div>
      </main>

      {/* ── Lightbox — Full size image with proper aspect ratio ── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Prev / Next — within same category group */}
            {lightboxGroup.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  disabled={lightboxIndex === 0}
                  className="absolute left-6 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  disabled={lightboxIndex === lightboxGroup.length - 1}
                  className="absolute right-6 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full flex flex-col items-center px-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full size image - no cropping, shows complete image */}
              <img
                src={selectedImage}
                alt={lightboxLabel}
                className="rounded-xl max-w-full max-h-[85vh] object-contain"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "90vw",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  display: "block",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                }}
              />

              {/* Category label + counter */}
              <div className="mt-5 flex items-center gap-3">
                <span
                  className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ background: "rgba(122,48,32,0.45)", border: "1px solid rgba(220,110,80,0.4)", color: "#e8907a" }}
                >
                  {lightboxLabel}
                </span>
                {lightboxGroup.length > 1 && (
                  <span className="text-xs" style={{ color: "rgba(240,190,160,0.4)" }}>
                    {lightboxIndex + 1} / {lightboxGroup.length}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JewelryRecommendations;