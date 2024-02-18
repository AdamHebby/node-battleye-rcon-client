import $ from 'jquery';

class DynamicTableRow
{
    private jqRow: JQuery<HTMLElement>|null = null;
    private rowCells: { key: string, value: string|number|null, html: JQuery<HTMLElement>|null, compareHtml: boolean }[] = [];
    private rowData: { [key: string]: string|number|null } = {};

    public addCell(
        name: string,
        value: string|number|null,
        html: JQuery<HTMLElement>|null = null,
        compareHtml: boolean = false
    ): DynamicTableRow {
        this.rowCells.push({ key: name, value: value, html: html, compareHtml: compareHtml});
        this.rowData[name] = value;
        return this;
    }

    public addData(key: string, value: string|number|null): DynamicTableRow
    {
        this.rowData[key] = value;
        return this;
    }

    public getData(key: string): string|number|null
    {
        return this.rowData[key];
    }

    private compare(element: JQuery<HTMLElement>, definedBy: string): boolean
    {
        let valid = true;
        let row = this;

        $(element).find(`[data-${definedBy}]`).each(function (this: HTMLElement, index: number, element: HTMLElement) {
            for (let data in row.rowData) {
                if ($(element).attr(`data-${data}`) !== (row.rowData[data] ?? '').toString()) {
                    valid = false;
                    return;
                }
            }

            for (let data of row.rowCells) {
                // if (data.compareHtml && data.html !== $(element).find(`[data-${data.key}]`)) {
                // }

                if ($(element).attr(`data-${data.key}`) !== (data.value ?? '').toString()) {
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
                this.jqRow.attr(`data-${data}`, (this.rowData[data] ?? '').toString());
            }

            for (let cell of this.rowCells) {
                this.jqRow.attr(`data-${cell.key}`, (cell.value ?? '').toString());

                let td = $('<td></td>');

                if (cell.html !== null) {
                    td.append(cell.html);
                } else {
                    td.text((cell.value ?? '').toString());
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

export default DynamicTableRow;
