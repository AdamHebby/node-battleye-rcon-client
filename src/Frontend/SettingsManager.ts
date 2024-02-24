import $ from 'jquery';
import Settings from '../Models/Settings';

class SettingsManager {
    public static instance: SettingsManager;
    public settingsConfigForm: JQuery<HTMLElement>;
    public settings: Settings;

    public constructor(settingsConfigForm: JQuery<HTMLElement>) {
        this.settings = new Settings();
        this.settingsConfigForm = settingsConfigForm;

        SettingsManager.instance = this;

        $(this.settingsConfigForm).on('change input', 'input', (event) => {
            let input = $(event.target);
            let key   = input.attr('name') ?? '';
            let value = input.val() ?? '';

            if (input.attr('type') === 'checkbox') {
                value = input.is(':checked') ? 1 : 0;
            }

            this.settings.set(key, value);
        });
    }

    public static getInstance(): SettingsManager {
        return SettingsManager.instance;
    }

    public update(settings: Settings): void
    {
        for (let i = 0; i < settings.settings.length; i++) {
            let setting = settings.settings[i];

            this.settings.set(setting.key, setting.value);
        }
        this.render();
    }

    public render(): void
    {
        for (let i = 0; i < this.settings.settings.length; i++) {
            let setting = this.settings.settings[i];
            let input = this.settingsConfigForm.find(`input[name="${setting.key}"]`);

            if (input.length > 0) {
                if (input.attr('type') === 'checkbox' && typeof setting.value === 'number') {
                    input.prop('checked', setting.value > 0);
                } else {
                    input.val(setting.value?.toString() ?? '');
                }
            }
        }
    }
}

export default SettingsManager;