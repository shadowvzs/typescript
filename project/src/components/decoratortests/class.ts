const test = () => {

    // -------

    type Constructor<T extends any> = new (...args: any[]) => T;

    function log<T extends Constructor<object>>(constructor: T) {
        console.log('decorator added at', new Date());
        const newConstructor = function(...args: any[]) {
            console.log('object was constructed at', new Date)
            console.log('with this arguments', args)
            return new constructor(...args);
        }
        newConstructor.prototype = constructor.prototype;
        return newConstructor as unknown as T;
    }

    // ----------------------

    @log
    class Pet {
        public myReadonlyProp: { something: string };
        public pista = 1;
        public b = 1;
        constructor(
            public name: string, 
            public age: number
        ) {
            console.log('original constructor')
        }
    }

    // -------------
    
    setTimeout(() => {
        const a = new Pet("Azor", 12);
        window['logClass'] = a;
        console.log(a);
    }, 3000)

    // -----------------------
}

export default test;