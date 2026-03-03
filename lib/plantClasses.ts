// ═══════════════════════════════════════════════════════════════════════════════
// PlantVillage 38 Disease Classes
//
// CRITICAL: This array MUST match the alphabetically-sorted directory names
// from the training dataset (vipoooool/new-plant-diseases-dataset).
// tf.keras.utils.image_dataset_from_directory sorts class names using
// Python's sorted() (case-sensitive ASCII sort), producing THIS exact order.
//
// The model's output index i corresponds to PLANT_CLASSES[i].
// Do NOT reorder these entries unless the model is retrained.
// ═══════════════════════════════════════════════════════════════════════════════

export const PLANT_CLASSES = [
  "Apple___Apple_scab",                                      // 0
  "Apple___Black_rot",                                       // 1
  "Apple___Cedar_apple_rust",                                // 2
  "Apple___healthy",                                         // 3
  "Blueberry___healthy",                                     // 4
  "Cherry_(including_sour)___Powdery_mildew",                // 5
  "Cherry_(including_sour)___healthy",                       // 6
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",      // 7
  "Corn_(maize)___Common_rust_",                             // 8
  "Corn_(maize)___Northern_Leaf_Blight",                     // 9
  "Corn_(maize)___healthy",                                  // 10
  "Grape___Black_rot",                                       // 11
  "Grape___Esca_(Black_Measles)",                            // 12
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",              // 13
  "Grape___healthy",                                         // 14
  "Orange___Haunglongbing_(Citrus_greening)",                // 15
  "Peach___Bacterial_spot",                                  // 16
  "Peach___healthy",                                         // 17
  "Pepper,_bell___Bacterial_spot",                           // 18
  "Pepper,_bell___healthy",                                  // 19
  "Potato___Early_blight",                                   // 20
  "Potato___Late_blight",                                    // 21
  "Potato___healthy",                                        // 22
  "Raspberry___healthy",                                     // 23
  "Soybean___healthy",                                       // 24
  "Squash___Powdery_mildew",                                 // 25
  "Strawberry___Leaf_scorch",                                // 26
  "Strawberry___healthy",                                    // 27
  "Tomato___Bacterial_spot",                                 // 28
  "Tomato___Early_blight",                                   // 29
  "Tomato___Late_blight",                                    // 30
  "Tomato___Leaf_Mold",                                      // 31
  "Tomato___Septoria_leaf_spot",                              // 32
  "Tomato___Spider_mites Two-spotted_spider_mite",           // 33
  "Tomato___Target_Spot",                                    // 34
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus",                  // 35
  "Tomato___Tomato_mosaic_virus",                            // 36
  "Tomato___healthy",                                        // 37
];

