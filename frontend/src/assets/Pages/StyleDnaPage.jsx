import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Share2, Star } from "lucide-react";
import { quizQuestions, calculatePersona } from "../../Data/StyleDnaData";

// ── FLOATING PARTICLES ────────────────────────────────────────
const FloatingParticles = ({ color = "#ffffff" }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full opacity-20"
        style={{
          width: Math.random() * 6 + 2,
          height: Math.random() * 6 + 2,
          backgroundColor: color,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1], scale: [1, 1.5, 1] }}
        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
      />
    ))}
  </div>
);

// ── INTRO ─────────────────────────────────────────────────────
const QuizIntro = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
    style={{
      background: "linear-gradient(135deg, #f8c8d4 0%, #fde2c8 15%, #fef3c7 30%, #d4f0d4 45%, #c8e8f8 60%, #d8c8f0 75%, #f0c8e8 90%, #f8c8d4 100%)",
    }}
  >
    {/* Animated gradient overlay */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          "linear-gradient(135deg, #f8c8d4 0%, #fde2c8 25%, #d4f0d4 50%, #c8e8f8 75%, #d8c8f0 100%)",
          "linear-gradient(135deg, #d8c8f0 0%, #f8c8d4 25%, #fde2c8 50%, #fef3c7 75%, #d4f0d4 100%)",
          "linear-gradient(135deg, #c8e8f8 0%, #d8c8f0 25%, #f8c8d4 50%, #fde2c8 75%, #fef3c7 100%)",
          "linear-gradient(135deg, #f8c8d4 0%, #fde2c8 25%, #d4f0d4 50%, #c8e8f8 75%, #d8c8f0 100%)",
        ],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />

    {/* Soft blur blobs */}
    <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-pink-200/40 blur-3xl" />
    <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-purple-200/40 blur-3xl" />
    <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-yellow-200/40 blur-3xl" />
    <div className="absolute bottom-1/3 left-1/2 w-56 h-56 rounded-full bg-blue-200/30 blur-3xl" />

    <FloatingParticles color="#9B7BAE" />

    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="text-center max-w-2xl relative z-10"
    >
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-800 mb-4 leading-none tracking-tight"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Unveil
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xl sm:text-2xl text-gray-600 mb-4 font-light"
      >
        Your style story starts here
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="w-24 h-px bg-linear-to-r from-transparent via-gray-400/60 to-transparent mx-auto mb-8"
      />

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-gray-500 text-base mb-12 max-w-md mx-auto leading-relaxed"
      >
        10 questions. 8 possible personas. One very accurate mirror of who you actually are.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-8 mb-12"
      >
        {[["10", "Questions"], ["8", "Personas"], ["2 min", "Time"]].map(([val, label]) => (
          <div key={label} className="text-center">
            <p className="text-2xl font-bold text-gray-800">{val}</p>
            <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="relative group px-10 py-4 bg-gray-900 text-white font-bold text-lg rounded-full overflow-hidden"
      >
        <span className="relative z-10">Decode My Style →</span>
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-pink-400 to-purple-400"
          initial={{ x: "-100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-gray-400 text-xs mt-4"
      >
        No right or wrong answers — just honest ones ✨
      </motion.p>
    </motion.div>
  </motion.div>
);

// ── PROGRESS ──────────────────────────────────────────────────
const DnaProgress = ({ current, total }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-sm font-medium">Question {current} of {total}</span>
      <span className="text-white/30 text-xs">{total - current} left</span>
    </div>
    <div className="flex gap-1">
      {[...Array(total)].map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 h-1.5 rounded-full"
          style={{ backgroundColor: i < current ? "#ffffff" : "rgba(255,255,255,0.15)" }}
          animate={{ scaleY: i === current - 1 ? [1, 1.5, 1] : 1 }}
          transition={{ duration: 0.4 }}
        />
      ))}
    </div>
  </div>
);

// ── QUESTION ──────────────────────────────────────────────────
const QuizQuestion = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const handleSelect = (idx, persona) => {
    setSelected(idx);
    setTimeout(() => { onAnswer(persona); setSelected(null); }, 500);
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-6"
      >
        <span className="text-white/50 text-xs uppercase tracking-widest">{question.scenario}</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-tight"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {question.question}
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(idx, opt.persona)}
            onHoverStart={() => setHoveredIdx(idx)}
            onHoverEnd={() => setHoveredIdx(null)}
            className={`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
              selected === idx
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
            }`}
          >
            {hoveredIdx === idx && selected === null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none"
              />
            )}
            <div className="flex items-center gap-3 relative z-10">
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <p className={`font-medium text-sm leading-snug ${selected === idx ? "text-black" : "text-white"}`}>
                  {opt.label}
                </p>
                <p className={`text-xs mt-0.5 ${selected === idx ? "text-black/60" : "text-white/30"}`}>
                  {opt.vibe}
                </p>
              </div>
            </div>
            {selected === idx && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ── RESULTS ───────────────────────────────────────────────────
const QuizResults = ({ persona, onRetake }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1.5 }}
        className={`absolute inset-0 bg-linear-to-br ${persona.cardBg}`}
      />
      <FloatingParticles color={persona.accentColor} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {!revealed ? (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white mb-6"
            />
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/60 text-sm tracking-widest uppercase"
            >
              Decoding your style...
            </motion.p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

            {/* Header */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-10"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Your Style Persona</p>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="text-7xl mb-6"
              >
                {persona.emoji}
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {persona.name}
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg italic"
                style={{ color: persona.accentColor }}
              >
                "{persona.tagline}"
              </motion.p>
            </motion.div>

            {/* Rarity */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm font-medium">Only {persona.rarity} of users get this persona</span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
            >
              <p className="text-white/80 leading-relaxed text-base">{persona.description}</p>
            </motion.div>

            {/* Palette */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
            >
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Your Signature Palette</h3>
              <div className="flex gap-3">
                {persona.palette.map((color, i) => (
                  <div key={i} className="flex-1 text-center">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.8 + i * 0.08 }}
                      className="h-12 rounded-xl mb-2 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-white/40 text-xs">{persona.paletteNames[i]}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Icons + Never Wear */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Always In Your Closet</h3>
                <ul className="space-y-2">
                  {persona.icons.map((item, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-center gap-2">
                      <span style={{ color: persona.accentColor }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Never Caught Wearing</h3>
                <p className="text-white/70 text-sm leading-relaxed">{persona.neverWear}</p>
              </div>
            </motion.div>

            {/* Style Twin */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: persona.accentColor + "30" }}
              >
                ⭐
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Your Style Twin</p>
                <p className="text-white font-bold text-lg">{persona.styleTwin}</p>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-3">
              <button
                onClick={onRetake}
                className="flex-1 flex items-center justify-center 
                gap-2 py-4 rounded-2xl border border-white/20 text-white/70 hover:text-white 
                hover:border-white/40 transition-all font-medium">
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────
const StyleDnaPage = () => {
  const [phase, setPhase] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [persona, setPersona] = useState(null);

  const handleStart = useCallback(() => {
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers({});
  }, []);

  const handleAnswer = useCallback((personaKey) => {
    const newAnswers = { ...answers, [quizQuestions[currentQ].id]: personaKey };
    setAnswers(newAnswers);
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      setPersona(calculatePersona(newAnswers));
      setPhase("results");
    }
  }, [answers, currentQ]);

  const handleRetake = useCallback(() => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers({});
    setPersona(null);
  }, []);

  const currentBg = phase === "quiz" ? quizQuestions[currentQ]?.bg : "from-black to-black";

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizIntro onStart={handleStart} />
          </motion.div>
        )}

        {phase === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`min-h-screen bg-linear-to-br ${currentBg} transition-all duration-700`}
          >
            <FloatingParticles />
            <div className="max-w-2xl mx-auto px-6 py-12">
              <div className="mb-8">
                {currentQ > 0 ? (
                  <button
                    onClick={() => setCurrentQ((p) => p - 1)}
                    className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                ) : (
                  <button
                    onClick={() => setPhase("intro")}
                    className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
              </div>

              <div className="mb-10">
                <DnaProgress current={currentQ + 1} total={quizQuestions.length} />
              </div>

              <AnimatePresence mode="wait">
                <QuizQuestion
                  key={currentQ}
                  question={quizQuestions[currentQ]}
                  onAnswer={handleAnswer}   />
              </AnimatePresence>
            </div>
          </motion.div>  )}
        {phase === "results" && persona && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuizResults persona={persona} onRetake={handleRetake} />
          </motion.div>     )}
      </AnimatePresence>
    </div>
  );
};
export default StyleDnaPage;
