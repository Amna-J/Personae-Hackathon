import { blogs } from "../../Data/Blogdata";

const categoryColors = {
  Jewellery:        { bg: "rgba(220,110,80,0.13)",  color: "var(--terracotta-soft)", border: "rgba(220,110,80,0.28)" },
  Colors:           { bg: "rgba(200,100,150,0.13)",  color: "#d88ab0", border: "rgba(200,100,150,0.28)" },
  "Body Type":      { bg: "rgba(100,160,190,0.13)",  color: "#8abcd4", border: "rgba(100,160,190,0.28)" },
  Makeup:           { bg: "rgba(200,150,80,0.13)",   color: "#d4aa6a", border: "rgba(200,150,80,0.28)"  },
  Hair:             { bg: "rgba(160,120,90,0.15)",   color: "#c49a72", border: "rgba(160,120,90,0.28)"  },
  "Outfit Colors":  { bg: "rgba(220,110,80,0.13)",   color: "#e8a080", border: "rgba(220,110,80,0.25)"  },
  Accessories:      { bg: "rgba(200,150,80,0.13)",   color: "#d4b070", border: "rgba(200,150,80,0.25)"  },
  "Color Analysis": { bg: "rgba(100,160,190,0.13)",  color: "#90c0d8", border: "rgba(100,160,190,0.25)" },
};

const Badge = ({ category }) => {
  const t = categoryColors[category] || categoryColors["Jewellery"];
  return (
    <span
      style={{ background: t.bg, color: t.color, borderColor: t.border }}
      className="text-[10px] font-semibold tracking-widset uppercase px-3 py-1 rounded-full border font-sans"
    >
      {category}
    </span>
  );
};

