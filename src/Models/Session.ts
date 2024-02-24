import { Session } from "express-session";

interface SessionRecord {
    sid: string;
    sess: string;
    expires: number;
}

interface NartSession extends Session {
    id: string;
    isLoggedIn: boolean;
    userId: number | null;
    socketToken: string;
}

export { NartSession, SessionRecord };
