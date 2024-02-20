import NartRepository from "../Repository/NartRepository";

let prompt: any = require('prompt-sync')();
let nartRepo = NartRepository.repo();
let username = prompt("Enter a username: ");

if (username === null) {
    console.log("Cancelled");
    process.exit(0);
}

if (nartRepo.getUserByUsername(username.trim()) !== null) {
    console.log(`User '${username.trim()}' already exists`);
    process.exit(0);
}

let user = nartRepo.generate(username.trim());
let link = nartRepo.generateInviteLink(user.id);

console.log(`Invite link: http://localhost:3000/invite/${link}`);
