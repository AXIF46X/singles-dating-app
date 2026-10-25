import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, profiles } from "@/db/schema";
import { hashPassword } from "@/lib/password";

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

const avatar = (name: string) => `/avatars/${name}.png`;

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
    photoUrl: avatar("jordan"),
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
    photoUrl: avatar("marcus"),
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
    photoUrl: avatar("leo"),
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
    photoUrl: avatar("theo"),
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
    photoUrl: avatar("sam"),
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
    photoUrl: avatar("diego"),
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
    photoUrl: avatar("ryan"),
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
    photoUrl: avatar("kevin"),
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
    photoUrl: avatar("minh"),
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
    photoUrl: avatar("eli"),
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
    photoUrl: `https://images.pexels.com/photos/34930167/pexels-photo-34930167.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/16869444/pexels-photo-16869444.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/3936894/pexels-photo-3936894.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/11701102/pexels-photo-11701102.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/35367077/pexels-photo-35367077.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/7752818/pexels-photo-7752818.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/40322798/pexels-photo-40322798.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/7717254/pexels-photo-7717254.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/15116517/pexels-photo-15116517.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
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
    photoUrl: `https://images.pexels.com/photos/6497114/pexels-photo-6497114.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=720&fit=crop`,
  },
];

async function seed() {
  console.log(`Seeding ${SEED_PROFILES.length} demo profiles...`);
  const defaultPasswordHash = await hashPassword("singles-demo");

  for (const seedProfile of SEED_PROFILES) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seedProfile.email))
      .limit(1);

    let userId = existing[0]?.id;
    if (!userId) {
      const [created] = await db
        .insert(users)
        .values({ email: seedProfile.email, passwordHash: defaultPasswordHash, isDemo: true })
        .returning({ id: users.id });
      userId = created.id;
    }

    const existingProfile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const profileValues = {
      name: seedProfile.name,
      age: seedProfile.age,
      gender: seedProfile.gender,
      lookingFor: seedProfile.lookingFor,
      location: seedProfile.location,
      bio: seedProfile.bio,
      interests: seedProfile.interests,
      photoUrl: seedProfile.photoUrl,
    };

    if (existingProfile[0]) {
      await db.update(profiles).set({ ...profileValues, updatedAt: new Date() }).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({ userId, ...profileValues });
    }
  }

  console.log("Seed complete.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
