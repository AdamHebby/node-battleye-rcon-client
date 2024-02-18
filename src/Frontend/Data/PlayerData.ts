import $ from 'jquery';

abstract class PlayerData {
    public abstract key: string;
    // public abstract jQuery(): JQuery<HTMLElement>;

    public data: string | number | null = null;

    public html(className: string): string
    {
        return `<span id="${this.randomId()}" class="${className}">${this.data}</span>`;
    }

    protected randomId(): string
    {
        return 'pd_' + Math.random().toString(36).substring(5);
    }

    public jQuery(): JQuery<HTMLElement> {
        return $(this.html(this.key));
    }
}

export default PlayerData;