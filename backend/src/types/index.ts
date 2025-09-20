import type { User } from "./user";
import type { Request } from "express";

export type CustomRequest = Request & {
    user?: User;  
};   

  