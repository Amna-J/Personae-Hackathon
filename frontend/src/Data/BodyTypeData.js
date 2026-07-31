// Hourglass
import hourglassWrap from "../assets/clothesrecommendation/hourglasswrap.jpg";
import beltedTopWithLineSkirt from "../assets/clothesrecommendation/beltedtopwithlineskirt.jpg";
import bodycon from "../assets/clothesrecommendation/bodycon.jpg";
import fitAndFlareDress from "../assets/clothesrecommendation/flitandfaredress.jpg";
import vneckAndBootcamps from "../assets/clothesrecommendation/vneckandbootcamps.jpg";
// Apple
import empireWaistDress from "../assets/clothesrecommendation/empirewaistdress.jpg";
import vneckTunicBootcutPants from "../assets/clothesrecommendation/Vneck tunicbootcutpants.jpg";
import flowyWrapDress from "../assets/clothesrecommendation/flowywrapdress.jpg";
import aLineDress from "../assets/clothesrecommendation/Alinedress.jpg";
import statementPantsAndStraightPants from "../assets/clothesrecommendation/statementpantsandstarightpants.jpg";
// Pear
import brightTopAndDarkJeans from "../assets/clothesrecommendation/brighttopanddarkjeans.jpg";
import boatNeckTopAndALineSkirt from "../assets/clothesrecommendation/boatnecktopandalineskirt.jpg";
import ruffledTopBootcutJeans from "../assets/clothesrecommendation/Ruffled top + bootcut jeans.jpg";
import statementSleeveTopDarkPants from "../assets/clothesrecommendation/Statementsleeve topdark pants.jpg";
// Inverted Triangle
import darkTopPleatSkirt from "../assets/clothesrecommendation/Darktoppleated skirt.jpg";
import vneckFlairedPants from "../assets/clothesrecommendation/Vneckflared pants.jpg";
import raglanTopWideLegPants from "../assets/clothesrecommendation/Raglantopwidelegpants.jpg";

