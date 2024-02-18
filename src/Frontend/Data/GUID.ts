import PlayerData from './PlayerData';
import $ from 'jquery';

class GUID extends PlayerData
{
    public key: string = 'player-guid';
    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default GUID;
