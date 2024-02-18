import IpLookup from '../IpLookup';
import PlayerData from './PlayerData';
import $ from 'jquery';
import { Popover } from 'bootstrap';

class IpAddress extends PlayerData
{
    public key: string = 'player-ip-address';
    public constructor(data: string, public previous: string[] = [])
    {
        super();
        this.data = data;
    }

    public jQuery(): JQuery<HTMLElement> {
        let element = $(this.html('player-ip-address'));

        if (this.previous.length > 0) {
            Popover.getOrCreateInstance(element[0], {
                content: this.previous.join('<br>'),
                title: 'Previous Names',
                html: true,
                placement: 'top',
                trigger: 'hover',
            });
        }

        IpLookup.element(element);

        return element;
    }
}

export default IpAddress;
