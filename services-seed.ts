import "dotenv/config";
import { db } from "./src/auth.js";
import { services } from "./src/db/schema.js";

async function main() {
  try {
    console.log("Seeding services...");

    const serviceData = [
      {
        name: "Ganti Oli",
        price: 50000,
        description: "Ganti oli mesin standard",
      },
      {
        name: "Service Ringan",
        price: 75000,
        description: "Tune-up, cek rem, cek kelistrikan",
      },
      {
        name: "Tambal Ban",
        price: 15000,
        description: "Tambal ban tubeless",
      },
      {
        name: "Ganti Kampas Rem",
        price: 35000,
        description: "Jasa ganti kampas rem depan/belakang",
      },
      {
        name: "Cuci Motor",
        price: 25000,
        description: "Cuci steam + semir ban",
      },
    ];

    await db.insert(services).values(serviceData);

    console.log("Services seeded successfully!");
  } catch (error) {
    console.error("Error seeding services:", error);
  } finally {
    process.exit(0);
  }
}

main();
