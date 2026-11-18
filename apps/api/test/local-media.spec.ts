import { mkdtemp, readFile, rm, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalMedia, validMediaHeader } from "../src/storage/local-media";

describe("Hostinger persistent public media", () => {
  let root: string;
  let media: LocalMedia;
  const png = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "himatu-media-")); media = new LocalMedia(root,"https://media.himatu.com"); });
  afterEach(async () => { await rm(root,{recursive:true,force:true}); });
  it("saves UUID images, returns media URLs and can delete only local paths", async () => {
    const stored = await media.saveImage("products/product-1",png,"image/png");
    expect(stored.storagePath).toMatch(/^local:products\/product-1\/[0-9a-f-]+\.png$/);
    expect(stored.publicUrl).toBe(`https://media.himatu.com/${stored.storagePath.slice(6)}`);
    expect(await readFile(join(root,stored.storagePath.slice(6)))).toEqual(png);
    await media.remove("products/product-1/legacy.png");
    await media.remove(stored.storagePath);
    await expect(readFile(join(root,stored.storagePath.slice(6)))).rejects.toThrow();
  });
  it("rejects traversal and mismatched image content", async () => {
    await expect(media.saveImage("products/../../outside",png,"image/png")).rejects.toThrow("path");
    await expect(media.saveImage("products/id",Buffer.from("malicious php content"),"image/png")).rejects.toThrow("content");
  });
  it("refuses a symlink that escapes the media root", async () => {
    const external = await mkdtemp(join(tmpdir(), "himatu-outside-"));
    try {
      await symlink(external,join(root,"products"));
      await expect(media.saveImage("products/id",png,"image/png")).rejects.toThrow("escapes");
    } finally { await rm(external,{recursive:true,force:true}); }
  });
  it("validates disk uploads before publishing hero files", async () => {
    const source = join(root,"upload.tmp");
    const mp4 = Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from("ftypisom"),Buffer.alloc(20)]);
    await writeFile(source,mp4);
    const result = await media.saveHero(source,mp4.length,"video/mp4");
    expect(await readFile(join(root,result.storagePath.slice(6)))).toEqual(mp4);
    await expect(media.saveHero(source,mp4.length,"image/png")).rejects.toThrow("type");
    await expect(media.saveHero(source,mp4.length+1,"video/mp4")).rejects.toThrow("type");
    await expect(media.saveHero(source,60*1024*1024,"video/mp4")).rejects.toThrow("50 MB");
    expect(validMediaHeader(Buffer.alloc(20),"video/webm")).toBe(false);
  });
  it("rejects invalid storage configuration", () => {
    expect(() => new LocalMedia("relative", "https://media.himatu.com")).toThrow("absolute");
    expect(() => new LocalMedia(root,"http://media.himatu.com")).toThrow("HTTPS");
  });
});
