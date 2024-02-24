import AbstractRepository from "./AbstractRepository";
import { NartUser, Permissions } from "../Models/NartUser";
import { hashSync, compareSync } from 'bcrypt';
import DatabaseManager from "./DatabaseManager";

export interface INartRepository {
    login(username: string, password: string): NartUser|null;
    takeInviteLink(user: NartUser, newPassword: string): void;
    generate(username: string, permissions: Permissions, password: string|null): NartUser;
    getUserByUsername(username: string): NartUser|null;
    generateInviteLink(userId: number): string;
    getInviteLinkByUser(user: NartUser): string|null;
    getUserByInviteLink(link: string): NartUser|null;
    count(): number;
    getUserById(id: number): NartUser|null;
}

export interface INartRepositoryUser {
    id: number;
    username: string;
    password: string;
    permissions: number;
    db_key: string;
    has_logged_in: boolean;
    created_at: string;
    last_login: string|null;
}

class NartRepository extends AbstractRepository implements INartRepository
{
    public static repo(): NartRepository
    {
        return new NartRepository(DatabaseManager.main());
    }

    public login(username: string, password: string): NartUser|null
    {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT id, password FROM nart_users WHERE username = ?');

        let result = stmt.get(username) as {
            id: number,
            password: string,
        } | null | undefined;

        if (result === undefined || result === null) {
            return null;
        }

        if (!compareSync(password, result.password)) {
            return null;
        }

        this.updateTable('nart_users', [
            {key: 'last_login', value: (new Date()).toString()},
        ], {key: 'id', value: result.id});

        return this.getUserById(result.id);
    }

    public takeInviteLink(user: NartUser, newPassword: string): void
    {
        this.updateTable('nart_users', [
            {key: 'has_logged_in', value: 1},
            {key: 'last_login', value: (new Date()).toString()},
            {key: 'password', value: hashSync(newPassword, 10)},
        ], {key: 'id', value: user.id});

        this.deleteFrom('nart_users_invite_links', {key: 'user_id', value: user.id});
    }

    public generate(username: string, permissions: Permissions = Permissions.USER, password: string|null = null): NartUser
    {
        let tempPw = password ?? this.generatePassword(64);

        let id = this.insertInto('nart_users', [
            {key: 'username', value: username},
            {key: 'password', value: hashSync(tempPw, 10)},
            {key: 'db_key', value: this.generatePassword(64)},
            {key: 'permissions', value: permissions},
        ], true);

        if (id === undefined || id === null) {
            throw new Error('Failed to create user');
        }

        if (password === null) {
            this.generateInviteLink(id);
        }

        return new NartUser(id, username, permissions);
    }

    public getUserByUsername(username: string): NartUser|null
    {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM nart_users WHERE username = ?');

        let result = stmt.get(username) as INartRepositoryUser|null|undefined;

        if (result === undefined || result === null) {
            return null;
        }

        return NartUser.fromJson(result);
    }

    public generateInviteLink(userId: number): string
    {
        let db = this.getConnection();
        let stmt = db.prepare('INSERT INTO nart_users_invite_links (user_id, link_hash) VALUES (?, ?)');
        let link = this.generatePassword(16);

        stmt.run(userId, link);

        return link;
    }

    public getInviteLinkByUser(user: NartUser): string|null
    {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT link_hash FROM nart_users_invite_links WHERE user_id = ?');

        let result = stmt.pluck().get(user.id) as string;

        if (result === undefined || result === null) {
            return null;
        }

        return result;
    }

    public getUserByInviteLink(link: string): NartUser|null
    {
        let db = this.getConnection();
        let stmt = db.prepare(`
            SELECT user_id FROM nart_users_invite_links
                WHERE link_hash = ?
                AND expires_at > date('now')
        `);

        let result = stmt.pluck().get(link) as number;

        if (result === undefined || result === null) {
            return null;
        }

        return this.getUserById(result);
    }

    public count(): number
    {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT COUNT(*) as c FROM nart_users');

        return stmt.pluck().get() as number;
    }

    public getUserById(id: number): NartUser|null
    {
        let db = this.getConnection();
        let stmt = db.prepare('SELECT * FROM nart_users WHERE id = ?');

        let result = stmt.get(id) as INartRepositoryUser|null|undefined;

        if (result === undefined || result === null) {
            return null;
        }

        return NartUser.fromJson(result);
    }
}


export default NartRepository;
