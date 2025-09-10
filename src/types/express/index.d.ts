import { Server } from "socket.io";
import { IUser } from "../../api/models/userModel";

// This is a special file in TypeScript called a "declaration file".
// It allows us to extend existing types from libraries.

declare global {
  namespace Express {
    // We are extending the original 'Request' interface from the Express library.
    export interface Request {
      // These are the custom properties we are adding.
      // Now, TypeScript will know that 'req.user', 'req.io', and 'req.file' can exist.
      user?: IUser;
      io?: Server;
      file?: Multer.File;
    }
  }
}

// You need this empty export statement to tell TypeScript this is a module.
export {};
