import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuthProvider, Language, PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.create({
    data: {
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

  const temple = await prisma.temple.create({
    data: {
      imageKey: 'temples/krishna.jpg',
      email: 'sree.krishna@example.com',
      state: 'Kerala',
      description: 'Historic temple known for Sree Krishna worship',
      translations: {
        create: [
          {
            language: Language.EN,
            name: 'Sree Krishna Temple',
            district: 'Ernakulam',
            place: 'Tripunithura',
            description: 'Historic temple known for Sree Krishna worship',
          },
          {
            language: Language.ML,
            name: 'ശ്രീകൃഷ്ണ ക്ഷേത്രം',
            district: 'എറണാകുളം',
            place: 'തൃപ്പൂണിത്തുറ',
            description: 'Historic temple known for Sree Krishna worship',
          },
          {
            language: Language.HI,
            name: 'श्री कृष्ण मंदिर',
            district: 'एर्नाकुलम',
            place: 'त्रिपुनितुरा',
            description: 'Historic temple known for Sree Krishna worship',
          },
        ],
      },
    },
  });

  const benefit = await prisma.benefit.create({
    data: {
      translations: {
        create: [
          {
            language: Language.EN,
            name: 'Prosperity',
            description: 'Blessings for growth, abundance, and wellbeing',
          },
          {
            language: Language.ML,
            name: 'ഐശ്വര്യം',
            description: 'വളർച്ചയ്ക്കും സമൃദ്ധിക്കും ക്ഷേമത്തിനുമുള്ള അനുഗ്രഹം',
          },
          {
            language: Language.HI,
            name: 'समृद्धि',
            description: 'वृद्धि, समृद्धि और कल्याण के लिए आशीर्वाद',
          },
        ],
      },
    },
  });

  const pooja = await prisma.pooja.create({
    data: {
      templeId: temple.id,
      baseAmount: 500,
      poojaDay: 'MONDAY',
      time: '06:30',
      isWeekly: false,
      normalDiscount: 0,
      weeklyDiscount: 10,
      benefits: {
        connect: { id: benefit.id },
      },
      translations: {
        create: [
          {
            language: Language.EN,
            name: 'Ganapathi Homam',
            about: 'Special pooja for prosperity',
          },
          {
            language: Language.ML,
            name: 'ഗണപതി ഹോമം',
            about: 'ഐശ്വര്യത്തിനായുള്ള പ്രത്യേക പൂജ',
          },
          {
            language: Language.HI,
            name: 'गणपति होम',
            about: 'समृद्धि के लिए विशेष पूजा',
          },
        ],
      },
    },
  });

  console.log({
    user,
    address,
    temple,
    benefit,
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
