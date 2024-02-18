import PlayerData from './PlayerData';
import $ from 'jquery';

class Generic extends PlayerData
{
    public key: string = 'player-generic';
    public constructor(data: string | number | null, key: string)
    {
        super();
        this.data = data;
        this.key = key;
    }
}

export default Generic;
