import PlayerData from './PlayerData';
import $ from 'jquery';

class Generic extends PlayerData
{
    public static key: string = 'player-generic';
    public key: string = Generic.key;

    public constructor(data: string | number | null, key: string)
    {
        super();
        this.data = data;
        this.key = key;
    }
}

export default Generic;
