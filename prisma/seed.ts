import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@takemetothefair.com" },
    update: {},
    create: {
      email: "admin@takemetothefair.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("Created admin user:", admin.email);

  // Create promoter user
  const promoterPassword = await bcrypt.hash("promoter123", 12);
  const promoterUser = await prisma.user.upsert({
    where: { email: "promoter@example.com" },
    update: {},
    create: {
      email: "promoter@example.com",
      name: "John Promoter",
      passwordHash: promoterPassword,
      role: "PROMOTER",
      emailVerified: new Date(),
    },
  });

  const promoter = await prisma.promoter.upsert({
    where: { userId: promoterUser.id },
    update: {},
    create: {
      userId: promoterUser.id,
      companyName: "Fair Events Co.",
      slug: "fair-events-co",
      description: "We organize the best fairs and festivals in the region!",
      website: "https://faireventsco.example.com",
      verified: true,
    },
  });
  console.log("Created promoter:", promoter.companyName);

  // Create vendor user
  const vendorPassword = await bcrypt.hash("vendor123", 12);
  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@example.com" },
    update: {},
    create: {
      email: "vendor@example.com",
      name: "Jane Vendor",
      passwordHash: vendorPassword,
      role: "VENDOR",
      emailVerified: new Date(),
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: "Artisan Crafts",
      slug: "artisan-crafts",
      description: "Handmade crafts and artisan goods",
      vendorType: "Arts & Crafts",
      products: JSON.stringify(["Pottery", "Jewelry", "Woodwork"]),
      verified: true,
    },
  });
  console.log("Created vendor:", vendor.businessName);

  // Create venues
  const venue1 = await prisma.venue.upsert({
    where: { slug: "county-fairgrounds" },
    update: {},
    create: {
      name: "County Fairgrounds",
      slug: "county-fairgrounds",
      address: "1234 Fair Lane",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      latitude: 39.7817,
      longitude: -89.6501,
      capacity: 50000,
      amenities: JSON.stringify(["Parking", "Food Court", "Restrooms", "First Aid", "ATM"]),
      contactEmail: "info@countyfairgrounds.example.com",
      contactPhone: "(555) 123-4567",
      description: "The largest fairgrounds in the county, hosting events year-round.",
      status: "ACTIVE",
    },
  });
  console.log("Created venue:", venue1.name);

  const venue2 = await prisma.venue.upsert({
    where: { slug: "riverside-park" },
    update: {},
    create: {
      name: "Riverside Park",
      slug: "riverside-park",
      address: "500 River Road",
      city: "Austin",
      state: "TX",
      zip: "78701",
      latitude: 30.2672,
      longitude: -97.7431,
      capacity: 15000,
      amenities: JSON.stringify(["Parking", "Picnic Areas", "Restrooms", "Playground"]),
      contactEmail: "parks@austin.example.gov",
      description: "Beautiful park along the river, perfect for outdoor events.",
      status: "ACTIVE",
    },
  });
  console.log("Created venue:", venue2.name);

  const venue3 = await prisma.venue.upsert({
    where: { slug: "downtown-convention-center" },
    update: {},
    create: {
      name: "Downtown Convention Center",
      slug: "downtown-convention-center",
      address: "100 Main Street",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      latitude: 41.8781,
      longitude: -87.6298,
      capacity: 25000,
      amenities: JSON.stringify(["Parking Garage", "Food Court", "WiFi", "ADA Accessible"]),
      contactEmail: "events@chicagocc.example.com",
      contactPhone: "(555) 987-6543",
      description: "State-of-the-art convention center in the heart of downtown.",
      status: "ACTIVE",
    },
  });
  console.log("Created venue:", venue3.name);

  // Create events
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const twoMonthsOut = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const event1 = await prisma.event.upsert({
    where: { slug: "summer-county-fair-2025" },
    update: {},
    create: {
      name: "Summer County Fair 2025",
      slug: "summer-county-fair-2025",
      description: "Join us for the biggest summer fair in the county! Featuring live music, carnival rides, agricultural exhibits, and delicious fair food. Fun for the whole family!",
      promoterId: promoter.id,
      venueId: venue1.id,
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
      categories: JSON.stringify(["Fair", "Family", "Agriculture"]),
      tags: JSON.stringify(["summer", "carnival", "rides", "food", "music"]),
      ticketPriceMin: 10,
      ticketPriceMax: 25,
      ticketUrl: "https://tickets.example.com/summer-fair",
      featured: true,
      status: "APPROVED",
    },
  });
  console.log("Created event:", event1.name);

  const event2 = await prisma.event.upsert({
    where: { slug: "artisan-market-festival" },
    update: {},
    create: {
      name: "Artisan Market Festival",
      slug: "artisan-market-festival",
      description: "Discover unique handmade goods from local artisans. Browse jewelry, pottery, woodwork, textiles, and more. Live demonstrations and workshops available.",
      promoterId: promoter.id,
      venueId: venue2.id,
      startDate: twoMonthsOut,
      endDate: new Date(twoMonthsOut.getTime() + 2 * 24 * 60 * 60 * 1000),
      categories: JSON.stringify(["Market", "Arts & Crafts"]),
      tags: JSON.stringify(["artisan", "handmade", "crafts", "shopping"]),
      ticketPriceMin: 0,
      ticketPriceMax: 5,
      featured: true,
      status: "APPROVED",
    },
  });
  console.log("Created event:", event2.name);

  const event3 = await prisma.event.upsert({
    where: { slug: "holiday-craft-show" },
    update: {},
    create: {
      name: "Holiday Craft Show",
      slug: "holiday-craft-show",
      description: "Get a head start on holiday shopping! Over 200 vendors selling handmade gifts, decorations, and treats. Perfect for finding unique presents.",
      promoterId: promoter.id,
      venueId: venue3.id,
      startDate: new Date(now.getFullYear(), 11, 1),
      endDate: new Date(now.getFullYear(), 11, 3),
      categories: JSON.stringify(["Market", "Holiday"]),
      tags: JSON.stringify(["holiday", "christmas", "gifts", "crafts"]),
      ticketPriceMin: 5,
      ticketPriceMax: 10,
      featured: false,
      status: "APPROVED",
    },
  });
  console.log("Created event:", event3.name);

  // Add vendor to events
  await prisma.eventVendor.upsert({
    where: {
      eventId_vendorId: { eventId: event1.id, vendorId: vendor.id },
    },
    update: {},
    create: {
      eventId: event1.id,
      vendorId: vendor.id,
      boothInfo: "Booth A-15, Arts & Crafts Section",
      status: "APPROVED",
    },
  });

  await prisma.eventVendor.upsert({
    where: {
      eventId_vendorId: { eventId: event2.id, vendorId: vendor.id },
    },
    update: {},
    create: {
      eventId: event2.id,
      vendorId: vendor.id,
      boothInfo: "Main Pavilion, Booth 42",
      status: "APPROVED",
    },
  });

  console.log("\nDatabase seeded successfully!");
  console.log("\nTest Accounts:");
  console.log("  Admin: admin@takemetothefair.com / admin123");
  console.log("  Promoter: promoter@example.com / promoter123");
  console.log("  Vendor: vendor@example.com / vendor123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
