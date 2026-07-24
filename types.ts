export interface AnalysisPoint {
  label: string;
  value: string;
}

export interface SkinAnalysis {
  diseaseName: string;
  overview: string;
  severityLevel: number;
  precautions?: string[];
  causes?: string[];
  recommendations?: string[];
  [key: string]: any;
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  imageData: string;
  label: string;
  analysis?: SkinAnalysis;
}

export interface ComparisonResult {
  verdict: 'Improved' | 'Unchanged' | 'Requires Medical Attention';
  summary: string;
  keyChanges: string[];
  recommendations: string[];
}