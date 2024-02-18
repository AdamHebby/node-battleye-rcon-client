import PlayerData from './PlayerData';
import $ from 'jquery';
import { Popover } from 'bootstrap';

class BanMinutesLeft extends PlayerData
{
    public static key: string = 'ban-minutes-left';
    public key: string = BanMinutesLeft.key;

    private instantiatedDate: Date = new Date();

    public constructor(data: number)
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let j = $(this.html(this.key));

        let newDate = new Date();
        newDate.setMinutes(newDate.getMinutes() + (this.data as number));

        let timeString = '';
        let seconds = Math.floor((newDate.getTime() - new Date().getTime()) / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours   = Math.floor(minutes / 60);
        let days    = Math.floor(hours / 24);

        seconds = seconds % 60;
        minutes = minutes % 60;
        hours   = hours % 24;

        if (days > 0)    timeString += days + 'd ';
        if (hours > 0)   timeString += hours + 'h ';
        if (minutes > 0) timeString += minutes + 'm ';
        if (seconds > 0) timeString += seconds + 's';

        $(j).attr('data-bs-toggle', 'popover')
            .attr('data-bs-placement', 'top')
            .attr('data-bs-trigger', 'hover focus');

        Popover.getOrCreateInstance(j[0], {
            content: `Time Left: ${timeString} <br> Expires: ${newDate.toLocaleString()}`,
            html: true,
            placement: 'top',
            animation: false,
            trigger: 'hover',
        });

        return j;
    }
}

export default BanMinutesLeft;
