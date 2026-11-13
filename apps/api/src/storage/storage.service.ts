import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

export interface UploadedFileDto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredImageResult {
  storagePath: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseClient?: SupabaseClient;
  private readonly heroClient?: SupabaseClient;
  private readonly bucketName = "product-images";
  private readonly heroBucketName = "hero-media";
  private readonly printingBucketName = "custom-print-references";

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>("SUPABASE_URL");
    const secretKey =
      this.config.get<string>("SUPABASE_SECRET_KEY") ||
      this.config.get<string>("SUPABASE_PUBLISHABLE_KEY");

    if (supabaseUrl && secretKey) {
      this.supabaseClient = createClient(supabaseUrl, secretKey, {
        auth: { persistSession: false },
      });
    }
    const heroSecret = this.config.get<string>("SUPABASE_SECRET_KEY");
    if (supabaseUrl && heroSecret) {
      this.heroClient = createClient(supabaseUrl, heroSecret, {
        auth: { persistSession: false },
      });
    }
  }

  async createHeroUpload(fileName: string, contentType: string, size: number) {
    const allowed: Record<string, string> = {
      "video/mp4": "mp4", "video/webm": "webm",
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    };
    const extension = allowed[contentType];
    if (!extension || !fileName || fileName.length > 255 || !Number.isSafeInteger(size) || size <= 0)
      throw new BadRequestException("Choose a valid MP4, WebM, JPEG, PNG or WebP file");
    if (!this.heroClient)
      throw new ServiceUnavailableException("Hero storage is not configured");
    const path = `hero/${randomUUID()}.${extension}`;
    const { data, error } = await this.heroClient.storage.from(this.heroBucketName).createSignedUploadUrl(path);
    if (error || !data) throw new ServiceUnavailableException(error?.message || "Unable to prepare hero upload");
    return { path, signedUrl: data.signedUrl, contentType };
  }

  async completeHeroUpload(path: string, contentType: string, alt: string) {
    if (!/^hero\/[0-9a-f-]{36}\.(mp4|webm|jpg|png|webp)$/.test(path))
      throw new BadRequestException("Invalid hero upload path");
    if (!this.heroClient) throw new ServiceUnavailableException("Hero storage is not configured");
    const { data, error } = await this.heroClient.storage.from(this.heroBucketName).info(path);
    if (error || !data?.size)
      throw new BadRequestException("Upload has not completed in storage");
    const suffix = path.split(".").pop();
    const expectedType = suffix === "mp4" ? "video/mp4" : suffix === "webm" ? "video/webm" : suffix === "jpg" ? "image/jpeg" : suffix === "png" ? "image/png" : "image/webp";
    if (contentType !== expectedType || data.contentType !== expectedType)
      throw new BadRequestException("Uploaded media type did not match the selected file");
    const { data: publicData } = this.heroClient.storage.from(this.heroBucketName).getPublicUrl(path);
    return {
      type: expectedType.startsWith("video/") ? "video" as const : "image" as const,
      src: publicData.publicUrl,
      alt: alt.trim().slice(0, 160) || "HIMATU hero media",
    };
  }

  /**
   * Upload custom 3D printing reference image
   */
  async uploadPrintingReference(
    requestId: string,
    file: UploadedFileDto,
  ): Promise<{ storagePath: string; fileName: string; fileSize: number; fileType: string; url: string }> {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP`,
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new BadRequestException("Reference image exceeds 15MB limit");
    }

    if (!this.validateFileSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException("File signature does not match claimed MIME type");
    }

    const rawExt = extname(file.originalname).toLowerCase();
    const ext = rawExt || (file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg");
    const uniqueFileName = `${randomUUID()}${ext}`;
    const storagePath = `requests/${requestId}/${uniqueFileName}`;

    if (!this.supabaseClient) {
      // Mock fallback for testing/dev environments without direct bucket configuration
      return {
        storagePath,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        url: `https://storage.googleapis.com/himatu-demo/reference/${uniqueFileName}`,
      };
    }

    try {
      const { error } = await this.supabaseClient.storage
        .from(this.printingBucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.warn(`Private bucket upload warning: ${error.message}. Falling back to default bucket.`);
        const fallbackRes = await this.supabaseClient.storage
          .from(this.bucketName)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });
        if (fallbackRes.error) {
          throw new InternalServerErrorException(`Reference upload failed: ${fallbackRes.error.message}`);
        }
      }

      const signedUrl = await this.getSignedPrintingUrl(storagePath);
      return {
        storagePath,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        url: signedUrl,
      };
    } catch (err: any) {
      this.logger.error(`Failed to upload printing reference: ${err.message}`);
      return {
        storagePath,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        url: `/images/figures/placeholder.jpg`,
      };
    }
  }

  /**
   * Get signed URL for private printing reference
   */
  async getSignedPrintingUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    if (!this.supabaseClient) {
      return `/images/figures/placeholder.jpg`;
    }
    try {
      const { data, error } = await this.supabaseClient.storage
        .from(this.printingBucketName)
        .createSignedUrl(storagePath, expiresIn);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }

      // Try product-images bucket
      const pubRes = this.supabaseClient.storage.from(this.bucketName).getPublicUrl(storagePath);
      return pubRes.data.publicUrl;
    } catch {
      return `/images/figures/placeholder.jpg`;
    }
  }

  /**
   * Validate image buffer magic numbers (file signatures) to prevent malicious payloads
   */
  validateFileSignature(buffer: Buffer, mimetype: string): boolean {
    if (!buffer || buffer.length < 12) return false;

    // JPEG: FF D8 FF
    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (mimetype === "image/png") {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }

    // WebP: 'RIFF' at 0..3 and 'WEBP' at 8..11
    if (mimetype === "image/webp") {
      const riff = buffer.toString("ascii", 0, 4);
      const webp = buffer.toString("ascii", 8, 12);
      return riff === "RIFF" && webp === "WEBP";
    }

    return false;
  }

  /**
   * Upload an image to Supabase Storage
   */
  async uploadProductImage(productId: string, file: UploadedFileDto): Promise<StoredImageResult> {
    return this.uploadPublicImage(`products/${productId}`, file);
  }

  async uploadCategoryImage(categoryId: string, file: UploadedFileDto): Promise<StoredImageResult> {
    return this.uploadPublicImage(`categories/${categoryId}`, file);
  }

  private async uploadPublicImage(folder: string, file: UploadedFileDto): Promise<StoredImageResult> {
    if (!this.supabaseClient) {
      throw new InternalServerErrorException("Supabase Storage client is not configured");
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP`,
      );
    }

    // Check 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 10MB limit");
    }

    // Verify magic numbers
    if (!this.validateFileSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        "File signature does not match claimed MIME type",
      );
    }

    const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const uniqueFileName = `${randomUUID()}${ext}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    const { error } = await this.supabaseClient.storage
      .from(this.bucketName)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Failed to upload to Supabase Storage: ${error.message}`);
      throw new InternalServerErrorException(`Image upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabaseClient.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: urlData.publicUrl,
    };
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteProductImage(storagePath: string): Promise<void> {
    if (!this.supabaseClient || !storagePath) return;

    try {
      const { error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        this.logger.warn(`Failed to delete storage path ${storagePath}: ${error.message}`);
      }
    } catch (err: any) {
      this.logger.warn(`Storage delete error for ${storagePath}: ${err.message}`);
    }
  }
}

