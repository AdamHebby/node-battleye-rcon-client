import $ from 'jquery';
import PlayerData from './PlayerData';

class DynamicTableRow
{
    private jqRow: JQuery<HTMLElement>|null = null;
    private rowCells: PlayerData[] = [];
    private rowData: { [key: string]: PlayerData } = {};

    public addCell(
        cell: PlayerData,
    ): DynamicTableRow {
        this.rowCells.push(cell);
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
        let row = this;

        $(element).find(`[data-${definedBy}]`).each(function (this: HTMLElement, index: number, element: HTMLElement) {
            for (let data in row.rowData) {
                if ($(element).attr(`data-${data}`) !== (row.getData(data) ?? '')) {
                    valid = false;
                    return;
                }
            }

            for (let data of row.rowCells) {
                // if (data.compareHtml && data.html !== $(element).find(`[data-${data.key}]`)) {
                // }

                if ($(element).attr(`data-${data.key}`) !== (data.data ?? '')) {
                    valid = false;
                    return;
                }
            }
        });

        return valid;
    }

    public build(onTable: JQuery<HTMLElement>, definedBy: string): void
    {
        let valid = this.compare(onTable, definedBy);
        let isNew = $(onTable).find(`[data-${definedBy}="${this.getData(definedBy)}"]`).length === 0;

        if (!valid || isNew) {
            this.jqRow = $('<tr></tr>');

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

            if (!isNew) {
                $(onTable).find(`[data-${definedBy}]`).replaceWith(this.jqRow);
            } else {
                $(onTable).append(this.jqRow);
            }
        }
    }
}

export {
    DynamicTableRow,
};
