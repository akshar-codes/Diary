import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { IAttachment } from "../models/Attachment";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryAsset = {
  publicId: string;
  url: string;
  resourceType: string;
};

export function uploadToCloudinary(
  file: Express.Multer.File,
): Promise<CloudinaryAsset> {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    return Promise.reject(
      new Error("Cloudinary credentials are required to upload attachments."),
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "diary-notes/attachments",
        resource_type: "auto",
        use_filename: false,
        unique_filename: true,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary returned no upload result"));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: result.resource_type,
        });
      },
    );
    stream.end(file.buffer);
  });
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: string,
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export async function deleteAttachmentAssets(
  attachments: Pick<
    IAttachment,
    "storageKey" | "storageUrl" | "storageResourceType"
  >[],
): Promise<void> {
  await Promise.all(
    attachments
      .filter(
        (attachment) => attachment.storageUrl && attachment.storageResourceType,
      )
      .map((attachment) =>
        deleteCloudinaryAsset(
          attachment.storageKey,
          attachment.storageResourceType!,
        ),
      ),
  );
}
