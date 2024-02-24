import PlayerData from './PlayerData';

class Comment extends PlayerData
{
    public static key: string = 'player-comment';
    public key: string = Comment.key;

    public constructor(data: null|string)
    {
        super();
        this.data = data ?? '';
    }
}

export default Comment;
