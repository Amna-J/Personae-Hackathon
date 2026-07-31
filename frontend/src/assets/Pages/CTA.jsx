import { Link } from "react-router-dom";
import Mainimage from "../Mainimage.jpg";
import Button from "../../Components/Button";

const STATS = [
  { value: "50K+", label: "Style Profiles" },
  { value: "98%", label: "Accuracy Rate" },
  { value: "4.9★", label: "User Rating" },
];

const CTA = () => (
  <>
    <section className="w-full relative mt-8">
      <img
        src={Mainimage}
        alt="Banner"
        className="w-full h-250px md:h-600px sm:h-300px object-cover object-top"
      />
      <div className="absolute inset-0 pointer-events-none cta-img-overlay" />
    </section>

    <section className="py-24 cta-section">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-serif mb-2 cta-heading-secondary">
          Your AI Personal Stylist
        </h2>
        <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 cta-heading">
          Designed Just for You
        </h2>
        <p className="max-w-xl mx-auto mb-8 cta-subtext">
          Fewer wrong purchases, better confidence, personalized fashion.
          Discover the colors and styles that truly complement your unique
          features.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/AnalyzePage">
            <Button showArrow fullWidth={false} className="px-10 py-7 text-lg">
              Analyze my Style
            </Button>
          </Link>
          <Link
            to="/AIchat"
            className="btn btn-outline btn-lg px-12 py-7 transition-all duration-300 cta-outline-btn"
          >
            Try AI Stylist
          </Link>
        </div>

        {/* Stats */}
        <div className="stats shadow-sm rounded-2xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 px-4 md:px-0 max-w-xl mx-auto cta-stats">
          {STATS.map(({ value, label }) => (
            <div key={label} className="stat text-center w-full md:w-auto">
              <div className="stat-value font-serif cta-stat-value">{value}</div>
              <div className="stat-desc cta-stat-desc">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default CTA;
