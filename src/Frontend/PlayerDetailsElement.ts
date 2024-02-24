import $ from 'jquery';
import Player from '../Models/Player';
import PlayerRecord from '../Models/PlayerRecord';
import { PlayerActionContextMenu, PlayerActionContextMenuCallback } from './PlayerActionContextMenu';
import "bootstrap";
import IpLookup from './IpLookup';

class PlayerDetailsElement
{
    private static elements: PlayerDetailsElement[] = [];

    public id: number | null = null;
    public gameId: number | null = null;
    public ip: string | null = null;
    public ping: number | null = null;
    public guid: string | null = null;
    public name: string | null = null;
    public status: string | null = null;
    public nickname: string | null = null;

    public bsPopover: bootstrap.Popover | null = null;

    private resolvedCountry: boolean = false;
    private flagSrc: string | null = null;
    private hasActionMenu: boolean = false;
    private needsPopoverUpdate: boolean = true;

    public constructor(
        public jqElement: JQuery<HTMLElement>,
    ) {
        PlayerDetailsElement.elements.push(this);
    }

    public static from(jqElement: JQuery<HTMLElement>): PlayerDetailsElement
    {
        for (let element of PlayerDetailsElement.elements) {
            if (element.jqElement.is(jqElement)) {
                return element;
            }
        }

        return new PlayerDetailsElement(jqElement);
    }

    public update(player: Player | null | undefined, dbRecord: PlayerRecord): void
    {
        let newIp = (player?.ip ?? dbRecord.lastIp).split(':')[0];

        if (this.ip !== newIp) {
            this.resolvedCountry = false;
            this.flagSrc = null;
        }

        this.ip = newIp;
        this.id = dbRecord.id;
        this.gameId = player?.id ?? null;
        this.guid = dbRecord.guid;
        this.name = dbRecord.name;
        this.nickname = dbRecord.nickname;
        this.status = player?.status ?? 'Not in game';

        $(this.jqElement)
            .attr('data-bs-toggle', 'popover')
            .attr('data-bs-placement', 'top')
            .attr('data-bs-trigger', 'hover focus')
            .attr('data-ip', this.ip)
            .data('db-id', this.id)
            .data('game-id', this.gameId ?? 'Not in game')
            .data('guid', this.guid)
            .data('name', this.name);

        if (this.resolvedCountry === false) {
            IpLookup.getCountryFlagFromIp(this.ip).then((flag: string) => {
                this.flagSrc = flag;
                this.resolvedCountry = true;
                this.updatePopover();
            });
        }
    }

    private updatePopover(): void
    {
        if (this.bsPopover !== null) {
            this.needsPopoverUpdate = true;
            let newContent = this.getBootstrapPopoverContent();

            if (newContent !== null && newContent.content !== null) {
                this.bsPopover.setContent({
                    '.popover-body': newContent.content
                });
            }
        }
    }

    public getBootstrapPopoverContent(): null | {content: string; html: boolean; title: string;}
    {
        if (!this.needsPopoverUpdate) {
            return null;
        }

        this.needsPopoverUpdate = false;
        let flag = this.getFlagImage();

        return {
            content: `In-Game ID: ${this.gameId ?? 'Not In Game'}
                <br />IP: <span class="ip-address">${flag} ${this.ip}</span>
                <br />GUID: ${this.guid}
                <br />Name: ${this.name}
                <br />Nickname: ${this.nickname}
                <br />Status: ${this.status}`,
            html: true,
            title: this.name ?? 'Survivor',
        };
    }

    private getFlagImage(): string
    {
        return (this.resolvedCountry !== false) ? `<img src="${this.flagSrc}" class="ip-flag" />` : '';
    }

    public addActionMenu(callback: PlayerActionContextMenuCallback): void
    {
        if (this.hasActionMenu) {
            return;
        }

        this.hasActionMenu = true;

        PlayerActionContextMenu.addMenu($(this.jqElement), callback);
    }

    public getElement(): HTMLElement | undefined
    {
        return this.jqElement.get(0);
    }
}

export default PlayerDetailsElement;
