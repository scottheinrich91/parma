import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export async function atomicWriteFile(targetPath: string, content: string | Buffer): Promise<void> {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const tempFileName = `.${path.basename(targetPath)}.tmp.${Date.now()}.${randomSuffix}`;
  const tempFilePath = path.join(dir, tempFileName);

  try {
    await fs.writeFile(tempFilePath, content);
    await fs.rename(tempFilePath, targetPath);
  } catch (error) {
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore unlink error if file wasn't created
    }
    throw error;
  }
}