// Rectangle
import beltedDress from "../assets/clothesrecommendation/Belteddress.jpg";
import peplumTopPleatSkirt from "../assets/clothesrecommendation/Peplumtoppleatedskirt.jpg";
import bodytype from "../assets/bodytype.png";
export const BODY_TYPE_GUIDE = bodytype;
export const BODY_ICONS = ["⌛", "🍎", "🍐", "🔺", "📏"];
export const BODY_TYPES = [
  {
    id: "hourglass",
    name: "Hourglass",
    icon: "⌛",
    description: "Balanced shoulders and hips with a defined waist",
    shortDescription: "Defined waist, balanced proportions",
    strengths: ["Defined Waist", "Curvy Hips", "Balanced Shoulders"],
    goals: ["Accentuate Curves", "Maintain Balance", "Define Waist"],
    tips: [
      "Wrap dresses and tops are your best friend",
      "Belted styles highlight your waist perfectly",
      "Avoid boxy cuts that hide your shape",
      "V-necklines complement your proportions"
    ],
    outfitPhotos: [
      { photo: hourglassWrap, label: "Wrap Dress" },
      { photo: beltedTopWithLineSkirt, label: "Belted Top + Skirt" },
      { photo: bodycon, label: "Bodycon Dress" },
      { photo: fitAndFlareDress, label: "Fit & Flare" },
      { photo: vneckAndBootcamps, label: "V-Neck + Bootcut" },
    ],
    clothingSuggestions: {
      tops: [
        { name: "Wrap Tops", reason: "Accentuates waist" },
        { name: "Peplum Tops", reason: "Highlights curves" },
        { name: "V-Neck Blouses", reason: "Balances proportions" }
      ],
      bottoms: [
        { name: "Pencil Skirts", reason: "Follows your curves" },
        { name: "Bootcut Pants", reason: "Balances hips" },
        { name: "A-Line Skirts", reason: "Flattering silhouette" }
      ],
      dresses: [
        { name: "Wrap Dresses", reason: "Perfect for waist definition" },
        { name: "Fit & Flare", reason: "Celebrates curves" },
        { name: "Bodycon", reason: "Showcases shape" }
      ]
    },
    wardrobeLink: "https://www.utsavfashion.com/concepts/hourglass-body-shape"
  },
  {
    id: "apple",
    name: "Apple",
    icon: "🍎",
    description: "Broader shoulders, fuller midsection with slimmer legs",
    shortDescription: "Fuller midsection, slender legs",
    strengths: ["Great Legs", "Elegant Neckline", "Stylish Arms"],
    goals: ["Create Definition", "Lengthen Torso", "Draw Attention Up"],
    tips: [
      "Empire waistlines create length",
      "V-necks elongate your upper body",
      "Flowy fabrics skim over midsection",
      "Statement jewelry draws eyes upward"
    ],
    outfitPhotos: [
      { photo: empireWaistDress, label: "Empire Waist Dress" },
      { photo: vneckTunicBootcutPants, label: "V-Neck Tunic + Pants" },
      { photo: flowyWrapDress, label: "Flowy Wrap Dress" },
      { photo: aLineDress, label: "A-Line Dress" },
      { photo: statementPantsAndStraightPants, label: "Statement Pants" },
    ],
    clothingSuggestions: {
      tops: [
        { name: "V-Neck Tops", reason: "Elongates torso" },
        { name: "Empire Waist", reason: "Creates definition" },
        { name: "Flowy Tunics", reason: "Comfortable fit" }
      ],
      bottoms: [
        { name: "Bootcut Pants", reason: "Balances proportions" },
        { name: "A-Line Skirts", reason: "Flattering silhouette" },
        { name: "Straight Leg", reason: "Creates balance" }
      ],
      dresses: [
        { name: "Empire Waist Dresses", reason: "Lengthens silhouette" },
        { name: "Wrap Dresses", reason: "Creates shape" },
        { name: "A-Line Dresses", reason: "Flowing fit" }
      ]
    },
    wardrobeLink: "https://www.utsavfashion.com/concepts/apple-body-shape"
  },
  {
    id: "pear",
    name: "Pear",
    icon: "🍐",
    description: "Hips wider than shoulders with a defined waist",
    shortDescription: "Defined waist, fuller hips",
    strengths: ["Defined Waist", "Curvy Hips", "Toned Arms"],
    goals: ["Balance Proportions", "Accentuate Upper Body", "Highlight Waist"],
    tips: [
      "Boat necks broaden shoulders visually",
      "Dark bottoms minimize hips",
      "Bright tops draw attention upward",
      "Fit & flare dresses balance proportions"
    ],
    outfitPhotos: [
      { photo: brightTopAndDarkJeans, label: "Bright Top + Dark Jeans" },
      { photo: boatNeckTopAndALineSkirt, label: "Boat Neck + A-Line" },
      { photo: fitAndFlareDress, label: "Fit & Flare Dress" },
      { photo: ruffledTopBootcutJeans, label: "Ruffled Top + Bootcut" },
      { photo: statementSleeveTopDarkPants, label: "Statement Sleeve Top" },
    ],
    clothingSuggestions: {
      tops: [
        { name: "Boat Neck Tops", reason: "Broadens shoulders" },
        { name: "Statement Sleeves", reason: "Adds upper volume" },
        { name: "Bright Colors", reason: "Draws attention up" }
      ],
      bottoms: [
        { name: "Dark Wash Jeans", reason: "Minimizes hips" },
        { name: "A-Line Skirts", reason: "Flows over hips" },
        { name: "Bootcut Pants", reason: "Balances proportions" }
      ],
      dresses: [
        { name: "Fit & Flare", reason: "Perfect for pear shape" },
        { name: "A-Line Dresses", reason: "Flattering silhouette" },
        { name: "Dark Bottoms", reason: "Minimizes lower half" }
      ]
    },
    wardrobeLink: "https://www.utsavfashion.com/concepts/pear-body-shape"
  },
  {
    id: "inverted-triangle",
    name: "Inverted Triangle",
    icon: "🔺",
    description: "Broader shoulders with narrower hips",
    shortDescription: "Broad shoulders, narrow hips",
    strengths: ["Strong Shoulders", "Toned Arms", "Elegant Neckline"],
    goals: ["Minimize Shoulders", "Add Hip Volume", "Create Balance"],
    tips: [
      "Dark tops minimize shoulders",
      "Light bottoms add volume to hips",
      "V-necks soften shoulder line",
      "Pleated skirts create lower volume"
    ],
    outfitPhotos: [
      { photo: darkTopPleatSkirt, label: "Dark Top + Pleated Skirt" },
      { photo: vneckFlairedPants, label: "V-Neck + Flared Pants" },
      { photo: aLineDress, label: "A-Line Dress" },
      { photo: raglanTopWideLegPants, label: "Raglan + Wide Leg" },
      { photo: fitAndFlareDress, label: "Fit & Flare Dress" },
    ],
    clothingSuggestions: {
      tops: [
        { name: "V-Neck Tops", reason: "Softens shoulders" },
        { name: "Dark Colors", reason: "Minimizes upper body" },
        { name: "Raglan Sleeves", reason: "Reduces shoulder width" }
      ],
      bottoms: [
        { name: "Pleated Skirts", reason: "Adds hip volume" },
        { name: "Light Colors", reason: "Draws attention down" },
        { name: "Flared Pants", reason: "Creates balance" }
      ],
      dresses: [
        { name: "A-Line Dresses", reason: "Adds lower volume" },
        { name: "Fit & Flare", reason: "Balances proportions" },
        { name: "Dark Top Dresses", reason: "Minimizes shoulders" }
      ]
    },
    wardrobeLink: "https://www.utsavfashion.com/concepts/inverted-triangle-body-shape"
  },
  {
    id: "rectangle",
    name: "Rectangle",
    icon: "📏",
    description: "Balanced shoulders and hips with minimal waist definition",
    shortDescription: "Athletic, straight silhouette",
    strengths: ["Athletic Build", "Versatile Styling", "Long Lines"],
    goals: ["Create Curves", "Define Waist", "Add Shape"],
    tips: [
      "Belted styles create waist definition",
      "Peplum tops add curve to hips",
      "Layered looks add dimension",
      "Textured fabrics create interest"
    ],
    outfitPhotos: [
      { photo: beltedDress, label: "Belted Dress" },
      { photo: peplumTopPleatSkirt, label: "Peplum + Pleated Skirt" },
      { photo: fitAndFlareDress, label: "Fit & Flare Dress" },
      { photo: flowyWrapDress, label: "Wrap Dress with Belt" },
      { photo: raglanTopWideLegPants, label: "Ruffled + Wide Leg" },
    ],
    clothingSuggestions: {
      tops: [
        { name: "Peplum Tops", reason: "Adds hip curve" },
        { name: "Belted Styles", reason: "Creates waist" },
        { name: "Ruffled Details", reason: "Adds dimension" }
      ],
      bottoms: [
        { name: "Pleated Pants", reason: "Adds volume" },
        { name: "A-Line Skirts", reason: "Creates curves" },
        { name: "Wide Leg", reason: "Adds shape" }
      ],
      dresses: [
        { name: "Belted Dresses", reason: "Defines waist" },
        { name: "Fit & Flare", reason: "Creates curves" },
        { name: "Wrap Dresses", reason: "Adds shape" }
      ]
    },
    wardrobeLink: "https://www.utsavfashion.com/concepts/rectangle-body-shape"
  }
];