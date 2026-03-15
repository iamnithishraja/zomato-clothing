import type { User } from "./user";
import type { Admin } from "./admin";
import type { Request } from "express";

export type CustomRequest = Request & {
    user?: User;
    admin?: Admin;
};