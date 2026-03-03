export interface PlantClass {
  id: number;
  name: string;
  plant: string;
  condition: string;
}

export interface Prediction {
  class: string;
  plant: string;
  condition: string;
  confidence: number;
}

export interface DetectionResult {
  id: string;
  imageUrl: string;
  predictions: Prediction[];
  topPrediction: Prediction;
  timestamp: Date;
  userId?: string;
}

export interface HistoryItem {
  id: string;
  imageUrl: string;
  plant: string;
  condition: string;
  confidence: number;
  timestamp: Date;
  recommendations?: string[];
}

export interface Statistics {
  totalScans: number;
  healthyPlants: number;
  diseasedPlants: number;
  mostCommonDisease: string;
  recentScans: HistoryItem[];
}
