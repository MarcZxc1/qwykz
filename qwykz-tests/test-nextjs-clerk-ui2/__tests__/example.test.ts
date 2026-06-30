import { describe, expect, it } from "bun:test";
import { GET } from "../app/api/health/route";

describe("Next.js API Tests", () => {
  it("should return healthy status from health endpoint", async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.message).toBe("Server is healthy");
  });

  it("should pass this basic math test", () => {
    expect(1 + 1).toBe(2);
  });
});
