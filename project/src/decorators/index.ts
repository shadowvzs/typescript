// method decorators

export function Measure (target: Object, propertyKey: string, descriptor: PropertyDescriptor): any {
    const originalMethod = descriptor.value;
  
    descriptor.value = function (...args: any[]) {
        const start = performance.now();
        const result = originalMethod.apply(this, args);
        const finish = performance.now();
        console.log(`Execution time: ${finish - start} milliseconds`);
        return result;
    };
  
    return descriptor;
};

export function MeasureAsync(target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
  
    descriptor.value = async function (...args: any[]) {
        const start = performance.now();
        const result = await originalMethod.apply(target, args);
        const finish = performance.now();
        console.info(`Execution time for "${propertyKey}": ${finish - start} milliseconds`);
        return result;
    };
  
    return descriptor;
};

export function autobind (target: Object, propertyKey: string, descriptor: PropertyDescriptor): any {
    if (typeof target[propertyKey] !== 'function') return;
    target[propertyKey] = target[propertyKey].bind(target);
};

// property decorator

export const Readonly = (initValue: any) => (target: Object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
        value: Object.freeze(initValue)
    }); 
};

export function Min(limit: number) {
    return function(target: Object, propertyKey: string) { 
        let value : string;
        const getter = () => { return value; };
        const setter = (newVal: string) => {
            if(newVal.length < limit) {
                const msg = `Your ${propertyKey} property length is lower than ${limit}`;
                Object.defineProperty(target, 'errors', {
                    value: msg
                });
                console.error(msg);
            } else {
                value = newVal;
            }      
        }; 
        Object.defineProperty(target, propertyKey, {
            get: getter,
            set: setter
        }); 
    } 
}