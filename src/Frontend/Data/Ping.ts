import PlayerData from './PlayerData';
import $ from 'jquery';

class Ping extends PlayerData
{
    public key: string = 'player-ping';
    public constructor(data: number | null)
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let color = '';
        let ping = typeof this.data === 'number' ? this.data : parseInt(this.data ?? '0');

        if (ping < 150) {
            color = 'text-success';
        } else if (ping < 250) {
            color = 'text-warning';
        } else {
            color = 'text-danger';
        }

        return $(this.html(`${this.key} ${color}`))
    }
}

export default Ping;
