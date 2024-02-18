import PlayerData from './PlayerData';
import $ from 'jquery';
import { Popover } from 'bootstrap';

class Nickname extends PlayerData
{
    public static key: string = 'player-nickname';
    public key: string = Nickname.key;

    public constructor(data: string, public previous: string[] = [])
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let j = $(this.html(this.key));

        if (this.previous.length > 0) {
            Popover.getOrCreateInstance(j[0], {
                content: this.previous.join('<br>'),
                title: 'Previous nicknames',
                html: true,
                placement: 'top',
                trigger: 'hover',
            });
        }

        return j;
    }
}

export default Nickname;
