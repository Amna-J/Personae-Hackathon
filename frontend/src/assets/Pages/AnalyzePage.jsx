import { Link } from "react-router-dom";
import Button from "../../Components/Button";
import AnalysisCard from "../../Components/AnalysisCard";
import { UNDER_TONE_GUIDE } from "../../Data/underToneData";
import { SKIN_TONE_GUIDE } from "../../Data/SkinToneData";
import { BODY_TYPE_GUIDE } from "../../Data/BodyTypeData";
import { FACE_SHAPES_GUIDE } from "../../data/FaceShapeData";

const CARDS = [
  {
    path: "/skin-tone",
    title: "Skin Tone Analysis",
    description: "Discover your skin tone to find the perfect foundation and products for you",
    content: (
      <img src={SKIN_TONE_GUIDE} alt="Skin tone guide" className="w-full h-full object-cover object-top" />
    ),
  },
  {
    path: "/under-tone",
    title: "Under Tone Analysis",
    description: "Discover your undertone to find colors that make you glow",
    content: (
      <img src={UNDER_TONE_GUIDE} alt="Undertone guide" className="w-full h-full object-cover object-top" />
    ),
  },
  {
    path: "/body-type",
    title: "Body Type Analysis",
    description: "Identify your body shape to find silhouettes that flatter your figure",
    content: (
      <img src={BODY_TYPE_GUIDE} alt="Body type guide" className="w-full h-full object-cover object-top" />
    ),
  },
  {
    path: "/face-shape",
    title: "Face Shape Analysis",
    description: "Understand your face shape to choose hairstyles and accessories that suit you",
    content: (
      <img src={FACE_SHAPES_GUIDE} alt="Face shapes guide" className="w-full h-full object-cover object-top" />
    ),
  },
];

const AnalyzePage = () => {
  return (
    <div className="min-h-screen analyze-page">
      <main className="pt-24 lg:pt-28 px-4">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12 animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 analyze-eyebrow">
              AI Fashion Stylist
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight analyze-heading">
              Start Your Style Analysis
            </h1>
            <p className="text-lg max-w-2xl mx-auto analyze-subtext">
              Choose where to begin your personalized style journey with AI-powered insights
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mx-auto items-stretch analyze-grid-perspective">
            {CARDS.map(({ path, title, description, content }) => (
              <AnalysisCard
                key={path}
                path={path}
                title={title}
                description={description}
                content={content}
              />
            ))}
          </section>

          <footer className="mt-14 text-center animate-fade-in-up">
            <p className="mb-4 text-sm analyze-footer-text">
              Already completed your analysis?
            </p>
            <Link to="/results">
              <Button
                showArrow={false}
                fullWidth={false}
                className="mb-8 py-3 px-8 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.03] analyze-results-btn"
              >
                View My Style Results
              </Button>
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;
