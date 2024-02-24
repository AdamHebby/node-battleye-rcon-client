import PlayerData from './PlayerData';
import $ from 'jquery';

class Nickname extends PlayerData
{
    public static key: string = 'player-nickname';
    public key: string = Nickname.key;

    public constructor(data: string|null, public previous: string[] = [])
    {
        super();
        this.data = data ?? '';
    }

    public jQuery(): JQuery<HTMLElement> {
        let element = $(this.html(this.key));

        if (this.previous.length > 0) {
            this.popover(element, this.previous.join('<br>'), 'Previous Nicknames');
            element.attr(`data-${this.key}-previous`, this.previous.join(', '));
        }

        return element;
    }
}

export default Nickname;
