import "server-only";
import { createDecipheriv, createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import encryptedEnvelope from "../../../data/private/atlas-private-admission-rules.v1.enc.json";

export type EncryptedAdmissionWorkbook = {
  schemaVersion: 1;
  sourceType: "confidential_admission_workbook";
  extractedAt: string;
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
    values: Array<Array<string | number | boolean | null>>;
    formulas: Array<Array<string | null>>;
  }>;
};

let cachedWorkbook: EncryptedAdmissionWorkbook | undefined;

export function loadEncryptedAdmissionWorkbook(): EncryptedAdmissionWorkbook {
  if (cachedWorkbook) return cachedWorkbook;

  const encodedKey = process.env.ATLAS_PRIVATE_ADMISSION_KEY;
  if (!encodedKey) throw new Error("ATLAS_PRIVATE_ADMISSION_KEY is not configured");
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) throw new Error("ATLAS_PRIVATE_ADMISSION_KEY must decode to 32 bytes");

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encryptedEnvelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encryptedEnvelope.authTag, "base64"));
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(encryptedEnvelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  const plaintext = gunzipSync(compressed);
  const hash = createHash("sha256").update(plaintext).digest("hex");
  if (hash !== encryptedEnvelope.plaintextSha256) {
    throw new Error("Encrypted admission workbook integrity check failed");
  }

  const parsed = JSON.parse(plaintext.toString("utf8")) as EncryptedAdmissionWorkbook;
  if (parsed.schemaVersion !== 1 || parsed.sourceType !== "confidential_admission_workbook") {
    throw new Error("Unsupported encrypted admission workbook format");
  }
  if (parsed.sheets.length !== encryptedEnvelope.sheetCount) {
    throw new Error("Encrypted admission workbook sheet count mismatch");
  }

  cachedWorkbook = parsed;
  return parsed;
}

export function getEncryptedAdmissionWorkbookMetadata() {
  return {
    format: encryptedEnvelope.format,
    algorithm: encryptedEnvelope.algorithm,
    compression: encryptedEnvelope.compression,
    sheetCount: encryptedEnvelope.sheetCount,
    cellCount: encryptedEnvelope.cellCount,
    formulaCellCount: encryptedEnvelope.formulaCellCount,
    plaintextSha256: encryptedEnvelope.plaintextSha256,
  };
}
