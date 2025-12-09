import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";
import playerRoutes from "./player.routes";
import matchRoutes from "./match.routes";
import championRoutes from "./champion.routes";

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
router.use("/matches", matchRoutes);
router.use("/champions", championRoutes);

export default router;
