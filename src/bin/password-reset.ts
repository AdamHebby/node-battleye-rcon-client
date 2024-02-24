import PromptSync from "prompt-sync";
import NartRepository from "../Repository/NartRepository";

let nartRepo = NartRepository.repo();
const prompt = PromptSync();
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

if (link === null) {
    link = nartRepo.generateInviteLink(user.id);
}

console.log(`Password Reset link: http://localhost:3000/invite/${link}`);

