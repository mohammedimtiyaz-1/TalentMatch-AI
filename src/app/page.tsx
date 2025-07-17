"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useJobStore,
  useCandidateStore,
  JobObject,
  Candidate,
} from "../../utils/zustandStores";
import mammoth from "mammoth";
import * as fileType from "file-type";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const jobSchema = z.object({
  title: z.string().min(2, "Title is required"),
  skills: z.string().min(1, "Skills are required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  description: z.string().min(1, "Description is required"),
});

export default function Home() {
  const [mdValue, setMdValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const job = useJobStore((s: { job: JobObject | null }) => s.job);
  const setJob = useJobStore(
    (s: { setJob: (job: JobObject) => void }) => s.setJob
  );
  const candidates = useCandidateStore(
    (s: { candidates: Candidate[] }) => s.candidates
  );
  const addCandidate = useCandidateStore(
    (s: { addCandidate: (candidate: Candidate) => void }) => s.addCandidate
  );
  const removeCandidate = useCandidateStore(
    (s: { removeCandidate: (index: number) => void }) => s.removeCandidate
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobObject>({
    resolver: zodResolver(jobSchema),
    defaultValues: job || {
      title: "",
      skills: "",
      qualifications: "",
      description: "",
    },
  });

  const onSubmit = (data: JobObject) => {
    setJob({ ...data, description: mdValue });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileErrors([]);
    setUploading(true);
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const type = await fileType.fileTypeFromBuffer(
          Buffer.from(arrayBuffer)
        );
        let text = "";
        if (type?.ext === "pdf" || file.name.endsWith(".pdf")) {
          setFileErrors((prev) => [
            ...prev,
            `${file.name}: PDF parsing is not supported in browser`,
          ]);
          continue;
        } else if (type?.ext === "docx" || file.name.endsWith(".docx")) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else {
          setFileErrors((prev) => [
            ...prev,
            `${file.name}: Unsupported file type`,
          ]);
          continue;
        }
        // Extract name/email
        const nameMatch = text.match(/([A-Z][a-z]+\s[A-Z][a-z]+)/);
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/);
        addCandidate({
          name: nameMatch?.[0] || "",
          email: emailMatch?.[0] || "",
          rawText: text,
          fileName: file.name,
        });
      } catch (err) {
        setFileErrors((prev) => [...prev, `${file.name}: Error parsing file`]);
      }
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>TalentMatch AI</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
        {/* SECTION 1: Job Description Form */}
        <section style={{ flex: 1, minWidth: 320 }}>
          <h2>Job Description</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <MDEditor
                value={mdValue}
                onChange={(v) => setMdValue(v || "")}
                preview="edit"
                height={200}
                visiableDragbar={false}
                data-color-mode="light"
                style={{ marginBottom: 8 }}
              />
              {errors.description && (
                <span style={{ color: "red" }}>
                  {errors.description.message}
                </span>
              )}
            </div>
            <button type="submit" disabled={!!job} style={{ marginTop: 12 }}>
              {job ? "Job Saved" : "Save Job"}
            </button>
          </form>
        </section>
        {/* SECTION 2: Resume Upload & Evaluation Panel */}
        <section style={{ flex: 1, minWidth: 320 }}>
          <h2>Resume Upload & Evaluation</h2>
          <input
            type="file"
            accept=".pdf,.docx"
            multiple
            disabled={!job || uploading}
            onChange={handleFileUpload}
          />
          {fileErrors.length > 0 && (
            <ul style={{ color: "red" }}>
              {fileErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 16 }}>
            {candidates.map((c: Candidate, idx: number) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <strong>{c.fileName}</strong>
                <div>
                  <em>Name:</em>{" "}
                  {c.name || <span style={{ color: "#888" }}>Not found</span>}
                </div>
                <div>
                  <em>Email:</em>{" "}
                  {c.email || <span style={{ color: "#888" }}>Not found</span>}
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 8 }}>
                  <pre
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {c.rawText.slice(0, 300)}
                    {c.rawText.length > 300 ? "..." : ""}
                  </pre>
                </div>
                <button
                  onClick={() => removeCandidate(idx)}
                  style={{ marginTop: 8, color: "red" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
