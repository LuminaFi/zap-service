import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

/**
 * Middleware to validate request data
 */
export const validators = {
  metaTransfer: [
    body("recipient")
      .isString()
      .notEmpty()
      .withMessage("Recipient is required")
      .isEthereumAddress()
      .withMessage("Valid Ethereum address is required"),

    body("idrxAmount")
      .isString()
      .notEmpty()
      .withMessage("IDRX amount is required")
      .matches(/^[0-9]*\.?[0-9]+$/)
      .withMessage("Amount must be a valid number"),
  ],
};

/**
 * Validate request and handle validation errors
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    res.status(400).json({
      success: false,
      error: errorMessages.join(", "),
    });
    return;
  }

  next();
};
