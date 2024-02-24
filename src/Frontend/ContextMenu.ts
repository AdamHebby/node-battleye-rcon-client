import $ from 'jquery';

declare type MenuSelected = (
    invokedOn: JQuery<HTMLElement>,
    selectedMenu: JQuery<HTMLElement>
) => void;

declare type BeforeShow = (e: JQuery.ContextMenuEvent) => void;

class ContextMenu {
    public static menu(
        jq: JQuery<HTMLElement>,
        settings: {
            menuSelector: string,
            beforeShow?: BeforeShow,
            menuSelected: MenuSelected
        }
    ) {
        $(jq).each(function () {
            // Open context menu
            $(this).on("contextmenu", function (e: JQuery.ContextMenuEvent) {
                // return native menu if pressing control
                if (e.ctrlKey) return;

                if (settings.beforeShow) {
                    settings.beforeShow.call(this, e);
                }

                //open menu
                let $menu = $(settings.menuSelector)
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

                        let $invokedOn = $menu.data("invokedOn");
                        let $selectedMenu = $(e.target);

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
        // @ts-ignore - jQuery types are wrong
        let win = $(window)[direction](),
            // @ts-ignore - jQuery types are wrong
            scroll = $(window)[scrollDir](),
            // @ts-ignore - jQuery types are wrong
            menu = $(menuSelector)[direction](),
            position = mouse + scroll;

        // opening menu would pass the side of the page
        if (mouse + menu > win && menu < mouse)
            position -= menu;

        return position;
    }
}

$.fn.extend({
    contextMenu: function (settings: {
        menuSelector: string,
        menuSelected: MenuSelected,
        beforeShow?: BeforeShow
    }) {
        ContextMenu.menu($(this) as JQuery<HTMLElement>, settings);
    }
});


export default ContextMenu;
