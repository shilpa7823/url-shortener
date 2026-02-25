import { generateShortCode } from "../src/utils/hashGenerator";

describe("Hash Generator", () => {
  it("should generate a short code of default length 6", () => {
    const code = generateShortCode();
    expect(code.length).toBe(6);
  });

  it("should generate different codes on multiple calls", () => {
    const code1 = generateShortCode();
    const code2 = generateShortCode();
    expect(code1).not.toBe(code2);
  });
});
