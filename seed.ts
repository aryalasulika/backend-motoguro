import "dotenv/config";
import { auth } from "./src/auth";

async function main() {
  try {
    const user = await auth.api.signUpEmail({
      body: {
        email: "admin@motoguro.tech",
        password: "barbara321",
        name: "Admin",
      },
    });
    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

main();
