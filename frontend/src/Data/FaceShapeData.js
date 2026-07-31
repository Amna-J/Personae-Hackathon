import bobWavyHairs from "../assets/hairstyles/bobwavyhairs.jpg";
import longWavyLayers from "../assets/hairstyles/longwavylayers.jpg";
import sideSweeptBangs from "../assets/hairstyles/sidesweptbangs.jpg";
import chinLengthBob from "../assets/hairstyles/chinlengthbob.jpg";
import longlayers from "../assets/hairstyles/longlayers.jpg";
import curtainBangs from "../assets/hairstyles/curtainbangs.jpg";
import voluminousWaves from "../assets/hairstyles/voloumnouswaves.jpg";
import longAndWispy from "../assets/hairstyles/longandwispy.jpg";
import texturedLayer from "../assets/hairstyles/texturedlayer.jpg";
import softWaves from "../assets/hairstyles/softwaves.jpg";
import highPonytail from "../assets/hairstyles/highponytail.jpg";
import sidePart from "../assets/hairstyles/sidepart.jpg";
import bobCut from "../assets/hairstyles/bobcut.jpg";
import faceshape from "../assets/faceshape.png";

// Jewellery imports
import teardrop from "../assets/jewellery/teardrop.jpg";
import chandelier from "../assets/jewellery/chandler.jpg";
import hoop from "../assets/jewellery/hoop.jpg";
import pendantNecklace from "../assets/jewellery/pendent necklace.jpg";
import longDropEarrings from "../assets/jewellery/longdropearings.jpg";
import angularGeometric from "../assets/jewellery/angulargeometric.jpg";
import vShapeNecklace from "../assets/jewellery/vshapenecklace.jpg";
import elongatedPendant from "../assets/jewellery/elongatedpendent.jpg";
import curvedDangly from "../assets/jewellery/curveddangly.jpg";
import ovalPendant from "../assets/jewellery/ovalpendant.jpg";
import layeredNecklace from "../assets/jewellery/layerednecklace.jpg";
import wideBottomEarrings from "../assets/jewellery/widebottomrearings.jpg";
import clusterEarrings from "../assets/jewellery/cluster earings.jpg";
import shortChandelier from "../assets/jewellery/shortchandler.jpg";
import chokerNecklace from "../assets/jewellery/chockernecklace.jpg";

