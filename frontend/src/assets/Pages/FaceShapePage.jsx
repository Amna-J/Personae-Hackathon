import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronRight, ArrowRight, Sparkles, Camera, Upload, Loader2, X, Heart, Video, SwitchCamera, AlertTriangle } from "lucide-react";
import Button from "../../Components/Button";
import { FACE_SHAPES } from "../../data/FaceShapeData";

const API_URL = "http://localhost:8000/api/predict/face-shape/";
const PROFILE_URL = "http://localhost:8000/api/users/profile/";

/* ── Lightbox ───────────────────────────────────────────────────── */
const Lightbox = ({ src, alt, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(10,5,3,0.92)", backdropFilter: "blur(12px)" }}
    onClick={onClose}
  >
    <button
      className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
      style={{ background: "rgba(220,110,80,0.2)", border: "1px solid rgba(220,110,80,0.35)" }}
      onClick={onClose}
    >
      <X className="w-5 h-5" style={{ color: "#e8907a" }} />
    </button>
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-[90vh] object-contain rounded-2xl"
      style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(220,110,80,0.2)" }}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

/* ── Camera Modal ───────────────────────────────────────────────── */
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [countdown, setCountdown] = useState(null);
  const [error, setCameraError] = useState(null);

  const startCamera = useCallback(async (mode = "user") => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setIsReady(false);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setIsReady(true); };
      }
    } catch {
      setCameraError("Camera access denied or not available. Please allow camera permissions and try again.");
    }
  }, []);

  const startedRef = useRef(false);
  if (!startedRef.current) { startedRef.current = true; setTimeout(() => startCamera(facingMode), 0); }

  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); }, []);

  const handleFlip = async () => { const next = facingMode === "user" ? "environment" : "user"; setFacingMode(next); await startCamera(next); };

  const handleCapture = () => {
    if (!isReady || !videoRef.current || !canvasRef.current) return;
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(timer); setCountdown(null);
        const video = videoRef.current; const canvas = canvasRef.current;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          onCapture(file, URL.createObjectURL(blob));
        }, "image/jpeg", 0.92);
      } else { setCountdown(count); }
    }, 1000);
  };

  const handleClose = () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,5,3,0.92)", backdropFilter: "blur(10px)" }}>
      <div className="relative rounded-3xl overflow-hidden w-full max-w-lg" style={{ backgroundColor: "var(--espresso)", border: "1px solid rgba(184,168,138,0.25)", boxShadow: "var(--shadow-dark-modal)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.6), transparent)" }} />

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(220,110,80,0.15)" }}>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" style={{ color: "#e8907a" }} />
            <span className="text-sm font-semibold tracking-wider" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "var(--canvas)" }}>Live Camera</span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(220,110,80,0.1)", border: "1px solid rgba(220,110,80,0.2)" }}>
            <X className="w-4 h-4" style={{ color: "#e8907a" }} />
          </button>
        </div>

        <div className="relative bg-black">
          {error ? (
            <div className="h-64 flex items-center justify-center px-6 text-center">
              <div>
                <Camera className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(232,144,122,0.5)" }} />
                <p className="text-sm" style={{ color: "rgba(240,190,160,0.7)" }}>{error}</p>
              </div>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full max-h-72 object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} playsInline muted />
              {isReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="rounded-full border-2 border-dashed" style={{ width: 140, height: 180, borderColor: "rgba(232,144,122,0.6)" }} />
                    <p className="text-center text-xs mt-2 font-medium tracking-wider" style={{ color: "#e8907a" }}>Align your face</p>
                  </div>
                </div>
              )}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <span className="font-bold" style={{ color: "var(--canvas)", fontSize: 96, lineHeight: 1, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{countdown}</span>
                </div>
              )}
              {!isReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#e8907a" }} />
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="px-4 py-2" style={{ background: "rgba(0,0,0,0.3)" }}>
          <p className="text-xs text-center tracking-wider" style={{ color: "rgba(240,190,160,0.55)" }}>Good lighting · Face forward · Hair pulled back</p>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={handleFlip} disabled={!isReady} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40" style={{ background: "rgba(220,110,80,0.1)", border: "1px solid rgba(220,110,80,0.2)" }} title="Flip camera">
            <SwitchCamera className="w-4 h-4" style={{ color: "#e8907a" }} />
          </button>
          <button onClick={handleCapture} disabled={!isReady || countdown !== null} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 4px 18px rgba(180,80,40,0.28)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", letterSpacing: "0.05em" }}>
            {countdown !== null ? <><Loader2 className="w-4 h-4 animate-spin" />Capturing in {countdown}…</> : <><Camera className="w-4 h-4" />Capture Photo</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Scene orbs ─────────────────────────────────────────────────── */
const SceneOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div style={{ position: "absolute", top: "8%", right: "6%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(200,100,60,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
    <div style={{ position: "absolute", bottom: "12%", left: "3%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle at 60% 60%, rgba(80,140,90,0.1) 0%, transparent 70%)", filter: "blur(36px)" }} />
    <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(122,48,32,0.05) 0%, transparent 65%)", filter: "blur(60px)" }} />
  </div>
);

/* ── Hairstyle photo card ── */
const HairstyleCard = ({ style }) => {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <>
      {lightboxOpen && !imgError && <Lightbox src={style.photo} alt={style.name} onClose={() => setLightboxOpen(false)} />}
      <div className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.07) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.18)", boxShadow: "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,220,200,0.06)", backdropFilter: "blur(8px)" }}>
        <div className="relative h-40 w-full overflow-hidden cursor-pointer" style={{ background: "rgba(42,21,10,0.4)" }} onClick={() => !imgError && setLightboxOpen(true)}>
          {!imgError ? (
            <img src={style.photo} alt={style.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{style.image}</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,8,3,0.55) 0%, transparent 60%)" }} />
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded-lg tracking-wide" style={{ background: "rgba(20,8,3,0.75)", color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{style.name}</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}>{style.description}</p>
        </div>
      </div>
    </>
  );
};

