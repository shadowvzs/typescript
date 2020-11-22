import { 
    IFPromise,
    IRequest
} from "@typo";

export const classAutobind = (t: any, exclude: string[] = []) => {
    const prototype = t.constructor.prototype;
    Object.getOwnPropertyNames(prototype)
        .filter((key) => (typeof prototype[key] === 'function') && key !== 'constructor')
        .filter((key) => !~exclude.indexOf(key))
        .forEach((key) => t[key] = t[key].bind(t));
}

export const guid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
        const r: number = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const delay = (sec: number) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), sec * 1000);
    });
}

export const arrayToMap = (array: string[]): Record<string, string|number> => {
    const obj: Record<string, string|number> = {};
    array.forEach((x: string, i: number) => {
        obj[x] = i;
        obj[i] = x;
    });
    return obj;
}

export const betweenNr = (value: number, [min, max]: [number, number]) => {
    return Math.max(Math.min(value, max), min);
}

export const capitalize = (t: string) => t[0].toUpperCase() + t.substr(1);
// dash to capitalized word
export const d2capitalize = (t: string) => t.replace(/(^|\-)./g, s => s.slice(-1).toUpperCase());
// underscore to capitalized word
export const u2capitalize = (t: string) => t.replace(/(^|_)./g, s => s.slice(-1).toUpperCase());
// 
export const c2dashed = (x: string): string => x.replace(/[A-Z]/g, m => "-" + m.toLowerCase());

// Type alias for shorter code :)
type AR<T> = IRequest.ApiResponse<T>;
export type PromiseCb<T> = (resolve: any, reject?: any) => Promise<AR<T>>;
export function fPromise <T>(c: PromiseCb<AR<T>> | Promise<AR<T>> | IFPromise<AR<T>>): IFPromise<AR<T>> {
    if ((c as  IFPromise<AR<T>>).isPending === false) return c as IFPromise<AR<T>>;
    const r: IFPromise<AR<T>> = ((typeof c === 'function' ? new Promise(c) : c) as Promise<AR<T>>)
        .then((x: AR<T>) => {
            r.isResolved = true;
            r.result = x;
            return x;
        })
        .catch((err: any) => {
            r.isRejected = true;
            r.result = err;
            throw err;
        })
        .finally(() => {
            r.isPending = false;
        })

    r.isPending = true;
    r.isResolved = false;
    r.isRejected = false;
    r.result = undefined;
    return r;
}

export function getDeepProp(obj: Record<string, any> = {}, keys: string = '', fallback?: any): any {
    const key = keys.split('.');
    const max = key.length;
    let i = 0;
    for (; i < max && obj; i++) obj = obj[key[i]];
    return i === max && obj ? obj : fallback;
}

interface IValueMap<T> {
    [key: string]: T;
}

type ITreeBaseProp = { id: number; parent_id: number; $childs?: ITreeBaseProp[]; };
export function createTreeValueMap<T extends ITreeBaseProp>(list: T[] = [], key: string = 'id', parentData: Partial<T>): IArrayValueMap<T> {
    const map =  array2ArrayMap(list);
    map.valueMap[0] = {
        id: 0,
        parent_id: -1,
        $childs: [],
        ...parentData
    } as unknown as T;
    map.forEach(x => {
        const parent = map.valueMap[x.parent_id];
        if (!parent) return;
        parent.$childs = parent.$childs ? [...parent.$childs, x] : [x];        
    });
    return map;
}

export interface IArrayValueMap<T> {
    [key: number]: T;
    valueMap: IValueMap<T>;
    length: number;
    push: (arg0: T) => number;
    pop: () => number;
    add: (arg0: T) => void;
    remove: (arg0: string | number) => void;
    splice: (arg0: number, arg1: number, arg2?: T) => T[];
    findIndex: (arg0: (arg0: T, arg1?: number) => boolean) => number;
    map: (arg0: (arg0: T, arg1?: number) => any) => any[];
    forEach: (arg0: (arg0: T, arg1?: number) => void) => void;
}

export function array2ArrayMap<T>(data: T[] = [], key: string = 'id'): IArrayValueMap<T> {
    const result = new Array() as unknown as IArrayValueMap<T>;
    result.length = data.length;
    result.valueMap = {};
    data.forEach((x, i) => {
        result[i] = x;
        result.valueMap[x[key]] = x;
    });
    result.add = function(item: T) {
        result.push(item);
        result.valueMap[item[key]] = item;
    }
    result.remove = function(id: string | number) {
        result.splice(result.findIndex(x => x[key] === id), 1);
        delete result.valueMap[id];
    }    
    return result;
}