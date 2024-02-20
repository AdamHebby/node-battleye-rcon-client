import Database, { Database as DB } from "better-sqlite3-multiple-ciphers";

abstract class AbstractRepository
{
    public constructor(private db: DB) {
    }

    public getConnection(): DB {
        return this.db;
    }

    public insertInto(table: string, data: {key: string, value: any}[], insertId: boolean = false): number|null {
        let db = this.getConnection();
        let keys = data.map((d) => d.key).join(', ');
        let values = data.map((d) => d.value);
        let qs = data.map(() => '?').join(', ');

        let stmt = db.prepare(`INSERT INTO ${table} (${keys}) VALUES (${qs})`);

        stmt.run(values);

        if (insertId) {
            let row = db.prepare('SELECT last_insert_rowid() as id').pluck().get() as number;

            if (row !== undefined && row !== null) {
                return row;
            }
        }

        return null;
    }

    public updateTable(table: string, data: {key: string, value: any}[], where: {key: string, value: any}): void {
        let db = this.getConnection();
        let set = data.map((d) => `${d.key} = ?`).join(', ');
        let values = data.map((d) => d.value);
        let whereStr = `${where.key} = ?`;

        let stmt = db.prepare(`UPDATE ${table} SET ${set} WHERE ${whereStr}`);

        stmt.run([...values, where.value]);
    }

    public deleteFrom(table: string, where: {key: string, value: any}): void {
        let db = this.getConnection();
        let whereStr = `${where.key} = ?`;

        let stmt = db.prepare(`DELETE FROM ${table} WHERE ${whereStr}`);

        stmt.run(where.value);
    }

    protected generatePassword(length: number = 256) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }

        return password;
    }

}

export default AbstractRepository;
