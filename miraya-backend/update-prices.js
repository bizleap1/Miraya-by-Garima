import prisma from './src/prisma/client.js';

const priceUpdates = [
  // Designer Suits
  { name: "Red Suit", price: 17731 },
  { name: "Purple Suit", price: 8991 },
  { name: "Mustard Suit", price: 13611 },
  { name: "Mustard Suit 2", price: 15131 },
  // Premium Suit Materials
  { name: "Rajastani Pink Material", price: 3951 },
  // Co-ord Sets
  { name: "Grey Co-ord Set", price: 23131 },
  { name: "Black Co-ord Set", price: 21591 },
  { name: "Golden-Black Co-ord Set", price: 24831 },
  { name: "Dark Green Co-ord Set", price: 21331 },
  { name: "White Co-ord Set", price: 23131 }
];

async function updateDbPrices() {
  console.log('Updating database prices for Designer Suits, Premium Suit Materials, and Co-ord Sets...');
  for (const item of priceUpdates) {
    const updated = await prisma.product.updateMany({
      where: { name: item.name },
      data: { price: item.price }
    });
    console.log(`Updated ${item.name}: ${updated.count} row(s) updated.`);
  }
  console.log('Done!');
}

updateDbPrices()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
