import "server-only";
import { createHash } from "node:crypto";
import type { PrivateImportIssue, PrivateSchoolSheetParser, PrivateWorkbookSheet } from "./types";

function normalizedCells(sheet: PrivateWorkbookSheet) {
  return sheet.rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
}

export function evidenceFingerprint(sheetName: string, row: number, values: string[]) {
  return createHash("sha256").update([sheetName, row, ...values].join("|")).digest("hex");
}

export class PrivateSheetParserRegistry {
  private readonly parsers: PrivateSchoolSheetParser[] = [];

  register(parser: PrivateSchoolSheetParser) {
    this.parsers.push(parser);
    return this;
  }

  resolve(sheet: PrivateWorkbookSheet) {
    return this.parsers.find((parser) => parser.canParse(sheet));
  }
}

/**
 * This detector only identifies candidate rule rows. It deliberately does not
 * publish them: university IDs, program scope and table semantics must be
 * resolved by a registered school-specific parser or Knowledge Ops review.
 */
export function detectUnmappedRuleRows(sheet: PrivateWorkbookSheet): PrivateImportIssue[] {
  const rows = normalizedCells(sheet);
  const issues: PrivateImportIssue[] = [];
  const signals = /(?:均分|平均分|录取|名单|院校|tier|average|requirement|accepted)/i;
  rows.forEach((cells, index) => {
    if (!cells.some((cell) => signals.test(cell))) return;
    issues.push({
      sheetName: sheet.name,
      row: index + 1,
      code: "ambiguous_rule",
      summary: "检测到可能的录取规则行，需要学校专用解析器确认字段含义。",
      evidenceFingerprint: evidenceFingerprint(sheet.name, index + 1, cells),
    });
  });
  return issues.slice(0, 100);
}
