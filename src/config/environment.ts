export function isProductionEnvironment(): boolean {
  return (process.env.NODE_ENV || 'development').trim() === 'production';
}
