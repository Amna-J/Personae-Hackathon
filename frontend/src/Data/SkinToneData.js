// Skin tone color palette - Light to Deep
import skintone from "../assets/skintone.png";

// ─── Jewellery imports ────────────────────────────────────────────────────────
import antiqueBronzeGold2 from "../assets/jewellery/antiquebronzegold2.jpg";
import antiqueBronzeGold3 from "../assets/jewellery/antiquebronzegold3.jpg";
import antiqueBronzeGold5 from "../assets/jewellery/antiquebronzegold5.jpg";
import antiqueBronzeGold6 from "../assets/jewellery/antiquebronzegold6.jpg";
import antiqueBronzeGold1 from "../assets/jewellery/antiquebronzegold1.jpg";
import antiqueRosegoldId4 from "../assets/jewellery/antiquebronzegold4.jpg";
import blackRhodium1 from "../assets/jewellery/blackrhodium1.jpg";
import blackRhodium2 from "../assets/jewellery/blackrhodium2.jpg";
import blackRhodium3 from "../assets/jewellery/blackrhodium3.jpg";
import blackRhodium4 from "../assets/jewellery/blackrhodium4.jpg";
import blackRhodium5 from "../assets/jewellery/blackrhodium5.jpg";
import blackRhodium6 from "../assets/jewellery/blackrhodium6.jpg";
import brieghtYellowHandlook from "../assets/jewellery/brightyellow1.jpg";
import brieghtYellowGoldEarings from "../assets/jewellery/brightyellow2.jpg";
import brightYellowNecklace3 from "../assets/jewellery/brightyellow3.jpg";
import brightYellowNecklace from "../assets/jewellery/brightyellow4.jpg";
import brightYellowNecklace2 from "../assets/jewellery/brightyellow5.jpg";
import brightYellowStuds from "../assets/jewellery/brightyellow6.jpg";
import matteCopper1 from "../assets/jewellery/mattecopper1.jpg";
import matteCopper2 from "../assets/jewellery/mattecopper2.jpg";
import matteCopper3 from "../assets/jewellery/mattecopper3.jpg";
import matteCopper4 from "../assets/jewellery/mattecopper4.jpg";
import matteCopper5 from "../assets/jewellery/mattecopper5.jpg";
import matteCopper6 from "../assets/jewellery/mattecopper6.jpg";
import matteSilverBracelet from "../assets/jewellery/mattersilver1.jpg";
import matteSilverBracelet2 from "../assets/jewellery/mattersilver2.jpg";
import matteSilverHandlook from "../assets/jewellery/mattersilver3.jpg";
import matteSilverNecklace from "../assets/jewellery/mattersilver4.jpg";
import matteSilverNecklace1 from "../assets/jewellery/mattersilver5.jpg";
import matteSilverNecklace2 from "../assets/jewellery/mattersilver6.jpg";
import matteSilverRing from "../assets/jewellery/mattersilver7.jpg";
import mixedJewellery1 from "../assets/jewellery/mixedjewellery1.jpg";
import mixedMetal2 from "../assets/jewellery/mixedmetal2.jpg";
import mixedMetal3 from "../assets/jewellery/mixedmetal3.jpg";
import mixedMetal4 from "../assets/jewellery/mixedmetal4.jpg";
import mixedMetal5 from "../assets/jewellery/mixedmetal5.jpg";
import mixedMetal6 from "../assets/jewellery/mixedmetal6.jpg";
import mixedMetal7 from "../assets/jewellery/mixedmetal7.jpg";
import polishedSilver1 from "../assets/jewellery/polishedsilver1.jpg";
import polishedSilver2 from "../assets/jewellery/polishedsilver2.jpg";
import polishedSilver3 from "../assets/jewellery/polishedsilver3.jpg";
import polishedSilver4 from "../assets/jewellery/polishedsilver4.jpg";
import polishedSilver5 from "../assets/jewellery/polishedsilver5.jpg";
import polishedSilver6 from "../assets/jewellery/polishedsilver6.jpg";
import warmRoseGold1 from "../assets/jewellery/warmrosegold1.jpg";
import warmRoseGold2 from "../assets/jewellery/warmrosegold2.jpg";
import warmRoseGold3 from "../assets/jewellery/warmrosegold3.jpg";
import warmRoseGold4 from "../assets/jewellery/warmrosegold4.jpg";
import warmRoseGold5 from "../assets/jewellery/warmrosegold5.jpg";
import warmRoseGold6 from "../assets/jewellery/warmrosegold6.jpg";

