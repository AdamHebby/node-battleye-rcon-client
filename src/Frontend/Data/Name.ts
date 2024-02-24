import PlayerData from './PlayerData';
import $ from 'jquery';

class Name extends PlayerData
{
    public static key: string = 'player-name';
    public key: string = Name.key;

    public constructor(data: string, public previous: string[] = [])
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let element = $(this.html(this.key));

        if (this.previous.length > 0) {
            this.popover(element, this.previous.join('<br>'), 'Previous Names');
            element.attr(`data-${this.key}-previous`, this.previous.join(', '));
        }

        return element;
    }
}

export default Name;
