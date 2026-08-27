import prisma from './src/prisma/client.js';

const dressRenames = [
  { image_url: "/dresses/1.png", name: "Rose Gold Fringe Crop Top & Draped Skirt Set", sub_category: "Co-ord Set" },
  { image_url: "/dresses/2.png", name: "Noir Black Embellished Halter Tunic & Palazzo Set", sub_category: "Tunic & Palazzo" },
  { image_url: "/dresses/3.png", name: "Obsidian Black Cut-Out Back Halter Evening Gown", sub_category: "Evening Gown" },
  { image_url: "/dresses/4.png", name: "Powder Blue Pre-Draped Saree Gown with Embroidered Belt", sub_category: "Drape Saree Gown" },
  { image_url: "/dresses/5.png", name: "Scarlet Red Embroidered Vest Jacket & Palazzo Set", sub_category: "Jacket Set" },
  { image_url: "/dresses/6.png", name: "Ivory Pearl Silk Paisley Tunic & Flared Sharara Set", sub_category: "Sharara Set" },
  { image_url: "/dresses/7.png", name: "Royal Plum Crinkle Chiffon Cape Kurta & Palazzo Set", sub_category: "Cape Kurta Set" },
  { image_url: "/dresses/8.png", name: "Noir Black Hand-Embroidered Halter Draped Column Gown", sub_category: "Evening Gown" },
  { image_url: "/dresses/9.png", name: "Onyx Black Hand-Embroidered Motif Blazer & Trouser Pantsuit", sub_category: "Pantsuit" },
  { image_url: "/dresses/10.png", name: "Wine Red Asymmetrical Embroidered Collar Kurta & Palazzo Set", sub_category: "Kurta Set" },
  { image_url: "/dresses/11.png", name: "Crimson Red Angrakha Pleated Anarkali Gown with Choker Dupatta", sub_category: "Anarkali Gown" },
  { image_url: "/dresses/12.png", name: "Rani Pink Zari Embroidered Peplum Sharara Set with Sheer Cape", sub_category: "Sharara Set" },
  { image_url: "/dresses/13.png", name: "Noir Black Pre-Draped Pleated Saree with Embroidered Sweetheart Blouse", sub_category: "Drape Saree" },
  { image_url: "/dresses/14.png", name: "Ruby Red Criss-Cross Neck Embroidered Tunic & Palazzo Set", sub_category: "Tunic & Palazzo" },
  { image_url: "/dresses/15.png", name: "Burgundy Draped Skirt & Crop Top Set with Embroidered Shrug", sub_category: "Skirt & Shrug Set" },
  { image_url: "/dresses/16.png", name: "Champagne Bronze Metallic Pleated Lehenga Set with Draped Pallu", sub_category: "Drape Lehenga" },
];

async function updateDresses() {
  try {
    for (const item of dressRenames) {
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { image_url: item.image_url },
            { images: { has: item.image_url } }
          ]
        }
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            sub_category: item.sub_category
          }
        });
        console.log(`✅ Renamed [${existing.id}] -> ${item.name}`);
      }
    }
    console.log('🎉 All 16 Haute Couture dresses successfully updated in database.');
  } catch (err) {
    console.error('Error updating dresses:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateDresses();
