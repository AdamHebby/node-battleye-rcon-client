import PlayerData from './PlayerData';
import $ from 'jquery';

class Comment extends PlayerData
{
    public key: string = 'player-comment';
    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default Comment;
