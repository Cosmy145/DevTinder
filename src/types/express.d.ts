import type { ISignupSchema } from "../utils/validator.ts";
import type { HydratedDocument } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<ISignupSchema>; // Simply combine ISignupSchema with Mongoose's Document type as the zod schema doesn't have the _id field,createdAt,updatedAt etc.
    }
  }
}

/**
 * * In TypeScript, req.user does not exist by default on Request. In industry codebases, we extend Express's Request interface via declaration merging so that req.user is globally typed and autocomplete works across all routes without manual type assertions.
 */
