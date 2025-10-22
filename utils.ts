export const calculatePrice = (domainName: string): string => {
  const len = domainName.split('.')[0].length;
  if (len <= 4) return "5.00";
  if (len <= 8) return "2.50";
  return "1.00";
};
