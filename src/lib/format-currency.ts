export function formatCNY(amount: number): string {
  return `￥${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  }).format(amount)}`;
}

export function formatCNYFromFen(fen: number): string {
  return `￥${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fen / 100)}`;
}
