import { 
    StrKeyOf 
} from "@typo";

/* Array methods */

export function flat<T>(arr: T[] | T[][], depth: number = 1) {
    const arrLen = arr.length;
    const final: T[] = [];
    let i = 0;
    for(; i < arrLen; i++) {
        if (Array.isArray(arr[i])) {
            concat(final, depth ? flat<T>(arr[i] as T[], depth - 1) : arr[i] as T[]);
        } else {
            final.push(arr[i] as T);
        }
    }
    return final;
}

export function concat(arr1: any, arr2: any[]): any[] {
    const arr1Len = arr1.length;
    const arr2Len = arr2.length;
    let i = 0;
    arr1.length = arr1Len + arr2Len;
    for(; i < arr2Len; i++) arr1[arr1Len + i] = arr2[i];
    return arr1;
}

type IForEachCb<T> = (arg0: T, arg1: number) => void;
export function forEach<T>(arr: T[], cb: IForEachCb<T>): void {
    const arrLen = arr.length;
    let i = 0;
    for(; i < arrLen; i++) cb(arr[i], i);
}

type IMapCb<T> = (arg0: T, arg1?: number) => any;
export function map<T>(arr: any, cb: IMapCb<T>): any[] {
    const finalArray: T[] = [];
    const arrLen = arr.length;
    finalArray.length = arrLen;
    let i = 0;
    for(; i < arrLen; i++) finalArray[i] = cb(arr[i], i);
    return finalArray;
}

export function toArray(obj: Record<string, any>): any[] {
    return Array.prototype.slice.call(obj);
}

/* Object methods */
type IObjForCb<T> = (arg0: StrKeyOf<T>, arg1: Partial<T[keyof T]>) => void;
export function objFor<T>(obj: T, cb: IObjForCb<T>) {
    let k: StrKeyOf<T>;
    for (k in obj) cb(k, obj[k]);
}

export function objConcat<T, K>(obj1: T, obj2: K): T & K {
    const result = {} as T & K;
    let key: string;
    for (key in obj1) result[key] = obj1[key];
    for (key in obj2) result[key] = obj2[key];
    return result;
}

export function objMerge<T, K>(obj1: T, obj2: K): T & K {
    if (!obj1) obj1 = {} as T;
    let key: string;
    for (key in obj2) obj1[key] = obj2[key];
    return obj1 as T & K;
}

type IObjMapCb = (arg0: any) => any;
export function objMap(obj: Record<string, any>, cb: IObjMapCb) {
    const result: Record<string, any> = {};
    let k: string;
    for (k in obj) result[k] = cb(obj[k]);
    return result;
}

export function objValues<T>(obj: Record<string, any>): T[] {
    const result: T[] = [];
    let k: string;
    for (k in obj) result.push(obj[k]);
    return result;
}