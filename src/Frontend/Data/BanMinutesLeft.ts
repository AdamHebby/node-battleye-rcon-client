import PlayerData from './PlayerData';
import $ from 'jquery';
import { Popover } from 'bootstrap';

class BanMinutesLeft extends PlayerData
{
    public key: string = 'ban-minutes-left';
    private instantiatedDate: Date = new Date();

    public constructor(data: number)
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let j = $(this.html(this.key));

        Popover.getOrCreateInstance(j[0], {
            content: this.instantiatedDate.setMinutes(
                this.instantiatedDate.getMinutes() + (this.data as number)
            ).toLocaleString(),
            html: true,
            placement: 'top',
            trigger: 'hover',
        });

        return j;
    }
}

export default BanMinutesLeft;
