import undertone from "../assets/undertone.png";

export const under_TONES = {
  warm: ["#F97316"],  
  cool: ["#2196F333"],    
  neutral: ["#71717a"]  
};

export const UNDER_TONE_GUIDE = undertone; // Export the image

export const under_TONE_RESULTS = {
  warm: {
    title: "Warm Undertone",
    depth: "Medium",
    description: "Your skin has golden, peachy, or yellow undertones. You look stunning in earthy, warm colors that complement your natural glow.",
    bestColors: [
      { name: "Terracotta", hex: "#E07952" },
      { name: "Olive", hex: "#8B9C5E" },
      { name: "Mustard", hex: "#D4A04B" },
      { name: "Coral", hex: "#F08080" },
      { name: "Cream", hex: "#F5E6D3" },
      { name: "Camel", hex: "#C19A6B" },
    ],
    avoidColors: [
      { name: "Icy Blue", hex: "#B4D4E7" },
      { name: "Fuchsia", hex: "#C154C1" },
      { name: "Silver", hex: "#C0C0C0" },
    ],
    makeupLink: "https://www.amazon.com/warm-undertone-makeup/s?k=warm+undertone+makeup"
  },
  cool: {
    title: "Cool Undertone",
    depth: "Light",
    description: "Your skin has pink, red, or bluish undertones. You shine in jewel tones and cool colors that bring out your natural radiance.",
    bestColors: [
      { name: "Navy", hex: "#1E3A5F" },
      { name: "Berry", hex: "#8E4585" },
      { name: "Emerald", hex: "#2E8B57" },
      { name: "Lavender", hex: "#B4A7D6" },
      { name: "Rose", hex: "#D4A5A5" },
      { name: "Silver", hex: "#C0C0C0" },
    ],
    avoidColors: [
      { name: "Orange", hex: "#F5A623" },
      { name: "Mustard", hex: "#D4A04B" },
      { name: "Gold", hex: "#FFD700" },
    ],
    makeupLink: "https://www.amazon.com/cool-undertone-makeup/s?k=cool+undertone+makeup"
  },
  neutral: {
    title: "Neutral Undertone",
    depth: "Medium",
    description: "You have a balanced mix of warm and cool undertones. You're lucky — most colors work beautifully on you!",
    bestColors: [
      { name: "Soft White", hex: "#F9F6F2" },
      { name: "Taupe", hex: "#9E8B7E" },
      { name: "Jade", hex: "#00A86B" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Navy", hex: "#4A5568" },
      { name: "Sage", hex: "#9CAF88" },
    ],
    avoidColors: [
      { name: "Neon Yellow", hex: "#DFFF00" },
      { name: "Hot Pink", hex: "#FF69B4" },
    ],
    makeupLink: "https://www.amazon.com/neutral-undertone-makeup/s?k=neutral+undertone+makeup"
  },
};