import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { requireAuth } from "./middlewares/requireAuth";
import adminProducts from "./routes/adminProducts";
import products from "./routes/products";
import categories from "./routes/categories";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminOrders from "./routes/adminOrders";
import userRoutes from "./routes/user";
import imageRoutes from "./routes/imageRoutes";


const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploads directory as static files
const uploadsPath = path.resolve(__dirname, "../uploads");
console.log("Serving uploads from:", uploadsPath);
app.use("/uploads", express.static(uploadsPath));

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend running");
});

app.get("/api/protected", requireAuth, (_req, res) => {
  res.json({ message: "You are authenticated" });
});

//Categories
app.use("/api/categories", categories);

//admin Products
app.use("/api/admin/products", adminProducts);

//products
app.use("/api/products", products);

//cart
app.use("/api/cart", cartRoutes);

//orders
app.use("/api/orders", orderRoutes);

//admin Orders view
app.use("/api/admin", adminOrders);

//User
app.use("/api/user", userRoutes);

// Image uploads
app.use("/api/images", imageRoutes);

export default app;
