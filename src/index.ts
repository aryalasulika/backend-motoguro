import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth, db } from "./auth.js";
import { transactions, services } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://pos.motoguro.tech"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Auth Routes - Mounting as middleware
app.use("/api/auth", toNodeHandler(auth));

// Middleware to check auth
const requireAuth = async (req: any, res: any, next: any) => {
    const session = await auth.api.getSession({
        headers: req.headers
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    next();
};

// API Routes
app.get("/api/transactions", requireAuth, async (req: any, res) => {
    try {
        const allTransactions = await db.select()
            .from(transactions)
            .orderBy(desc(transactions.date));
        res.json(allTransactions);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

app.post("/api/transactions", requireAuth, async (req: any, res) => {
    try {
        const newTransaction = await db.insert(transactions).values({
            ...req.body,
            userId: req.user.id
        }).returning();
        res.json(newTransaction[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

app.delete("/api/transactions/:id", requireAuth, async (req: any, res) => {
    try {
        await db.delete(transactions).where(eq(transactions.id, req.params.id));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

app.put("/api/transactions/:id", requireAuth, async (req: any, res) => {
    try {
        const updatedTransaction = await db.update(transactions)
            .set({ ...req.body })
            .where(eq(transactions.id, req.params.id))
            .returning();
        res.json(updatedTransaction[0]);
    } catch (e) {
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

// Services CRUD
app.get("/api/services", requireAuth, async (req: any, res) => {
    try {
        const allServices = await db.select().from(services);
        res.json(allServices);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch services" });
    }
});

app.post("/api/services", requireAuth, async (req: any, res) => {
    try {
        const newService = await db.insert(services).values({
            ...req.body,
            userId: req.user.id
        }).returning();
        res.json(newService[0]);
    } catch (e) {
        res.status(500).json({ error: "Failed to create service" });
    }
});

app.put("/api/services/:id", requireAuth, async (req: any, res) => {
    try {
        const updatedService = await db.update(services)
            .set({ ...req.body })
            .where(eq(services.id, req.params.id))
            .returning();
        res.json(updatedService[0]);
    } catch (e) {
        res.status(500).json({ error: "Failed to update service" });
    }
});

app.delete("/api/services/:id", requireAuth, async (req: any, res) => {
    try {
        await db.delete(services).where(eq(services.id, req.params.id));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete service" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