/* ── Jewelry photo card ── */
const JewelryCard = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <>
      {lightboxOpen && !imgError && <Lightbox src={item.photo} alt={item.name} onClose={() => setLightboxOpen(false)} />}
      <div className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.07) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.18)", boxShadow: "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,220,200,0.06)", backdropFilter: "blur(8px)" }}>
        <div className="relative h-40 w-full overflow-hidden cursor-pointer" style={{ background: "rgba(42,21,10,0.4)" }} onClick={() => !imgError && setLightboxOpen(true)}>
          {!imgError ? (
            <img src={item.photo} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{item.icon}</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,8,3,0.55) 0%, transparent 60%)" }} />
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded-lg tracking-wide" style={{ background: "rgba(20,8,3,0.75)", color: "var(--canvas)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{item.name}</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}>{item.description}</p>
        </div>
      </div>
    </>
  );
};

/* ── Glass Card wrapper ── */
const GlassCard = ({ children, className = "", style = {} }) => (
  <div className={`relative rounded-3xl overflow-hidden ${className}`} style={{ background: "linear-gradient(145deg, rgba(249,237,232,0.07) 0%, rgba(249,237,232,0.03) 100%)", border: "1px solid rgba(220,110,80,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(180,60,30,0.1), inset 0 1px 0 rgba(255,220,200,0.08)", backdropFilter: "blur(12px)", ...style }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,144,122,0.5), transparent)" }} />
    {children}
  </div>
);

/* ── Label ── */
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(232,144,122,0.6)" }}>{children}</p>
);

