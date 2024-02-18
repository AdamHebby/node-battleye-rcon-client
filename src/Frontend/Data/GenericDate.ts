import PlayerData from './PlayerData';
import $ from 'jquery';

class GenericDate extends PlayerData
{
    public static key: string = 'player-generic-date';
    public key: string = GenericDate.key;

    private date: Date;

    public constructor(data: Date, key: string)
    {
        super();

        this.date = new Date(data);
        this.data = this.date.toUTCString();

        this.key  = key;
    }

    public jQuery(): JQuery<HTMLElement> {
        return $(this.html(this.key)).attr('data-date', this.date.toString());
    }
}

export default GenericDate;
