export const WOMENSWEAR_PRICE_RULES = {
  CLASSIC_MIN: 1500,
  PRIME_MIN: 6000
};

export const WOMENSWEAR_CATEGORY_NAMES = [
  'indo-western',
  'drape sarees',
  'designer suits',
  'premium suit materials',
  'co-ord sets',
  'dresses'
];

export const getWomenPriceCategory = (price, categoryName = '') => {
  if (price == null) return null;
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return null;

  if (categoryName) {
    const isWomenswear = WOMENSWEAR_CATEGORY_NAMES.includes(categoryName.toLowerCase().trim());
    if (!isWomenswear) return null;
  }

  if (numPrice >= WOMENSWEAR_PRICE_RULES.PRIME_MIN) {
    return 'PRIME';
  } else if (numPrice >= WOMENSWEAR_PRICE_RULES.CLASSIC_MIN) {
    return 'CLASSIC';
  }
  return null;
};
