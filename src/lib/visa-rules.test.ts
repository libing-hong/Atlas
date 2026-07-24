import assert from "node:assert/strict";
import test from "node:test";
import { getVisaRule } from "./visa-rules";

test("maps every Private Beta visa country to its own official route", () => {
  assert.match(getVisaRule("英国")?.officialUrl ?? "", /gov\.uk\/student-visa/);
  assert.match(getVisaRule("法国")?.officialUrl ?? "", /france-visas\.gouv\.fr/);
  assert.match(getVisaRule("澳洲")?.officialUrl ?? "", /homeaffairs\.gov\.au/);
});

test("does not silently send unsupported countries to another country's route", () => {
  assert.equal(getVisaRule("美国"), null);
});
