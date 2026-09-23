// prisma/seed.ts
// Seeds the database with realistic players and teams for testing.

import { PrismaClient, PremierDivision } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── 1. Clean existing seed data (optional/safe) ───────────────────────────
  // Delete teams first due to foreign key cascade
  await prisma.team.deleteMany({});
  await prisma.player.deleteMany({});

  // ── 2. Seed Sample Players ────────────────────────────────────────────────
  const playersData = [
    {
      discordId: '100000000000000001',
      discordUsername: 'TenZ_Official',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
      riotId: 'TenZ#NA1',
      isVerified: true,
      trustScore: 95,
      verificationTier: 'verified',
      verifiedAt: new Date(),
      division: PremierDivision.Invite,
      mainAgents: ['Jett', 'Omen'],
      flexAgent: 'Reyna',
      playstyleTags: ['Entry', 'IGL'],
      vodUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      availableHours: [18, 19, 20, 21, 42, 43, 44, 45, 66, 67, 68, 69], // Mon-Wed evenings
      isPublished: true,
    },
    {
      discordId: '100000000000000002',
      discordUsername: 'Chronicle_Viper',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
      riotId: 'Chronicle#EU1',
      isVerified: true,
      trustScore: 88,
      verificationTier: 'verified',
      verifiedAt: new Date(),
      division: PremierDivision.Invite,
      mainAgents: ['Viper', 'Brimstone'],
      flexAgent: 'Harbor',
      playstyleTags: ['Support', 'Anchor'],
      vodUrl: 'https://medal.tv/games/valorant/clips/sampleClip1/xyz',
      availableHours: [17, 18, 19, 20, 41, 42, 43, 44, 65, 66, 67, 68],
      isPublished: true,
    },
    {
      discordId: '100000000000000003',
      discordUsername: 'FNS_Mastermind',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
      riotId: 'FNS#CALLS',
      isVerified: true,
      trustScore: 92,
      verificationTier: 'verified',
      verifiedAt: new Date(),
      division: PremierDivision.Contender,
      mainAgents: ['Killjoy', 'Cypher'],
      flexAgent: 'Fade',
      playstyleTags: ['IGL', 'Anchor'],
      vodUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      availableHours: [18, 19, 20, 21, 42, 43, 44, 45, 90, 91, 92, 93],
      isPublished: true,
    },
    {
      discordId: '100000000000000004',
      discordUsername: 'Aspas_Duelist',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
      riotId: 'aspas#BR1',
      isVerified: true,
      trustScore: 98,
      verificationTier: 'verified',
      verifiedAt: new Date(),
      division: PremierDivision.EsportsOrg,
      mainAgents: ['Jett', 'Raze'],
      flexAgent: 'Neon',
      playstyleTags: ['Entry'],
      vodUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      availableHours: [19, 20, 21, 22, 43, 44, 45, 46, 67, 68, 69, 70],
      isPublished: true,
    },
    {
      discordId: '100000000000000005',
      discordUsername: 'Boaster_Hype',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
      riotId: 'Boaster#FNC',
      isVerified: true,
      trustScore: 90,
      verificationTier: 'verified',
      verifiedAt: new Date(),
      division: PremierDivision.Elite,
      mainAgents: ['Astra', 'Omen'],
      flexAgent: 'Gekko',
      playstyleTags: ['IGL', 'Support'],
      vodUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      availableHours: [18, 19, 20, 21, 42, 43, 44, 45],
      isPublished: true,
    },
    {
      discordId: '100000000000000006',
      discordUsername: 'Unpublished_Rookie',
      discordAvatar: 'https://cdn.discordapp.com/embed/avatars/5.png',
      riotId: 'Rookie#1234',
      isVerified: false,
      trustScore: 25,
      verificationTier: 'unverified',
      division: PremierDivision.Open,
      mainAgents: ['Phoenix', 'Sage'],
      flexAgent: null,
      playstyleTags: ['Support'],
      vodUrl: null,
      availableHours: [10, 11, 12],
      isPublished: false, // Should NOT appear in public search
    },
  ];

  const createdPlayers = [];
  for (const data of playersData) {
    const player = await prisma.player.create({ data });
    createdPlayers.push(player);
  }

  console.log(`✅ Created ${createdPlayers.length} sample players (5 published, 1 draft)`);

  // ── 3. Seed Sample Teams ──────────────────────────────────────────────────
  const team1 = await prisma.team.create({
    data: {
      captainId: createdPlayers[0].id, // TenZ is captain
      name: 'Sentinels Premier',
      division: PremierDivision.Invite,
      recruitingRoles: ['Controller', 'Initiator'],
      isActivelyRecruiting: true,
      requiredHours: [18, 19, 20, 21, 42, 43, 44, 45], // Practice Mon & Tue evenings
    },
  });

  const team2 = await prisma.team.create({
    data: {
      captainId: createdPlayers[2].id, // FNS is captain
      name: 'Brainiacs Gaming',
      division: PremierDivision.Contender,
      recruitingRoles: ['Duelist', 'Flex'],
      isActivelyRecruiting: true,
      requiredHours: [18, 19, 20, 21, 90, 91, 92, 93],
    },
  });

  console.log(`✅ Created 2 sample teams: "${team1.name}" and "${team2.name}"`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
