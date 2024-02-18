import PlayerData from './PlayerData';

class BanReason extends PlayerData
{
    public static key: string = 'player-ban-reason';
    public key: string = BanReason.key;

    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default BanReason;
