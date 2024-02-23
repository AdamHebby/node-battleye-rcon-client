export interface ICacheRepository {
    set(key: string, value: any): void;
    get(key: string): any;
    delete(key: string): void;
    clear(): void;
    has(key: string): boolean;
    keys(): string[];
    values(): any[];
    size(): number;
}

class CacheRepository implements ICacheRepository
{
    private cache: { [key: string]: any };

    constructor() {
        this.cache = {};
    }

    public set(key: string, value: any): void {
        this.cache[key] = value;
    }

    public get(key: string): any {
        return this.cache[key];
    }

    public delete(key: string): void {
        delete this.cache[key];
    }

    public clear(): void {
        this.cache = {};
    }

    public has(key: string): boolean {
        return key in this.cache;
    }

    public keys(): string[] {
        return Object.keys(this.cache);
    }

    public values(): any[] {
        return Object.values(this.cache);
    }

    public size(): number {
        return Object.keys(this.cache).length;
    }
}

export default CacheRepository;