// ─── Makeup imports ───────────────────────────────────────────────────────────
// FAIR
import raspberryFAIR    from "../assets/makeup/raspberryFAIR.jpg";
import petalpeechFAIR   from "../assets/makeup/petalpeechFAIR.jpg";
import truerubyFAIR     from "../assets/makeup/truerubyFAIR.jpg";
import dustyroseFAIR    from "../assets/makeup/dustyroseFAIR.jpg";


// MEDIUM
import toastedcinamonMEDIUM from "../assets/makeup/toastedcinamonMEDIUM.jpg";
import chilliMEDIUM         from "../assets/makeup/chilliMEDIUM.jpg";
import terracottaMEDIUM     from "../assets/makeup/terracottaMEDIUM.jpg";
import warmmauveMEDIUM      from "../assets/makeup/warmmauveMEDIUM.jpg"; // note the space in your filename

// DARK
import burgundyDARK      from "../assets/makeup/burgundyDARK.jpg";
import terracottaDARK    from "../assets/makeup/terracottaDARK.jpg";
import darkplumDARK      from "../assets/makeup/darkplumDARK.jpg";
import choclatebrownDARK from "../assets/makeup/choclatebrownDARK.jpg"; // note the space in your filename

// BLACK
import darkplumBLACK        from "../assets/makeup/darkplumBLACK.png";
import boldmatteorangeBLACK from "../assets/makeup/boldmatteorangeBLACK.jpg";
import smokepurpleBLACK     from "../assets/makeup/smokepurpleBLACK.jpg";
import deepwineBLACK        from "../assets/makeup/deepwineBLACK.jpg";

// ─── Static data ──────────────────────────────────────────────────────────────

export const SKIN_TONES = [
  { name: "Fair",   color: "#FFE4C4", depth: "Light",  description: "Fair to light skin that burns easily" },
  { name: "Medium", color: "#C8A080", depth: "Medium", description: "Olive to tan skin that tans easily" },
  { name: "Dark",   color: "#8B5A2B", depth: "Dark",   description: "Brown skin with warm undertones" },
  { name: "Black",  color: "#4A2C1A", depth: "Deep",   description: "Deep brown to ebony skin" },
];

export const SKIN_TONE_GUIDE = skintone;

// ─── Seasonal Color System ───────────────────────────────────────────────────
export const SEASONAL_MAP = {
  fair:   { season: "True Spring",   hue: "Warm",    value: "Light",  chroma: "Bright", palette: ["#FFD700","#FF6B6B","#98FB98","#87CEEB","#FFA500","#FFB6C1"], powerColors: ["Peach","Warm Coral","Golden Yellow"], neutrals: ["Ivory","Warm Beige","Soft Camel"] },
  medium: { season: "True Autumn",   hue: "Warm",    value: "Medium", chroma: "Muted",  palette: ["#8B4513","#D2691E","#CD853F","#A0522D","#6B8E23","#8FBC8F"], powerColors: ["Terracotta","Olive Green","Warm Brown"], neutrals: ["Camel","Warm Taupe","Chocolate"] },
  dark:   { season: "True Summer",   hue: "Neutral", value: "Dark",   chroma: "Muted",  palette: ["#8B008B","#FF4500","#00CED1","#32CD32","#FFD700","#FF1493"], powerColors: ["Rich Magenta","Bold Cobalt","Lime Green"], neutrals: ["Charcoal","Warm Brown","Mocha"] },
  black:  { season: "True Winter",   hue: "Cool",    value: "Deep",   chroma: "Bright", palette: ["#4169E1","#FF00FF","#FFFF33","#FF69B4","#2E8B57","#9B111E"], powerColors: ["Electric Blue","Magenta","Pure White"], neutrals: ["Black","Charcoal","Pure White"] },
};

