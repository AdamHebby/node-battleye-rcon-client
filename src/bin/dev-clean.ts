import DatabaseManager from "../Repository/DatabaseManager";
import NartRepository from "../Repository/NartRepository";

let user = NartRepository.repo().getUserByUsername('admin');

if (user === null) {
    throw new Error('Admin user not found');
}

let db = DatabaseManager.getConnection(`users/admin`, user?.dbKey);

db.exec(`DELETE FROM players`);
db.exec(`DELETE FROM player_previous_names`);
db.exec(`DELETE FROM player_previous_ips`);

db.exec("UPDATE `sqlite_sequence` SET `seq` = 0 WHERE `name` = 'players';");
db.exec("UPDATE `sqlite_sequence` SET `seq` = 0 WHERE `name` = 'player_previous_names';");
db.exec("UPDATE `sqlite_sequence` SET `seq` = 0 WHERE `name` = 'player_previous_ips';");

