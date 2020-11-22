import { 
    objFor,
    objValues,
    forEach,
    flat,
} from "@util/performance";

import { getDeepProp } from "@util/core";
import { 
    ObjPart,
    ObjPartAny,
} from "@typo";

type IRegexValidator = (arg0: string) => boolean;
type ILengthValidator = (arg0: string, arg1: number, arg2?: number) => boolean;
type IStringCompareValidator = (arg0: string, o: any, arg1: string) => boolean;
// type aliases
type IValidator = IRegexValidator | ILengthValidator | IStringCompareValidator;
type IValidatorData = Record<string, Record<string, IValidator> | IValidator>;

export const FormSymbolKey = Symbol('form');
export const errorSymbolKey = Symbol('errors');
export const validationSymbolKey = Symbol('validations');

export const validator: IValidatorData = {
    TYPE: {
        EMAIL: (x: string) => new RegExp('^([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$)$').test(x),
        NAME_HUN: (x: string) => new RegExp('^([a-zA-Z0-9 ÁÉÍÓÖŐÚÜŰÔ??áéíóöőúüűô??]+)$').test(x),
        ADDRESS_HUN: (x: string) => new RegExp('^([a-zA-Z0-9 ÁÉÍÓÖŐÚÜŰÔ??áéíóöőúüűô??\,\.\-]+)$').test(x),
        NAME: (x: string) => new RegExp('^([a-zA-Z0-9 \-]+)$').test(x),
        INTEGER: (x: string) => new RegExp('^([0-9]+)$').test(x),
        SLUG: (x: string) => new RegExp('^[a-zA-Z0-9-_]+$').test(x),
        URL: (x: string) => new RegExp('^[a-zA-Z0-9-_]+$').test(x),
        ALPHA_NUM: (x: string) => new RegExp('^([a-zA-Z0-9]+)$').test(x),
        STR_AND_NUM: (x: string) => new RegExp('^([0-9]+[a-zA-Z]+|[a-zA-Z]+[0-9]+|[a-zA-Z]+[0-9]+[a-zA-Z]+)$').test(x),
        LOWER_UPPER_NUM: (x: string) => new RegExp('^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$').test(x),
        MYSQL_DATE: (x: string) => new RegExp('^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9])(?:( [0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$').test(x),
        STRING: (x: string) => true,
        BLOB: (x: string) => true,
        JSON: (x: string) => {
            try {
                JSON.parse(x);
            } catch(err) {
                return false;
            }
            return true;
        },
    },
    LENGTH: {
        MIN: (x: string, len1: number) => Boolean(x && x.length >= len1),
        MAX: (x: string, len1: number) => Boolean(x && x.length <= len1),
        MIN_MAX: (x: string, len1: number, len2?: number) => Boolean(x && x.length >= len1 && len2 && x.length <= len2)
    },
    REQUIRED: (x: string, o?: any) => Boolean(x),
    MATCH: (x: string, y: string) => x === y,
    EGUAL: (x: string,  o: any, y: string) => Boolean(y && x === o[y]),
    REVALIDATE: (x: string,  o: any, y: string) => { 
        const showText = o[FormSymbolKey]['showHelperText'];
        if (showText) {
            // reevalidate all validation on y property & show error if needed at that field
            o.validator(y, o[y]);   
            o[FormSymbolKey]['showHelperText'](y);
        }
        return true; 
    },
}

type IVCondition<T> = (x: string, o?: T) => boolean;
type IValidatorOption<T> = any[] | IVCondition<T>;
export function addValidation<T>(rule: string, message: string, options: IValidatorOption<T> = []): ValidationCondition<T> {
    if (typeof options === 'function') {
        return (x: string, o?: T) => !(options as IVCondition<T>)(x, o) && ({
            type: rule,
            message: message
        });
    }
    const v = getDeepProp(validator, rule);
    if (v) {
        return (x: string, o?: T) => {
            if (rule.indexOf('.') < 0 && options[0] !== o) (options as any[]).unshift(o);
            return !v(x, ...(options as any[])) && ({
                type: rule,
                message: message
            });
        }
    }
    return (x: string, o?: T) => false;
};

type IDecoratorSignature = any;
export function CV<T>(rule: string, message: string, options: IValidatorOption<T> = []) {
    return function (target: IBaseModel<T>, property: string, descriptor: PropertyDecorator) {
        if (!target.$validation) { target.$validation = {}; }
        if (!target.$validation[property]) { target.$validation[property] = []; }
        target.$validation[property].push(addValidation(rule, message, options));
        return descriptor;
    } as IDecoratorSignature;
}


