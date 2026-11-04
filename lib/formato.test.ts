/**
 * Test dell'interpretazione dell'importo digitato dall'utente in
 * convenzione italiana: punti come separatori delle migliaia, virgola
 * come decimale con al massimo due cifre.
 */
import { describe, expect, it } from "vitest";
import { interpretaImporto } from "./formato";

describe("interpretaImporto: input validi", () => {
  it.each([
    ["30000", 30000],
    ["30.000", 30000],
    ["1.234.567", 1234567],
    ["30000,5", 30000.5],
    ["30.000,50", 30000.5],
    [" 30 000 ", 30000],
    ["30.000 €", 30000],
    ["€ 30.000", 30000],
    ["0", 0],
  ])("%p diventa %p", (testo, atteso) => {
    expect(interpretaImporto(testo)).toBe(atteso);
  });
});

describe("interpretaImporto: input non validi", () => {
  it.each(["", "   ", "30,000", "30,", ",5", "0x10", "1e3", "-5", "+5", "abc", "30.000,505", "30,5,0", "Infinity", "NaN"])(
    "%p diventa null",
    (testo) => {
      expect(interpretaImporto(testo)).toBeNull();
    }
  );
});