const Blogs = () => {
  const featured = blogs[0];
  const rest = blogs.slice(1);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const openLink = (url) => window.open(url, "_blank", "noopener noreferrer");

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        backgroundColor: "var(--espresso)",
        color: "var(--canvas)",
        fontFamily: "'Jost', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        .b-fade { animation: bFadeUp .55s ease forwards; opacity: 0; }
        @keyframes bFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .d1{animation-delay:.05s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
        .d4{animation-delay:.24s} .d5{animation-delay:.30s} .d6{animation-delay:.36s} .d7{animation-delay:.42s}

        .hero-italic { font-style: italic; color: var(--terracotta-soft); position: relative; }
        .hero-italic::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 1px; background: linear-gradient(90deg, transparent, var(--terracotta-soft), transparent);
          transform: scaleX(0); transform-origin: center;
          animation: lineGrow 1s ease .7s forwards;
        }
        @keyframes lineGrow { to { transform: scaleX(1); } }

        .fc-char {
          position: absolute; font-family: 'Cormorant Garamond', serif; font-style: italic;
          color: rgba(220,110,80,0.07); font-weight: 300; line-height: 1;
          user-select: none; pointer-events: none; font-size: clamp(80px,12vw,130px);
        }
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-14px) rotate(-5deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(4deg)}  50%{transform:translateY(-10px) rotate(6deg)} }

        .hero-pill {
          font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 20px; border: 1px solid;
          transition: transform .2s ease, box-shadow .2s ease; cursor: default;
        }
        .hero-pill:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(220,110,80,0.15); }

        .feat-card { transition: transform .4s cubic-bezier(0.23,1,0.32,1), box-shadow .4s ease; cursor: pointer; }
        .feat-card:hover { transform: translateY(-6px); box-shadow: 0 32px 80px rgba(180,60,40,0.22); }
        .feat-card:hover .feat-img { transform: scale(1.04); }
        .feat-img { transition: transform .6s ease; width:100%; height:100%; object-fit:cover; }
        .feat-arrow { display:inline-flex; align-items:center; gap:8px; transition:gap .3s ease; }
        .feat-card:hover .feat-arrow { gap: 14px; }

        .g-card {
          transition: transform .35s cubic-bezier(0.23,1,0.32,1), box-shadow .35s ease, border-color .35s ease;
          cursor: pointer; position: relative;
        }
        .g-card::before {
          content:''; position:absolute; inset:0; border-radius:18px; pointer-events:none; z-index:1;
          background: radial-gradient(ellipse at var(--mx,50%) var(--my,50%), rgba(220,110,80,0.09) 0%, transparent 65%);
          opacity:0; transition:opacity .3s;
        }
        .g-card:hover { transform: translateY(-6px); box-shadow: 0 24px 64px rgba(160,50,30,0.2); border-color: rgba(220,110,80,0.28) !important; }
        .g-card:hover::before { opacity: 1; }
        .g-card:hover .g-img { transform: scale(1.05); }
        .g-img { transition: transform .5s ease; width:100%; height:100%; object-fit:cover; }
        .g-arrow { display:inline-flex; align-items:center; gap:6px; transition:gap .3s ease; }
        .g-card:hover .g-arrow { gap: 11px; }
      `}</style>

      {/* ── HERO ── */}
      <section className="w-full text-center pt-20 pb-16 px-6 relative overflow-hidden">

        <div className="absolute rounded-full pointer-events-none" style={{ width:520,height:520,top:-200,left:"50%",transform:"translateX(-50%)",background:"radial-gradient(circle,rgba(220,110,80,0.12) 0%,transparent 70%)" }}/>
        <div className="absolute rounded-full pointer-events-none" style={{ width:300,height:300,bottom:-100,left:"6%",background:"radial-gradient(circle,rgba(180,80,60,0.09) 0%,transparent 70%)" }}/>
        <div className="absolute rounded-full pointer-events-none" style={{ width:240,height:240,bottom:-70,right:"5%",background:"radial-gradient(circle,rgba(200,100,150,0.08) 0%,transparent 70%)" }}/>

        <span className="fc-char" style={{ top:-20,left:-8,animation:"floatA 8s ease-in-out infinite" }}>S</span>
        <span className="fc-char" style={{ top:18,right:-6,animation:"floatB 10s ease-in-out infinite 1.5s" }}>Y</span>
        <span className="fc-char" style={{ bottom:-8,left:"21%",fontSize:72,opacity:.5,animation:"floatA 9s ease-in-out infinite 3s" }}>L</span>

        <div className="relative z-10">
          <h1
            className="b-fade d1 font-light leading-[1.08] mb-6"
            style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(3rem,7.5vw,5.4rem)", color:"var(--canvas)" }}
          >
            Your <em className="hero-italic">Personal</em><br />Style
          </h1>

          <div
            className="b-fade d2 mx-auto mb-6"
            style={{ width:60,height:1,background:"linear-gradient(90deg,transparent,#e8907a,transparent)" }}
          />

          <p
            className="b-fade d2 max-w-lg mx-auto text-[15px] font-light leading-relaxed mb-10"
            style={{ color:"rgba(240,190,160,0.58)" }}
          >
            Expert guides on jewellery, color palettes, body-type dressing, and everything in between — tailored to who you are.
          </p>

          <div className="b-fade d3 flex items-center justify-center gap-3 flex-wrap">
            {[
              { label:"Jewellery",      bg:"rgba(220,110,80,0.13)",  color:"var(--terracotta-soft)", border:"rgba(220,110,80,0.28)"  },
              { label:"Color Analysis", bg:"rgba(100,160,190,0.13)", color:"#8abcd4", border:"rgba(100,160,190,0.28)" },
              { label:"Body Type",      bg:"rgba(100,160,190,0.13)", color:"#8abcd4", border:"rgba(100,160,190,0.28)" },
              { label:"Hair",           bg:"rgba(160,120,90,0.15)",  color:"#c49a72", border:"rgba(160,120,90,0.28)"  },
              { label:"Makeup",         bg:"rgba(200,150,80,0.13)",  color:"#d4aa6a", border:"rgba(200,150,80,0.28)"  },
            ].map(p => (
              <span key={p.label} className="hero-pill" style={{ background:p.bg, color:p.color, borderColor:p.border }}>
                {p.label}
              </span>
            ))}
          </div>

          <div className="b-fade d4 mx-auto mt-10 relative" style={{ width:120,height:1,background:"rgba(220,110,80,0.15)" }}>
            <div style={{ position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",width:40,height:3,borderRadius:2,background:"rgba(220,110,80,0.4)",filter:"blur(2px)" }}/>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6">

        {/* Featured */}
        <div
          onClick={() => openLink(featured.link)}
          className="feat-card b-fade d3 rounded-2xl overflow-hidden mb-16 grid md:grid-cols-2"
          style={{ background:"var(--espresso-soft)", border:"1px solid rgba(220,110,80,0.15)" }}
        >
          <div className="relative overflow-hidden" style={{ minHeight:400 }}>
            <img src={featured.coverImage} alt={featured.title} className="feat-img absolute inset-0" />
          </div>

          <div className="flex flex-col justify-center p-10 md:p-14 relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <Badge category={featured.category} />
              <span className="text-xs font-sans" style={{ color:"rgba(240,190,160,0.4)" }}>{featured.readTime}</span>
              <span
                className="text-[10px] px-3 py-1 rounded-full border font-sans"
                style={{ background:"rgba(220,110,80,0.13)", color:"var(--terracotta-soft)", borderColor:"rgba(220,110,80,0.28)" }}
              >
                Featured
              </span>
            </div>

            <h2
              className="font-light leading-snug mb-4"
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,2.6vw,2.5rem)", color:"var(--canvas)" }}
            >
              {featured.title}
            </h2>

            <p className="text-sm leading-relaxed mb-8 font-light max-w-md" style={{ color:"rgba(240,190,160,0.58)" }}>
              {featured.subtitle}
            </p>

            <div className="feat-arrow text-sm font-medium font-sans" style={{ color:"var(--terracotta-soft)" }}>
              <span>Read Article</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4 mb-9 b-fade d4">
          <h2
            className="font-light whitespace-nowrap"
            style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.6rem", color:"var(--canvas)" }}
          >
            All Style Guides
          </h2>
          <div className="flex-1 h-px" style={{ background:"rgba(220,110,80,0.12)" }} />
          <span className="text-xs font-sans" style={{ color:"rgba(240,190,160,0.38)" }}>
            {blogs.length} articles
          </span>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((blog, i) => (
            <div
              key={blog.id}
              onClick={() => openLink(blog.link)}
              onMouseMove={handleMouseMove}
              className={`g-card b-fade d${Math.min(i + 3, 7)} flex flex-col rounded-2xl overflow-hidden`}
              style={{ background:"var(--espresso-soft)", border:"1px solid rgba(220,110,80,0.1)" }}
            >
              <div className="relative overflow-hidden shrink-0" style={{ aspectRatio:"16/9" }}>
                <img src={blog.coverImage} alt={blog.title} className="g-img" />
              </div>

              <div className="p-6 flex flex-col flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Badge category={blog.category} />
                  <span className="text-xs font-sans" style={{ color:"rgba(240,190,160,0.38)" }}>{blog.readTime}</span>
                </div>

                <h3
                  className="font-light leading-snug mb-2 line-clamp-2"
                  style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"var(--canvas)" }}
                >
                  {blog.title}
                </h3>

                <p
                  className="text-[13px] leading-relaxed font-light line-clamp-2 mb-5 flex-1"
                  style={{ color:"rgba(240,190,160,0.52)" }}
                >
                  {blog.subtitle}
                </p>

                <div className="g-arrow text-xs font-medium font-sans mt-auto" style={{ color:"var(--terracotta-soft)" }}>
                  <span>Read Article</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Blogs;