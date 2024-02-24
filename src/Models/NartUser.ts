import { INartRepositoryUser } from "../Repository/NartRepository";

enum Permissions {
    NONE = 0,
    USER = 1,
    ADMIN = 2,
    SUPER_ADMIN = 4,
}

class NartUser {
    public constructor(
        public id: number = -1,
        public username: string,
        public permissions: Permissions = Permissions.USER,
        public hasLoggedIn: boolean = false,
        public dbKey: string = '',
        public createdAt: Date = new Date(),
        public lastLogin: Date|null = null,
    ) {
    }

    public usernameDbKey() {
        return this.username.trim().replace(' ', '_').toLowerCase();
    }

    public static fromJson(json: INartRepositoryUser): NartUser {
        return new NartUser(
            json.id,
            json.username,
            json.permissions,
            json.has_logged_in,
            json.db_key,
            new Date(json.created_at),
            json.last_login === null ? null : new Date(json.last_login),
        );
    }

    public static unauthorized(username: string): NartUser {
        return new NartUser(-1, username, Permissions.NONE);
    }
}

export {
    NartUser,
    Permissions,
};
