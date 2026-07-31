import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../Components/Button";
import {
  Check, ArrowRight, Camera, Upload, RefreshCw, Star, Heart,
  ShoppingBag, Ruler, AlertCircle, Loader2, X
} from "lucide-react";
import { BODY_TYPES } from "../../Data/BodyTypeData";

const API_URL = "http://127.0.0.1:8000/api/predict/body-shape/";
const PROFILE_URL = "http://127.0.0.1:8000/api/users/profile/";
const normalizeLabel = (label) => label.toLowerCase().replace(/[_\s]+/g, "-");

/* ── Lightbox ─────────────────────────────────────────────────── */
const Lightbox = ({ src, alt, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
    <button
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
      onClick={onClose}
    >
      <X className="w-5 h-5 text-white" />
    </button>
    <img
      src={src} alt={alt}
      className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

/* ── Outfit Photo Card ────────────────────────────────────────── */
const OutfitCard = ({ photo, label, bgColor }) => {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {lightboxOpen && !imgError && (
        <Lightbox src={photo} alt={label} onClose={() => setLightboxOpen(false)} />
      )}
      <div
        className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-gray-100 group cursor-pointer"
        onClick={() => !imgError && setLightboxOpen(true)}
      >
        <div className={`relative h-48 w-full overflow-hidden ${bgColor}`}>
          {!imgError ? (
            <img
              src={photo} alt={label}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-rose-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
          {!imgError && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-white text-[10px]">🔍 View</div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <span className="inline-block bg-white/90 backdrop-blur-sm text-black text-xs font-semibold px-2 py-1 rounded-md">{label}</span>
          </div>
        </div>
      </div>
    </>
  );
};

const SHAPE_COLORS = {
  hourglass:          "#A86B5C",
  apple:              "#7A8C5C",
  pear:               "#C9A05C",
  rectangle:          "#A89478",
  "inverted-triangle":"#7A6B82",
  diamond:            "#5C7A82",
};

const Bodytype = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [measurements, setMeasurements] = useState({ shoulder: "", bust: "", waist: "", hip: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ── Save to profile state ──
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fileInputRef = useRef(null);
  const selectedType = BODY_TYPES.find((t) => t.id === selectedId);

  const handleMeasurementChange = (e) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAISubmit = async () => {
    const { shoulder, bust, waist, hip } = measurements;
    if (!shoulder || !bust || !waist || !hip) { setError("Please enter all measurements."); return; }
    const ranges = { shoulder: [28, 50], bust: [70, 140], waist: [55, 130], hip: [75, 150] };
    for (const [field, [min, max]] of Object.entries(ranges)) {
      const value = parseFloat(measurements[field]);
      if (isNaN(value) || value <= 0) { setError(`${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid number.`); return; }
      if (value < min || value > max) { setError(`${field.charAt(0).toUpperCase() + field.slice(1)} must be between ${min} and ${max} cm.`); return; }
    }
    setError(null);
    setSaved(false);
    setSaveError(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("shoulder", shoulder);
      formData.append("bust", bust);
      formData.append("waist", waist);
      formData.append("hip", hip);
      if (imageFile) formData.append("image", imageFile);
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server error. Please try again.");
      const data = await res.json();
      setApiResult(data);
      const normalizedId = normalizeLabel(data.body_shape);
      const typeExists = BODY_TYPES.find((t) => t.id === normalizedId);
      if (typeExists) setSelectedId(normalizedId);
      else console.warn("No matching BODY_TYPE found for:", data.body_shape);
      setShowResult(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Save body type to profile ──
  const saveToProfile = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) { setSaveError("Please log in to save your results."); return; }
    if (!selectedId) { setSaveError("No result to save."); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(PROFILE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId), body_type: selectedId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSaved(true);
        setTimeout(() => navigate("/profile"), 800);
      } else {
        setSaveError(data?.detail || "Failed to save to profile.");
      }
    } catch (err) {
      setSaveError("Network error. Is Django running?");
    } finally {
      setSaving(false);
    }
  };

  const handleWardrobeClick = (e) => {
    e.preventDefault();
    if (selectedType?.wardrobeLink) window.open(selectedType.wardrobeLink, "_blank");
  };

  const handleReset = () => {
    setMode(null); setSelectedId(null); setShowResult(false); setApiResult(null);
    setImageFile(null); setImagePreview(null);
    setMeasurements({ shoulder: "", bust: "", waist: "", hip: "" });
    setError(null); setSaved(false); setSaveError(null);
  };

  const handleManualContinue = () => { setShowResult(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleBackToSelection = () => { setShowResult(false); setSaved(false); setSaveError(null); };

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-black text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Fit</h1>
          <p className="text-lg text-espresso-soft max-w-2xl mx-auto">
            Discover styles that flatter your unique body shape
          </p>
        </div>

        {!showResult ? (
          <div className="max-w-4xl mx-auto">

            {/* Mode selector */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div
                className={`card shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-2 ${mode === "ai" ? "border-primary" : "border-transparent"}`}
                onClick={() => setMode("ai")}
              >
                <div className="card-body rounded-2xl" style={{ backgroundColor: "var(--taupe-light)" }}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="card-title text-2xl text-black">AI + Measurements</h3>
                  <p className="text-espresso-soft">Enter your measurements and optionally upload a photo for AI-powered detection</p>
                  {mode === "ai" && <div className="badge badge-primary mt-2">Selected</div>}
                </div>
              </div>
              <div
                className={`card shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-2 ${mode === "manual" ? "border-primary" : "border-transparent"}`}
                onClick={() => setMode("manual")}
              >
                <div className="card-body rounded-2xl" style={{ backgroundColor: "var(--taupe-light)" }}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Ruler className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="card-title text-2xl text-black">Manual Selection</h3>
                  <p className="text-espresso-soft font-extrabold">Already know your body type? Choose directly from the list</p>
                  {mode === "manual" && <div className="badge badge-primary mt-2">Selected</div>}
                </div>
              </div>
            </div>

            {/* AI Form */}
            {mode === "ai" && (
              <div className="card shadow-xl mb-8">
                <div className="card-body">
                  <h3 className="card-title text-2xl text-black mb-2">Enter Your Measurements</h3>
                  <p className="text-sm text-espresso-soft mb-2">All measurements in centimeters (cm)</p>
                  <p className="text-xs text-red-500 mb-4">Disclaimer: Upload a T-pose photo and avoid baggy clothes for accurate detection.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { name: "shoulder", label: "Shoulder Width", placeholder: "e.g. 38" },
                      { name: "bust", label: "Bust Circumference", placeholder: "e.g. 90" },
                      { name: "waist", label: "Waist Circumference", placeholder: "e.g. 70" },
                      { name: "hip", label: "Hip Circumference", placeholder: "e.g. 95" },
                    ].map((field) => (
                      <div key={field.name} className="form-control">
                        <label className="label"><span className="label-text font-semibold text-black">{field.label}</span></label>
                        <input
                          type="number" name={field.name} value={measurements[field.name]}
                          onChange={handleMeasurementChange} placeholder={field.placeholder}
                          className="input input-bordered w-full bg-white text-black" min="1"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text font-semibold text-black">
                        Photo Upload <span className="text-espresso-soft font-normal">(optional)</span>
                      </span>
                    </label>
                    <div
                      className="border-2 border-dashed border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-xl object-cover" />
                          <span className="text-sm text-green-600 font-semibold">✓ Photo ready</span>
                          <span className="text-xs text-espresso-soft">Click to change</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-primary/50 mb-2" />
                          <p className="text-sm text-espresso-soft">Click to upload a full-body photo</p>
                          <p className="text-xs text-espresso-soft mt-1">JPG, PNG supported</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                  {error && <div className="alert alert-error mb-4"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}
                  <button onClick={handleAISubmit} disabled={isLoading} className="btn btn-primary w-full btn-lg">
                    {isLoading
                      ? (<><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</>)
                      : (<><Camera className="w-5 h-5" />Detect My Body Shape</>)
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Manual Mode */}
            {mode === "manual" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
                  {BODY_TYPES.map((type) => {
                    const shapeColor = SHAPE_COLORS[type.id] || "#C9876A";
                    const isSelected = selectedId === type.id;
                    return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedId(type.id)}
                      className="relative p-4 md:p-5 rounded-xl transition-all duration-300 text-left group flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: isSelected
                          ? `${shapeColor}22`
                          : `${shapeColor}0F`,
                        border: `1px solid ${isSelected ? shapeColor : `${shapeColor}55`}`,
                        boxShadow: isSelected ? `0 4px 12px ${shapeColor}30` : "none",
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = `${shapeColor}1A`;
                          e.currentTarget.style.borderColor = `${shapeColor}88`;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = `${shapeColor}0F`;
                          e.currentTarget.style.borderColor = `${shapeColor}55`;
                        }
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: shapeColor }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <span className="text-3xl md:text-4xl">{type.icon}</span>
                      </div>
                      <h4 className="font-display font-semibold text-sm md:text-base mb-1 text-center text-black">
                        {type.name}
                      </h4>
                      <p className="text-xs line-clamp-2 text-center" style={{ color: "var(--espresso-soft)" }}>
                        {type.shortDescription || "Select for details"}
                      </p>
                    </button>
                    );
                  })}
                </div>

                {selectedType && (
                  <div className="card shadow-xl mb-8">
                    <div className="card-body">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <span className="text-5xl">{selectedType.icon}</span>
                        </div>
                        <div>
                          <h3 className="card-title text-2xl text-black">{selectedType.name}</h3>
                          <p className="text-espresso-soft">{selectedType.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedType.strengths.slice(0, 3).map((strength, index) => (
                          <div key={index} className="badge badge-primary badge-lg">{strength}</div>
                        ))}
                      </div>
                      <Button
                        showArrow
                        arrowIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
                        fullWidth={true} className="btn-lg" onClick={handleManualContinue}
                      >
                        View Full Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          selectedType && (
            <div className="max-w-6xl mx-auto">

              {/* Back button */}
              <div className="mb-6">
                <button onClick={handleBackToSelection} className="btn btn-ghost" style={{ color: "var(--espresso-soft)" }}>
                  <ArrowRight className="w-5 h-5 rotate-180" />Back to Selection
                </button>
              </div>

              {/* API Result */}
              {apiResult && (
                <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-black">Confidence: {apiResult.confidence}%</p>
                  <p className="text-black">Borderline: {apiResult.borderline ? "Yes" : "No"}</p>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-8">

                {/* Left column */}
                <div className="lg:col-span-1">
                  <div className="card shadow-xl sticky top-24" style={{ backgroundColor: "var(--canvas)" }}>
                    <div className="card-body">
                      <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                          <span className="text-7xl">{selectedType.icon}</span>
                        </div>
                        <h2 className="card-title text-3xl text-black">{selectedType.name}</h2>
                        <p className="text-espresso-soft font-bold mt-2">{selectedType.description}</p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2 text-black">Your Strengths</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedType.strengths.map((strength, index) => (
                              <div key={index} className="badge badge-primary badge-lg border-black">{strength}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2 text-black">Styling Goals</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedType.goals.map((goal, index) => (
                              <div key={index} className="badge badge-secondary badge-lg bg-white border-black">{goal}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="divider"></div>

                      {/* ── SAVE TO PROFILE BUTTON ── */}
                      {saveError && (
                        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-sm text-red-600">⚠️ {saveError}</p>
                        </div>
                      )}
                      <button
                        onClick={saveToProfile}
                        disabled={saving || saved}
                        className={`group w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                          ${saved
                            ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
                            : saving
                            ? "cursor-not-allowed"
                            : "hover:shadow-md"
                          }`}
                        style={!saved ? { backgroundColor: saving ? "rgba(184,168,138,0.5)" : "var(--taupe)", color: "var(--espresso)" } : {}}
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                        ) : saved ? (
                          <><Check className="w-4 h-4" />Saved to Profile!</>
                        ) : (
                          <><Heart className="w-4 h-4 group-hover:text-red-300 transition-colors duration-300" />Save to Profile</>
                        )}
                      </button>

                    </div>
                  </div>
                </div>

                {/* Right column — unchanged */}
                <div className="lg:col-span-2 space-y-8">

                  <div className="card shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center gap-2 mb-6">
                        <Star className="w-6 h-6 text-warning" />
                        <h3 className="card-title text-2xl text-black">Style Tips & Tricks</h3>
                      </div>
                      <div className="space-y-4">
                        {selectedType.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-base-300 rounded-box">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-lg">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center gap-2 mb-6">
                        <ShoppingBag className="w-6 h-6 text-accent" />
                        <h3 className="card-title text-2xl text-black">Outfit Inspiration</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedType.outfitPhotos.map((outfit, index) => (
                          <OutfitCard key={index} photo={outfit.photo} label={outfit.label} bgColor={selectedType.pastelColor} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center gap-2 mb-6">
                        <ShoppingBag className="w-6 h-6 text-accent" />
                        <h3 className="card-title text-2xl text-black">Recommended Clothing</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        {["tops", "bottoms", "dresses"].map((cat) => (
                          <div key={cat} className="bg-base-300 rounded-2xl p-6">
                            <h4 className="font-bold text-xl mb-4 capitalize">{cat}</h4>
                            <ul className="space-y-3">
                              {selectedType.clothingSuggestions[cat].map((item, index) => (
                                <li key={index} className="flex justify-between items-center p-3 bg-base-100 rounded-box" style={{ color: "var(--espresso-soft)" }}>
                                  <span className="font-medium">{item.name}</span>
                                  <div className="tooltip" data-tip={item.reason}><div className="badge badge-outline">Why</div></div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title text-2xl mb-6 text-black">Complete Your Look</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-linear-to-br from-primary/10 to-primary/5 p-6 rounded-2xl">
                          <h4 className="font-bold text-lg mb-4 text-black">Accessories to Try</h4>
                          <ul className="space-y-2 text-black">
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full"></div><span>Statement belts (for waist definition)</span></li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full"></div><span>Vertical line necklaces</span></li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full"></div><span>Proportionate handbags</span></li>
                          </ul>
                        </div>
                        <div className="bg-linear-to-br from-secondary/10 to-secondary/5 p-6 rounded-2xl">
                          <h4 className="font-bold text-lg mb-4 text-black">Fabric Choices</h4>
                          <ul className="space-y-2 text-black">
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-secondary rounded-full"></div><span>Structured fabrics for definition</span></li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-secondary rounded-full"></div><span>Flowing fabrics for movement</span></li>
                            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-secondary rounded-full"></div><span>Medium-weight materials</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 justify-center">
                    <button onClick={handleReset} className="btn btn-outline btn-lg" style={{ color: "var(--espresso-soft)", borderColor: "var(--taupe)" }}>
                      <RefreshCw className="w-5 h-5" />Try Another Type
                    </button>
                    <button onClick={handleWardrobeClick} className="btn btn-primary btn-lg">
                      <ShoppingBag className="w-5 h-5" />Browse Wardrobe
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Bodytype;