export const FACE_SHAPES = [
  {
    id: "oval",
    name: "Oval",
    description: "Balanced proportions with a slightly narrower forehead and chin",
    characteristics: ["Cheekbones are the widest point", "Forehead slightly wider than chin", "Face length is 1.5x width"],
    icon: "🥚",
    color: "from-rose-400 to-pink-500",
    bestHairstyles: [
      { name: "Long Layers", description: "Frames face beautifully, adds movement", image: "💇‍♀️", photo: longlayers },
      { name: "Side-Swept Bangs", description: "Adds softness without hiding features", image: "✨", photo: sideSweeptBangs },
      { name: "Bob Cut", description: "Classic and versatile for your shape", image: "💈", photo: bobCut },
      { name: "Curtain Bangs", description: "Trendy, face-framing perfection", image: "🌟", photo: curtainBangs },
    ],
    avoidHairstyles: ["Heavy blunt bangs", "Styles that add too much volume at sides"],
    tips: "Lucky you! Oval faces suit almost any hairstyle. Experiment freely!",
    bestJewelry: [
      { name: "Teardrop Earrings", description: "Elegant and flattering for your balanced features", icon: "💧", photo: teardrop },
      { name: "Chandelier Earrings", description: "Adds drama without overwhelming", icon: "✨", photo: chandelier },
      { name: "Statement Hoops", description: "Any size works beautifully", icon: "⭕", photo: hoop },
      { name: "Pendant Necklaces", description: "Draws attention to your neckline", icon: "📿", photo: pendantNecklace },
    ],
    avoidJewelry: ["None really! You can wear almost any style"],
  },
  {
    id: "round",
    name: "Round",
    description: "Soft, circular shape with full cheeks",
    characteristics: ["Face width and length are similar", "Soft, rounded jawline", "Full cheeks"],
    icon: "🔵",
    color: "from-blue-400 to-cyan-500",
    bestHairstyles: [
      { name: "Long Straight Hair", description: "Elongates the face beautifully", image: "💇‍♀️", photo: longlayers },
      { name: "Side Part", description: "Creates asymmetry and length", image: "✂️", photo: sidePart },
      { name: "Layered Lob", description: "Adds height and dimension", image: "💈", photo: longWavyLayers },
      { name: "High Ponytail", description: "Lifts and lengthens face shape", image: "👸", photo: highPonytail },
    ],
    avoidHairstyles: ["Chin-length bobs", "Heavy straight bangs", "Center parts with volume"],
    tips: "Go for height and length! Styles that add vertical dimension work best.",
    bestJewelry: [
      { name: "Long Drop Earrings", description: "Creates vertical lines to elongate", icon: "📍", photo: longDropEarrings },
      { name: "Angular Geometric Shapes", description: "Adds definition and structure", icon: "🔷", photo: angularGeometric },
      { name: "V-Shape Necklaces", description: "Draws the eye down, creates length", icon: "💎", photo: vShapeNecklace },
      { name: "Elongated Pendants", description: "Perfect for adding vertical dimension", icon: "📿", photo: elongatedPendant },
    ],
    avoidJewelry: ["Round hoops", "Button earrings", "Chokers that emphasize width"],
  },
  {
    id: "square",
    name: "Square",
    description: "Strong jawline with angular features",
    characteristics: ["Forehead, cheekbones, and jaw are similar width", "Strong, defined jawline", "Angular appearance"],
    icon: "⬜",
    color: "from-purple-400 to-indigo-500",
    bestHairstyles: [
      { name: "Soft Waves", description: "Softens angular features", image: "🌊", photo: softWaves },
      { name: "Side-Swept Styles", description: "Adds movement and softness", image: "💫", photo: sideSweeptBangs },
      { name: "Textured Layers", description: "Creates soft, feminine look", image: "✨", photo: texturedLayer },
      { name: "Long & Wispy", description: "Balances strong features", image: "💇‍♀️", photo: longAndWispy },
    ],
    avoidHairstyles: ["Blunt cuts at jaw level", "Straight heavy bangs", "Severe slicked-back styles"],
    tips: "Embrace softness and texture to complement your striking bone structure!",
    bestJewelry: [
      { name: "Round Hoops", description: "Softens angular features beautifully", icon: "⭕", photo: hoop },
      { name: "Curved Dangly Earrings", description: "Adds flowing movement", icon: "🌙", photo: curvedDangly },
      { name: "Oval Pendants", description: "Creates softness around face", icon: "💫", photo: ovalPendant },
      { name: "Layered Necklaces", description: "Adds curves and femininity", icon: "📿", photo: layeredNecklace },
    ],
    avoidJewelry: ["Square or rectangular shapes", "Angular geometric designs", "Chunky box chains"],
  },
  {
    id: "heart",
    name: "Heart",
    description: "Wider forehead tapering to a pointed chin",
    characteristics: ["Forehead is the widest point", "High cheekbones", "Narrow, pointed chin"],
    icon: "💜",
    color: "from-pink-400 to-rose-500",
    bestHairstyles: [
      { name: "Chin-Length Bob", description: "Adds width at the chin area", image: "💈", photo: chinLengthBob },
      { name: "Side-Swept Bangs", description: "Minimizes forehead width", image: "✨", photo: sideSweeptBangs },
      { name: "Wavy Layers", description: "Adds volume at cheeks and chin", image: "🌊", photo: bobWavyHairs },
      { name: "Lob with Waves", description: "Perfect balance for your features", image: "💇‍♀️", photo: longWavyLayers },
    ],
    avoidHairstyles: ["Voluminous tops", "Slicked back styles", "Very short pixies"],
    tips: "Add volume and width around your chin and jawline for perfect balance!",
    bestJewelry: [
      { name: "Teardrop Earrings", description: "Adds width at the lower face", icon: "💧", photo: teardrop },
      { name: "Chandelier Styles", description: "Widens the chin area beautifully", icon: "✨", photo: chandelier },
      { name: "Wider Bottom Earrings", description: "Balances narrow chin", icon: "🔻", photo: wideBottomEarrings },
      { name: "Pendant Necklaces", description: "Draws attention downward", icon: "📿", photo: pendantNecklace },
    ],
    avoidJewelry: ["Top-heavy earrings", "Wide studs", "Pieces that add forehead width"],
  },
  {
    id: "oblong",
    name: "Oblong",
    description: "Long and narrow face with a long straight cheek line",
    characteristics: ["Face length is greater than width", "Forehead, cheekbones and jaw are similar width", "Long straight cheek line"],
    icon: "🪞",
    color: "from-amber-400 to-yellow-500",
    bestHairstyles: [
      { name: "Voluminous Waves", description: "Adds width to balance length", image: "🌊", photo: voluminousWaves },
      { name: "Side-Swept Bangs", description: "Shortens appearance of face", image: "✨", photo: sideSweeptBangs },
      { name: "Chin-Length Bob", description: "Adds width at jaw level", image: "💈", photo: chinLengthBob },
      { name: "Layered Cut", description: "Creates fullness on the sides", image: "💇‍♀️", photo: longlayers },
    ],
    avoidHairstyles: ["Long straight hair", "Center parts", "Styles that add height on top"],
    tips: "Add width and volume to the sides to balance your elegant long face shape!",
    bestJewelry: [
      { name: "Wide Hoops", description: "Adds width to balance face length", icon: "⭕", photo: hoop },
      { name: "Cluster Earrings", description: "Creates horizontal visual width", icon: "✨", photo: clusterEarrings },
      { name: "Short Chandelier Earrings", description: "Widens without adding length", icon: "💎", photo: shortChandelier },
      { name: "Choker Necklaces", description: "Shortens the face visually", icon: "📿", photo: chokerNecklace },
    ],
    avoidJewelry: ["Long drop earrings", "Vertical pendants", "Styles that add face length"],
  },
];

export const FACE_ICONS = ["🥚", "🔵", "⬜", "💜", "🪞"];
export const FACE_SHAPES_GUIDE = faceshape;