/* ── Main Page ── */
const FaceShapePage = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [allScores, setAllScores] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [aiDetected, setAiDetected] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fileInputRef = useRef(null);
  const selectedShape = FACE_SHAPES.find((s) => s.id === selectedId);

  const handleContinue = () => { if (selectedId) setShowResult(true); };

  const analyzeImage = async (file, preview) => {
    setPreviewUrl(preview); setIsUploading(true); setError(null); setSaved(false); setSaveError(null);
    try {
      const formData = new FormData(); formData.append("image", file);
      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Prediction failed"); }
      const data = await response.json();
      setSelectedId(data.predicted_class.toLowerCase()); setConfidence(data.confidence); setAllScores(data.all_scores); setAiDetected(true); setShowResult(true);
    } catch (err) { setError(err.message); }
    finally { setIsUploading(false); }
  };

  const handleFileChange = async (e) => { const file = e.target.files[0]; if (!file) return; await analyzeImage(file, URL.createObjectURL(file)); };
  const handleCameraCapture = async (file, previewBlobUrl) => { setShowCamera(false); await analyzeImage(file, previewBlobUrl); };

  const saveToProfile = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) { setSaveError("Please log in to save your results."); return; }
    setSaving(true); setSaveError(null);
    try {
      const response = await fetch(PROFILE_URL, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: parseInt(userId), face_shape: selectedId }) });
      const data = await response.json();
      if (response.ok) { setSaved(true); setTimeout(() => navigate("/profile"), 800); }
      else { setSaveError(data?.detail || "Failed to save to profile."); }
    } catch { setSaveError("Network error. Is Django running?"); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: "var(--espresso)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');`}</style>
      <SceneOrbs />

      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      <main className="relative z-10 pt-24 lg:pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "rgba(232,144,122,0.6)" }}>Personae · AI Analysis</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontStyle: "italic", fontWeight: 400, color: "var(--canvas)", letterSpacing: "-0.01em", lineHeight: 1.15, marginBottom: "12px" }}>
              Face Shape Detection
            </h1>
            <p className="text-sm font-light max-w-md mx-auto" style={{ color: "rgba(240,190,160,0.55)" }}>
              Upload a clear face photo to discover your shape and receive personalised hairstyle &amp; jewellery guidance
            </p>
            <div className="mx-auto mt-5" style={{ width: 52, height: 1, background: "linear-gradient(90deg, transparent, #e8907a, transparent)" }} />
          </div>

          {error && (
            <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: "linear-gradient(135deg, #4a2c0a 0%, #5c3510 50%, #3d2008 100%)", border: "1.5px solid rgba(255,185,80,0.45)", boxShadow: "0 0 0 1px rgba(255,155,40,0.12), 0 12px 48px rgba(180,90,0,0.35), inset 0 1px 0 rgba(255,210,120,0.2)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,185,80,0.85), transparent)" }} />
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4px", background: "linear-gradient(180deg, #ffb840, #e07820, #ffb840)", borderRadius: "12px 0 0 12px" }} />
              <div className="px-7 py-4 pl-9 flex gap-4 items-center">
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#ffb840" }} />
                <p className="text-sm" style={{ color: "rgba(255,225,170,0.92)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>⚠ {error}</p>
              </div>
            </div>
          )}

          {!showResult ? (
            <div className="max-w-4xl mx-auto">

              {/* AI Upload / Camera Card */}
              <GlassCard className="mb-8">
                <div className="p-7">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(122,48,32,0.2)", border: "1px solid rgba(220,110,80,0.3)", boxShadow: "0 0 20px rgba(220,110,80,0.2)" }}>
                    <Camera className="w-7 h-7" style={{ color: "#e8907a" }} />
                  </div>
                  <SectionLabel>AI Detection</SectionLabel>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "8px" }}>AI Image Analysis</h3>
                  <p className="text-sm mb-5" style={{ color: "rgba(240,190,160,0.55)" }}>Use your camera or upload a clear front-facing photo for instant face shape detection</p>

                  {previewUrl && (
                    <div className="mt-3 mb-5 rounded-2xl overflow-hidden h-40 w-40 mx-auto" style={{ border: "2px solid rgba(220,110,80,0.3)", boxShadow: "0 0 24px rgba(220,110,80,0.2)" }}>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setShowCamera(true)} disabled={isUploading} className="flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-semibold transition-all duration-200" style={{ background: "rgba(249,237,232,0.06)", color: isUploading ? "rgba(240,190,160,0.35)" : "rgba(240,190,160,0.85)", border: "1px solid rgba(220,110,80,0.25)", cursor: isUploading ? "not-allowed" : "pointer" }}>
                      <Video className="w-4 h-4" />Open Camera
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-semibold transition-all duration-200" style={{ background: isUploading ? "rgba(200,160,128,0.35)" : "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: isUploading ? "rgba(255,255,255,0.45)" : "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: isUploading ? "none" : "0 4px 18px rgba(180,80,40,0.28)", cursor: isUploading ? "not-allowed" : "pointer" }}>
                      {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</> : <><Upload className="w-4 h-4" />Upload &amp; Analyse</>}
                    </button>
                  </div>
                  <p className="text-xs mt-3 text-center" style={{ color: "rgba(240,190,160,0.4)" }}>For best results: face forward, good lighting, hair pulled back</p>
                </div>
              </GlassCard>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: "1px solid rgba(220,110,80,0.2)" }} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-sm" style={{ background: "transparent", color: "rgba(240,190,160,0.4)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>or select manually</span>
                </div>
              </div>

              {/* Manual Selection */}
              <div className="px-5 py-4 rounded-2xl mb-6 text-center" style={{ background: "rgba(106,72,24,0.15)", border: "1px solid rgba(200,150,80,0.2)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(232,180,100,0.7)" }}>Manual Selection</p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.2rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "6px" }}>Select Your Face Shape</h3>
                <p className="text-xs" style={{ color: "rgba(240,200,140,0.65)" }}>Look in a mirror, pull your hair back, and trace the outline of your face.</p>
              </div>

              {/* Face Shape Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {FACE_SHAPES.map((shape) => (
                  <button key={shape.id} onClick={() => setSelectedId(shape.id)} className="relative p-4 rounded-2xl transition-all duration-300 text-left group" style={selectedId === shape.id ? { background: "linear-gradient(145deg, rgba(200,160,128,0.18), rgba(180,120,80,0.12))", border: "1.5px solid rgba(220,110,80,0.5)", boxShadow: "0 4px 18px rgba(180,80,40,0.2), inset 0 1px 0 rgba(255,220,200,0.1)" } : { background: "linear-gradient(145deg, rgba(249,237,232,0.05) 0%, rgba(249,237,232,0.02) 100%)", border: "1px solid rgba(220,110,80,0.12)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                    {selectedId === shape.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c8a080, #b88060)", boxShadow: "0 2px 8px rgba(180,80,40,0.4)" }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform" style={{ background: "rgba(122,48,32,0.2)", border: "1px solid rgba(220,110,80,0.25)" }}>
                      <span className="text-xl">{shape.icon}</span>
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--canvas)", marginBottom: "3px" }}>{shape.name}</p>
                    <p className="text-xs line-clamp-2" style={{ color: "rgba(240,190,160,0.5)" }}>{shape.description}</p>
                  </button>
                ))}
              </div>

              {/* Preview Card */}
              {selectedShape && (
                <GlassCard className="mb-8">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(122,48,32,0.22)", border: "1px solid rgba(220,110,80,0.3)", boxShadow: "0 0 20px rgba(220,110,80,0.2)" }}>
                        <span className="text-2xl">{selectedShape.icon}</span>
                      </div>
                      <div>
                        <SectionLabel>Selected Shape</SectionLabel>
                        <h4 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", fontStyle: "italic", color: "var(--canvas)", lineHeight: 1.2 }}>{selectedShape.name} Face Shape</h4>
                        <p className="text-sm mt-1" style={{ color: "rgba(240,190,160,0.6)" }}>{selectedShape.description}</p>
                      </div>
                    </div>
                    <div className="mb-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "rgba(232,144,122,0.55)" }}>Key Characteristics</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedShape.characteristics.map((char, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(122,48,32,0.15)", border: "1px solid rgba(220,110,80,0.18)", color: "rgba(240,190,160,0.75)" }}>{char}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleContinue} className="group py-3.5 px-6 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:opacity-90" style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 4px 18px rgba(180,80,40,0.28)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem", letterSpacing: "0.04em" }}>
                      See Hairstyle Recommendations <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </GlassCard>
              )}
            </div>
          ) : (
            selectedShape && (
              <div className="max-w-3xl mx-auto space-y-6">

                {/* Result Header Card */}
                <GlassCard>
                  <div className="p-7">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(80,160,100,0.15)", border: "1px solid rgba(80,160,100,0.3)", boxShadow: "0 0 14px rgba(80,160,100,0.3)" }}>
                        <Check className="w-4 h-4" style={{ color: "#7ec89a" }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(232,144,122,0.6)" }}>Analysis Complete</p>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.25rem", fontStyle: "italic", color: "var(--canvas)", lineHeight: 1.2 }}>Your Face Shape Profile</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 p-5 rounded-2xl mb-6" style={{ background: "rgba(42,21,10,0.45)", border: "1px solid rgba(220,110,80,0.15)" }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(122,48,32,0.25)", border: "1.5px solid rgba(220,110,80,0.3)", boxShadow: "0 0 28px rgba(220,110,80,0.2)" }}>
                        <span className="text-3xl">{selectedShape.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(232,144,122,0.55)" }}>Detected Shape</p>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.7rem", fontWeight: 600, color: "var(--canvas)", lineHeight: 1.1 }}>{selectedShape.name}</p>
                        <p className="text-sm mt-1" style={{ color: "rgba(240,190,160,0.6)" }}>{selectedShape.description}</p>
                        {aiDetected && confidence && (
                          <p className="text-xs mt-1.5 font-semibold" style={{ color: "#e8907a" }}>AI detected with {confidence}% confidence</p>
                        )}
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="mb-5 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid rgba(220,110,80,0.3)" }}>
                          <img src={previewUrl} alt="Your photo" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs" style={{ color: "rgba(240,190,160,0.45)" }}>Analysis based on your uploaded photo</p>
                      </div>
                    )}

                    {aiDetected && allScores && (
                      <div className="mb-5 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(232,144,122,0.55)" }}>Confidence Scores</p>
                        {Object.entries(allScores).sort((a, b) => b[1] - a[1]).map(([cls, score]) => (
                          <div key={cls}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="capitalize" style={{ color: "rgba(240,190,160,0.6)" }}>{cls}</span>
                              <span style={{ color: cls === selectedId ? "#e8907a" : "rgba(240,190,160,0.45)", fontWeight: cls === selectedId ? 700 : 400 }}>{score}%</span>
                            </div>
                            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                              <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${score}%`, background: cls === selectedId ? "linear-gradient(90deg, #c8a080, #e8907a)" : "rgba(255,255,255,0.12)" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {saveError && (
                      <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(180,40,30,0.15)", border: "1px solid rgba(220,80,60,0.3)", color: "rgba(255,160,140,0.9)" }}>⚠ {saveError}</div>
                    )}

                    <button onClick={saveToProfile} disabled={saving || saved} className="w-full mb-5 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2" style={saved ? { background: "rgba(80,160,100,0.18)", color: "#7ec89a", border: "1px solid rgba(80,160,100,0.3)", cursor: "default" } : saving ? { background: "rgba(200,160,128,0.3)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(220,160,100,0.2)", cursor: "not-allowed" } : { background: "linear-gradient(135deg, rgba(200,160,128,0.2), rgba(180,120,80,0.15))", color: "rgba(240,190,160,0.9)", border: "1px solid rgba(220,110,80,0.35)", boxShadow: "0 4px 18px rgba(180,80,40,0.15)", cursor: "pointer" }}>
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : saved ? <><Check className="w-4 h-4" />Saved to Profile</> : <><Heart className="w-4 h-4" />Save to Profile</>}
                    </button>

                    <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(106,72,24,0.22), rgba(122,48,32,0.16))", border: "1px solid rgba(200,150,80,0.25)" }}>
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(232,180,100,0.7)" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(240,200,140,0.75)" }}><span className="font-semibold" style={{ color: "rgba(232,180,100,0.9)" }}>Pro Tip:</span> {selectedShape.tips}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Best Hairstyles */}
                <GlassCard>
                  <div className="p-6">
                    <SectionLabel>Recommended Styles</SectionLabel>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "20px" }}>Best Hairstyles for You</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedShape.bestHairstyles.map((style, index) => <HairstyleCard key={index} style={style} />)}
                    </div>
                  </div>
                </GlassCard>

                {/* Avoid Hairstyles */}
                <GlassCard>
                  <div className="p-6">
                    <SectionLabel>Styles to Avoid</SectionLabel>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "16px" }}>What Doesn't Flatter</h3>
                    <ul className="space-y-2">
                      {selectedShape.avoidHairstyles.map((style, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm" style={{ color: "rgba(240,190,160,0.65)" }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(220,110,80,0.15)", border: "1px solid rgba(220,110,80,0.25)" }}>
                            <ChevronRight className="w-3 h-3" style={{ color: "#e8907a" }} />
                          </div>
                          {style}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>

                {/* Best Jewelry */}
                <GlassCard>
                  <div className="p-6">
                    <SectionLabel>Jewellery Recommendations</SectionLabel>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "20px" }}>Jewellery That Flatters You</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedShape.bestJewelry.map((item, index) => <JewelryCard key={index} item={item} />)}
                    </div>
                  </div>
                </GlassCard>

                {/* Avoid Jewelry */}
                <GlassCard>
                  <div className="p-6">
                    <SectionLabel>Jewellery to Avoid</SectionLabel>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "12px" }}>Skip These Pieces</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(240,190,160,0.6)" }}>
                      {Array.isArray(selectedShape.avoidJewelry) ? selectedShape.avoidJewelry.join(", ") : selectedShape.avoidJewelry}
                    </p>
                  </div>
                </GlassCard>

                {/* Characteristics */}
                <GlassCard>
                  <div className="p-6">
                    <SectionLabel>Face Characteristics</SectionLabel>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontStyle: "italic", color: "var(--canvas)", marginBottom: "16px" }}>Your Unique Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedShape.characteristics.map((char, index) => (
                        <span key={index} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(122,48,32,0.18)", border: "1px solid rgba(220,110,80,0.22)", color: "rgba(240,190,160,0.8)" }}>{char}</span>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => { setShowResult(false); setAiDetected(false); setAllScores(null); setConfidence(null); setPreviewUrl(null); setSaved(false); setSaveError(null); }} className="py-3 px-5 rounded-2xl text-sm font-semibold transition-all duration-200" style={{ background: "rgba(249,237,232,0.06)", color: "rgba(240,190,160,0.75)", border: "1px solid rgba(220,110,80,0.2)" }}>
                    Change Selection
                  </button>
                  <Link to="/results" className="py-3 px-5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:opacity-90" style={{ background: "linear-gradient(135deg, #c8a080 0%, #b88060 100%)", color: "#fff", border: "1px solid rgba(220,160,100,0.4)", boxShadow: "0 4px 18px rgba(180,80,40,0.28)", textDecoration: "none", fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.04em" }}>
                    Complete Style Profile <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/AIchat" className="py-3 px-5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-200" style={{ background: "rgba(249,237,232,0.06)", color: "rgba(240,190,160,0.75)", border: "1px solid rgba(220,110,80,0.2)", textDecoration: "none" }}>
                    <Sparkles className="w-4 h-4" style={{ color: "#e8907a" }} />Ask AI Stylist
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default FaceShapePage;