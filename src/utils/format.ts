export function formatCurrency(value: number): string {
  if (isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parsePriceInput(input: string): number {
  if (!input) return 0;
  // Replace Brazilian comma with period if entered
  const normalized = input.replace(/\s+/g, '').replace('R$', '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.max(0, num);
}
