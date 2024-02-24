import $ from 'jquery';
import PlayerData from './PlayerData';
import { Popover } from 'bootstrap';

class DynamicTableRow
{
    private jqRow: JQuery<HTMLElement>|null = null;
    private rowCells: PlayerData[] = [];
    private rowData: { [key: string]: PlayerData } = {};
    private classList: string = '';

    public constructor(classList: string = '') {
        this.classList = classList;
    }

    public addCell(
        cell: PlayerData,
    ): DynamicTableRow {
        this.rowCells.push(cell);
        this.rowData[cell.key] = cell;
        return this;
    }

    public addData(data: PlayerData): DynamicTableRow
    {
        this.rowData[data.key] = data;
        return this;
    }

    public getData(key: string): string | number | null
    {
        return this.rowData[key]?.data ?? null;
    }

    private compare(element: JQuery<HTMLElement>, definedBy: string): boolean
    {
        let valid = true;

        $(element)
            .find(`[data-${definedBy}="${this.getData(definedBy)}"]`)
            .each((_: number, element: HTMLElement) => {
                for (let data in this.rowData) {
                    if (($(element).attr(`data-${data}`) ?? '').toString() !== (this.getData(data) ?? '').toString()) {
                        valid = false;
                        console.debug(`Data mismatch for ${definedBy} (${this.getData(definedBy)}) ${data} - ${$(element).attr(`data-${data}`)} !== ${this.getData(data)}`);
                    }
                }
            });

        return valid;
    }

    public build(onTable: JQuery<HTMLElement>, definedBy: string): void
    {
        let existingRow = $(onTable).find(`[data-${definedBy}="${this.getData(definedBy)}"]`);
        let isNew = existingRow.length === 0;

        if (isNew || !this.compare(onTable, definedBy)) {
            this.jqRow = $('<tr></tr>').addClass(this.classList);

            for (let data in this.rowData) {
                this.jqRow.attr(`data-${data}`, (this.rowData[data]?.data ?? '').toString());
            }

            for (let cell of this.rowCells) {
                this.jqRow.attr(`data-${cell.key}`, (cell.data ?? '').toString());

                let td = $('<td></td>');

                if (cell.html !== null && cell.html !== undefined) {
                    td.append(cell.jQuery());
                } else {
                    td.text((cell.data ?? '').toString());
                }

                td.attr(`data-col`, cell.key);
                this.jqRow.append(td);
            }

            $(onTable).find(`[data-bs-toggle="popover"]`).each(function (this: HTMLElement) {
                let popover = Popover.getInstance(this);
                popover?.hide();
                popover?.disable();
                popover?.dispose();
            });

            if (existingRow.length > 0 && existingRow !== undefined && existingRow !== null) {
                let isVisible = existingRow.is(':visible');

                if (isVisible) {
                    this.jqRow.show();
                } else {
                    this.jqRow.hide();
                }

                existingRow.replaceWith(this.jqRow);
            } else {
                $(onTable).append(this.jqRow);
            }
        }
    }
}

export {
    DynamicTableRow,
};
