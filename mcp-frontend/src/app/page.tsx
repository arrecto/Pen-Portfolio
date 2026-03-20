"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useHttp } from "@/contexts/HttpProvider";

export default function Home() {
  const { postWithFormData } = useHttp();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGetStarted = async () => {
    if (url.trim()) {
      setShowUrlDialog(true);
      return;
    }

    if (!file) return;

    setLoading(true);
    try {
      await postWithFormData("/client/embed", { file });
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat">
      <main>
        <nav className="flex justify-center p-4 gap-4 text-nav">
          <a href="/">Home</a>
          <a href="/">About</a>
        </nav>

        <div className="flex flex-col items-center justify-center gap-6">
          <a className="font-title font-medium text-[48px]">PEN</a>
          <a className="font-title text-nav italic">your smart assistant</a>
          <a className="w-[424px] text-center">
            Enter your webpage address or upload business document for Pen to read
          </a>
        </div>

        <div className="flex flex-col mt-8 gap-4 items-center">
          <div className="flex w-full justify-center gap-2 px-4 sm:px-0">
            <input
              className="h-[56px] w-full sm:w-[346px] p-4 bg-surface border border-primary-light rounded-[20px] shadow-md"
              placeholder="www.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="flex items-center justify-center h-[56px] w-[56px] sm:w-[72px] shrink-0 bg-surface border border-primary-light rounded-[20px] shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-text-mid text-sm">
              <span>{file.name}</span>
              <button onClick={() => setFile(null)}><X size={14} /></button>
            </div>
          )}

          <div className="w-full px-4 sm:px-0 flex justify-center">
            <button
              disabled={loading || (!url.trim() && !file)}
              onClick={handleGetStarted}
              className="h-[56px] w-full sm:w-[420px] text-[23px] font-semibold text-surface bg-primary border border-primary-light rounded-[20px] shadow-md disabled:opacity-50"
            >
              {loading ? "Processing..." : "Get Started"}
            </button>
          </div>
        </div>

        <div className="mt-8 sm:mt-4 flex justify-center px-4 sm:px-0">
          <a className="text-nav text-center">Pen reads your data to build a context-aware assistant</a>
        </div>
      </main>

      {/* URL Not Supported Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-text/30 z-50">
          <div className="bg-surface rounded-[20px] shadow-xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 className="font-title text-[28px] font-medium text-text">Not available yet</h2>
            <p className="text-text-mid">
              URL embedding is not supported yet. Please upload a PDF document instead.
            </p>
            <button
              onClick={() => setShowUrlDialog(false)}
              className="h-[48px] w-full font-semibold text-surface bg-primary border border-primary-light rounded-full shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
