import IpLookup from '../IpLookup';
import PlayerData from './PlayerData';
import $ from 'jquery';

class IpAddress extends PlayerData
{
    public static key: string = 'player-ip-address';
    public key: string = IpAddress.key;

    public constructor(data: string, public previous: string[] = [])
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let element = $(this.html('player-ip-address'));

        if (this.previous.length > 0) {
            this.popover(element, this.previous.join('<br>'), 'Previous IPs');
        }

        IpLookup.element(element);

        return element;
    }
}

export default IpAddress;
