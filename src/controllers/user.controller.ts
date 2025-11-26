import type { NextFunction, Request, Response } from "express";
import * as userService from "@/services/user.service";
import { ServiceError } from "@/errors";
import { RegisterUserDTO } from "@/dto/register-user.dto";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = new RegisterUserDTO(req.body);
    dto.sanitize();
    dto.validate();

    const newUser = await userService.registerUser(dto.toServiceData());

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { user, token } = await userService.loginUser(email, password);

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(userId, updateData);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(error.toJSON());
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: (error as Error).message,
      },
    });
  }
};
