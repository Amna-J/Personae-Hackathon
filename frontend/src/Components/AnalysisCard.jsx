import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

const CARD_THEMES = {
  "/skin-tone": {
    tag: "Complexion",
    color: "var(--terracotta)",
    tagBg: "rgba(208, 135, 112, 0.18)",
  },
  "/under-tone": {
    tag: "Color Theory",
    color: "var(--sage-soft)",
    tagBg: "rgba(138, 154, 138, 0.18)",
  },
  "/body-type": {
    tag: "Silhouette",
    color: "var(--terracotta-soft)",
    tagBg: "rgba(229, 181, 160, 0.18)",
  },
  "/face-shape": {
    tag: "Structure",
    color: "var(--taupe)",
    tagBg: "rgba(184, 168, 138, 0.18)",
  },
};

const AnalysisCard = ({ path, title, description, content }) => {
  const cardRef = useRef(null);
  const foilRef = useRef(null);
  const theme   = CARD_THEMES[path] || CARD_THEMES["/skin-tone"];

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const foil = foilRef.current;
    if (!card || !foil) return;
    const rect = card.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    const rotX = -((y - rect.height / 2) / (rect.height / 2)) * 8;
    card.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateZ(8px)`;
    card.style.transition = "transform 0.1s ease-out";
    foil.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
    foil.style.setProperty("--my", `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "rotateY(0deg) rotateX(0deg) translateZ(0px)";
    card.style.transition = "transform 0.5s cubic-bezier(0.23,1,0.32,1)";
  };

  return (
    <div
      className="h-full analysis-card-perspective"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden cursor-pointer group h-full flex flex-col analysis-card-wrapper"
      >
        <div className="relative z-10 rounded-2xl overflow-hidden flex flex-col flex-1 analysis-card-inner-bg">
          {/* Image area */}
          <div className="relative w-full h-64 shrink-0 overflow-hidden">
            {content}
            <div className="absolute inset-0 pointer-events-none analysis-card-img-overlay" />
          </div>

          {/* Foil reflection — background set via JS CSS custom properties */}
          <div
            ref={foilRef}
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none analysis-card-foil"
            style={{
              background: "radial-gradient(ellipse at var(--mx, 50%) var(--my, 50%), rgba(245,237,224,0.06) 0%, transparent 65%)",
              "--mx": "50%",
              "--my": "50%",
            }}
          />

          {/* Card body */}
          <div className="p-6 relative z-10 flex flex-col flex-1">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 self-start"
              style={{ background: theme.tagBg, color: theme.color }}
            >
              {theme.tag}
            </span>

            <h3 className="text-lg font-bold mb-2 leading-snug analysis-card-title">
              {title}
            </h3>

            <p className="text-sm mb-5 leading-relaxed flex-1 analysis-card-desc">
              {description}
            </p>

            <div>
              <Link to={path}>
                <button
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all duration-200 group/btn hover:-translate-y-0.5"
                  style={{ color: theme.color, background: theme.tagBg, borderColor: "transparent" }}
                >
                  Start Analysis
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
