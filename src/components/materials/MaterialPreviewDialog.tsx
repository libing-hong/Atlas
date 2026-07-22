"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { getMaterialFile, type StoredMaterial } from "@/lib/material-repository";

export function MaterialPreviewDialog({ material, onClose }: { material: StoredMaterial; onClose: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => { let objectUrl = ""; void getMaterialFile(material.id).then((blob) => { if (!blob) return; objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }); return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [material.id]);
  const embedded = material.type.startsWith("image/") || material.type === "application/pdf" || material.type.startsWith("text/");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2924]/35 p-4"><div role="dialog" aria-modal="true" aria-label={`预览 ${material.name}`} className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[24px] bg-[#fffaf3] p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">材料预览</p><h2 className="mt-2 text-xl font-semibold text-[#2f2924]">{material.name}</h2><p className="mt-1 text-xs text-[#8f847a]">{Math.ceil(material.size / 1024)} KB · {material.type}</p></div><button type="button" onClick={onClose} aria-label="关闭预览" className="grid h-9 w-9 place-items-center rounded-full border border-[#d8ccbe]"><X size={16} /></button></div>{url && embedded ? <iframe title={material.name} src={url} className="mt-4 h-[65vh] w-full rounded-2xl border border-[#d8ccbe] bg-white" /> : <div className="mt-4 grid min-h-48 place-items-center rounded-2xl bg-[#f7f0e8] p-6 text-center text-sm text-[#6f6256]"><p>{url ? "浏览器无法直接预览此格式，请下载后查看。" : "正在载入材料……"}</p></div>}{url ? <a href={url} download={material.name} className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-white"><Download size={15} />下载材料</a> : null}</div></div>;
}
