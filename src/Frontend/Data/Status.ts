import PlayerData from './PlayerData';
import $ from 'jquery';

class Status extends PlayerData
{
    public key: string = 'player-status';
    public constructor(data: string|null)
    {
        super();
        this.data = data;
    }
}

export default Status;
