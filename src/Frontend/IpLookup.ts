import $ from 'jquery';

class IpLookup
{
    public static BASE_URL = 'https://get.geojs.io/v1/ip/';
    private static cache: { [ip: string]: string } = {};

    public static async getCountryCode(ip: string): Promise<string>
    {
        ip = IpLookup.clean(ip);

        return new Promise((resolve, reject) => {
            if (this.cache[ip] !== undefined) {
                resolve(this.cache[ip]);
                return;
            }

            fetch(this.BASE_URL + 'country/' + ip)
                .then(response => response.text())
                .then(data => data.trim())
                .then(countryCode => {
                    this.cache[ip] = countryCode;
                    resolve(countryCode);
                })
                .catch(error => reject(error));
        });
    }

    public static getCountryFlagFromIp(ip: string): Promise<string>
    {
        return new Promise((resolve, reject) => {
            this.getCountryCode(IpLookup.clean(ip))
                .then(countryCode => resolve(`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`))
                .catch(error => reject(error));
        });
    }

    public static async elements(element: JQuery<HTMLElement>): Promise<void>
    {
        let address = element.find('.ip-address');

        for (let i = 0; i < address.length; i++) {
            await this.element($(address[i]));
        }
    }

    public static async element(element: JQuery<HTMLElement>): Promise<void>
    {
        if (element.find('.ip-flag').length > 0) {
            return;
        }

        let ip = IpLookup.clean(element.text());

        if (ip.length === 0) {
            return;
        }

        let countryCode = await this.getCountryFlagFromIp(ip);

        $(`<img src="${countryCode}" class="ip-flag" />&nbsp;`).prependTo($(element));
    }

    public static clean(ip: string): string
    {
        return ip.trim().split(':')[0];
    }
}

export default IpLookup;
