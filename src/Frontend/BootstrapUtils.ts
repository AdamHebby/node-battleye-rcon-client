import { Modal } from "bootstrap";
import $ from "jquery";

export declare type TModalValue = string|number|boolean|undefined|null;
export declare type TModalData = {
    [key: string]: TModalValue
}

class BootstrapUtils {
    public static formModal(title: string, message: string, form: JQuery<HTMLElement>, cb: (data: TModalData) => void) {
        let modal        = $('#modal-input-form');
        let modalTitle   = modal.find('.modal-title');
        let modalText    = modal.find('.modal-text');
        let modalConfirm = modal.find('.modal-confirm');
        let formWrapper  = modal.find('.modal-form');

        modalTitle.text(title);
        modalText.text(message);
        formWrapper.empty().append(form);

        let m = Modal.getOrCreateInstance('#modal-input-form');

        modalConfirm.one('click', function () {
            let data: TModalData = {};

            form.serializeArray().map((i: {name: string, value: TModalValue}) => {
                data[i.name] = i.value;
            });

            cb(data);
        });

        m.show();
    }

    public static formNumberGroup (name: string, label: string, min: number, max: number, value: number = 0) {
        return $(`
            <div class="form-group mb-2 row g-0">
                <label for="${name}" class="col-4 col-form-label form-label">${label}</label>
                <input type="number" class="col form-control" name="${name}" value="${value}" min="${min}" max="${max}">
            </div>
        `);
    }

    public static formTextGroup (name: string, label: string, value: string = '') {
        return $(`
            <div class="form-group mb-2 row g-0">
                <label for="${name}" class="col-4 col-form-label form-label">${label}</label>
                <input type="text" class="col form-control" name="${name}" value="${value}">
            </div>
        `);
    }
}

export default BootstrapUtils;