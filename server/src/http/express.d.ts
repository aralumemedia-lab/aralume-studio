import type { AuthPrincipal } from "./auth";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthPrincipal;
  }
}
