export const extractOrderFromFileName = (fileName: string) => {
  const match = fileName.match(/(\d[^_.-\D]+)/);
  return match ? Number(match[0]) : -1;
};
