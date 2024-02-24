import PlayerData from './PlayerData';

class Status extends PlayerData
{
    public static key: string = 'player-status';
    public key: string = Status.key;

    public constructor(data: string|null)
    {
        super();
        this.data = data;
    }
}

export default Status;
