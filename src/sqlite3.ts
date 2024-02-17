import AbstractRepository from "./Repository/AbstractRepository";

class InputRepository extends AbstractRepository {
    public constructor() {
        super();
    }

    public run(query: string) {
        try {
            let db = this.getConnection();

            let stmt = db.prepare(query);

            if (query.toLowerCase().startsWith('select')) {
                console.log(stmt.all());
            } else {
                let res = stmt.run();
                console.log(`Changes: ${res.changes} | Last ID: ${res.lastInsertRowid}`)
            }
        } catch (e) {
            console.error(e);
        }
    }
}


// constantly read user input and execute it
let inputRepo = new InputRepository();
let stdin = process.openStdin();
stdin.addListener("data", function(d) {
    let input = d.toString().trim();
    inputRepo.run(input);
});
