import BootstrapUtils from "./BootstrapUtils";
import ContextMenu from "./ContextMenu";
import $ from "jquery";

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
        duration?: number
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
                <a class="dropdown-item text-danger" href="#" data-action="ban_both">Ban (IP &amp; GUID)</a>
                <a class="dropdown-item text-danger" href="#" data-action="ban_ip">Ban (IP ADDRESS)</a>
                <a class="dropdown-item text-danger" href="#" data-action="ban_guid">Ban (GUID)</a>
            </div>
        `).hide().appendTo('body');
    }

    public static addMenu(record: JQuery<Element>, callback: PlayerActionContextMenuCallback|undefined = undefined) {
        ContextMenu.menu(record, {
            menuSelector: '#players-db-context-menu',
            beforeShow: function (e: JQuery.ContextMenuEvent) {
                let disableOnlineButtons = $(e.target).closest('[data-guid]').data('game-id') === '';
                $('#players-db-context-menu [data-action=message]').toggleClass('disabled', disableOnlineButtons);
                $('#players-db-context-menu [data-action=kick]').toggleClass('text-warning', !disableOnlineButtons);
                $('#players-db-context-menu [data-action=kick]').toggleClass('disabled', disableOnlineButtons);
            },
            menuSelected: function (invokedOn: JQuery<Element>, selectedMenu: JQuery<Element>) {
                invokedOn = invokedOn.closest('[data-guid]');
                PlayerActionContextMenu.trigger(invokedOn, selectedMenu, callback);
            }
        });
    }

    public static trigger(record: JQuery<Element>, selectedMenu: JQuery<Element>, callback: PlayerActionContextMenuCallback|undefined = undefined) {
        let action = selectedMenu.data('action');
        let dbId   = record.data('db-id');
        let gameId = record.data('game-id');
        let guid   = record.data('guid');
        let ip     = record.data('ip');
        let name   = record.data('name') || null;

        if (gameId === '') {
            gameId = null;
        }

        if (action === 'message' && dbId !== '') {
            let form = $('<form>').append($('<textarea class="w-100" rows="5">').attr('name', 'message').val(''));

            BootstrapUtils.formModal(`Send Message to ${name}`, 'Input Message:', form, function (data: any) {
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

            BootstrapUtils.formModal('Set Comment', 'Enter a comment:', form, function (data: any) {
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

            BootstrapUtils.formModal('Set Nickname', 'Enter new Nickname:', form, function (data: any) {
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

            BootstrapUtils.formModal(`Kick ${name}`, `Are you sure you want to kick ${name} (${guid}) at ${ip}?`, form, function (data: any) {
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

        if (action === 'ban_both') {
            let form = $('<form>')
                .append(BootstrapUtils.formTextGroup('reason', 'Reason:', 'Banned by Admin'))
                .append(BootstrapUtils.formNumberGroup('duration', 'Duration:', 0, 525600, 0));

            BootstrapUtils.formModal(`Ban ${ip}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip} by their GUID and IP address?`, form, function (data: any) {
                if (data.reason === undefined || data.duration === undefined) {
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

                // nart.sendCommand(Events.USER_BAN, {id: gameId, source: 'both', reason: data.reason, duration: data.duration});
            });
            return;
        }

        if (action === 'ban_ip') {
            let form = $('<form>')
                .append(BootstrapUtils.formTextGroup('reason', 'Reason:', 'Banned by Admin'))
                .append(BootstrapUtils.formNumberGroup('duration', 'Duration:', 0, 525600, 0));

            BootstrapUtils.formModal(`Ban ${ip}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip} by their IP address?`, form, function (data: any) {
                if (data.reason === undefined || data.duration === undefined) {
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
                // nart.sendCommand(Events.USER_BAN, {id: gameId, source: 'ip', reason: data.reason, duration: data.duration});
            });
            return;
        }

        if (action === 'ban_guid') {
            let form = $('<form>')
                .append(BootstrapUtils.formTextGroup('reason', 'Reason:', 'Banned by Admin'))
                .append(BootstrapUtils.formNumberGroup('duration', 'Duration:', 0, 525600, 0));

            BootstrapUtils.formModal(`Ban ${guid}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip} by their GUID?`, form, function (data: any) {
                if (data.reason === undefined || data.duration === undefined) {
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

                // nart.sendCommand(Events.USER_BAN, {id: gameId, source: 'guid', reason: data.reason, duration: data.duration});
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