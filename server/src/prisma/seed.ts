import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuthProvider, PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test555@yaagam.com',
      whatsappNumber: '9876543210',
      isWhatsappVerified: true,
      provider: AuthProvider.WHATSAPP,
    },
  });

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      houseNo: '12A',
      roadName: 'Temple Road',
      phoneNumber: '9876543210',
      state: 'Kerala',
      district: 'Ernakulam',
      pincode: '682001',
      isDefault: true,
    },
  });

  const devotee = await prisma.devotee.create({
    data: {
      userId: user.id,
      age: '30',
      name: 'Mohammed Ismail',
      nakshatra: 'Ashwini',
      naal: 'Monday',
      ritualState: 'Active',
    },
  });

  const temple = await prisma.temple.create({
    data: {
      name: 'Sree Krishna Temple',
      district: 'Ernakulam',
      place: 'Tripunithura',
      imageKey: 'temples/krishna.jpg',
    },
  });

  const pooja = await prisma.pooja.create({
    data: {
      name: 'Ganapathi Homam',
      about: 'Special pooja for prosperity',
      templeId: temple.id,
      baseAmount: 500,
      poojaDay: 'MONDAY',
      isWeekly: false,
      normalDiscount: 0,
      weeklyDiscount: 10,
    },
  });

  console.log({
    user,
    address,
    devotee,
    temple,
    pooja,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
