import * as urlService from "../src/services/urlService";

describe("URL Service", () => {
  it("should return null for non-existing short code", async () => {
    const result = await urlService.getOriginalUrl("invalidCode");
    expect(result).toBeNull();
  });

  it("should create a short URL object", async () => {
    const result = await urlService.createShortUrl("https://example.com");
    expect(result).toHaveProperty("short_code");
    expect(result.original_url).toBe("https://example.com");
  });
});
