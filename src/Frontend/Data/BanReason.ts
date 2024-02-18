import PlayerData from './PlayerData';
import $ from 'jquery';

class BanReason extends PlayerData
{
    public key: string = 'player-ban-reason';
    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default BanReason;
