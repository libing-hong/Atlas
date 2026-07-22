import type { MaterialKind } from "./material-recognition";

export type StoredMaterial = { id: string; name: string; type: string; size: number; kind: MaterialKind; uploadedAt: string; sourceApplicationId?: string };
const metadataKey = "atlas.material-library.v1";
const databaseName = "atlas-material-library";
const storeName = "files";

function readMetadata(): StoredMaterial[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(metadataKey) ?? "[]") as StoredMaterial[]; } catch { return []; }
}
function writeMetadata(items: StoredMaterial[]) { window.localStorage.setItem(metadataKey, JSON.stringify(items)); window.dispatchEvent(new Event("atlas-material-library-change")); }
function openDatabase() { return new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(databaseName, 1); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }

export async function saveMaterialFile(file: File, kind: MaterialKind, sourceApplicationId?: string) {
  const id = `material-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: StoredMaterial = { id, name: file.name, type: file.type || "application/octet-stream", size: file.size, kind, uploadedAt: new Date().toISOString(), sourceApplicationId };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => { const transaction = database.transaction(storeName, "readwrite"); transaction.objectStore(storeName).put(file, id); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  writeMetadata([item, ...readMetadata()]);
  return item;
}
export function listStoredMaterials() { return readMetadata(); }
export async function getMaterialFile(id: string) { const database = await openDatabase(); return new Promise<Blob | undefined>((resolve, reject) => { const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id); request.onsuccess = () => resolve(request.result as Blob | undefined); request.onerror = () => reject(request.error); }); }
export function subscribeMaterialLibrary(listener: () => void) { window.addEventListener("atlas-material-library-change", listener); window.addEventListener("storage", listener); return () => { window.removeEventListener("atlas-material-library-change", listener); window.removeEventListener("storage", listener); }; }
