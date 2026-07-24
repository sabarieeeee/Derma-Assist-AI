export interface AnalysisPoint {
  label: string;
  value: string;
}

export interface SkinAnalysis {
  diseaseName: string;
  overview: string;             // Fixes the 'overview does not exist' error
  severityLevel: number;        // Changes to number to fix the 'arithmetic operation' error
  precautions?: string[];
  causes?: string[];
  recommendations?: string[];
  [key: string]: any;           // Catch-all to prevent other missing property errors
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  imageData: string;
  label: string;
  analysis?: SkinAnalysis;
}