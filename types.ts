
export interface SkinAnalysis {
  isSkin: boolean;
  isHealthy: boolean;
  diseaseName: string | null;
  description: string | null;
  treatments: string[];
  medicines: string[];
  symptoms: string[];
  reasons: string[];
  healingPeriod: string | null;
  precautions: string[];
  prevention: string[];
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  imageData: string;
  label: string;
  analysis?: SkinAnalysis;
}

export type DetailCategory = 'Symptoms' | 'Causes' | 'Care & Precautions' | 'Healing & Tracking' | null;
