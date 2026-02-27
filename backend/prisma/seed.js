const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Clothing', slug: 'clothing', iconUrl: '👕', displayOrder: 1 },
  { name: 'Books', slug: 'books', iconUrl: '📚', displayOrder: 2 },
  { name: 'Electronics', slug: 'electronics', iconUrl: '📱', displayOrder: 3 },
  { name: 'Furniture', slug: 'furniture', iconUrl: '🪑', displayOrder: 4 },
  { name: 'Kitchen', slug: 'kitchen', iconUrl: '🍳', displayOrder: 5 },
  { name: 'Toys', slug: 'toys', iconUrl: '🧸', displayOrder: 6 },
  { name: 'Sports', slug: 'sports', iconUrl: '⚽', displayOrder: 7 },
  { name: 'Medical', slug: 'medical', iconUrl: '🏥', displayOrder: 8 },
  { name: 'Stationery', slug: 'stationery', iconUrl: '✏️', displayOrder: 9 },
  { name: 'Others', slug: 'others', iconUrl: '📦', displayOrder: 10 },
];

async function main() {
  console.log('🌱 Seeding ShareCare database...');

  // Seed categories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {},
    create: {
      phone: '+919999999999',
      name: 'ShareCare Admin',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.id}`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
