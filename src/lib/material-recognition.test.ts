import assert from "node:assert/strict";
import test from "node:test";
import { recognizeMaterial } from "./material-recognition";

test("recognizes transcript fields from a local text fixture", async () => {
  const file = new File(["University: Sun Yat-sen University\nMajor: Business English\nAverage: 88.6"], "transcript.txt", { type: "text/plain" });
  const result = await recognizeMaterial(file);
  assert.equal(result.kind, "transcript");
  assert.equal(result.fields.institution, "Sun Yat-sen University");
  assert.equal(result.fields.major, "Business English");
  assert.equal(result.fields.officialAverage, 88.6);
  assert.equal(result.confidence, "high");
});

test("recognizes IELTS scores and keeps image extraction pending", async () => {
  const score = new File(["IELTS Academic Overall: 7 Listening: 7.5 Reading: 7 Writing: 6.5 Speaking: 7"], "ielts.txt", { type: "text/plain" });
  const recognized = await recognizeMaterial(score);
  assert.equal(recognized.kind, "language");
  assert.equal(recognized.fields.overall, 7);
  assert.equal(recognized.fields.writing, 6.5);

  const image = new File([new Uint8Array([1, 2, 3])], "passport.jpg", { type: "image/jpeg" });
  const pending = await recognizeMaterial(image);
  assert.equal(pending.kind, "identity");
  assert.equal(pending.confidence, "medium");
  assert.match(pending.summary.join(" "), /OCR Adapter/);
});
