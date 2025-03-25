const request = require("supertest");
const app = require("../app");

describe("User Authentication", () => {
  test("Should register a user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ name: "Test User", email: "test@example.com", password: "password" });
    expect(res.statusCode).toBe(201);
  });

  test("Should not register duplicate email", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ name: "Test User", email: "test@example.com", password: "password" });
    expect(res.statusCode).toBe(400);
  });
});
