import PlayerData from './PlayerData';
import $ from 'jquery';

class Comment extends PlayerData
{
    public static key: string = 'player-comment';
    public key: string = Comment.key;

    public constructor(data: string)
    {
        super();
        this.data = data;
    }
}

export default Comment;
