import AbstractRepository from "./AbstractRepository";
import {ConsoleColor} from "../Models/ConsoleColors";

class ConsoleColorsRepository extends AbstractRepository
{
    public upsert(colors: ConsoleColor[]): ConsoleColor[] {
        let db = this.getConnection();

        let stmt = db.prepare('INSERT OR REPLACE INTO console_colors (event, color, enabled) VALUES (?, ?, ?)');

        colors.forEach(color => {
            stmt.run(color.event, color.color, color.enabled ? 1 : 0);
        });

        return colors;
    }

    public all(): ConsoleColor[] {
        let db = this.getConnection();

        let stmt = db.prepare('SELECT * FROM console_colors');
        let colors: ConsoleColor[] = stmt.all() as any;

        let colorsObject = [] as ConsoleColor[];

        for (let i = 0; i < colors.length; i++) {
            let color = colors[i];
            colorsObject.push(new ConsoleColor(color.event, color.color, color.enabled ? true : false));
        }

        return colorsObject;
    }
}


export default ConsoleColorsRepository;
