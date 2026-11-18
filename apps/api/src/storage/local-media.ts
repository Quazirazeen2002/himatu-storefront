import { constants } from "node:fs";
import { copyFile, mkdir, open, realpath, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

export const heroMediaLimit = 50 * 1024 * 1024;
export const mediaExtensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm",
};

export function validMediaHeader(buffer: Buffer, type: string) {
  if (buffer.length < 12) return false;
  if (type === "image/jpeg") return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/webp") return buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP";
  if (type === "video/mp4") return buffer.toString("ascii",4,8) === "ftyp";
  if (type === "video/webm") return buffer.subarray(0,4).equals(Buffer.from([26,69,223,163]));
  return false;
}

export class LocalMedia {
  constructor(private readonly root: string, private readonly publicUrl: string) {
    if (!isAbsolute(root)) throw new Error("MEDIA_STORAGE_PATH must be absolute");
    const url = new URL(publicUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("MEDIA_PUBLIC_URL must be a clean HTTPS URL");
  }
  private async destination(relative: string) {
    if (!/^(products|categories|hero)\/[a-zA-Z0-9/_.-]+$/.test(relative) || relative.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Invalid media path");
    const root = await realpath(this.root);
    const target = resolve(root, relative);
    if (!target.startsWith(`${root}${sep}`)) throw new Error("Invalid media path");
    let parent = root;
    for (const segment of relative.split("/").slice(0, -1)) {
      parent = resolve(parent, segment);
      await mkdir(parent).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
      if (!(await realpath(parent)).startsWith(`${root}${sep}`)) throw new Error("Media directory escapes storage root");
    }
    return target;
  }
  private result(relative: string) {
    return { storagePath: `local:${relative}`, publicUrl: `${this.publicUrl.replace(/\/$/, "")}/${relative}` };
  }
  async saveImage(folder: string, buffer: Buffer, type: string) {
    if (!type.startsWith("image/") || !mediaExtensions[type] || !validMediaHeader(buffer, type)) throw new Error("Invalid image content");
    const relative = `${folder}/${randomUUID()}.${mediaExtensions[type]}`;
    await writeFile(await this.destination(relative), buffer, { flag: "wx", mode: 0o644 });
    return this.result(relative);
  }
  async saveHero(source: string, size: number, type: string) {
    if (!mediaExtensions[type] || size <= 0 || size > heroMediaLimit) throw new Error("Choose valid hero media up to 50 MB");
    const file = await open(source, "r");
    try {
      const header = Buffer.alloc(32);
      const { bytesRead } = await file.read(header, 0, 32, 0);
      if ((await file.stat()).size !== size || !validMediaHeader(header.subarray(0, bytesRead), type)) throw new Error("Uploaded media content does not match its type");
    } finally { await file.close(); }
    const relative = `hero/${randomUUID()}.${mediaExtensions[type]}`;
    await copyFile(source, await this.destination(relative), constants.COPYFILE_EXCL);
    return this.result(relative);
  }
  async remove(storagePath: string) {
    if (!storagePath.startsWith("local:")) return;
    await unlink(await this.destination(storagePath.slice(6)));
  }
}
