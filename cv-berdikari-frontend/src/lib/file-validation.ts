const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Tipe file harus PDF, JPG, atau PNG';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Ukuran file maksimal 5MB';
  }
  return null;
}