// ─── Contrast Level Mapping ──────────────────────────────────────────────────
export const CONTRAST_MAP = {
  fair:   { level: "Low",    score: 28, label: "Delicate Harmony",   tip: "Monochromatic and tonal looks are your magic zone — avoid sharp high-contrast combinations which can overwhelm your natural softness.", patterns: ["Soft florals","Tonal gradients","Watercolour washes"], avoid: ["Bold stripes","High-contrast blocks","Graphic prints"] },
  medium: { level: "Medium", score: 55, label: "Balanced Radiance",  tip: "You sit in the sweet spot — you can rock both subtle tonal looks and bolder colour combinations without either extreme overpowering you.", patterns: ["Mixed prints","Colour blocking","Ethnic patterns"], avoid: ["Neon combinations","Stark black-and-white only"] },
  dark:   { level: "High",   score: 78, label: "Vivid Presence",     tip: "Your natural contrast is striking. Bold patterns, sharp colour blocks, and vivid hues all read with stunning clarity on your complexion.", patterns: ["Graphic prints","Bold stripes","Colour blocking"], avoid: ["Dusty muted tones","Washed-out pastels"] },
  black:  { level: "High",   score: 92, label: "Dramatic Statement", tip: "Maximum contrast is your signature. Jewel tones, bold graphics, and dramatic combinations look extraordinary against your deep complexion.", patterns: ["Bold graphics","Rich jewel tones","Metallic accents"], avoid: ["Nude tones that blend","Muted beige families"] },
};

// ─── Jewellery Recommendations ───────────────────────────────────────────────
export const JEWELRY_MAP = {
  fair: {
    primaryMetal: "Warm Yellow Gold & Rose Gold",
    why: "Bright, buttery gold and blush rose gold echo the warmth and delicacy of fair Spring colouring — they glow rather than contrast.",
    avoid: "Cool gunmetal or black rhodium",
    featured: brightYellowNecklace,
    looks: [
      { label: "Bright Yellow", img: brightYellowNecklace2 },
      { label: "Bright Yellow", img: brightYellowNecklace3 },
      { label: "Bright Yellow", img: brightYellowStuds },
      { label: "Bright Yellow", img: brieghtYellowHandlook },
      { label: "Bright Yellow", img: brieghtYellowGoldEarings },
      { label: "Rose Gold",     img: warmRoseGold1 },
      { label: "Rose Gold",     img: warmRoseGold2 },
      { label: "Rose Gold",     img: warmRoseGold3 },
      { label: "Rose Gold",     img: warmRoseGold4 },
      { label: "Rose Gold",     img: warmRoseGold5 },
      { label: "Rose Gold",     img: warmRoseGold6 },
    ],
  },

  medium: {
    primaryMetal: "Antique Bronze Gold & Matte Copper",
    why: "Earthy, aged bronze and brushed copper mirror the warmth and depth of Autumn colouring — rich, grounded, and completely harmonious.",
    avoid: "High-shine silver or icy platinum",
    featured: antiqueBronzeGold1,
    looks: [
      { label: "Antique Bronze Gold", img: antiqueBronzeGold2 },
      { label: "Antique Bronze Gold", img: antiqueBronzeGold3 },
      { label: "Antique Bronze Gold", img: antiqueBronzeGold5 },
      { label: "Antique Bronze Gold", img: antiqueBronzeGold6 },
      { label: "Antique Bronze Gold", img: antiqueRosegoldId4 },
      { label: "Matte Copper",        img: matteCopper1 },
      { label: "Matte Copper",        img: matteCopper2 },
      { label: "Matte Copper",        img: matteCopper3 },
      { label: "Matte Copper",        img: matteCopper4 },
      { label: "Matte Copper",        img: matteCopper5 },
      { label: "Matte Copper",        img: matteCopper6 },
    ],
  },

  dark: {
    primaryMetal: "Matte Silver & Mixed Metals",
    why: "Brushed satin silver adds a cool, sophisticated contrast to deeper complexions, while mixed metals give you versatile, editorial edge.",
    avoid: "Heavy yellow gold tones",
    featured: matteSilverHandlook,
    looks: [
      { label: "Matte Silver",  img: matteSilverNecklace },
      { label: "Matte Silver",  img: matteSilverNecklace1 },
      { label: "Matte Silver",  img: matteSilverNecklace2 },
      { label: "Matte Silver",  img: matteSilverBracelet },
      { label: "Matte Silver",  img: matteSilverBracelet2 },
      { label: "Matte Silver",  img: matteSilverRing },
      { label: "Mixed Metals",  img: mixedJewellery1 },
      { label: "Mixed Metals",  img: mixedMetal2 },
      { label: "Mixed Metals",  img: mixedMetal3 },
      { label: "Mixed Metals",  img: mixedMetal4 },
      { label: "Mixed Metals",  img: mixedMetal5 },
      { label: "Mixed Metals",  img: mixedMetal6 },
      { label: "Mixed Metals",  img: mixedMetal7 },
    ],
  },

  black: {
    primaryMetal: "Polished Silver & Black Rhodium",
    why: "High-shine platinum silver and dramatic black rhodium deliver the bold, high-contrast drama that makes Deep Winter colouring absolutely electric.",
    avoid: "Muted or brushed copper tones",
    featured: polishedSilver1,
    looks: [
      { label: "Polished Silver", img: polishedSilver2 },
      { label: "Polished Silver", img: polishedSilver3 },
      { label: "Polished Silver", img: polishedSilver4 },
      { label: "Polished Silver", img: polishedSilver5 },
      { label: "Polished Silver", img: polishedSilver6 },
      { label: "Black Rhodium",   img: blackRhodium1 },
      { label: "Black Rhodium",   img: blackRhodium2 },
      { label: "Black Rhodium",   img: blackRhodium3 },
      { label: "Black Rhodium",   img: blackRhodium4 },
      { label: "Black Rhodium",   img: blackRhodium5 },
      { label: "Black Rhodium",   img: blackRhodium6 },
    ],
  },
};

