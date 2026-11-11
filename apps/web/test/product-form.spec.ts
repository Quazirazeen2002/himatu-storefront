import { slugForProductName } from "../src/lib/product-form";
it("updates an automatic slug throughout typing and renaming", () => {
  expect(slugForProductName("L", "l", "Luffy Gear Five")).toBe("luffy-gear-five");
  expect(slugForProductName("Luffy Gear Five", "luffy-gear-five", "Luffy Gear Six")).toBe("luffy-gear-six");
});
it("preserves a manually chosen slug", () => {
  expect(slugForProductName("Luffy", "limited-edition", "Luffy Gear Five")).toBe("limited-edition");
});
