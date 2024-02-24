export interface ICacheRepository {
    set(key: string, value: unknown): void;
    get(key: string): unknown;
    delete(key: string): void;
    clear(): void;
    has(key: string): boolean;
    keys(): string[];
    values(): unknown[];
    size(): number;
}

class CacheRepository implements ICacheRepository
{
    private cache: { [key: string]: unknown };

    constructor() {
        this.cache = {};
    }

    public set(key: string, value: unknown): void {
        this.cache[key] = value;
    }

    public get(key: string): unknown {
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

    public values(): unknown[] {
        return Object.values(this.cache);
    }

    public size(): number {
        return Object.keys(this.cache).length;
    }
}

export default CacheRepository;