// ─── Makeup Recommendations ──────────────────────────────────────────────────
export const MAKEUP_MAP = {
  fair: {
    primaryLook: "Raspberry, Petal Peach & Dusty Rose",
    why: "Soft berry, peach-pink, and dusty rose tones complement fair Spring colouring beautifully — they add warmth and dimension without overpowering your natural delicacy. These shades mimic a natural flush and keep the look fresh, never heavy.",
    avoid: "Heavy contouring, warm orange-based foundations, overly dark lip colours that can make fair skin look washed out",
    featured: raspberryFAIR,
    swatches: [
      { name: "Raspberry",   hex: "#C0392B" },
      { name: "Petal Peach", hex: "#F4A884" },
      { name: "Dusty Rose",  hex: "#C48888" },
      { name: "True Ruby",   hex: "#9B1B30" },
    ],
    stylingTip: "✨ Start with a light-coverage, luminous base — heavy coverage looks mask-like on fair skin • Blend blush high on the cheekbones in soft peach or rose • Raspberry and dusty rose lips look polished without drama • Line eyes in brown rather than black for a softer, more wearable look • Set with a fine translucent powder to avoid chalkiness",
    looks: [
      { label: "Raspberry",  img: raspberryFAIR },
      { label: "Petal Peach", img: petalpeechFAIR },
      { label: "True Ruby",   img: truerubyFAIR },
      { label: "Dusty Rose",  img: dustyroseFAIR },
    ],
  },

  medium: {
    primaryLook: "Terracotta, Warm Mauve & Chilli Red",
    why: "Earthy terracotta, warm mauve, and chilli red shades harmonise with medium Autumn colouring — they enhance the natural warmth of olive and tan skin without competing with it. Toasted cinnamon adds a sun-kissed dimension perfect for everyday wear.",
    avoid: "Icy pink or cool-toned foundations that can look grey and flat against warm complexions",
    featured: terracottaMEDIUM,
    swatches: [
      { name: "Terracotta",        hex: "#E2725B" },
      { name: "Warm Mauve",        hex: "#9E6B6B" },
      { name: "Chilli",            hex: "#C0392B" },
      { name: "Toasted Cinnamon",  hex: "#A0522D" },
    ],
    stylingTip: "✨ Use a warm-undertone foundation — look for 'golden', 'warm', or 'olive' in the shade name • Bronze powder along the temples and jawline adds natural warmth • Terracotta blush gives a sun-kissed glow that lasts all day • Chilli and warm-red lips look incredibly vibrant against medium skin • Gold and copper eyeshadow highlights your natural warmth",
    looks: [
      { label: "Terracotta",       img: terracottaMEDIUM },
      { label: "Warm Mauve",       img: warmmauveMEDIUM },
      { label: "Chilli",           img: chilliMEDIUM },
      { label: "Toasted Cinnamon", img: toastedcinamonMEDIUM },
    ],
  },

  dark: {
    primaryLook: "Burgundy, Terracotta & Dark Plum",
    why: "Deep burgundy, warm terracotta, and rich dark plum create stunning contrast against brown skin — these shades are deeply pigmented enough to show their true colour without fading into the complexion. Chocolate brown grounds the look with earthy sophistication.",
    avoid: "Sheer or pastel lip colours that disappear on deeper skin, and foundations with excess pink that can look ashy",
    featured: burgundyDARK,
    swatches: [
      { name: "Burgundy",          hex: "#800020" },
      { name: "Terracotta",        hex: "#C47A44" },
      { name: "Dark Plum",         hex: "#5A1A5A" },
      { name: "Chocolate Brown",   hex: "#4A2312" },
    ],
    stylingTip: "✨ Choose foundations labeled 'warm', 'caramel', or 'honey' — avoid anything with a pink or grey cast • Rich berry and plum lip colours look absolutely stunning and last beautifully • Bronze and gold highlighters bring out the warmth in brown skin • Bold burgundy or terracotta blush gives gorgeous depth • Coloured eyeliner in deep green or blue adds unexpected vibrancy",
    looks: [
      { label: "Burgundy",        img: burgundyDARK },
      { label: "Terracotta",      img: terracottaDARK },
      { label: "Dark Plum",       img: darkplumDARK },
      { label: "Chocolate Brown", img: choclatebrownDARK },
    ],
  },

  black: {
    primaryLook: "Dark Plum, Deep Wine & Bold Matte Orange",
    why: "Dark plum, deep wine, and bold matte orange deliver the maximum colour impact that makes deep complexions truly electric. Smoke purple adds a dramatic editorial dimension — these are shades with enough pigment to read true and vivid against the richest skin tones.",
    avoid: "Any sheer or nude-pink formulas that blend into deep skin — they read flat and colourless; avoid foundations with a blue-grey cast",
    featured: darkplumBLACK,
    swatches: [
      { name: "Dark Plum",     hex: "#4B0040" },
      { name: "Deep Wine",     hex: "#722F37" },
      { name: "Bold Orange",   hex: "#C84B00" },
      { name: "Smoke Purple",  hex: "#614051" },
    ],
    stylingTip: "✨ Go full coverage and full pigment — sheer formulas are invisible on deep skin • Bold matte orange lip is a show-stopping power move unique to deep complexions • Smoke purple eyeshadow creates an otherworldly editorial look • Silver and white highlight on the centre of the lid makes eyes pop dramatically • Setting spray locks in colour payoff and prevents fading throughout the day",
    looks: [
      { label: "Dark Plum",    img: darkplumBLACK },
      { label: "Deep Wine",    img: deepwineBLACK },
      { label: "Bold Orange",  img: boldmatteorangeBLACK },
      { label: "Smoke Purple", img: smokepurpleBLACK },
    ],
  },
};

