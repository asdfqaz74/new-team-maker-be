import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";

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

export default router;
