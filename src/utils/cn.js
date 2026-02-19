import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合併 Tailwind CSS 類別的通用工具
 * 解決 className 衝突並支援條件式渲染
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}