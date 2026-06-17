import admin from "../config/firebase";

export class StorageService {
  /**
   * Uploads a file buffer directly to Firebase Storage bucket and returns the public download URL.
   */
  static async uploadToFirebase(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    folder: string = "uploads"
  ): Promise<string> {
    const bucket = admin.storage().bucket();
    
    // Generate a unique filename similar to multer's diskStorage logic
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanOriginalName = originalName.replace(/\s+/g, "_"); // replace spaces with underscores
    const filename = `${uniqueSuffix}-${cleanOriginalName}`;
    const filePath = `${folder}/${filename}`;
    
    const file = bucket.file(filePath);

    // Save buffer to firebase storage
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
      resumable: false,
    });

    // Attempt to make file public. This works if ACLs are allowed.
    // If Uniform Bucket-Level Access is enabled, this is a no-op but might throw an error.
    try {
      await file.makePublic();
      console.log(`Successfully set public ACL for: ${filePath}`);
    } catch (error) {
      console.log(
        `Note: Could not set public ACL for ${filePath} (usually fine if Uniform Bucket-Level Access or public access is pre-configured):`,
        error instanceof Error ? error.message : error
      );
    }

    // Generate and return the standard public download URL format for Firebase Storage
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    return publicUrl;
  }
}
