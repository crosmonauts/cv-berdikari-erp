const API_URL = import.meta.env.VITE_API_URL;

export const getRegions = async () => {
  const response = await fetch(`${API_URL}/regions`);
  if (!response.ok) {
    throw new Error('Gagal mengambil data wilayah');
  }
  return response.json();
};
