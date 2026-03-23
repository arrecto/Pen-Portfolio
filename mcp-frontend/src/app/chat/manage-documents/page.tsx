"use client";

import { FileText, Globe, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useHttp } from "@/contexts/HttpProvider";
import { useToast } from "@/contexts/ToastContext";

type Document = {
  doc_id: string;
  filename: string;
};

type WebsiteGroup = {
  domain: string;
  docs: Document[];
};

function groupDocuments(docs: Document[]): { websites: WebsiteGroup[]; files: Document[] } {
  const domainMap = new Map<string, Document[]>();
  const files: Document[] = [];

  for (const doc of docs) {
    const slashIdx = doc.filename.indexOf("/");
    if (slashIdx !== -1) {
      const domain = doc.filename.slice(0, slashIdx);
      if (!domainMap.has(domain)) domainMap.set(domain, []);
      domainMap.get(domain)!.push(doc);
    } else {
      files.push(doc);
    }
  }

  const websites: WebsiteGroup[] = Array.from(domainMap.entries()).map(([domain, docs]) => ({ domain, docs }));
  return { websites, files };
}

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

  const handleDeleteFile = async (doc: Document) => {
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

  const handleDeleteWebsite = async (group: WebsiteGroup) => {
    setDeleting(group.domain);
    try {
      await Promise.all(group.docs.map((doc) => remove(`/client/document/${doc.doc_id}`)));
      const deletedIds = new Set(group.docs.map((d) => d.doc_id));
      setDocuments((prev) => prev.filter((d) => !deletedIds.has(d.doc_id)));
      toast(`"${group.domain}" removed.`);
    } catch {
      toast("Failed to remove website.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const { websites, files } = groupDocuments(documents);
  const isEmpty = websites.length === 0 && files.length === 0;

  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      <h1 className="font-title text-[32px] font-medium mb-6">Manage Documents</h1>

      {loading ? (
        <p className="text-text-mid text-sm">Loading...</p>
      ) : isEmpty ? (
        <p className="text-text-mid text-sm">No documents uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {websites.map((group) => (
            <li
              key={group.domain}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl group"
            >
              <Globe size={16} className="shrink-0 text-primary-light" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-text text-sm font-medium truncate">{group.domain}</span>
                <span className="text-text-mid text-xs truncate">{group.docs.length} page{group.docs.length !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={() => handleDeleteWebsite(group)}
                disabled={deleting === group.domain}
                className="opacity-0 group-hover:opacity-100 transition text-text-mid hover:text-red-400 disabled:opacity-30"
                title="Delete website"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {files.map((doc) => (
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
                onClick={() => handleDeleteFile(doc)}
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
