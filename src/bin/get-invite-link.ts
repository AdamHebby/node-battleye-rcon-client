import NartRepository from "../Repository/NartRepository";

let prompt: any = require('prompt-sync')();
let nartRepo = NartRepository.repo();
let username = prompt("Enter a username: ");

if (username === null) {
    console.log("Cancelled");
    process.exit(0);
}

let user = nartRepo.getUserByUsername(username.trim());
if (user === null) {
    console.log(`User '${username.trim()}' does not exist`);
    process.exit(0);
}

let link = nartRepo.getInviteLinkByUser(user);

console.log(`Password Reset link: http://localhost:3000/invite/${link}`);