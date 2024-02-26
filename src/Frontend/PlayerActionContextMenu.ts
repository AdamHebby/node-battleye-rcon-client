import BootstrapUtils, { TModalData } from "./BootstrapUtils";
import ContextMenu from "./ContextMenu";
import $ from "jquery";
import Name from "./Data/Name";
import IpAddress from "./Data/IpAddress";
import GUID from "./Data/GUID";

interface PlayerActionContextMenuCallbackData {
    dbId: number,
    gameId: number|null,
    guid: string,
    ip: string,
    name: string|null,
    formData: {
        message?: string,
        comment?: string,
        nickname?: string,
        reason?: string,
        duration?: number,
        ban_guid?: string,
        ban_ip?: string,
        ban_previous_ips?: string,
    }
}

interface PlayerActionContextMenuCallback {
    (action: string, data: PlayerActionContextMenuCallbackData): void;
}

class PlayerActionContextMenu {
    public static buildMenu() {
        $(`
            <div id="players-db-context-menu" class="dropdown-menu">
                <a class="dropdown-item" href="#" data-action="message">Message</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" data-action="set_comment">Set Comment</a>
                <a class="dropdown-item" href="#" data-action="set_nickname">Set Nickname</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" data-action="copy_all">Copy All</a>
                <a class="dropdown-item" href="#" data-action="copy_ip">Copy IP</a>
                <a class="dropdown-item" href="#" data-action="copy_guid">Copy GUID</a>
                <a class="dropdown-item" href="#" data-action="copy_name">Copy Name</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item text-warning" href="#" data-action="kick">Kick</a>
                <a class="dropdown-item text-danger" href="#" data-action="ban_user">Ban User</a>
            </div>
        `).hide().appendTo('body');
    }

    public static addMenu(record: JQuery<HTMLElement>, callback: PlayerActionContextMenuCallback|undefined = undefined) {
        ContextMenu.menu(record, {
            menuSelector: '#players-db-context-menu',
            beforeShow: function (e: JQuery.ContextMenuEvent) {
                let disableOnlineButtons = $(e.target).closest(`[data-${GUID.key}]`).data('game-id') === '';
                $('#players-db-context-menu [data-action=message]').toggleClass('disabled', disableOnlineButtons);
                $('#players-db-context-menu [data-action=kick]').toggleClass('text-warning', !disableOnlineButtons);
                $('#players-db-context-menu [data-action=kick]').toggleClass('disabled', disableOnlineButtons);
            },
            menuSelected: function (invokedOn: JQuery<HTMLElement>, selectedMenu: JQuery<HTMLElement>) {
                invokedOn = invokedOn.closest(`[data-${GUID.key}]`);

                if (invokedOn.length === 0) {
                    return;
                }

                PlayerActionContextMenu.trigger(invokedOn, selectedMenu, callback);
            }
        });
    }

    public static trigger(record: JQuery<HTMLElement>, selectedMenu: JQuery<HTMLElement>, callback: PlayerActionContextMenuCallback|undefined = undefined) {
        let action = selectedMenu.data('action');
        let dbId   = record.data('db-id');
        let gameId = record.data('game-id');
        let guid   = record.data(GUID.key);
        let ip     = record.data(IpAddress.key);
        let name   = record.data(Name.key) || null;

        if (gameId === '') {
            gameId = null;
        }

        if (action === 'message' && dbId !== '') {
            let form = $('<form>').append($('<textarea class="w-100" rows="5">').attr('name', 'message').val(''));

            BootstrapUtils.formModal(`Send Message to ${name}`, 'Input Message:', form, function (data: TModalData ) {
                if (data.message === undefined) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        dbId: dbId,
                        gameId: gameId,
                        guid: guid,
                        ip: ip,
                        name: name,
                        formData: data
                    });
                    return;
                }
            });
            return;
        }

        if (action === 'set_comment') {
            let form = $('<form>').append($('<textarea class="w-100" rows="5">').attr('name', 'comment').val(''));

            BootstrapUtils.formModal('Set Comment', 'Enter a comment:', form, function (data: TModalData) {
                if (data.comment === undefined) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        dbId: dbId,
                        gameId: gameId,
                        guid: guid,
                        ip: ip,
                        name: name,
                        formData: data
                    });
                    return;
                }
            });
            return;
        }

        if (action === 'set_nickname') {
            let form = $('<form>').append(BootstrapUtils.formTextGroup('nickname', 'Nickname', ''));

            BootstrapUtils.formModal('Set Nickname', 'Enter new Nickname:', form, function (data: TModalData) {
                if (data.nickname === undefined) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        dbId: dbId,
                        gameId: gameId,
                        guid: guid,
                        ip: ip,
                        name: name,
                        formData: data
                    });
                    return;
                }
            });
            return;
        }

        if (action === 'copy_all') {
            navigator.clipboard.writeText(`GUID: ${guid}\nIP: ${ip}\nGAME ID: ${gameId}`);
            return;
        }

        if (action === 'copy_ip') {
            navigator.clipboard.writeText(ip);
            return;
        }

        if (action === 'copy_guid') {
            navigator.clipboard.writeText(guid);
            return;
        }

        if (action === 'copy_name') {
            navigator.clipboard.writeText(name);
            return;
        }

        if (action === 'kick') {
            let form = $('<form>').append(BootstrapUtils.formTextGroup('reason', 'Reason:', ''));

            BootstrapUtils.formModal(`Kick ${name}`, `Are you sure you want to kick ${name} (${guid}) at ${ip}?`, form, function (data: TModalData) {
                if (data.reason === undefined) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        dbId: dbId,
                        gameId: gameId,
                        guid: guid,
                        ip: ip,
                        name: name,
                        formData: data
                    });
                    return;
                }
            });
            return;
        }

        if (action === 'ban_user') {
            let form = $('<form>')
                .append(BootstrapUtils.formTextGroup('reason', 'Reason:', 'Banned by Admin'))
                .append(BootstrapUtils.formNumberGroup('duration', 'Duration:', -1, 5256000, -1))
                .append(BootstrapUtils.formCheckboxGroup('ban_guid', 'Ban GUID', true))
                .append(BootstrapUtils.formCheckboxGroup('ban_ip', 'Ban Current IP', false))
                .append(BootstrapUtils.formCheckboxGroup('ban_previous_ips', 'Ban Previous IPs', false))
            ;

            BootstrapUtils.formModal(`Ban ${name}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip}?`, form, function (data: TModalData) {
                if (data.reason === undefined || data.duration === undefined || (data.ban_guid === undefined && data.ban_ip === undefined && data.ban_previous_ips === undefined)) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        dbId: dbId,
                        gameId: gameId,
                        guid: guid,
                        ip: ip,
                        name: name,
                        formData: data
                    });
                    return;
                }
            });
            return;
        }
    }
}

export {
    PlayerActionContextMenu,
    PlayerActionContextMenuCallback,
    PlayerActionContextMenuCallbackData
};