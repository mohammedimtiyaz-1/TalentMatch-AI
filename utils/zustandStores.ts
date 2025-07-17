import { create } from "zustand";

export type JobObject = {
  title: string;
  skills: string;
  qualifications: string;
  description: string;
};

export type Candidate = {
  name: string;
  email: string;
  rawText: string;
  fileName: string;
  aiInsights?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    questions: string[];
  };
};

// Job store
interface JobState {
  job: JobObject | null;
  setJob: (job: JobObject) => void;
}

export const useJobStore = create<JobState>((set) => ({
  job: null,
  setJob: (job) => set({ job }),
}));

// Candidate store
interface CandidateState {
  candidates: Candidate[];
  addCandidate: (candidate: Candidate) => void;
  removeCandidate: (index: number) => void;
}

export const useCandidateStore = create<CandidateState>((set) => ({
  candidates: [],
  addCandidate: (candidate) =>
    set((state) => ({ candidates: [...state.candidates, candidate] })),
  removeCandidate: (index) =>
    set((state) => ({
      candidates: state.candidates.filter((_, i) => i !== index),
    })),
}));
