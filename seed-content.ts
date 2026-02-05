import "dotenv/config";
import { db } from "./src/auth";
import { transactions, user } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    // 1. Get Admin User
    const adminUser = await db.query.user.findFirst({
        where: eq(user.email, "admin@motoguro.com")
    });

    if (!adminUser) {
        console.error("Admin user not found! Please run seed.ts first.");
        return;
    }

    console.log(`Found Admin: ${adminUser.id}`);

    // 2. Create Transactions
    const sampleTransactions = [
        {
            type: "income",
            amount: 25000,
            description: "Cuci Motor Premium - B 1234 CD",
            category: "Service",
            date: new Date(),
            userId: adminUser.id
        },
        {
            type: "income",
            amount: 15000,
            description: "Cuci Motor Standar - A 5678 EF",
            category: "Service",
            date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            userId: adminUser.id
        },
        {
            type: "expense",
            amount: 50000,
            description: "Beli Sabun Cuci",
            category: "Supplies",
            date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            userId: adminUser.id
        },
        {
            type: "income",
            amount: 10000,
            description: "Cuci Helm",
            category: "Service",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
            userId: adminUser.id
        }
    ];

    await db.insert(transactions).values(sampleTransactions);

    console.log("Sample transactions seeded successfully!");
  } catch (error) {
    console.error("Error seeding content:", error);
  }
}

main();
