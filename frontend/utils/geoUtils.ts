// src/utils/geoUtils.ts

/**
 * 将 DMS 格式坐标（如 "36°55'33.2S"）转换为十进制经纬度
 * @example dmsToDecimal("36°55'33.2S") → -36.925889
 */
export const dmsToDecimal = (dms: string): number | null => {
  const regex = /(\d+)°\s*(\d+)'?\s*([\d.]+)?"?\s*([NSEW])/i;
  const match = dms.trim().match(regex);
  if (!match) return null;
  const [, deg, min, sec, dir] = match;
  let decimal = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  if (['S', 'W'].includes(dir.toUpperCase())) decimal = -decimal;
  return parseFloat(decimal.toFixed(6));
};