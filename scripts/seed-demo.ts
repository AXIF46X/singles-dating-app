// Seed demo partner profiles into the SQLite database so the Singles chat
// workspace can immediately connect a real user with a "stranger".
//
// Usage:  bun run scripts/seed-demo.ts
//
// Demo accounts all share password: "singles-demo"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type SeedProfile = {
  email: string;
  name: string;
  age: number;
  gender: string;
  lookingFor: string;
  location: string;
  bio: string;
  interests: string[];
  photoUrl: string;
};

const SEED_PROFILES: SeedProfile[] = [
  {
    email: "demo.jordan@singles.app",
    name: "Jordan",
    age: 29,
    gender: "Man",
    lookingFor: "Everyone",
    location: "Austin, TX",
    bio: "Weekend hiker, weekday barista connoisseur. Always planning the next road trip.",
    interests: ["Hiking", "Coffee", "Photography", "Travel"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Jordan&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.marcus@singles.app",
    name: "Marcus",
    age: 32,
    gender: "Man",
    lookingFor: "Women",
    location: "Chicago, IL",
    bio: "Architect by day, amateur chef by night. Let's argue about the best deep dish place.",
    interests: ["Cooking", "Art", "Tech", "Movies"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Marcus&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.leo@singles.app",
    name: "Leo",
    age: 26,
    gender: "Man",
    lookingFor: "Everyone",
    location: "Seattle, WA",
    bio: "Software engineer who codes by day and climbs boulders by night. Dog dad to a corgi.",
    interests: ["Dogs", "Tech", "Fitness", "Gaming"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Leo&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.theo@singles.app",
    name: "Theo",
    age: 34,
    gender: "Man",
    lookingFor: "Women",
    location: "Denver, CO",
    bio: "Mountains are my happy place. Looking for a partner in adventure (and snacks).",
    interests: ["Hiking", "Surfing", "Running", "Dogs"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Theo&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.sam@singles.app",
    name: "Sam",
    age: 28,
    gender: "Man",
    lookingFor: "Everyone",
    location: "Portland, OR",
    bio: "Vintage sweater collector and vinyl record hoarder. Let's go thrifting.",
    interests: ["Music", "Art", "Coffee", "Reading"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Sam&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.diego@singles.app",
    name: "Diego",
    age: 30,
    gender: "Man",
    lookingFor: "Women",
    location: "Miami, FL",
    bio: "Salsa dancing on Fridays, beach volleyball on Sundays. Full of energy.",
    interests: ["Dancing", "Fitness", "Surfing", "Foodie"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Diego&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.ryan@singles.app",
    name: "Ryan",
    age: 31,
    gender: "Man",
    lookingFor: "Everyone",
    location: "San Diego, CA",
    bio: "Motorcycle enthusiast and weekend trail runner. Coffee snob, no apologies.",
    interests: ["Running", "Coffee", "Photography", "Travel"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Ryan&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.kevin@singles.app",
    name: "Kevin",
    age: 27,
    gender: "Man",
    lookingFor: "Women",
    location: "Atlanta, GA",
    bio: "Plant dad with way too many succulents. Into cozy nights and good playlists.",
    interests: ["Music", "Cats", "Yoga", "Reading"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Kevin&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.minh@singles.app",
    name: "Minh",
    age: 29,
    gender: "Man",
    lookingFor: "Everyone",
    location: "San Francisco, CA",
    bio: "Street photographer chasing golden hour. Always down for ramen and conversation.",
    interests: ["Photography", "Foodie", "Travel", "Art"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Minh&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.eli@singles.app",
    name: "Eli",
    age: 25,
    gender: "Man",
    lookingFor: "Everyone",
    location: "Brooklyn, NY",
    bio: "Comedy nights and late-night diner runs. I promise my jokes get better.",
    interests: ["Comedy", "Movies", "Gaming", "Music"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Eli&backgroundColor=c0aede,d1d4f9",
  },
  {
    email: "demo.ava@singles.app",
    name: "Ava",
    age: 27,
    gender: "Woman",
    lookingFor: "Everyone",
    location: "Los Angeles, CA",
    bio: "Yoga instructor who loves sunrise hikes and sunset smoothie bowls.",
    interests: ["Yoga", "Hiking", "Foodie", "Travel"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Ava&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.nora@singles.app",
    name: "Nora",
    age: 30,
    gender: "Woman",
    lookingFor: "Men",
    location: "Boston, MA",
    bio: "Bookworm with a weakness for cozy cafes and rainy days. Ask me for a recommendation.",
    interests: ["Reading", "Coffee", "Art", "Movies"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Nora&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.chloe@singles.app",
    name: "Chloe",
    age: 26,
    gender: "Woman",
    lookingFor: "Everyone",
    location: "Nashville, TN",
    bio: "Singer-songwriter who's always humming something new. Dog mom of two.",
    interests: ["Music", "Dogs", "Dancing", "Photography"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Chloe&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.priya@singles.app",
    name: "Priya",
    age: 31,
    gender: "Woman",
    lookingFor: "Men",
    location: "New York, NY",
    bio: "Marketing lead who spends weekends testing every brunch spot in the city.",
    interests: ["Foodie", "Travel", "Fitness", "Cooking"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Priya&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.hana@singles.app",
    name: "Hana",
    age: 28,
    gender: "Woman",
    lookingFor: "Everyone",
    location: "Denver, CO",
    bio: "Trail runner and amateur astronomer. Let's find the best stargazing spot.",
    interests: ["Running", "Hiking", "Photography", "Tech"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Hana&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.isabel@singles.app",
    name: "Isabel",
    age: 29,
    gender: "Woman",
    lookingFor: "Men",
    location: "Houston, TX",
    bio: "Grad student by week, salsa dancer by weekend. Big fan of spontaneous plans.",
    interests: ["Dancing", "Reading", "Coffee", "Travel"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Isabel&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.zara@singles.app",
    name: "Zara",
    age: 33,
    gender: "Woman",
    lookingFor: "Everyone",
    location: "Washington, DC",
    bio: "Museum hopper and documentary addict. Looking for someone to debate plot twists with.",
    interests: ["Art", "Movies", "Comedy", "Cats"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Zara&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.maya@singles.app",
    name: "Maya",
    age: 25,
    gender: "Woman",
    lookingFor: "Men",
    location: "Phoenix, AZ",
    bio: "Desert sunrise hikes and smoothie experiments. Always up for a new adventure.",
    interests: ["Hiking", "Fitness", "Cooking", "Yoga"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Maya&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.lucia@singles.app",
    name: "Lucia",
    age: 30,
    gender: "Woman",
    lookingFor: "Everyone",
    location: "San Antonio, TX",
    bio: "Freelance illustrator fueled by iced coffee and good playlists.",
    interests: ["Art", "Coffee", "Music", "Gaming"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Lucia&backgroundColor=ffd5dc,ffdfbf",
  },
  {
    email: "demo.simone@singles.app",
    name: "Simone",
    age: 27,
    gender: "Woman",
    lookingFor: "Men",
    location: "Charlotte, NC",
    bio: "Runner training for my first marathon. Dog person, always has snacks.",
    interests: ["Running", "Dogs", "Foodie", "Fitness"],
    photoUrl: "https://api.dicebear.com/9.x/adventurer/png?seed=Simone&backgroundColor=ffd5dc,ffdfbf",
  },
];

async function seed() {
  console.log(`Seeding ${SEED_PROFILES.length} demo profiles...`);
  const passwordHash = await bcrypt.hash("singles-demo", 10);

  for (const p of SEED_PROFILES) {
    const existing = await db.user.findUnique({ where: { email: p.email } });
    let userId = existing?.id;

    if (!userId) {
      const created = await db.user.create({
        data: {
          email: p.email,
          passwordHash,
          isDemo: true,
        },
        select: { id: true },
      });
      userId = created.id;
    } else {
      // make sure existing demo accounts are flagged
      await db.user.update({ where: { id: userId }, data: { isDemo: true } }).catch(() => {});
    }

    const data = {
      userId,
      name: p.name,
      age: p.age,
      gender: p.gender,
      lookingFor: p.lookingFor,
      location: p.location,
      bio: p.bio,
      interests: JSON.stringify(p.interests),
      photoUrl: p.photoUrl,
    };

    await db.profile.upsert({
      where: { userId },
      create: data,
      update: data,
    });
  }

  console.log("Seed complete.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
