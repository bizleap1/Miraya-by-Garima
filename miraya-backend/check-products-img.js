import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    orderBy: { id: 'desc' },
    select: { id: true, name: true, image_url: true, images: true }
  });
  console.log("Database products images:", JSON.stringify(products, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
