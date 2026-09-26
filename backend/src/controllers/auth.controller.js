import { registerPassenger, login } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerPassenger(data);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
