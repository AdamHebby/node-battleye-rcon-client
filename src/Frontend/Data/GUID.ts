import PlayerData from './PlayerData';
import $ from 'jquery';

class GUID extends PlayerData
{
    public static key: string = 'player-guid';
    public key: string = GUID.key;

    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default GUID;
