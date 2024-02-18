import BootstrapUtils from "./BootstrapUtils";
import ContextMenu from "./ContextMenu";
import $ from "jquery";
import Name from "./Data/Name";
import IpAddress from "./Data/IpAddress";
import GUID from "./Data/GUID";

interface BanRemoveContextMenuCallbackData {
    id: number
}

interface BanRemoveContextMenuCallback {
    (action: string, data: BanRemoveContextMenuCallbackData): void;
}

class BanRemoveContextMenu {
    public static buildMenu() {
        $(`
            <div id="player-ban-context-menu" class="dropdown-menu">
                <a class="dropdown-item text-danger" href="#" data-action="remove_ban">Remove Ban</a>
            </div>
        `).hide().appendTo('body');
    }

    public static addMenu(record: JQuery<Element>, callback: BanRemoveContextMenuCallback|undefined = undefined) {
        ContextMenu.menu(record, {
            menuSelector: '#player-ban-context-menu',
            menuSelected: function (invokedOn: JQuery<Element>, selectedMenu: JQuery<Element>) {
                invokedOn = invokedOn.closest(`[data-id]`);

                if (invokedOn.length === 0) {
                    return;
                }

                BanRemoveContextMenu.trigger(invokedOn, selectedMenu, callback);
            }
        });
    }

    public static trigger(record: JQuery<Element>, selectedMenu: JQuery<Element>, callback: BanRemoveContextMenuCallback|undefined = undefined) {
        let action   = selectedMenu.data('action');
        let id       = record.data('id');
        let guid     = record.data(GUID.key);
        let ip       = record.data(IpAddress.key);
        let bannedOn = (guid !== undefined && guid !== '' && guid !== null) ? guid : ip;

        if (id === '' && id !== undefined && id !== null) {
            return;
        }

        if (action === 'remove_ban' && id !== '') {
            let form = $('<form>');

            BootstrapUtils.formModal(`Kick ${name}`, `Are you sure you want to remove the ban on ${bannedOn}?`, form, function (data: any) {
                if (data.reason === undefined) {
                    return;
                }

                if (callback) {
                    callback(action, {
                        id: id
                    });
                    return;
                }
            });
            return;
        }
    }
}

export {
    BanRemoveContextMenu,
    BanRemoveContextMenuCallback,
    BanRemoveContextMenuCallbackData
};