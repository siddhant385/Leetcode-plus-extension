export interface ApproachData {
  summary: string;
  current: string;
  suggested: string;
  keyIdea: string;
}

export interface EfficiencyData {
  timeCurrent: string; // e.g. "O(N)"
  timeSuggested: string; // e.g. "O(1)"
  spaceCurrent: string; // e.g. "O(N)"
  spaceSuggested: string; // e.g. "O(1)"
  suggestions: string;
}

export interface CodeStyleData {
  readability: "Poor" | "Average" | "Good" | "Excellent";
  structure: "Poor" | "Average" | "Good" | "Excellent";
  suggestions: string;
}

export interface AnalysisResultData {
  approach: ApproachData;
  efficiency: EfficiencyData;
  codeStyle: CodeStyleData;
}
