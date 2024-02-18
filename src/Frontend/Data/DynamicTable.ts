import { DynamicTableRow } from "./DynamicTableRow";
import $ from 'jquery';

class DynamicTable
{
    public rows: DynamicTableRow[] = [];

    public constructor(
        public table: JQuery<HTMLElement>,
    ) {
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
                $(element).remove();
            }
        });

        for (let row of this.rows) {
            row.build(this.table, definedBy);
        }
    }
}

export default DynamicTable;