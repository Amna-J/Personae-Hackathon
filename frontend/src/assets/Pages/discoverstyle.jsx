import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Button from "../../Components/Button";


function Discoverstyle() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <>
      <div data-theme="mytheme">
        {/* Testimonials Section */}
        <section
          className="py-12 md:py-16 testimonials-section"
          aria-label="Customer Testimonials"
        >
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-3 testimonials-heading">
                What Our Users Say
              </h2>
              <p className="text-lg testimonials-subtext">
                Join thousands who've discovered their perfect style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  quote: "Personae completely changed how I shop. I finally understand why certain colors never worked for me. My wardrobe feels more intentional now.",
                  name: "Ayesha Khan",
                  role: "Fashion Enthusiast",
                  img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
                },
                {
                  quote: "The body-type analysis was eye-opening. I'd been dressing for the wrong shape for years. Now I feel confident in every outfit.",
                  name: "Neha Patel",
                  role: "Working Professional",
                  img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c",
                },
                {
                  quote: "As someone who shops online frequently, this tool has been a game-changer. The recommendations are accurate and save me time and money.",
                  name: "Sara Malik",
                  role: "Online Shopper",
                  img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
                },
              ].map(({ quote, name, role, img }) => (
                <div key={name} className="card bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md testimonial-card">
                  <div className="card-body p-6 md:p-8">
                    <div className="rating rating-sm mb-4">
                      {[...Array(5)].map((_, i) => (
                        <input key={i} type="radio" className="mask mask-star bg-gray-800" checked readOnly />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 leading-relaxed mb-6">
                      "{quote}"
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={img} alt={name} />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-sm text-gray-600">{role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-16 discover-cta-section" aria-label="Get Started Call to Action">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 discover-cta-heading">
                Ready to Discover Your Style?
              </h2>
              <p className="text-lg mb-8 leading-relaxed discover-cta-subtext">
                Start your personalized style journey today. It only takes a few minutes
              </p>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <div className="p-6">
                  <Button
                    showArrow
                    fullWidth
                    variant="btn-primary"
                    className="py-6 px-9"
                    ariaLabel="Get started for free"
                    onClick={openAuthModal}
                  >
                    Get Started Free
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/AIchat")}
                  className="btn btn-outline btn-lg min-w-220px px-8 py-4 text-base font-semibold transition-all duration-300 ease-in-out discover-outline-btn"
                  aria-label="Chat with AI Stylist"
                >
                  Chat with AI Stylist
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="modal modal-open" onClick={(e) => e.stopPropagation()}>
            <div className="modal-box max-w-md p-0 overflow-hidden bg-white">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Welcome to Personae</h3>
                <button onClick={closeAuthModal} className="btn btn-ghost btn-circle btn-sm" aria-label="Close modal">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6 text-center">
                  Sign in to start your personalized style journey
                </p>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                </div>
                <button
                  className="btn w-full py-3 mb-4 font-medium border-none discover-modal-signin-btn"
                  onClick={() => { window.location.href = "/auth"; }}
                >
                  Sign in with Email
                </button>
                <p className="text-xs text-center mt-6 discover-modal-note">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="hover:underline discover-modal-link">Terms</a>{" "}
                  and{" "}
                  <a href="/privacy" className="hover:underline discover-modal-link">Privacy Policy</a>
                </p>
              </div>
            </div>
            <div className="modal-backdrop" onClick={closeAuthModal} aria-hidden="true" />
          </div>
        </div>
      )}
    </>
  );
}

export default Discoverstyle;
