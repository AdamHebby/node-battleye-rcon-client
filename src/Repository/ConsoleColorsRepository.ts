import AbstractRepository from "./AbstractRepository";
import {ConsoleColor} from "../Models/ConsoleColors";
import DatabaseManager from "./DatabaseManager";
import { NartUser } from "../Models/NartUser";
import ServerEvents from "../ServerEvents";

export interface IConsoleColorsRepository {
    upsert(colors: ConsoleColor[]): ConsoleColor[];
    all(): ConsoleColor[];
}

class ConsoleColorsRepository extends AbstractRepository implements IConsoleColorsRepository
{
    public static repo(user: NartUser): IConsoleColorsRepository
    {
        return new ConsoleColorsRepository(
            DatabaseManager.getConnection(`users/${user.usernameDbKey()}`, user.dbKey)
        );
    }

    public upsert(colors: ConsoleColor[]): ConsoleColor[] {
        let db = this.getConnection();

        let stmt = db.prepare('INSERT OR REPLACE INTO console_colors (event, color, enabled) VALUES (?, ?, ?)');

        colors.forEach(color => {
            if (color.color === undefined || color.event === undefined) {
                return;
            }

            stmt.run(color.event, color.color, color.enabled ? 1 : 0);
        });

        return colors;
    }

    public all(): ConsoleColor[] {
        let db = this.getConnection();

        let stmt = db.prepare('SELECT * FROM console_colors');
        let colors = stmt.all() as {
            event: ServerEvents,
            color: string,
            enabled: number
        }[];

        let colorsObject = [] as ConsoleColor[];

        for (let i = 0; i < colors.length; i++) {
            let color = colors[i];
            colorsObject.push(new ConsoleColor(color.event, color.color, color.enabled ? true : false));
        }

        return colorsObject;
    }
}


export default ConsoleColorsRepository;