// ─── Skin Tone Results with Recommendations ──────────────────────────────────
export const SKIN_TONE_RESULTS = {
  fair: {
    title: "Fair Skin Tone",
    depth: "Fair",
    description: "Your skin is fair to light. You may burn easily in the sun and require extra sun protection.",
    characteristics: [
      "Burns easily in the sun",
      "Often has pink or rosy surface tones",
      "May have freckles",
      "Requires high SPF protection",
    ],
    bestColors: [
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Lavender",  hex: "#E6E6FA" },
      { name: "Mint",      hex: "#98FB98" },
      { name: "Baby Blue", hex: "#89CFF0" },
      { name: "Peach",     hex: "#FFDAB9" },
      { name: "Rose Gold", hex: "#B76E79" },
    ],
    avoidColors: [
      { name: "Neon Yellow",     hex: "#DFFF00" },
      { name: "Electric Orange", hex: "#FF5F1F" },
    ],
    makeupTips: [
      "Look for foundation with pink or neutral undertones",
      "Soft blush in pink or peach shades",
      "Pastel eyeshadows work beautifully",
      "Avoid foundations that are too dark or orange",
    ],
    skincareTips: [
      "Use SPF 30+ daily",
      "Gentle exfoliation for smooth texture",
      "Vitamin C serums for brightness",
      "Hydrating products to maintain glow",
    ],
    foundationMatch: "Look for shades labeled 'Fair' or 'Light' with cool/neutral undertones",
    sunscreen: "SPF 50+ recommended for maximum protection",
    productLink: "https://www.amazon.com/s?k=foundation+light+skin+tone",
  },

  medium: {
    title: "Medium Skin Tone",
    depth: "Medium",
    description: "Your skin is olive to tan. You tan easily and have a natural warmth to your complexion.",
    characteristics: [
      "Tans easily with sun exposure",
      "Natural warmth in complexion",
      "Less likely to burn",
      "Can have olive or golden undertones",
    ],
    bestColors: [
      { name: "Coral",      hex: "#FF7F50" },
      { name: "Turquoise",  hex: "#40E0D0" },
      { name: "Mustard",    hex: "#FFDB58" },
      { name: "Berry",      hex: "#8A2BE2" },
      { name: "Emerald",    hex: "#50C878" },
      { name: "Terracotta", hex: "#E2725B" },
    ],
    avoidColors: [
      { name: "Pastel Pink", hex: "#FFD1DC" },
      { name: "Icy Blue",    hex: "#B0E0E6" },
    ],
    makeupTips: [
      "Warm-toned foundations work best",
      "Bronzer adds natural warmth",
      "Rich berry and coral lipsticks",
      "Gold eyeshadows enhance your glow",
    ],
    skincareTips: [
      "SPF 30+ for protection",
      "Vitamin C for even tone",
      "Hydrating serums for radiance",
      "Exfoliate 2-3 times weekly",
    ],
    foundationMatch: "Look for shades labeled 'Medium' or 'Tan' with warm or neutral undertones",
    sunscreen: "SPF 30+ recommended for daily wear",
    productLink: "https://www.amazon.com/s?k=foundation+medium+skin+tone",
  },

  dark: {
    title: "Dark Skin Tone",
    depth: "Dark",
    description: "Your skin is brown with rich, warm undertones. You have natural sun protection but still need care.",
    characteristics: [
      "Rarely burns",
      "Rich melanin content",
      "Can have warm or neutral undertones",
      "Natural sun protection (still needs SPF)",
    ],
    bestColors: [
      { name: "Fuchsia",     hex: "#FF00FF" },
      { name: "Orange",      hex: "#FFA500" },
      { name: "Cobalt Blue", hex: "#0047AB" },
      { name: "Lime Green",  hex: "#32CD32" },
      { name: "Purple",      hex: "#800080" },
      { name: "Red",         hex: "#FF0000" },
    ],
    avoidColors: [
      { name: "Dusty Pastels", hex: "#C4AEAD" },
      { name: "Muted Tones",   hex: "#808080" },
    ],
    makeupTips: [
      "Rich, pigmented foundations work best",
      "Bold lip colors look stunning",
      "Gold and bronze highlighters pop",
      "Colorful eyeshadows show true pigment",
    ],
    skincareTips: [
      "SPF 30+ to prevent hyperpigmentation",
      "Vitamin C for brightening",
      "Moisturize to maintain healthy glow",
      "Treat hyperpigmentation with targeted products",
    ],
    foundationMatch: "Look for shades labeled 'Tan', 'Caramel', or 'Honey' with warm undertones",
    sunscreen: "SPF 30+ to prevent dark spots and hyperpigmentation",
    productLink: "https://www.amazon.com/s?k=foundation+dark+skin+tone",
  },

  black: {
    title: "Black Skin Tone",
    depth: "Black",
    description: "Your skin is deep brown to ebony. Rich in melanin with beautiful natural radiance.",
    characteristics: [
      "Very rarely burns",
      "High melanin content",
      "Rich, deep complexion",
      "May have cool or neutral undertones",
    ],
    bestColors: [
      { name: "Royal Blue",      hex: "#4169E1" },
      { name: "Magenta",         hex: "#FF00FF" },
      { name: "Electric Yellow", hex: "#FFFF33" },
      { name: "Hot Pink",        hex: "#FF69B4" },
      { name: "Emerald",         hex: "#2E8B57" },
      { name: "Ruby Red",        hex: "#9B111E" },
    ],
    avoidColors: [
      { name: "Nude",  hex: "#F5DEB3" },
      { name: "Beige", hex: "#F5F5DC" },
    ],
    makeupTips: [
      "Highly pigmented foundations are essential",
      "Bright, bold colors pop beautifully",
      "Metallics and shimmers add dimension",
      "Deep lip colors look sophisticated",
    ],
    skincareTips: [
      "SPF 30+ for even tone",
      "Vitamin C for radiance",
      "Rich moisturizers for hydration",
      "Treat hyperpigmentation concerns",
    ],
    foundationMatch: "Look for shades labeled 'Deep', 'Ebony', or 'Rich' with neutral or cool undertones",
    sunscreen: "SPF 30+ essential for preventing uneven tone",
    productLink: "https://www.amazon.com/s?k=foundation+deep+skin+tone",
  },
};

export const skinToneData = {
  tones: SKIN_TONES,
  results: SKIN_TONE_RESULTS,
  seasonalMap: SEASONAL_MAP,
  contrastMap: CONTRAST_MAP,
  jewelryMap: JEWELRY_MAP,
  makeupMap: MAKEUP_MAP,
};