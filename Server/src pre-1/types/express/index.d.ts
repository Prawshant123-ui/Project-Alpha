// src/types/express/index.d.ts
import { Role } from "@prisma/client"; // or wherever your Role type lives

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role; // or string, if you don't have an enum
      };
    }
  }
}

export {};