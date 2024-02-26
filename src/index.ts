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
import IpLookup from "./Frontend/IpLookup";
import PlayerDetailsElement from "./Frontend/PlayerDetailsElement";
import { DynamicTableRow } from "./Frontend/Data/DynamicTableRow";
import { DynamicTable, DynamicTableSearcher } from "./Frontend/Data/DynamicTable";
import Generic from "./Frontend/Data/Generic";
import IpAddress from "./Frontend/Data/IpAddress";
import Ping from "./Frontend/Data/Ping";
import GUID from "./Frontend/Data/GUID";
import Name from "./Frontend/Data/Name";
import Status from "./Frontend/Data/Status";
import Nickname from "./Frontend/Data/Nickname";
import Comment from "./Frontend/Data/Comment";
import BanMinutesLeft from "./Frontend/Data/BanMinutesLeft";
import BanReason from "./Frontend/Data/BanReason";
import { BanRemoveContextMenu, BanRemoveContextMenuCallback, BanRemoveContextMenuCallbackData } from "./Frontend/BanRemoveContextMenu";
import GenericDate from "./Frontend/Data/GenericDate";

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
    BanRemoveContextMenu.buildMenu();

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

        if (action === 'ban_user' && data.formData.reason !== undefined && data.formData.duration !== undefined) {
            nart.sendCommand(ServerEvents.USER_BAN, {
                guid: data.guid,
                source: {
                    banGuid: data.formData.ban_guid !== undefined,
                    banIp: data.formData.ban_ip !== undefined,
                    banPreviousIps: data.formData.ban_previous_ips !== undefined,
                },
                reason: data.formData.reason,
                duration: data.formData.duration
            });
            return;
        }
    };

    const playerUnbanContextActions: BanRemoveContextMenuCallback = function (action: string, data: BanRemoveContextMenuCallbackData) {
        if (action === 'remove_ban' && data.id !== null) {
            nart.unbanUser(data.id);
            return;
        }
    };

    $(document).on('keydown', function (e) {
        let searchId = '';
        if ($('.active[data-tab-control=players]').length === 1) {
            searchId = '#player-search';
        } else if ($('.active[data-tab-control=bans]').length === 1) {
            searchId = '#ban-search';
        } else if ($('.active[data-tab-control=players-db]').length === 1) {
            searchId = '#player-db-search';
        }

        if (searchId === '' || $(searchId).length === 0 || $(searchId).is(':focus')) {
            return;
        }

        if (e.key === 'f' && e.ctrlKey === true && e.shiftKey === false && e.altKey === false && e.metaKey === false) {
            $(searchId).trigger('focus');
            e.preventDefault();
        }
    });

    let playersDbSearch = () => DynamicTableSearcher.search($('#player-db-search'), '#players-db', [
        GUID.key,
        IpAddress.key,
        Name.key,
        Nickname.key,
        Comment.key,
        'last-seen',
    ]);

    let playersSearch = () => DynamicTableSearcher.search($('#player-search'), '#server-players', [
        GUID.key,
        IpAddress.key,
        Name.key,
        Nickname.key,
        Comment.key,
        'last-seen',
    ]);

    let bansSearch = () => DynamicTableSearcher.search($('#ban-search'), '#server-bans', [
        GUID.key,
        IpAddress.key,
        BanReason.key,
    ]);


    $('#player-db-search').on('keyup', playersDbSearch);
    $('#player-search').on('keyup', playersSearch);
    $('#ban-search').on('keyup', bansSearch);

    nart.eventEmitter.on(ServerEvents.PLAYERS, function (players: {players: Player[], playerRecords: PlayerRecord[]}) {
        let currentPlayers = players.players;
        let allPlayers     = players.playerRecords;

        let serverPlayersTable = new DynamicTable($('#server-players'));
        let playersDbTable     = new DynamicTable($('#players-db'));

        let currentGuids: string[] = [];

        currentPlayers.forEach(function (player: Player) {
            currentGuids.push(player.guid);

            serverPlayersTable.addRow(
                (new DynamicTableRow('survivor-row'))
                    .addCell(new Generic(player.id, 'game-id'))
                    .addCell(new IpAddress(player.ip, player.record?.previousIps))
                    .addCell(new Ping(player.ping))
                    .addCell(new GUID(player.guid))
                    .addCell(new Name(player.name, player.record?.previousNames))
                    .addCell(new Status(player.status))
                    .addData(new Generic(player.dbId, 'db-id'))
            );
        });

        allPlayers.forEach(function (record: PlayerRecord) {
            let connected = currentGuids.includes(record.guid) ? 'true' : 'false';
            let gameId = currentPlayers.find((p: Player) => p.guid === record.guid)?.id ?? '';
            let status = currentPlayers.find((p: Player) => p.guid === record.guid)?.status ?? '';

            playersDbTable.addRow(
                (new DynamicTableRow('survivor-row'))
                    .addCell(new Generic(record.id, 'db-id'))
                    .addCell(new GUID(record.guid))
                    .addCell(new IpAddress(record.lastIp, record.previousIps))
                    .addCell(new Generic(record.lastSeen, 'last-seen'))
                    .addCell(new GenericDate(record.lastSeenDate, 'last-seen-date'))
                    .addCell(new Name(record.name, record.previousNames))
                    .addCell(new Nickname(record.nickname))
                    .addCell(new Comment(record.comment))
                    .addData(new Status(status))
                    .addData(new Generic(connected, 'connected'))
                    .addData(new Generic(gameId, 'game-id'))
            );
        });

        serverPlayersTable.build('player-guid');
        playersDbTable.build('player-guid');

        IpLookup.elements($('#players-db, #server-players'));

        $('#server-info-players').text(currentPlayers.length);

        $(document).find('player').each(function () {
            let id = $(this).attr('data-id');
            let guid = $(this).attr('data-guid');
            let player: Player | undefined;
            let dbRecord: PlayerRecord | undefined;

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

            let playerEl = PlayerDetailsElement.from($(this));
            playerEl.update(player, dbRecord);

            let element = playerEl.getElement();
            let popoverContent = playerEl.getBootstrapPopoverContent();

            if (playerEl.bsPopover === null && element !== undefined && popoverContent !== null) {
                playerEl.bsPopover = bootstrap.Popover.getOrCreateInstance(
                    element,
                    popoverContent
                );

                playerEl.addActionMenu(playerContextMenuActions);
            }
        });

        playersDbSearch();
        playersSearch();
    });

    nart.eventEmitter.on(ServerEvents.BANS, function (bans: Ban[]) {
        let serverBansTable = new DynamicTable($('#server-bans'));
        bans.forEach(function (ban: Ban) {
            serverBansTable.addRow(
                (new DynamicTableRow('survivor-row ban-row'))
                    .addCell(new Generic(ban.id, 'id'))
                    .addCell(ban.guid !== null ? new GUID(ban.guid) : new IpAddress(ban.ip ?? ''))
                    .addCell(new BanMinutesLeft(ban.minutesLeft))
                    .addCell(new BanReason(ban.reason))
            );
        });

        serverBansTable.build('id');

        BanRemoveContextMenu.addMenu($('#server-bans'), playerUnbanContextActions);
        bansSearch();
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
            let [event, _a, color, _b, enabled] = line.split(/(=|,)/g).map((s: string) => s.trim());

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
            $(`[data-tab-control-group="${group}"]`).removeClass('active');
            $(`[data-tab-control="${tab}"]`).addClass('active');
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

    nart.eventEmitter.on(ServerEvents.RCON_CONNECT, function (data: { id: number }) {
        jqServerConnected(data.id);
    });

    nart.eventEmitter.on(ServerEvents.RCON_DISCONNECT, function () {
        jqServerDisconnected();
    });

    nart.eventEmitter.on(ServerEvents.RCON_RECONNECT, function (data: { id: number }) {
        jqServerConnected(data.id);
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

        $('#settings-config-save').on('click', function () {
            nart.sendCommand(ServerEvents.SETTINGS_SAVE, settingsManager.settings);

            nart.updateAutoRefreshTime(Math.min(
                (settingsManager.settings.get('bans-refresh-interval') as number) * 1000,
                (settingsManager.settings.get('players-refresh-interval') as number) * 1000,
                (settingsManager.settings.get('admins-refresh-interval') as number) * 1000,
            ));
        });

        $('#settings-colors-save').on('click', function () {
            nart.sendCommand(ServerEvents.COLORS_SAVE, consoleColorsManager.save());
        });

        serverManager.onSave = function (servers: Server[]) {
            nart.sendCommand(ServerEvents.SERVERS_SAVE, servers);
        };

        serverManager.onDelete = function (server: Server) {
            nart.sendCommand(ServerEvents.SERVER_DELETE, {id: server.id});
        };

        nart.eventEmitter.addListener(ServerEvents.SERVERS_LIST, function (servers: Server[]) {
            let previousSelected = $('#server-selection option:selected').val();
            $('#server-selection').empty();
            $('#server-selection').append('<option value="0">SERVER SELECT</option>');

            servers.forEach(function (server: Server) {
                let selected = nart.serverId === server.id ? 'selected' : '';
                $('#server-selection').append(`<option value="${server.id}" ${selected}>${server.name}</option>`);
            });

            $('#server-selection').val(parseInt(previousSelected?.toString() || '0'));
            if ($('#server-selection option:selected').length === 0) {
                $('#server-selection').val(0);
            }

            serverManager.update(servers);
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

        $('#action-reload-scripts').on('click', function () {
            nart.sendCommand(ServerEvents.RCON_RELOAD_SCRIPTS);
        });
        $('#action-reload-bans').on('click', function () {
            nart.sendCommand(ServerEvents.RCON_RELOAD_BANS);
        });
        $('#action-reload-events').on('click', function () {
            nart.sendCommand(ServerEvents.RCON_RELOAD_EVENTS);
        });
    });
});
