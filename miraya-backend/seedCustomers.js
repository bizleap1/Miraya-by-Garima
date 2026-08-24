import prisma from './src/prisma/client.js';
import bcrypt from 'bcryptjs';

export const vipCustomers = [
  {
    name: "Ananya Sharma",
    email: "ananya.sharma@gmail.com",
    phone: "9820145678",
    role: "customer",
    address: { line1: "Flat 402, Sea Green Apts, Worli Sea Face", city: "Mumbai", state: "Maharashtra", pincode: "400018", phone: "9820145678" },
    orders: [
      { total: 32382, status: "delivered", items: [{ productName: "Pink Blush Lehenga", size: "M", quantity: 2, price: 16191 }] }
    ]
  },
  {
    name: "Priya Kapoor",
    email: "priya.kapoor88@yahoo.com",
    phone: "9811234567",
    role: "customer",
    address: { line1: "House No 12, Golf Links", city: "New Delhi", state: "Delhi", pincode: "110003", phone: "9811234567" },
    orders: [
      { total: 18891, status: "delivered", items: [{ productName: "Golden Lehenga", size: "L", quantity: 1, price: 18891 }] }
    ]
  },
  {
    name: "Meera Singhania",
    email: "meera.singhania@outlook.com",
    phone: "9930456123",
    role: "customer",
    address: { line1: "A-501, Raheja Vivarea, Mahalaxmi", city: "Mumbai", state: "Maharashtra", pincode: "400011", phone: "9930456123" },
    orders: [
      { total: 24831, status: "shipped", items: [{ productName: "Red Indo Western Suit", size: "S", quantity: 1, price: 24831 }] }
    ]
  },
  {
    name: "Ritu Deshmukh",
    email: "ritu.deshmukh@gmail.com",
    phone: "9769012345",
    role: "customer",
    address: { line1: "72, Boat Club Road", city: "Pune", state: "Maharashtra", pincode: "411001", phone: "9769012345" },
    orders: [
      { total: 22681, status: "processing", items: [{ productName: "Grey Drape Saree", size: "Free Size", quantity: 1, price: 22681 }] }
    ]
  },
  {
    name: "Sneha Varma",
    email: "sneha.varma@rediffmail.com",
    phone: "9845012349",
    role: "customer",
    address: { line1: "Villa 14, Palm Meadows, Whitefield", city: "Bengaluru", state: "Karnataka", pincode: "560066", phone: "9845012349" },
    orders: [
      { total: 17731, status: "delivered", items: [{ productName: "Red Suit", size: "M", quantity: 1, price: 17731 }] }
    ]
  },
  {
    name: "Kavita Mehta",
    email: "kavita.mehta@gmail.com",
    phone: "9825019876",
    role: "customer",
    address: { line1: "B-22, Bodakdev", city: "Ahmedabad", state: "Gujarat", pincode: "380054", phone: "9825019876" },
    orders: [
      { total: 15131, status: "delivered", items: [{ productName: "Mustard Suit 2", size: "L", quantity: 1, price: 15131 }] }
    ]
  },
  {
    name: "Natasha Oberoi",
    email: "natasha.oberoi@gmail.com",
    phone: "9810987654",
    role: "customer",
    address: { line1: "Sector 43, Golf Course Road", city: "Gurugram", state: "Haryana", pincode: "122002", phone: "9810987654" },
    orders: [
      { total: 23131, status: "delivered", items: [{ productName: "Grey Co-ord Set", size: "S", quantity: 1, price: 23131 }] }
    ]
  },
  {
    name: "Pooja Bansal",
    email: "pooja.bansal@gmail.com",
    phone: "9872012345",
    role: "customer",
    address: { line1: "Sector 9-C", city: "Chandigarh", state: "Punjab", pincode: "160009", phone: "9872012345" },
    orders: [
      { total: 21591, status: "shipped", items: [{ productName: "Black Co-ord Set", size: "M", quantity: 1, price: 21591 }] }
    ]
  },
  {
    name: "Tanvi Singhal",
    email: "tanvi.singhal@yahoo.com",
    phone: "9829012345",
    role: "customer",
    address: { line1: "C-Scheme, Ashok Nagar", city: "Jaipur", state: "Rajasthan", pincode: "302001", phone: "9829012345" },
    orders: [
      { total: 17091, status: "delivered", items: [{ productName: "Pink Blush Drape Saree", size: "Free Size", quantity: 1, price: 17091 }] }
    ]
  },
  {
    name: "Ishita Roy",
    email: "ishita.roy@gmail.com",
    phone: "9830012345",
    role: "customer",
    address: { line1: "Alipore Road", city: "Kolkata", state: "West Bengal", pincode: "700027", phone: "9830012345" },
    orders: [] // Registered prospect client
  },
  {
    name: "Simran Kaur",
    email: "simran.kaur@gmail.com",
    phone: "9814012345",
    role: "customer",
    address: { line1: "Model Town", city: "Ludhiana", state: "Punjab", pincode: "141002", phone: "9814012345" },
    orders: [] // Registered prospect client
  }
];

export async function seedVipCustomers() {
  console.log('🌱 Seeding VIP registered customer directory...');
  const hash = await bcrypt.hash('customerpassword', 10);

  for (const c of vipCustomers) {
    let user = await prisma.user.findFirst({ where: { email: c.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          password_hash: hash,
          role: c.role,
        }
      });
      console.log(`✅ Created Customer: ${c.name} (${c.email})`);

      // Create address
      if (c.address) {
        await prisma.address.create({
          data: {
            user_id: user.id,
            line1: c.address.line1,
            city: c.address.city,
            state: c.address.state,
            pincode: c.address.pincode,
            phone: c.address.phone,
          }
        });
      }

      // Create orders if any
      for (const ord of c.orders) {
        const orderRecord = await prisma.order.create({
          data: {
            user_id: user.id,
            total: ord.total,
            status: ord.status,
            payment_id: `pay_seed_${Math.random().toString(36).substring(2, 10)}`,
            shipping_name: c.name,
            shipping_phone: c.phone,
            shipping_address: c.address?.line1 || "Flagship Boutique Address",
            shipping_city: c.address?.city || "Mumbai",
            shipping_state: c.address?.state || "Maharashtra",
            shipping_pincode: c.address?.pincode || "400001",
          }
        });

        // Add order items
        for (const itm of ord.items) {
          const prod = await prisma.product.findFirst({ where: { name: itm.productName } });
          if (prod) {
            await prisma.orderItem.create({
              data: {
                order_id: orderRecord.id,
                product_id: prod.id,
                quantity: itm.quantity,
                size: itm.size,
                price_at_purchase: itm.price,
                sku_snapshot: `MIR-${prod.name.substring(0, 3).toUpperCase()}-${itm.size}`,
              }
            });
          }
        }
      }
    }
  }

  console.log('🎉 VIP Customer directory seeded successfully!');
}

if (process.argv[1]?.endsWith('seedCustomers.js')) {
  seedVipCustomers()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error('Error seeding customers:', e);
      prisma.$disconnect();
      process.exit(1);
    });
}
