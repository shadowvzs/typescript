import {
    IEvents
} from "./types";

/**
 * @constructor
 * @this CloneMouseEvent
 */
function CloneMouseEvent( e: Record<string, any> ): void {
    for (const k in e) {
        this[k] = e[k];
    }
    this.original = e;
    this.preventDefault = function() { this.original.preventDefault(); }
}

class Events implements IEvents.Core {
    private $nodeEventMap: WeakMap<object, any[]> = new WeakMap([]);
    private listeners: IEvents.Listeners = {};
    private autoPreventable: string[] = ['submit'];
    private customTarget = {
        'popstate': window
    };

    constructor() {
        this.onDispatch = this.onDispatch.bind(this);
        this.addListener = this.addListener.bind(this);
    }

    // create an event object from original event
    private clone($node: Element, event: Event): Event {
        const newEvent = new CloneMouseEvent(event);
        newEvent.target = $node;
        return newEvent;
    }

    // if an event was fired then we go over on every callback which was assigned to this event type (ex. click)
    private onDispatch(event: Event): void {
        const type: string = event.type;
        if (~this.autoPreventable.indexOf(type)) event.preventDefault();
        this.listeners[type].forEach(([c, cb]: IEvents.Listener) => {
            if (typeof c === 'boolean') {
                if (c) return cb(event)
            } else if (typeof c === 'function') {
                if (c(event)) return cb(event)
            } else if (typeof c === 'object') {
                const $node = c;
                return ($node === event.target || $node.contains(event.target as Node))
                        && cb(this.clone($node, event))
            }
        });
    }

    // assign an new callback into the global event listeners (if listener still not exist then create one)
    public addListener(condition: IEvents.Condition, type: string, cb: IEvents.EventCallback): void {
        let listener;
        if (typeof condition === 'object' && condition.nodeType) {
            const $node = condition;
            const existingTypes = this.$nodeEventMap.get($node) || [];
            if (~existingTypes.indexOf(type)) { return; }
            existingTypes.splice(0, 0, type);
            this.$nodeEventMap.set($node, existingTypes);
            listener = [condition, cb] as IEvents.NodeListener;
        } else {
            listener = [condition, cb] as IEvents.ConditionalListener;
        }

        if (!this.listeners[type]) {
            this.getTarget(type).addEventListener(type, this.onDispatch as EventListenerOrEventListenerObject, true);
            this.listeners[type] = [];
        }

        this.listeners[type].push(listener);
    }

    // remove an eventlistener callback
    public removeListener(condition: HTMLElementEx | IEvents.EventCallback, type?: string): void {
        let oldTypes: string[];
        let filter: (arg0: any) => boolean;
        // console.log('remove listener', arguments)
        if (typeof condition === 'object') {
            const $node = condition;
            if (!this.$nodeEventMap.has($node)) { return; }
            oldTypes = type ? [type] : this.$nodeEventMap.get($node) as string[];
            filter = ([$oldNode, _]: IEvents.NodeListener) => $oldNode !== $node;
            this.$nodeEventMap.delete($node);
        } else {
            oldTypes = [type as string];
            filter = ([_, cb]: IEvents.NodeListener) => cb !== condition;
        }

        oldTypes.forEach((oldType) => {
            this.listeners[oldType] = this.listeners[oldType].filter(filter);
            if (!this.listeners[oldType].length) {
                this.getTarget(oldType).removeEventListener(oldType, this.onDispatch as EventListenerOrEventListenerObject);
                // console.log(`Removed the listener: ${oldType} event`);
            }
        });
    }

    private getTarget(type: string): HTMLElement | HTMLDocument {
        if (this.customTarget[type]) return this.customTarget[type];
        return document;
    }
}

export const events = new Events();

// test purpose
// @ts-ignore
window.events = events;
