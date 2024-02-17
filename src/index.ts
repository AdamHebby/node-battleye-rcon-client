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
import { ConsoleColor } from "./Models/ConsoleColors";
import ConsoleColorManager from "./Frontend/ConsoleColorManager";
import * as bootstrap from "bootstrap";
import PlayerRecord from "./Models/PlayerRecord";
import { PlayerActionContextMenu, PlayerActionContextMenuCallback, PlayerActionContextMenuCallbackData } from "./Frontend/PlayerActionContextMenu";

$(function () {
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

    PlayerActionContextMenu.buildMenu();

    const playerContextMenuActions: PlayerActionContextMenuCallback = function (action: string, data: PlayerActionContextMenuCallbackData) {
        if (action === 'message' && data.formData.message !== undefined && data.gameId !== null) {
            nart.messageUser(data.gameId, data.formData.message);
            return;
        }

        if (action === 'set_comment' && data.dbId > 0) {
            nart.sendCommand(ServerEvents.SET_COMMENT, {id: data.dbId, comment: data.formData.comment});
            return;
        }

        if (action === 'set_nickname') {
            nart.sendCommand(ServerEvents.SET_NICKNAME, {id: data.dbId, nickname: data.formData.nickname});
            return;
        }

        if (action === 'kick' && data.formData.reason !== undefined && data.gameId !== null) {
            nart.kickUser(data.gameId, data.formData.reason);
            return;
        }

        if (action === 'ban_both' && data.formData.reason !== undefined && data.formData.duration !== undefined) {
            nart.sendCommand(ServerEvents.USER_BAN, {
                id: data.gameId,
                source: 'both',
                reason: data.formData.reason,
                duration: data.formData.duration
            });
            return;
        }

        if (action === 'ban_ip' && data.formData.reason !== undefined && data.formData.duration !== undefined) {
            nart.sendCommand(ServerEvents.USER_BAN, {
                id: data.gameId,
                source: 'ip',
                reason: data.formData.reason,
                duration: data.formData.duration
            });
            return;
        }

        if (action === 'ban_guid' && data.formData.reason !== undefined && data.formData.duration !== undefined) {
            nart.sendCommand(ServerEvents.USER_BAN, {
                id: data.gameId,
                source: 'ip',
                reason: data.formData.reason,
                duration: data.formData.duration
            });
            return;
        }
    }

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
            let gameId = currentPlayers.find((p: Player) => p.guid === record.guid)?.id ?? '';
            let status = currentPlayers.find((p: Player) => p.guid === record.guid)?.status ?? '';

            if (status !== '' && status !== '') {
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

        $(document).find('player').each(function (el) {
            let id = $(this).attr('data-id');
            let guid = $(this).attr('data-guid');
            let player: Player | undefined;
            let dbRecord: PlayerRecord | undefined;

            console.debug(id, guid);

            if ((id === undefined && guid === undefined) || (id === '' && guid === '')) {
                return;
            }

            if (guid === undefined || guid.trim() === '') {
                if (id === undefined || id.trim() === '' || id === null) {
                    return;
                }

                player = currentPlayers.find((p: Player) => p.id === parseInt(id as string)) as Player;

                if (player === undefined || player.guid === undefined || !player) {
                    return;
                }

                dbRecord = allPlayers.find((p: PlayerRecord) => p.guid === player?.guid) as PlayerRecord;

                if (dbRecord === undefined || dbRecord.guid === undefined) {
                    return;
                }

                guid = player.guid;
            }

            if (player === undefined && guid !== undefined) {
                player = currentPlayers.find((p: Player) => p.guid === guid) as Player;
                dbRecord = allPlayers.find((p: PlayerRecord) => p.guid === guid) as PlayerRecord;
            }

            if (dbRecord === undefined || dbRecord.guid === undefined) {
                return;
            }

            $(this)
                .attr('data-bs-toggle', 'popover')
                .attr('data-bs-placement', 'top')
                .attr('data-bs-trigger', 'hover focus')
                .data('db-id', dbRecord.id)
                .data('game-id', player?.id ?? 'Not In Game')
                .data('guid', dbRecord.guid)
                .data('ip', player?.ip ?? 'Not In Game')
                .data('name', dbRecord.name);

            bootstrap.Popover.getOrCreateInstance($(this).get(0) as HTMLElement, {
                content: `In-Game ID: ${player?.id ?? 'Not In Game'}
                    <br />IP: ${player?.ip ?? 'Last: ' + dbRecord.lastIp}
                    <br />GUID: ${dbRecord.guid}
                    <br />Name: ${dbRecord.name}
                    <br />Nickname: ${dbRecord.nickname}
                    <br />Status: ${player?.status ?? 'Not In Game'}`,
                html: true,
                title: dbRecord.name,
            });

            PlayerActionContextMenu.addMenu($(this), playerContextMenuActions);
        });

    });

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
        nart.sendCommand(ServerEvents.SERVERS_LIST);
        nart.sendCommand(ServerEvents.SETTINGS_LIST);
        nart.sendCommand(ServerEvents.COLORS_LIST);

        $('#server-connect').on('click', function (e) {
            e.preventDefault();

            $('#server-selection').prop('disabled', true);
            $('#server-connect').prop('disabled', true);
            $('#server-refresh-status').text('Never');

            nart.connect($('#server-selection').val() as number);
        });

        $('#server-disconnect').on('click', function (e) {
            e.preventDefault();

            nart.sendCommand(ServerEvents.RCON_DISCONNECT);
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

        $('#modal-input-form').on('keyup', 'input, textarea', function (e) {
            if (e.key === 'Enter' && e.ctrlKey === true && e.shiftKey === false && e.altKey === false && e.metaKey === false) {
                $('#modal-input-form').find('.modal-confirm').trigger('click');
            }
        });

        PlayerActionContextMenu.addMenu($("#players-db, #server-players"), playerContextMenuActions);
    });
});