export type ValidationCondition<T> = (x: any, o?: T) => false | IValidationError;
export type IValidation<T> = ObjPart<T, ValidationCondition<T>[]>;
export interface IModel<T> extends IBaseModel<T> {}
export interface IBaseModel<T> {
    $validation: IValidation<T>;
    getValues: () => T;
    getError: (key?: Partial<keyof T>) => IValidationError[];
    inputConnector: (arg0: KeyboardEvent) => boolean;
    runValidations: () => void;
    getProps: (fieldList: Partial<keyof T>[]) => Partial<T>;
    setProps: (arg0: ObjPartAny<T>) => void;
    getProp: (key: Partial<keyof T>) => Partial<T[keyof T]>;
    setProp: (key: Partial<keyof T>, value: Partial<T[keyof T]>) => void;
    validator: (key: Partial<keyof T>, value: any) => boolean | IValidationError;
}
export interface IValidationError {
    type: string;
    message: string;
}

class BaseModel<T> implements IBaseModel<T> {
    public [FormSymbolKey]: ObjPart<T, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = {};
    public [errorSymbolKey]: ObjPart<T, IValidationError[]> = {};
    private [validationSymbolKey]: IValidation<T>;
    
    public get $validation(): IValidation<T> {
        return this[validationSymbolKey];
    }

    public set $validation(v) {
        this[validationSymbolKey] = v;
        this.runValidations();
    }

    constructor(prefilledData?: ObjPartAny<T>) {
        if (prefilledData) this.setProps(prefilledData);
    }

    public validator = (key: keyof T, value: any): boolean => {
        const vld = ((this.$validation || {})[key] || []) as ValidationCondition<T>[];
        const model = this as unknown as T;
        this[errorSymbolKey][key] = [] as IValidationError[];

        forEach(vld, (cond) => {
            const err = cond(value, model);
            if (err) (this[errorSymbolKey][key] as IValidationError[]).push(err);
        })

        return !(this[errorSymbolKey][key] as IValidationError[]).length;
    }

    public inputConnector = (ev: KeyboardEvent): boolean => {
        const { name, value } = ev.target as unknown as { name: keyof T, value: string };
        (this as Record<keyof T, any>)[name] = value;
        return this.validator(name, value);
    }

    public setProps(prefilledData: ObjPartAny<T>): void {
        const vld = this.$validation || {};
        objFor<Partial<T>>(prefilledData, (k, v) => {
            if (vld[k]) this.validator(k, v);
            (this as ObjPartAny<T>)[k] = v;
        });
    }

    public setProp(key: Partial<keyof T>, value: Partial<T[keyof T]>): void {
        const vld = (this.$validation || {})[key];
        if (vld) this.validator(key, value);
        (this as ObjPartAny<T>)[key] = value;
    }

    public getProps(fieldList: Partial<keyof T>[]): Partial<T> {
        const result = {} as Partial<T>;
        fieldList.forEach(x => result[x] = (this as ObjPartAny<T>)[x])
        return result;
    }

    public getProp(key: Partial<keyof T>): Partial<T[keyof T]> {
        return (this as ObjPartAny<T>)[key];
    }

    public runValidations(): void {
        const model = this.getValues();
        objFor<any>(this.$validation, (k, i) => this.validator(k as keyof T, model[k]));
    }

    public getError(key?: Partial<keyof T>): IValidationError[] {
        let errors: IValidationError[];
        if (!key) {
            errors = flat(objValues<IValidationError>(this[errorSymbolKey]), 1)
        } else {
            return this[errorSymbolKey][key as string];
        }
        return errors || [];
    }

    public getValues(): T {
        const reserved = ['_', '$'];
        const obj = {} as T;
        Object.getOwnPropertyNames(this)
            .filter(x => reserved.indexOf(x[0]) < 0 && typeof this[x] !== 'function')
            .forEach(x => obj[x] = this[x]);
        return obj;
    }
}

export default BaseModel;


/*
// Method 1 - No decorator:
const userValidation = {
    email: [
        addValidation('TYPE.EMAIL', 'Helytelen email')
    ],
    password: [
        addValidation('TYPE.STR_AND_NUM', 'A jelszó szám és betűből álljon'),
        addValidation('LENGTH.MIN_MAX', 'A jelszó 6-32 karakter kell legyen', [6, 32]),
    ],
    pali: [
        addValidation('REQUIRED', 'Pali hianyzik'),
    ]
} as  IValidation<ILoginUser>;

class User extends Base {
    public $validation = userValidation;
    public email: string;
    public password: string;
    public pupucs: string;
}

// Method2 Decorator
class User extends Base {
    @CV('TYPE.EMAIL', 'Helytelen email')
    public email: string;
    @CV('TYPE.STR_AND_NUM', 'A jelszó szám és betűből álljon')
    @CV('LENGTH.MIN_MAX', 'A jelszó 6-32 karakter kell legyen', [6, 32])
    public password: string;
    @CV('REQUIRED', 'A papucs hianyzik')
    public pupucs: string;
}
*/
