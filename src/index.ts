import Ban from "./Models/Ban";
import Player from "./Models/Player";
import Server from "./Models/Server";
import Nart from "./Frontend/Nart";
import ServerEvents from "./ServerEvents";

import $ from "jquery";
import "bootstrap";
import Console from "./Frontend/Console";
import ServerManager from "./Frontend/ServerManager";
import SettingsManager from "./Frontend/SettingsManager";
import Settings from "./Models/Settings";
import { ConsoleColor } from "./Models/ConsoleColors";
import ConsoleColorManager from "./Frontend/ConsoleColorManager";
import * as bootstrap from "bootstrap";
import PlayerRecord from "./Models/PlayerRecord";

$(function () {
    // @ts-ignore
    $.fn.contextMenu = function (settings: {menuSelector: string, menuSelected: Function}) {
        return this.each(function () {

            // Open context menu
            $(this).on("contextmenu", function (e: JQuery.ContextMenuEvent) {
                // return native menu if pressing control
                if (e.ctrlKey) return;

                //open menu
                var $menu = $(settings.menuSelector)
                    .data("invokedOn", $(e.target))
                    .show()
                    .css({
                        position: "absolute",
                        left: getMenuPosition(e.clientX, 'width', 'scrollLeft'),
                        top: getMenuPosition(e.clientY, 'height', 'scrollTop')
                    })
                    .off('click')
                    .on('click', 'a', function (e: JQuery.ClickEvent) {
                        e.preventDefault();
                        $menu.hide();

                        var $invokedOn = $menu.data("invokedOn");
                        var $selectedMenu = $(e.target);

                        settings.menuSelected.call(this, $invokedOn, $selectedMenu);
                    });

                return false;
            });

            //make sure menu closes on any click
            $('body').on('click', function () {
                $(settings.menuSelector).hide();
            });
        });

        function getMenuPosition(mouse: number, direction: string, scrollDir: string) {
            // @ts-ignore
            var win = $(window)[direction](),
                // @ts-ignore
                scroll = $(window)[scrollDir](),
                // @ts-ignore
                menu = $(settings.menuSelector)[direction](),
                position = mouse + scroll;

            // opening menu would pass the side of the page
            if (mouse + menu > win && menu < mouse)
                position -= menu;

            return position;
        }

    };

    const nart = Nart.getInstance();

    const serverManager = new ServerManager(
        $('#settings-servers-list'),
        $('#settings-servers-reset'),
        $('#settings-servers-save'),
        $('#settings-servers-add'),
    );

    const settingsManager = new SettingsManager($('#settings-config-form'));
    const consoleColorsManager = new ConsoleColorManager($('#settings-chat-colors-form'));
    Console.getInstance();

    nart.eventEmitter.on(ServerEvents.PLAYERS, function (players: {players: Player[], playerRecords: PlayerRecord[]}) {
        $('#players-db').empty();
        $('#server-players').empty();

        let currentPlayers = players.players;
        let allPlayers = players.playerRecords;

        let currentGuids: string[] = [];

        currentPlayers.forEach(function (player: Player) {
            currentGuids.push(player.guid);
            let status = player.status === 'Alive' ? 'alive' : 'lobby';

            $('#server-players').append(`
                <tr class="survivor-row" data-name="${player.name}" data-status="${status}" data-guid="${player.guid}" data-ip="${player.ip}" data-game-id="${player.id}" data-db-id="${player.dbId}">
                    <td>${player.id}</td>
                    <td>${player.ip}</td>
                    <td>${player.ping}</td>
                    <td>${player.guid}</td>
                    <td>${player.name}</td>
                    <td>${player.status}</td>
                </tr>
            `);
        });

        allPlayers.forEach(function (record: PlayerRecord) {
            let connected = currentGuids.includes(record.guid) ? 'true' : 'false';
            let gameId = currentPlayers.find((p: Player) => p.guid === record.guid)?.id;
            let status = currentPlayers.find((p: Player) => p.guid === record.guid)?.status;

            if (status !== undefined && status !== null) {
                status = status === 'Alive' ? 'alive' : 'lobby';
            }

            $('#players-db').append(`
                <tr class="survivor-row" data-name="${record.name}" data-status="${status}" data-connected="${connected}" data-guid="${record.guid}" data-ip="${record.lastIp}" data-db-id="${record.id}" data-game-id="${gameId}">
                    <td>${record.id}</td>
                    <td>${record.guid}</td>
                    <td>${record.lastIp}</td>
                    <td>${record.lastSeen}</td>
                    <td>${record.lastSeenDate}</td>
                    <td>${record.name}</td>
                    <td>${record.nickname ?? ''}</td>
                    <td>${record.comment ?? ''}</td>
                </tr>
            `);
        });

        $('#server-info-players').text(currentPlayers.length);
    });

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
            <a class="dropdown-item text-danger" href="#" data-action="ban_ip">Ban (IP ADDRESS)</a>
            <a class="dropdown-item text-danger" href="#" data-action="ban_guid">Ban (GUID)</a>
        </div>
    `).hide().appendTo('body');

    nart.eventEmitter.on(ServerEvents.BANS, function (bans: Ban[]) {
        $('#server-bans').empty();
        bans.forEach(function (ban: Ban) {
            $('#server-bans').append(`
                <tr>
                    <td>${ban.ip}</td>
                    <td>${ban.guid}</td>
                    <td>${ban.minutesLeft}</td>
                    <td>${ban.reason}</td>
                </tr>
            `);
        });
    });

    $('#settings-colors-copy').on('click', function () {
        let colors = ConsoleColorManager.getInstance().consoleColors;
        let text = '';

        colors.forEach(function (color: ConsoleColor) {
            text += `${color.event}=${color.color},${color.enabled}\n`;
        });

        navigator.clipboard.writeText(text);

        $('#settings-colors-copy').text('Copied!').prop('disabled', true);

        setTimeout(function () {
            $('#settings-colors-copy').text('Copy').prop('disabled', false);
        }, 1000);
    });

    $('#paste-color-settings-save').on('click', function () {
        let textArea = $('#paste-color-settings');
        let text = textArea.val() as string;
        let colors: ConsoleColor[] = [];

        text.split('\n').forEach(function (line: string) {
            let [event, eq, color, c, enabled] = line.split(/(\=|,)/g).map((s: string) => s.trim());

            colors.push(new ConsoleColor(event as ServerEvents, color, enabled === '1'));
        });

        textArea.val('');

        let bsTarget = $('#paste-color-settings-save').data('bs-target');

        if (bsTarget) {
            bootstrap.Modal.getInstance('#modal-paste-color-settings')?.hide();
            bootstrap.Modal.getInstance(bsTarget)?.show();
        }

        ConsoleColorManager.getInstance().tempUpdate(colors);
    });

    $('#settings-colors-reset').on('click', function () {
        ConsoleColorManager.getInstance().reset();
    });

    $('#settings-colors-default').on('click', function () {
        ConsoleColorManager.getInstance().default();
        nart.sendCommand(ServerEvents.COLORS_SAVE, ConsoleColorManager.getInstance().consoleColors);
    });

    $('[data-tab-control]').on('click', function () {
        let tab = $(this).data('tab-control');
        let group = $(this).data('tab-control-group');

        if ($(`.tab[data-tab="${tab}"]`).length) {
            $(`.tab[data-tab-group="${group}"]`).hide();
            $(`.tab[data-tab="${tab}"]`).show();
            $(`[data-tab-control-group="${group}"]`).removeClass('active')
            $(`[data-tab-control="${tab}"]`).addClass('active')
        }
    });

    let jqServerConnected = function (id: number) {
        $('#server-selection').val(id);
        $('#server-selection').prop('disabled', true);
        $('#server-connect').prop('disabled', true);
        $('#server-disconnect').prop('disabled', false);
        $('#server-refresh-progress').prop('disabled', false);
    };

    let jqServerDisconnected = function () {
        $('#server-selection').prop('disabled', false);
        $('#server-connect').prop('disabled', false);
        $('#server-disconnect').prop('disabled', true);
        $('#server-refresh-progress').prop('disabled', true);
        $('#server-refresh-status').text('Never');
    };

    nart.eventEmitter.on(ServerEvents.RCON_CONNECT, function (id: number) {
        jqServerConnected(id);
    });

    nart.eventEmitter.on(ServerEvents.RCON_DISCONNECT, function (response: {data: boolean}) {
        jqServerDisconnected();
    });

    nart.eventEmitter.on(ServerEvents.RCON_RECONNECT, function (id: number) {
        jqServerConnected(id);
    });

    nart.eventEmitter.on(ServerEvents.ADMINS, function (data: { id: number, ip: string, port: number}[]) {
        $('#server-info-admins').text(data.length);
    });

    nart.eventEmitter.on(ServerEvents.SOCK_OPEN, function () {
        nart.sendCommand(ServerEvents.SERVERS_LIST, []);
        nart.sendCommand(ServerEvents.SETTINGS_LIST, []);
        nart.sendCommand(ServerEvents.COLORS_LIST, []);

        $('#server-connect').on('click', function (e) {
            e.preventDefault();

            $('#server-selection').prop('disabled', true);
            $('#server-connect').prop('disabled', true);
            $('#server-refresh-status').text('Never');

            nart.connect($('#server-selection').val() as number);
        });

        $('#server-disconnect').on('click', function (e) {
            e.preventDefault();

            nart.sendCommand(ServerEvents.RCON_DISCONNECT, []);
        });

        $('#server-selection').on('change', function () {
            let id = $(this).val();

            if (id === 'SERVER SELECT') {
                $('#server-connect').prop('disabled', true);
                return;
            }

            $('#server-connect').prop('disabled', false);
        });

        $('#settings-config-save').on('click', function (e) {
            nart.sendCommand(ServerEvents.SETTINGS_SAVE, settingsManager.settings);
        });

        $('#settings-colors-save').on('click', function (e) {
            nart.sendCommand(ServerEvents.COLORS_SAVE, consoleColorsManager.save());
        });

        serverManager.onSave = function (servers: Server[]) {
            nart.sendCommand(ServerEvents.SERVERS_SAVE, servers);
        };

        serverManager.onDelete = function (server: Server) {
            nart.sendCommand(ServerEvents.SERVER_DELETE, {id: server.id});
        };

        nart.eventEmitter.addListener(ServerEvents.SERVERS_LIST, function (servers: {data: Server[]}) {
            let previousSelected = $('#server-selection option:selected').val();
            $('#server-selection').empty();
            $('#server-selection').append('<option value="0">SERVER SELECT</option>');

            servers.data.forEach(function (server: Server) {
                let selected = nart.serverId === server.id ? 'selected' : '';
                $('#server-selection').append(`<option value="${server.id}" ${selected}>${server.name}</option>`);
            });

            $('#server-selection').val(parseInt(previousSelected?.toString() || '0'));
            if ($('#server-selection option:selected').length === 0) {
                $('#server-selection').val('0');
            }

            serverManager.update(servers.data);
        });

        nart.eventEmitter.addListener(ServerEvents.COLORS_LIST, function (colors: ConsoleColor[]) {
            consoleColorsManager.update(colors);
        });

        function bootstrapFormModal(title: string, message: string, form: JQuery<HTMLElement>, cb: Function) {
            let modal        = $('#modal-input-form');
            let modalTitle   = modal.find('.modal-title');
            let modalText    = modal.find('.modal-text');
            let modalConfirm = modal.find('.modal-confirm');
            let formWrapper  = modal.find('.modal-form');

            modalTitle.text(title);
            modalText.text(message);
            formWrapper.empty().append(form);

            let m = bootstrap.Modal.getOrCreateInstance('#modal-input-form');

            modalConfirm.one('click', function () {
                let data: any = {};

                form.serializeArray().map((i: any) => {
                    data[i.name] = i.value;
                });

                cb(data);
            });

            m.show();
        }

        function bootstrapFormNumberGroup (name: string, label: string, min: number, max: number, value: number = 0) {
            return $(`
                <div class="form-group mb-2 row g-0">
                    <label for="${name}" class="col-4 col-form-label form-label">${label}</label>
                    <input type="number" class="col form-control" name="${name}" value="${value}" min="${min}" max="${max}">
                </div>
            `);
        }

        function bootstrapFormTextGroup (name: string, label: string, value: string = '') {
            return $(`
                <div class="form-group mb-2 row g-0">
                    <label for="${name}" class="col-4 col-form-label form-label">${label}</label>
                    <input type="text" class="col form-control" name="${name}" value="${value}">
                </div>
            `);
        }

        $('#modal-input-form').on('keyup', 'input, textarea', function (e) {
            if (e.key === 'Enter' && e.ctrlKey === true && e.shiftKey === false && e.altKey === false && e.metaKey === false) {
                $('#modal-input-form').find('.modal-confirm').trigger('click');
            }
        });

        // @ts-ignore
        $("#players-db, #server-players").contextMenu({
            menuSelector: "#players-db-context-menu",
            menuSelected: function (invokedOn: JQuery<Element>, selectedMenu: JQuery<Element>) {
                let action = selectedMenu.data('action');
                let dbId   = invokedOn.parent('.survivor-row').data('db-id');
                let gameId = invokedOn.parent('.survivor-row').data('game-id');
                let guid   = invokedOn.parent('.survivor-row').data('guid');
                let ip     = invokedOn.parent('.survivor-row').data('ip');
                let name   = invokedOn.parent('.survivor-row').data('name') || null;

                if (action === 'message' && dbId !== '') {
                    let form = $('<form>').append($('<textarea class="w-100" rows="5">').attr('name', 'message').val(''));

                    bootstrapFormModal(`Send Message to ${name}`, 'Input Message:', form, function (data: any) {
                        if (data.message === undefined) {
                            return;
                        }

                        nart.messageUser(gameId, data.message);
                    });
                    return;
                }

                if (action === 'set_comment') {
                    let form = $('<form>').append($('<textarea class="w-100" rows="5">').attr('name', 'comment').val(''));

                    bootstrapFormModal('Set Comment', 'Enter a comment:', form, function (data: any) {
                        if (data.comment === undefined) {
                            return;
                        }

                        nart.sendCommand(ServerEvents.SET_COMMENT, {id: dbId, comment: data.comment});
                    });
                    return;
                }

                if (action === 'set_nickname') {
                    let form = $('<form>').append(bootstrapFormTextGroup('nickname', 'Nickname', ''));

                    bootstrapFormModal('Set Nickname', 'Enter new Nickname:', form, function (data: any) {
                        if (data.nickname === undefined) {
                            return;
                        }

                        nart.sendCommand(ServerEvents.SET_NICKNAME, {id: dbId, nickname: data.nickname});
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
                    let form = $('<form>').append(bootstrapFormTextGroup('reason', 'Reason:', ''));

                    bootstrapFormModal(`Kick ${name}`, `Are you sure you want to kick ${name} (${guid}) at ${ip}?`, form, function (data: any) {
                        if (data.reason === undefined) {
                            return;
                        }

                        nart.kickUser(gameId, data.reason);
                    });
                    return;
                }

                if (action === 'ban_ip') {
                    let form = $('<form>')
                        .append(bootstrapFormTextGroup('reason', 'Reason:', 'Banned by Admin'))
                        .append(bootstrapFormNumberGroup('duration', 'Duration:', 0, 525600, 0));

                    bootstrapFormModal(`Ban ${ip}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip} by their IP address?`, form, function (data: any) {
                        console.debug(data);

                        if (data.reason === undefined || data.duration === undefined) {
                            return;
                        }

                        // nart.sendCommand(Events.USER_BAN, {id: gameId, reason: data.reason, duration: data.duration});
                    });
                    return;
                }

                if (action === 'ban_guid') {
                    let form = $('<form>')
                        .append(bootstrapFormTextGroup('reason', 'Reason:', 'Banned by Admin'))
                        .append(bootstrapFormNumberGroup('duration', 'Duration:', 0, 525600, 0));

                    bootstrapFormModal(`Ban ${guid}`, `Are you sure you want to Ban ${name} (${guid}) at ${ip} by their GUID?`, form, function (data: any) {
                        console.debug(data);

                        if (data.reason === undefined || data.duration === undefined) {
                            return;
                        }

                        // nart.sendCommand(Events.USER_BAN, {id: gameId, reason: data.reason, duration: data.duration});
                    });
                    return;
                }
            }
        });

    });
});
