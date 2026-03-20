"use client";

import { FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useHttp } from "@/contexts/HttpProvider";
import { useToast } from "@/contexts/ToastContext";

type Document = {
  doc_id: string;
  filename: string;
};

export default function ManageDocumentsPage() {
  const { get, remove } = useHttp();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await get("/client/documents");
      const raw = res?.result ?? "[]";
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      setDocuments(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.doc_id);
    try {
      await remove(`/client/document/${doc.doc_id}`);
      setDocuments((prev) => prev.filter((d) => d.doc_id !== doc.doc_id));
      toast(`"${doc.filename}" removed.`);
    } catch {
      toast("Failed to remove document.", "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      <h1 className="font-title text-[32px] font-medium mb-6">Manage Documents</h1>

      {loading ? (
        <p className="text-text-mid text-sm">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-text-mid text-sm">No documents uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.doc_id}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl group"
            >
              <FileText size={16} className="shrink-0 text-primary-light" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-text text-sm font-medium truncate">{doc.filename}</span>
                <span className="text-text-mid text-xs font-mono truncate">{doc.doc_id}</span>
              </div>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deleting === doc.doc_id}
                className="opacity-0 group-hover:opacity-100 transition text-text-mid hover:text-red-400 disabled:opacity-30"
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
