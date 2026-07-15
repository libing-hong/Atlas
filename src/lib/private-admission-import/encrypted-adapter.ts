import "server-only";
import { getEncryptedAdmissionWorkbookMetadata, loadEncryptedAdmissionWorkbook } from "./encrypted-workbook";
import type { PrivateWorkbookAdapter } from "./types";

export function createEncryptedPrivateWorkbookAdapter(): PrivateWorkbookAdapter {
  const metadata = getEncryptedAdmissionWorkbookMetadata();
  return {
    sourceName: "atlas-private-admission-rules-v1",
    sourceHash: metadata.plaintextSha256,
    async listSheets() {
      return loadEncryptedAdmissionWorkbook().sheets.map((sheet, index) => ({
        index,
        name: sheet.name,
      }));
    },
    async readSheet(index) {
      const sheet = loadEncryptedAdmissionWorkbook().sheets[index];
      if (!sheet) throw new Error(`Encrypted workbook sheet ${index} was not found`);
      return {
        index,
        name: sheet.name,
        rows: sheet.values,
      };
    },
  };
}
