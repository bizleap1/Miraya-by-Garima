import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findUnique({ where: { id: 23 } });
  if (p && p.image_url && p.image_url.startsWith('/uploads')) {
    const fullUrl = `http://localhost:5000${p.image_url}`;
    await prisma.product.update({
      where: { id: 23 },
      data: {
        image_url: fullUrl,
        images: [fullUrl]
      }
    });
    console.log(`✅ Updated product ID 23 image_url to: ${fullUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
