export type Versionable<T> = T & { 
    back: () => void;
    showHistory: () => void;
};

const test = () => {

    type Constructor<T extends any> = new (...args: any[]) => T;
    const history = Symbol("history");

    function versionable<T extends Constructor<object>>(constructor: T) {
        const newConstructor = function(...args: any[]) {
            const instance = new constructor(...args);
            instance[history] = [];
            let index: number = -1;
            const proxy = new Proxy(instance, {
                set(target, propertyKey, value) { 
                    if (target[propertyKey] !== value) {
                        console.info('Object property was changed to: ', propertyKey,' - ', value)
                        target[history].push([propertyKey, target[propertyKey]]);
                        index = target[history].length;
                        Reflect.set(target, propertyKey, value);
                    } else {
                        console.warn('no more history')
                    }
                    return true;
                }
            });
            (instance as Versionable<typeof instance>).back = function () {
                if (instance[history].length === 0) { return; }
                const [lastProperty, lastValue] = instance[history].pop() || [];
                console.info('Object property was reseted to: ', lastProperty,' - ', lastValue)
                instance[lastProperty] = lastValue;
            };
            (instance as Versionable<typeof instance>).showHistory = function () {
                console.table(instance[history]);
            };
            return proxy;
        }
        newConstructor.prototype = constructor.prototype;
        return newConstructor as unknown as T;
    }

    // ========== class ==========
    
    @versionable
    class Entity {
        public id: string = '134sdw4353-dfvde4354';
        public text: string = 'first text';
        public name: string = 'unsaved title';
        public show() {
            console.table(Object.entries(this).filter(x => typeof x[1] !== 'function'));
        }
    }

    // --------- test --------

    const entity = (new Entity()) as Versionable<Entity>;
    entity.text = "i changed the text";
    entity.text = "Third text";
    entity.name = "Updated entity name";
    entity.text = "Final looooooong text";


    window['entity'] = entity;

    // --------- test in browser --------
    entity.showHistory();  // show version history
    entity.show();         // show the object with his current values
    // entity.back();      // jump back by 1 version


    // ====================
};

export default test;
