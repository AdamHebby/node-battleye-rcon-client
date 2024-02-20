import { Popover } from "bootstrap";
import { DynamicTableRow } from "./DynamicTableRow";
import $ from 'jquery';

class DynamicTableSearcher
{
    public static search(element: JQuery<HTMLElement>, tableId: string, keys: string[])
    {
        let value = $(element).val()?.toString();
        if (value === '' || value === undefined || value === null) {
            $(tableId).find('tr').show();
            return;
        }

        (new DynamicTable($(tableId))).search(value, keys);
    }
}

class DynamicTable
{
    public rows: DynamicTableRow[] = [];

    public constructor(
        public table: JQuery<HTMLElement>,
    ) {
    }

    public search(search: string, fields: string[]): void
    {
        if (search === '' || search === undefined || search === null) {
            $(this.table).find(`[data-search]`).removeAttr(`data-search`);
            $(this.table).find('tr').show();
            return;
        }

        search = search.toLowerCase();

        $(this.table).find('tr').each(function (this: HTMLElement, index: number, element: HTMLElement) {
            let row = $(element);
            let show = false;

            for (let field of fields) {
                let value = (
                    (row.attr(`data-${field}`) ?? '').toLowerCase() + ' ' + (row.attr(`data-${field}-previous`) ?? '').toLowerCase()
                ).trim();

                if (value.includes(search as string)) {
                    show = true;
                    row.find(`[data-col="${field}"]`).attr(`data-search`, 'true');
                } else {
                    row.find(`[data-col="${field}"]`).removeAttr(`data-search`);
                }
            }

            if (show) {
                row.show();
            } else {
                row.hide();
            }
        });

    }

    public addRow(row: DynamicTableRow): void
    {
        this.rows.push(row);
    }

    public build(definedBy: string): void
    {
        let definedValues = this.rows.map((row: DynamicTableRow) => {
            return row.getData(definedBy);
        });

        $(this.table).find(`[data-${definedBy}]`).each(function (this: HTMLElement, index: number, element: HTMLElement) {
            let value = $(element).attr(`data-${definedBy}`);

            if (value !== undefined && !definedValues.includes(value)) {
                $(element).find(`[data-bs-toggle="popover"]`).each(function (this: HTMLElement, index: number, element: HTMLElement) {
                    let popover = Popover.getInstance(this);
                    popover?.hide();
                    popover?.disable();
                    popover?.dispose();
                });

                $(element).remove();
            }
        });

        for (let row of this.rows) {
            row.build(this.table, definedBy);
        }
    }
}

export { DynamicTable, DynamicTableSearcher }