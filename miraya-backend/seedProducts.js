import prisma from './src/prisma/client.js';

const products = [
  // Indo-Western
  { name: "Pink Blush Lehenga", price: 16191, category: "Indo-Western", sub_category: "Lehenga", stock: 12, size_stock: { S: 3, M: 3, L: 3, XL: 3 }, image_url: "/products/Lehenga-Pink Blush/1.JPG" },
  { name: "Light Purple Lehenga", price: 15831, category: "Indo-Western", sub_category: "Lehenga", stock: 8, size_stock: { S: 2, M: 2, L: 2, XL: 2 }, image_url: "/products/Lehenga-Light Purple/1.JPG" },
  { name: "Golden Lehenga", price: 18891, category: "Indo-Western", sub_category: "Lehenga", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/products/Lehenga-Golden/1.JPG" },
  { name: "Red Indo Western Suit", price: 24831, category: "Indo-Western", sub_category: "Suit", stock: 6, size_stock: { S: 1, M: 2, L: 2, XL: 1 }, image_url: "/products/Indo Western Suit -Red/1.JPG" },
  // Drape Sarees
  { name: "Grey Drape Saree", price: 22681, category: "Drape Sarees", sub_category: "Saree", stock: 15, size_stock: { "Free Size": 15 }, image_url: "/products/Drape Saree-Grey Color/1.JPG" },
  { name: "Pink Blush Drape Saree", price: 17091, category: "Drape Sarees", sub_category: "Saree", stock: 14, size_stock: { "Free Size": 14 }, image_url: "/products/Drape Saree-Pink Blush Color/1.JPG" },
  { name: "Black Drape Saree", price: 11511, category: "Drape Sarees", sub_category: "Saree", stock: 12, size_stock: { "Free Size": 12 }, image_url: "/products/Drape Saree-Black Color/1.JPG" },
  // Designer Suits
  { name: "Red Suit", price: 17731, category: "Designer Suits", sub_category: "Suit", stock: 9, size_stock: { S: 2, M: 3, L: 2, XL: 2 }, image_url: "/products/Suit- Red/1.JPG" },
  { name: "Purple Suit", price: 8991, category: "Designer Suits", sub_category: "Suit", stock: 7, size_stock: { S: 2, M: 2, L: 2, XL: 1 }, image_url: "/products/Suit-Purple/1.JPG" },
  { name: "Mustard Suit", price: 13611, category: "Designer Suits", sub_category: "Suit", stock: 5, size_stock: { S: 1, M: 2, L: 1, XL: 1 }, image_url: "/products/Suit -Mustard/1.JPG" },
  { name: "Mustard Suit 2", price: 15131, category: "Designer Suits", sub_category: "Suit", stock: 4, size_stock: { S: 1, M: 1, L: 1, XL: 1 }, image_url: "/products/Suit-Mustard 2/1.JPG" },
  // Premium Suit Materials
  { name: "Rajastani Pink Material", price: 3951, category: "Premium Suit Materials", sub_category: "Material", stock: 11, size_stock: { "Free Size": 11 }, image_url: "/products/Rajastani-pink/1.JPG" },
  { name: "Rajastani Green Material", price: 6999, category: "Premium Suit Materials", sub_category: "Material", stock: 10, size_stock: { "Free Size": 10 }, image_url: "/products/Rajastani-Green/1.JPG" },
  // Co-ord Sets
  { name: "Grey Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", stock: 18, size_stock: { S: 5, M: 5, L: 4, XL: 4 }, image_url: "/products/grey co-order set/1.JPG" },
  { name: "Black Co-ord Set", price: 21591, category: "Co-ord Sets", sub_category: "Co-ord", stock: 16, size_stock: { S: 4, M: 4, L: 4, XL: 4 }, image_url: "/products/Co-order Black/1.JPG" },
  { name: "Golden-Black Co-ord Set", price: 24831, category: "Co-ord Sets", sub_category: "Co-ord", stock: 14, size_stock: { S: 3, M: 4, L: 4, XL: 3 }, image_url: "/products/Co-order Golden-Black/1.JPG" },
  { name: "Dark Green Co-ord Set", price: 21331, category: "Co-ord Sets", sub_category: "Co-ord", stock: 12, size_stock: { S: 3, M: 3, L: 3, XL: 3 }, image_url: "/products/Co-order Dark Green/1.JPG" },
  { name: "White Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", stock: 15, size_stock: { S: 4, M: 4, L: 4, XL: 3 }, image_url: "/products/Co-order White/1.JPG" },
  { name: "Red Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 0, size_stock: { "Free Size (M to XL)": 0 }, image_url: "/products/Co-order Red/1.JPG", whatsapp_inquiry: true },
  { name: "Orange Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 0, size_stock: { "Free Size (M to XL)": 0 }, image_url: "/products/Co-order Orange/1.JPG", whatsapp_inquiry: true },
  { name: "Light Green Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 0, size_stock: { "Free Size (M to XL)": 0 }, image_url: "/products/Co-order Light Green/1.JPG", whatsapp_inquiry: true },
  { name: "Mustard Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", stock: 0, size_stock: { "Free Size (M to XL)": 0 }, image_url: "/products/Co-order Mustard/1.JPG", whatsapp_inquiry: true },
  // Dresses (Haute Couture)
  { name: "Rose Gold Fringe Crop Top & Draped Skirt Set", price: 9311, category: "Dresses", sub_category: "Co-ord Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/1.png" },
  { name: "Noir Black Embellished Halter Tunic & Palazzo Set", price: 10791, category: "Dresses", sub_category: "Tunic & Palazzo", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/2.png" },
  { name: "Obsidian Black Cut-Out Back Halter Evening Gown", price: 16191, category: "Dresses", sub_category: "Evening Gown", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/3.png" },
  { name: "Powder Blue Pre-Draped Saree Gown with Embroidered Belt", price: 17731, category: "Dresses", sub_category: "Drape Saree Gown", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/4.png" },
  { name: "Scarlet Red Embroidered Vest Jacket & Palazzo Set", price: 10791, category: "Dresses", sub_category: "Jacket Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/5.png" },
  { name: "Ivory Pearl Silk Paisley Tunic & Flared Sharara Set", price: 19531, category: "Dresses", sub_category: "Sharara Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/6.png" },
  { name: "Royal Plum Crinkle Chiffon Cape Kurta & Palazzo Set", price: 7561, category: "Dresses", sub_category: "Cape Kurta Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/7.png" },
  { name: "Noir Black Hand-Embroidered Halter Draped Column Gown", price: 11511, category: "Dresses", sub_category: "Evening Gown", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/8.png" },
  { name: "Onyx Black Hand-Embroidered Motif Blazer & Trouser Pantsuit", price: 16731, category: "Dresses", sub_category: "Pantsuit", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/9.png" },
  { name: "Wine Red Asymmetrical Embroidered Collar Kurta & Palazzo Set", price: 12591, category: "Dresses", sub_category: "Kurta Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/10.png" },
  { name: "Crimson Red Angrakha Pleated Anarkali Gown with Choker Dupatta", price: 23131, category: "Dresses", sub_category: "Anarkali Gown", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/11.png" },
  { name: "Rani Pink Zari Embroidered Peplum Sharara Set with Sheer Cape", price: 16551, category: "Dresses", sub_category: "Sharara Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/12.png" },
  { name: "Noir Black Pre-Draped Pleated Saree with Embroidered Sweetheart Blouse", price: 21591, category: "Dresses", sub_category: "Drape Saree", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/13.png" },
  { name: "Ruby Red Criss-Cross Neck Embroidered Tunic & Palazzo Set", price: 8991, category: "Dresses", sub_category: "Tunic & Palazzo", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/14.png" },
  { name: "Burgundy Draped Skirt & Crop Top Set with Embroidered Shrug", price: 16191, category: "Dresses", sub_category: "Skirt & Shrug Set", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/15.png" },
  { name: "Champagne Bronze Metallic Pleated Lehenga Set with Draped Pallu", price: 17991, category: "Dresses", sub_category: "Drape Lehenga", stock: 10, size_stock: { S: 2, M: 3, L: 3, XL: 2 }, image_url: "/dresses/16.png" }
];

async function main() {
  console.log('Seeding products to database...');

  for (const item of products) {
    let cat = await prisma.category.findFirst({ where: { name: item.category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: item.category } });
    }

    const existingProduct = await prisma.product.findFirst({ where: { name: item.name } });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          stock: 1,
          sizes: ["Free Size (M to XL)"],
          size_stock: { "Free Size (M to XL)": 1 },
          image_url: item.image_url,
          images: [item.image_url],
          category_id: cat.id,
          sub_category: item.sub_category,
        },
      });
      console.log(`Created product: ${item.name}`);
    }
  }

  console.log('✅ Successfully seeded all products!');
}

main()
  .catch((e) => {
    console.error('Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
