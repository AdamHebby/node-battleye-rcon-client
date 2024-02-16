enum ServerEvents {
    MESSAGE = 'message',
    SOCK_OPEN = 'sock_open',
    SOCK_CLOSE = 'sock_close',
    SOCK_ERROR = 'sock_error',
    SOCK_RECONNECT = 'sock_reconnect',

    RCON_CONNECT = 'rcon_connect',
    RCON_DISCONNECT = 'rcon_disconnect',
    RCON_RECONNECT = 'rcon_reconnect',

    PLAYERS = 'players',
    BANS = 'bans',
    ADMINS = 'admins',
    VERSION = 'version',

    SERVERS_LIST = 'servers_list',
    SERVER_DELETE = 'server_delete',
    SERVERS_SAVE = 'servers_save',

    SETTINGS_LIST = 'settings_list',
    SETTINGS_SAVE = 'settings_save',

    COLORS_LIST = 'colors_list',
    COLORS_SAVE = 'colors_save',

    CHAT_DEBUG = 'chat_debug',
    CHAT_ERROR = 'chat_error',
    CHAT_GLOBAL_MESSAGE = 'chat_global_message',
    CHAT_ADMIN_MESSAGE = 'chat_admin_message',
    CHAT_ADMIN_JOIN = 'chat_admin_join',
    CHAT_ADMIN_LEAVE = 'chat_admin_leave',
    CHAT_PLAYER_JOIN = 'chat_player_join',
    CHAT_PLAYER_LEAVE = 'chat_player_leave',
    CHAT_PRIVATE_MESSAGE = 'chat_private_message',

    USER_BAN = 'user_ban',
    USER_UNBAN = 'user_unban',
    USER_KICK = 'user_kick',

    SET_COMMENT = 'set_comment',
    SET_NICKNAME = 'set_nickname',
}

export default ServerEvents;