import { JwtPayload } from "./interfaces";
import { Store } from "@/database/models/Store";
import { PermissionStructure } from "@/database/models/Role";

declare global {
  namespace Express {
    // Override Passport's User interface to be JwtPayload
    interface User extends JwtPayload {}

    interface Request {
      user?: JwtPayload;
      permission?: PermissionStructure;
      storeCode?: string;
      store?: Store;
      cookies: {
        access_token?: string;
        refresh_token?: string;
        [key: string]: any;
      };
    }
  }
}