export const DISEASE_INFO: Record<string, { description: string; treatment: string[] }> = {
  "Apple_scab": {
    description: "Fungal disease causing dark, scabby lesions on leaves and fruit.",
    treatment: [
      "Remove and destroy infected leaves",
      "Apply fungicide in early spring",
      "Ensure good air circulation",
      "Choose resistant varieties"
    ]
  },
  "Black_rot": {
    description: "Fungal disease causing leaf spots and fruit rot.",
    treatment: [
      "Prune infected branches",
      "Remove mummified fruit",
      "Apply copper-based fungicides",
      "Maintain tree health with proper fertilization"
    ]
  },
  "Cedar_apple_rust": {
    description: "Fungal disease requiring both apple and cedar trees to complete lifecycle.",
    treatment: [
      "Remove nearby cedar trees if possible",
      "Apply fungicides during wet spring weather",
      "Plant resistant apple varieties",
      "Rake and destroy fallen leaves"
    ]
  },
  "Powdery_mildew": {
    description: "Fungal disease appearing as white powdery coating on leaves.",
    treatment: [
      "Improve air circulation",
      "Apply sulfur or potassium bicarbonate sprays",
      "Remove infected plant parts",
      "Water at soil level, not overhead"
    ]
  },
  "Cercospora_leaf_spot": {
    description: "Fungal disease causing rectangular gray-brown lesions on corn leaves.",
    treatment: [
      "Plant resistant hybrids",
      "Rotate crops annually",
      "Remove crop debris after harvest",
      "Apply fungicides if severe"
    ]
  },
  "Common_rust": {
    description: "Fungal disease with circular to elongate brown pustules on leaves.",
    treatment: [
      "Plant resistant varieties",
      "Apply fungicides early in season",
      "Monitor fields regularly",
      "Ensure adequate plant nutrition"
    ]
  },
  "Northern_Leaf_Blight": {
    description: "Fungal disease causing long, elliptical gray-green lesions.",
    treatment: [
      "Use resistant hybrids",
      "Rotate with non-host crops",
      "Bury crop residue",
      "Apply fungicides preventatively"
    ]
  },
  "Bacterial_spot": {
    description: "Bacterial disease causing dark spots with yellow halos on leaves and fruit.",
    treatment: [
      "Use disease-free seeds",
      "Apply copper-based bactericides",
      "Avoid overhead irrigation",
      "Remove and destroy infected plants"
    ]
  },
  "Early_blight": {
    description: "Fungal disease with concentric ring patterns on older leaves.",
    treatment: [
      "Remove infected lower leaves",
      "Apply fungicides preventatively",
      "Mulch to prevent soil splash",
      "Rotate crops for 3-4 years"
    ]
  },
  "Late_blight": {
    description: "Devastating fungal disease causing rapid plant death.",
    treatment: [
      "Apply fungicides immediately",
      "Remove and destroy infected plants",
      "Avoid overhead watering",
      "Plant certified disease-free seed"
    ]
  },
  "Leaf_Mold": {
    description: "Fungal disease thriving in humid conditions with pale spots on leaves.",
    treatment: [
      "Improve greenhouse ventilation",
      "Reduce humidity levels",
      "Remove infected leaves",
      "Apply fungicides if necessary"
    ]
  },
  "Septoria_leaf_spot": {
    description: "Fungal disease with small circular spots with dark borders.",
    treatment: [
      "Remove infected leaves immediately",
      "Apply copper fungicides",
      "Mulch around plants",
      "Space plants for air circulation"
    ]
  },
  "Spider_mites": {
    description: "Tiny pests causing stippling and webbing on leaves.",
    treatment: [
      "Spray with water to dislodge mites",
      "Apply insecticidal soap",
      "Introduce predatory mites",
      "Keep plants well-watered"
    ]
  },
  "Target_Spot": {
    description: "Fungal disease with concentric rings resembling a target.",
    treatment: [
      "Remove infected plant debris",
      "Apply fungicides regularly",
      "Avoid overhead irrigation",
      "Rotate crops"
    ]
  },
  "Yellow_Leaf_Curl_Virus": {
    description: "Viral disease causing upward leaf curling and yellowing.",
    treatment: [
      "Control whitefly vectors",
      "Remove infected plants immediately",
      "Use reflective mulches",
      "Plant resistant varieties"
    ]
  },
  "mosaic_virus": {
    description: "Viral disease causing mottled light and dark green patterns.",
    treatment: [
      "Remove infected plants",
      "Control aphid vectors",
      "Disinfect tools between plants",
      "Plant resistant varieties"
    ]
  },
  "Leaf_scorch": {
    description: "Fungal disease causing brown, scorched-looking leaf margins.",
    treatment: [
      "Remove infected leaves",
      "Improve air circulation",
      "Apply fungicides in spring",
      "Avoid overhead watering"
    ]
  },
  "Citrus_greening": {
    description: "Bacterial disease causing yellow shoots and misshapen fruit.",
    treatment: [
      "Remove infected trees immediately",
      "Control psyllid vectors",
      "Use certified disease-free nursery stock",
      "Monitor trees regularly"
    ]
  },
  "Esca": {
    description: "Complex fungal disease causing leaf discoloration and wood decay.",
    treatment: [
      "Prune during dry weather",
      "Remove infected wood",
      "Apply wound protectants",
      "Maintain vine vigor"
    ]
  },
  "Leaf_blight": {
    description: "Fungal disease causing brown lesions and premature leaf drop.",
    treatment: [
      "Apply fungicides preventatively",
      "Remove infected leaves",
      "Improve air circulation",
      "Avoid wetting foliage"
    ]
  }
};

export function parseClassName(className: string): { plant: string; condition: string } {
  const parts = className.split("___");
  const plant = parts[0].replace(/_/g, " ").replace(",", ", ").trim().replace(/\s+/g, " ");
  const condition = parts[1] ? parts[1].replace(/_/g, " ").trim().replace(/\s+/g, " ") : "Unknown";
  return { plant, condition };
}

export function getDiseaseInfo(condition: string) {
  const key = Object.keys(DISEASE_INFO).find(k => 
    condition.toLowerCase().includes(k.toLowerCase().replace(/_/g, " "))
  );
  return key ? DISEASE_INFO[key] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Severity Classification
//
// Based on real-world agricultural impact:
//   high   — Devastating to crops, rapid spread, major yield loss
//   medium — Significant damage but manageable with treatment
//   low    — Cosmetic or easily treatable conditions
//   none   — Healthy plant (no disease)
// ═══════════════════════════════════════════════════════════════════════════════

const SEVERITY_MAP: Record<string, 'low' | 'medium' | 'high'> = {
  // HIGH — Crop-devastating diseases
  "late blight": "high",
  "citrus greening": "high",
  "haunglongbing": "high",
  "yellow leaf curl virus": "high",
  "tomato mosaic virus": "high",
  "mosaic virus": "high",
  "black rot": "high",
  "esca": "high",
  "black measles": "high",

  // MEDIUM — Significant but manageable
  "early blight": "medium",
  "bacterial spot": "medium",
  "cercospora": "medium",
  "gray leaf spot": "medium",
  "common rust": "medium",
  "northern leaf blight": "medium",
  "septoria": "medium",
  "target spot": "medium",
  "spider mites": "medium",
  "apple scab": "medium",
  "cedar apple rust": "medium",
  "leaf blight": "medium",
  "isariopsis": "medium",
  "leaf scorch": "medium",

  // LOW — Cosmetic or easily treatable
  "powdery mildew": "low",
  "leaf mold": "low",
};

export function getSeverity(condition: string): 'low' | 'medium' | 'high' | 'none' {
  const condLower = condition.toLowerCase();

  if (condLower.includes("healthy")) return "none";

  for (const [keyword, severity] of Object.entries(SEVERITY_MAP)) {
    if (condLower.includes(keyword)) return severity;
  }

  // Default for unrecognized diseases
  return "medium";
}
