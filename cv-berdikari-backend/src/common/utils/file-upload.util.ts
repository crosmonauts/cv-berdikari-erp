import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';

const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const fileFilter = (_req: any, file: Express.Multer.File, cb: (error: any, accept: boolean) => void) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new HttpException(`Tipe file ${file.mimetype} tidak diizinkan. Gunakan PDF/JPG/PNG.`, HttpStatus.BAD_REQUEST), false);
  }
};

export const limits = { fileSize: MAX_FILE_SIZE };
