import { Popover, Tooltip } from 'bootstrap';
import $ from 'jquery';

abstract class PlayerData {
    public abstract key: string;
    // public abstract jQuery(): JQuery<HTMLElement>;

    public data: string | number | null = null;

    public html(className: string): string
    {
        return `<span id="${this.randomId()}" class="${className}">${this.data}</span>`;
    }

    protected randomId(): string
    {
        return 'pd_' + Math.random().toString(36).substring(5);
    }

    public jQuery(): JQuery<HTMLElement> {
        return $(this.html(this.key));
    }

    protected popover(element: JQuery<HTMLElement>, content: string, title: string = '', placement: Tooltip.PopoverPlacement = 'top'): void
    {
        element.attr('data-bs-toggle', 'popover')
            .attr('data-bs-placement', placement)
            .attr('data-bs-trigger', 'hover focus');

        Popover.getOrCreateInstance(element[0], {
            title: title,
            content: content,
            html: true,
            placement: placement,
            animation: false,
            trigger: 'hover focus',
        });
    }
}

export default PlayerData;