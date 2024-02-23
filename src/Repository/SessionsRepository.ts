import AbstractRepository from "./AbstractRepository";
import DatabaseManager from "./DatabaseManager";
import { NartSession, SessionRecord } from "../Models/Session";

export interface ISessionsRepository {
    getSessionByToken(token: string): NartSession | null;
}

class SessionsRepository extends AbstractRepository
{
    public static repo(): SessionsRepository
    {
        return new SessionsRepository(DatabaseManager.main());
    }

    public getSessionByToken(token: string): NartSession | null
    {
        let records: SessionRecord[] = this.getConnection().prepare("SELECT * FROM sessions").all() as SessionRecord[];
        let sessions: NartSession[]  = records.map((session: SessionRecord): NartSession => {
            let s = JSON.parse(session.sess) as NartSession;
            s.id = session.sid;
            return s;
        });

        let session = sessions.find((s: NartSession) => {
            return s.socketToken === token;
        });

        if (session === undefined) {
            return null;
        }

        return session;
    }
}

export default SessionsRepository;