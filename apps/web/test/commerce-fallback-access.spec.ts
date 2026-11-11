import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "../src/app/api/v1/[...slug]/route";
jest.mock("../src/lib/db", () => ({getDbPool:()=>null}));
jest.mock("../src/lib/server-auth", () => ({serverAuth:jest.fn()}));
describe("Commerce fallback permissions", () => {
  const original = process.env.API_URL;
  beforeAll(()=>{delete process.env.API_URL;});
  afterAll(()=>{if(original)process.env.API_URL=original;else delete process.env.API_URL;});
  it.each([GET,POST,PATCH,DELETE])("rejects anonymous admin requests when the backend is unavailable",async handler=>{
    const response=await handler(new NextRequest("https://himatu.example/api/v1/admin/products"),{params:Promise.resolve({slug:["admin","products"]})});
    expect(response.status).toBe(401);
  });
  it("requires administrator access to the legacy product creation alias", async()=>{
    const response=await POST(new NextRequest("https://himatu.example/api/v1/products",{method:"POST"}),{params:Promise.resolve({slug:["products"]})});
    expect(response.status).toBe(401);
  });
});
