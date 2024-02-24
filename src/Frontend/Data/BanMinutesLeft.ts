import PlayerData from './PlayerData';
import $ from 'jquery';

class BanMinutesLeft extends PlayerData
{
    public static key: string = 'ban-minutes-left';
    public key: string = BanMinutesLeft.key;

    private instantiatedDate: Date = new Date();
    private expiresString: string = '';

    public constructor(data: number)
    {
        super();

        let newDate = new Date();
        newDate.setMinutes(this.instantiatedDate.getMinutes() + (data as number));

        let timeString = '';
        let seconds = Math.floor((newDate.getTime() - this.instantiatedDate.getTime()) / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours   = Math.floor(minutes / 60);
        let days    = Math.floor(hours / 24);
        let years   = Math.floor(days / 365);

        seconds = seconds % 60;
        minutes = minutes % 60;
        hours   = hours % 24;
        days    = days % 365;

        if (years > 0)   timeString += years + 'y ';
        if (days > 0)    timeString += days + 'd ';
        if (hours > 0)   timeString += hours + 'h ';
        if (minutes > 0) timeString += minutes + 'm ';
        if (seconds > 0) timeString += seconds + 's';

        this.data = timeString;
        this.expiresString = newDate.toUTCString();
    }

    public jQuery(): JQuery<HTMLElement> {
        let j = $(this.html(this.key));

        this.popover(j, `Time Left: ${this.data} <br> Expires: ${this.expiresString}`);

        return j;
    }
}

export default BanMinutesLeft;
