import $ from 'jquery';
import { ConsoleColor } from '../Models/ConsoleColors';
import Events from '../Events';

class ConsoleColorManager {
    public static instance: ConsoleColorManager;
    public consoleColorsConfigForm: JQuery<HTMLElement>;
    public consoleColors: ConsoleColor[] = [];
    public tempConsoleColors: ConsoleColor[] | null = null;
    public lastSaveState: ConsoleColor[] = [];
    public onUpdate: (consoleColors: ConsoleColor[]) => void = () => {};

    public constructor(consoleColorsConfigForm: JQuery<HTMLElement>) {
        this.consoleColorsConfigForm = consoleColorsConfigForm;

        let self = this;
        $(this.consoleColorsConfigForm).find('.color-group').each(function () {
            let eventConfig = $(this).data('event') as string;
            let enabled     = $(this).find('input[type="checkbox"]').is(':checked') as boolean;
            let color       = $(this).find('input[type="color"]').val() as string;

            self.consoleColors.push(new ConsoleColor(eventConfig as Events, color, enabled));
        });;

        $(this.consoleColorsConfigForm).on('change', 'input', (event) => {
            let inputTr     = $(event.target).closest('.color-group');
            let eventConfig = inputTr.data('event') as string;
            let enabled     = $(inputTr).find('input[type="checkbox"]').is(':checked') as boolean;
            let color       = $(inputTr).find('input[type="color"]').val() as string;

            this.consoleColors.forEach((consoleColor: ConsoleColor) => {
                if (consoleColor.event.toString() === eventConfig) {
                    consoleColor.enabled = enabled;
                    consoleColor.color = color;
                    return;
                }
            });

            this.render(this.consoleColors);
        });

        ConsoleColorManager.instance = this;
    }

    public static getInstance(): ConsoleColorManager {
        return ConsoleColorManager.instance;
    }

    public update(consoleColors: ConsoleColor[]): void
    {
        if (consoleColors.length === 0) return;
        this.lastSaveState = JSON.parse(JSON.stringify(consoleColors));
        this.consoleColors = JSON.parse(JSON.stringify(consoleColors));
        this.render(consoleColors);
        this.onUpdate(consoleColors);
    }

    public tempUpdate(consoleColors: ConsoleColor[]): void
    {
        if (consoleColors.length === 0) return;
        this.tempConsoleColors = JSON.parse(JSON.stringify(consoleColors));
        this.render(consoleColors);
    }

    public save(): ConsoleColor[]
    {
        let colors: ConsoleColor[] = this.tempConsoleColors || this.consoleColors;

        this.tempConsoleColors = null;
        this.lastSaveState = JSON.parse(JSON.stringify(colors));
        this.consoleColors = JSON.parse(JSON.stringify(colors));
        this.onUpdate(colors);
        this.render(colors);


        return colors;
    }

    public reset(): void
    {
        this.tempConsoleColors = null;
        this.consoleColors = JSON.parse(JSON.stringify(this.lastSaveState));
        this.render(this.lastSaveState);
    }

    public default(): void
    {
        $('#settings-chat-colors-form .form-control-color').each(function () {
            $(this).val($(this).data('default') as string);
            $(this).parent().find('input[type="checkbox"]').prop('checked', true);
            $(this).trigger('change');
        });
    }

    public render(consoleColors: ConsoleColor[]): void
    {
        consoleColors.forEach((consoleColor: ConsoleColor) => {
            let input = $(`#CC_${consoleColor.event.toUpperCase()}`);
            let color = $(`#CC_${consoleColor.event.toUpperCase()}_COLOR`);
            let last  = this.lastSaveState.find((c: ConsoleColor) => c.event === consoleColor.event);

            input.closest('.color-group').toggleClass('dirty', last && this.isDiff(last, consoleColor));

            input.prop('checked', this.isEnabled(consoleColor));
            color.val(consoleColor.color);
        });
    }

    private isDiff(a: ConsoleColor, b: ConsoleColor): boolean
    {
        return a.event !== b.event || a.color !== b.color || this.isEnabled(a) !== this.isEnabled(b);
    }

    private isEnabled(c: ConsoleColor): boolean
    {
        return c.enabled == true || c.enabled == 1;
    }
}

export default ConsoleColorManager;
