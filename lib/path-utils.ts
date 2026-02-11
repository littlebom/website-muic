import path from "path";
import fs from "fs";

/**
 * Gets the absolute path to the uploads directory.
 * Prioritizes the known production path on the VM to ensure compatibility
 * with Nginx and PM2 standalone/cluster mode.
 */
export function getUploadsDir(): string {
    const PROD_UPLOAD_DIR = "/home/jira/thai-mooc/public/uploads";

    try {
        // Check if the production directory exists explicitly
        if (fs.existsSync(PROD_UPLOAD_DIR)) {
            return PROD_UPLOAD_DIR;
        }
    } catch (e) {
        // Ignore error
    }

    // Fallback to local project directory (development default)
    return path.join(process.cwd(), "public", "uploads");
}
