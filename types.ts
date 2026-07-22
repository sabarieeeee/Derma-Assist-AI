export interface AnalysisPoint {
  title: string;
  details: string;
}

export interface ComparisonResult {
  // Added 'MISMATCH' to the allowed values
  verdict: "IMPROVED" | "WORSENED" | "STABLE" | "UNCLEAR" | "MISMATCH";
  changes: string[];
  recommendation: string;
}

export interface SkinAnalysis {
  isSkin: boolean;
  isHealthy: boolean;
  diseaseName: string | null;
  description: string | null;
  symptoms: AnalysisPoint[] | string[];
  reasons: AnalysisPoint[] | string[];
  precautions: AnalysisPoint[] | string[];
  prevention: AnalysisPoint[] | string[];
  treatments: AnalysisPoint[] | string[];
  medicines: string[];
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
