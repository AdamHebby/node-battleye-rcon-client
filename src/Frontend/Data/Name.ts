import PlayerData from './PlayerData';
import $ from 'jquery';
import { Popover } from 'bootstrap';

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
        let j = $(this.html(this.key));

        if (this.previous.length > 0) {
            Popover.getOrCreateInstance(j[0], {
                content: this.previous.join('<br>'),
                title: 'Previous Names',
                html: true,
                placement: 'top',
                trigger: 'hover',
            });
        }

        return j;
    }
}

export default Name;
