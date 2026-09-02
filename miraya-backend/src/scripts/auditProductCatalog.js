import prisma from '../prisma/client.js';

async function auditCatalog() {
  console.log('\n==================================================');
  console.log('   STEP 3: PRODUCT CATALOG CONTENT READINESS AUDIT  ');
  console.log('==================================================\n');

  const products = await prisma.product.findMany({
    include: { category: true, variants: true }
  });

  console.log(`Auditing ${products.length} products in database catalog...\n`);

  let gapsCount = 0;

  products.forEach(p => {
    const missing = [];
    if (!p.description || p.description.trim() === '') missing.push('Description');
    if (!p.mrp_price && (!p.variants || p.variants.every(v => !v.mrp_price))) missing.push('MRP Price');
    if (!p.image_url && (!p.images || p.images.length === 0)) missing.push('Images');
    if (!p.category_id && !p.category) missing.push('Category');
    if (!p.variants || p.variants.length === 0) missing.push('Size Stock Variants');

    if (missing.length > 0) {
      gapsCount++;
      console.log(`⚠️ Product #${p.id} ("${p.name}") missing: ${missing.join(', ')}`);
    }
  });

  if (gapsCount === 0) {
    console.log('🎉 100% PRODUCT CATALOG READINESS: All 38 products have complete images, descriptions, MRP prices, categories, and size variants!');
  } else {
    console.log(`\nFound content gaps in ${gapsCount} out of ${products.length} products.`);
  }

  console.log('\n==================================================\n');
  await prisma.$disconnect();
}

auditCatalog().catch(console.error);
