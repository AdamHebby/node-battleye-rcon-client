import DatabaseManager from "../Repository/DatabaseManager";

let db = DatabaseManager.main();

let stdin = process.openStdin();
stdin.addListener("data", function(d) {
    try {
        let input = d.toString().trim();
        let stmt = db.prepare(input);
        stmt.run();

        // dump results
        console.log(stmt.all());
    } catch (error) {
        console.error(error);
    }
});
