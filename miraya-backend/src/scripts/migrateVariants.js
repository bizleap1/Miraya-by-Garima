import prisma from '../prisma/client.js';

export async function migrateProductVariants() {
  console.log('🔄 Starting Safe Product Variant & Inventory Migration...\n');

  try {
    const products = await prisma.product.findMany({
      include: { variants: true, category: true },
    });

    console.log(`📦 Found ${products.length} products to audit for variants.`);
    let migratedCount = 0;
    let variantsCreated = 0;

    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        console.log(`⏩ Product "${product.name}" (ID: ${product.id}) already has ${product.variants.length} variants. Skipping.`);
        continue;
      }

      const sizeStockMap = (typeof product.size_stock === 'object' && product.size_stock !== null)
        ? product.size_stock
        : {};

      const sizes = Object.keys(sizeStockMap).length > 0
        ? Object.keys(sizeStockMap)
        : (Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL']);

      const catName = product.category?.name || product.sub_category || 'WEAR';
      const catCode = catName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MIR';

      const totalStock = parseInt(product.stock || 0, 10);
      const perSizeStock = Math.max(1, Math.floor(totalStock / sizes.length));

      for (const size of sizes) {
        const stockForSize = sizeStockMap[size] !== undefined ? parseInt(sizeStockMap[size], 10) : perSizeStock;
        const sku = `MIR-${catCode}-${String(product.id).padStart(3, '0')}-${size.toUpperCase()}`;

        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            stock: stockForSize,
            price: product.price,
          },
          create: {
            product_id: product.id,
            sku,
            size: size.toUpperCase(),
            color: 'Classic',
            price: product.price,
            stock: stockForSize,
            is_active: true,
          },
        });
        variantsCreated++;
      }

      migratedCount++;
      console.log(`✅ Migrated Product "${product.name}" (ID: ${product.id}) -> Created ${sizes.length} Variants.`);
    }

    console.log(`\n🎉 Safe Migration Complete! Migrated ${migratedCount} products, generated ${variantsCreated} variants in database.`);
    return { migratedCount, variantsCreated };
  } catch (error) {
    console.error('❌ Migration Error:', error);
    throw error;
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('migrateVariants.js')) {
  migrateProductVariants()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
      process.exit(1);
    });
}
