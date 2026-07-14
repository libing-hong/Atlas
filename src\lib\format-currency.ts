export function formatCNY(amount: number): string {
  return `￥${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  }).format(amount)}`;
}
