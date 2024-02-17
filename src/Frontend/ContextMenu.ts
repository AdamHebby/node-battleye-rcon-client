import $ from 'jquery';

class ContextMenu {
    public static menu(jq: JQuery<{}>, settings: {menuSelector: string, beforeShow?: Function, menuSelected: Function}) {
        $(jq).each(function () {
            // Open context menu
            $(this).on("contextmenu", function (e: JQuery.ContextMenuEvent) {
                // return native menu if pressing control
                if (e.ctrlKey) return;

                if (settings.beforeShow) {
                    settings.beforeShow.call(this, e);
                }

                //open menu
                var $menu = $(settings.menuSelector)
                    .data("invokedOn", $(e.target))
                    .show()
                    .css({
                        position: "absolute",
                        left: ContextMenu.getMenuPosition(settings.menuSelector, e.clientX, 'width', 'scrollLeft'),
                        top: ContextMenu.getMenuPosition(settings.menuSelector, e.clientY, 'height', 'scrollTop')
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
    }

    private static getMenuPosition(menuSelector: string, mouse: number, direction: string, scrollDir: string) {
        // @ts-ignore
        var win = $(window)[direction](),
            // @ts-ignore
            scroll = $(window)[scrollDir](),
            // @ts-ignore
            menu = $(menuSelector)[direction](),
            position = mouse + scroll;

        // opening menu would pass the side of the page
        if (mouse + menu > win && menu < mouse)
            position -= menu;

        return position;
    }
}

$.fn.extend({
    contextMenu: function (settings: {menuSelector: string, menuSelected: Function}) {
        ContextMenu.menu($(this), settings);
    }
});


export default ContextMenu;
