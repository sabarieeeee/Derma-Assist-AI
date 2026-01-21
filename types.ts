// Structure for the new detailed bullet points (Title + Description)
export interface AnalysisPoint {
  title: string;
  details: string;
}

// Structure for the Progression Comparison Result
export interface ComparisonResult {
  verdict: "IMPROVED" | "WORSENED" | "STABLE" | "UNCLEAR";
  changes: string[];
  recommendation: string;
  differentconditions: string;
}

// Main Analysis Data Structure
export interface SkinAnalysis {
  isSkin: boolean;
  isHealthy: boolean;
  diseaseName: string | null;
  description: string | null;
  
  // Updated to allow both new objects (AnalysisPoint) and old strings (for history compatibility)
  symptoms: AnalysisPoint[] | string[];
  reasons: AnalysisPoint[] | string[];
  precautions: AnalysisPoint[] | string[];
  prevention: AnalysisPoint[] | string[];
  treatments: AnalysisPoint[] | string[];
  
  medicines: string[]; // Medicines usually stay as simple strings
  healingPeriod: string | null;
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  imageData: string;
  label: string;
  analysis?: SkinAnalysis;
}

export type DetailCategory = 'Symptoms' | 'Causes' | 'Care & Precautions' | 'Healing & Tracking' | null;
