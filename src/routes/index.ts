import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";
import playerRoutes from "./player.routes";

const router: Router = Router();

// Example route
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date(),
  });
});

router.use("/users", userRoutes);
router.use("/players", playerRoutes);

export default router;
