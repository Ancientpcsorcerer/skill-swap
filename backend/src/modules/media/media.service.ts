import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { queryOne } from '../../db/client';
import { BadRequestError } from '../../utils/errors';
import { env } from '../../config/env';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_DIR = path.join(UPLOAD_DIR, 'public');
const PRIVATE_DIR = path.join(UPLOAD_DIR, 'private');

// Ensure directories exist
for (const dir of [UPLOAD_DIR, PUBLIC_DIR, PRIVATE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface MediaUploadRecord {
  id: string;
  user_id: string;
  url: string;
  storage_path: string;
  media_type: 'image' | 'video';
  mime_type: string;
  size_bytes: number;
  is_private: boolean;
  project_id: string | null;
  created_at: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export class MediaService {
  async processUpload(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    baseUrl: string,
    isPrivate = false,
    projectId?: string
  ): Promise<MediaUploadRecord> {
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType.toLowerCase());

    if (!isImage && !isVideo) {
      throw new BadRequestError(
        `Unsupported media type: ${mimeType}. Allowed images: JPG, PNG, WEBP, GIF. Allowed videos: MP4, WEBM.`
      );
    }

    const mediaType: 'image' | 'video' = isImage ? 'image' : 'video';
    const maxSize = isImage ? 15 * 1024 * 1024 : 60 * 1024 * 1024;

    if (fileBuffer.length > maxSize) {
      throw new BadRequestError(
        `File size exceeds maximum limit of ${isImage ? '15MB' : '60MB'}.`
      );
    }

    const ext = path.extname(originalFilename).toLowerCase() || (isImage ? '.jpg' : '.mp4');
    const hash = crypto.randomBytes(16).toString('hex');
    const storageFilename = `${Date.now()}-${hash}${ext}`;
    const targetDir = isPrivate ? PRIVATE_DIR : PUBLIC_DIR;
    const filePath = path.join(targetDir, storageFilename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const mediaId = crypto.randomUUID();
    const mediaUrl = isPrivate
      ? `${baseUrl}/api/v1/media/access/${mediaId}`
      : `${baseUrl}/uploads/${storageFilename}`;

    const record = await queryOne<MediaUploadRecord>(
      `INSERT INTO media_uploads (id, user_id, url, storage_path, media_type, mime_type, size_bytes, is_private, project_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, url, storage_path, media_type, mime_type, size_bytes, is_private, project_id, created_at`,
      [mediaId, userId, mediaUrl, filePath, mediaType, mimeType, fileBuffer.length, isPrivate, projectId || null]
    );

    return record!;
  }

  async getMediaFile(mediaId: string, requesterUserId?: string): Promise<{ filePath: string; mimeType: string }> {
    const record = await queryOne<MediaUploadRecord>(
      `SELECT * FROM media_uploads WHERE id = $1`,
      [mediaId]
    );

    if (!record) {
      throw new BadRequestError('Media asset not found');
    }

    if (record.is_private) {
      if (!requesterUserId) {
        throw new BadRequestError('Authentication required to access private media');
      }

      if (record.user_id !== requesterUserId) {
        if (record.project_id) {
          const authCheck = await queryOne<{ allowed: boolean }>(
            `SELECT (
               p.creator_id = $1 OR
               EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = $1) OR
               EXISTS (SELECT 1 FROM project_authorized_connections WHERE project_id = p.id AND user_id = $1)
             ) as allowed
             FROM projects p WHERE p.id = $2`,
            [requesterUserId, record.project_id]
          );

          if (!authCheck?.allowed) {
            throw new BadRequestError('Access denied to private media');
          }
        } else {
          throw new BadRequestError('Access denied to private media');
        }
      }
    }

    if (!fs.existsSync(record.storage_path)) {
      throw new BadRequestError('Media file missing from storage');
    }

    return {
      filePath: record.storage_path,
      mimeType: record.mime_type,
    };
  }
}

export const mediaService = new MediaService();
