import {
    IEvents
} from "./types";
import { concat, map, toArray, forEach, objFor, flat, objMerge } from "@util/performance";
import { classAutobind } from "@util/core";
import { events } from "./Events";
import { toStyle } from "./JSS";

type IAttrs = JSX.Element['attrs'];
type IChilds = JSX.Element['children'];
type ITagName = string;

// used to rebuild the subtree (it is)
type IBuildCustomElem = (arg0: any) => JSX.Element;
type IBuildAttr = [IBuildCustomElem, IAttrs];


/*
----------------------------------------------
---------------- Virtual DOM -----------------
----------------------------------------------
*/

export declare namespace IVDOM {
    type Childrens = JSX.Element[];
    type NodeModifier1 = (arg0?: HTMLElementEx) => HTMLElementEx;
    type NodeModifier2 = (arg0?: HTMLElementEx) => undefined;
    type NodeModifier = NodeModifier1 | NodeModifier2;
    type FC = (props: Record<string, string>) => JSX.Element;
    type partialChildren = Pick<JSX.Element, 'attrs' | 'children'>;
    type Event = MouseEvent | KeyboardEvent | PopStateEvent;
    type EventHandler = (event: KeyboardEvent | MouseEvent) => void;
    type Update = ($node: HTMLElementEx) => HTMLElementEx;
    type ISetRef = (ref: HTMLElement) => void;
    type UseState<S> = [S, (state: S) => void]
    type Ref = { current: HTMLElement | null };
    interface Hook<S = any, P = any> {
        id: Symbol;
        props?: Record<string, any>;
        state?: S;
        vElem?: JSX.Element;
        build?: (props: P) => JSX.Element;
        effect?: Effect;
        setter?: (state: S) => void;
    }

    type EffectCbFn = () => void;
    type EffectCb = () => EffectCbFn | void;
    type EffectDep = any[] | undefined;
    interface Effect {
        mountCb: EffectCb;
        unmountCb?: EffectCb;
        dep: EffectDep;
        lastDep?: string;
        shouldRun?: boolean;
    }
   
    interface HookMap {
        [Symbol.toStringTag](): Hook;
    }    
}

// implements IVDOM.Core
export class VDom {
    public $App: HTMLElementEx;
    public $root: HTMLElementEx;
    public App: JSX.Element;
    public hookMap: IVDOM.HookMap = {} as IVDOM.HookMap;
    public hookKey?: symbol = undefined;
    private $recycleBin: HTMLDivElement = document.createElement('div');
    private events: IEvents.Core = events;
    private lastPageData: [IVDOM.FC[], Record<string, string>];
    private _safeLoadQueue: (() => void)[] = [];
    private namespacedTags = {
        svg: 'http://www.w3.org/2000/svg',
        path: 'http://www.w3.org/2000/svg'
    }

    constructor(rootSelector = 'body') {
        this.$root = document.querySelector(rootSelector) as HTMLElementEx;
        classAutobind(this);
        window.addEventListener("load", this.onPageLoaded);
    }

    public onPageLoaded() {
        this._safeLoadQueue.forEach(this.safeLoad);
        window.removeEventListener("load", this.onPageLoaded);
    }

    // execute the callbacks after the page is loaded
    private safeLoad(cb: () => void) {
        if (document.readyState === "complete") {
            cb();
        } else {
            this._safeLoadQueue.push(cb);
        }       
    }

    // create virtual dom object from given parameters
    public ce(
        tagName: ITagName, {
            attrs = {} as IAttrs,
            children = [] as IChilds,
        } = {} as Partial<Omit<JSX.Element, 'tagName'>>
    ): JSX.Element {
        if (!attrs) attrs = {};
        if (!children) children = [];

        if (attrs['children']) {
            children.push(attrs['children']);
            delete attrs['children'];
        }

        const elem: JSX.Element = Object.assign(Object.create(null), {
            tagName,
            attrs,
            children,
        });

        forEach(children.filter(x => typeof x === 'object' && x !== null), (child: JSX.Element) => {
            if (!child.attrs) child.attrs = {};
            child.parent = elem;
        })
        return elem;
    }

    // check if property key is an event property key or no (ex. onclick, onmousedown, onkeydown etc)
    private isEventProp(name: string): boolean {
        return /^on/.test(name);
    }

    // assign a new attribute/event to given element
    private setAttribute($el: HTMLElementEx, k: string, v: any): HTMLElementEx {
        if (this.isEventProp(k)) {
            if (v) this.events.addListener($el, k.substr(2).toLowerCase(), v);
        } else if (~['key', 'ref', 'html', 'build', 'hookKey'].indexOf(k)) {
            if (k === 'ref') {
                const type = typeof v;
                if (type === 'function') {
                    v($el);
                } else if (Array.isArray(v)) {
                    const [obj, key] = v;
                    obj[key] = $el;
                } else if (type === 'object' && v) {
                    v.current = $el;
                }
            } else if (k === 'html') {
                $el.innerHTML = v;
            }
        } else if ($el.getAttribute(k) !== v) {
            if (k === 'className') { 
                k = 'class';
                if (Array.isArray(v)) v = v.join(' ');
            } else if (k === 'style' && v && typeof v === 'object') {
                v = toStyle(v);
            }
            if (v || typeof v === 'number' || $el.getAttribute(k)) $el.setAttribute(k, v);
        }
        return $el;
    }

    // remove attributes/event from given element
    private removeAttribute($el: HTMLElementEx, k: string): HTMLElementEx {
        if (this.isEventProp(k)) {
            this.events.removeListener($el);
        } else if (~['ref', 'key', 'html', 'build', 'hookKey'].indexOf(k)) {
            if (k === 'html') {
                $el.innerHTML = '';
            } else if (k === 'ref') {
                if (!$el.vRef) return $el;
                const v = $el.vRef.attrs[k];
                const type = typeof v;
                if (Array.isArray(v)) {
                    const [obj, key] = v;
                    obj[key] = null;
                } else if (type === 'object' && v) {
                    v.current = null;
                }
            } else if (k === 'hookKey' && $el.vRef) {
                const v: symbol = $el.vRef.attrs.hookKey as symbol;
                const hook = this.hookMap[v];
                delete this.hookMap[v];
            }
        } else if (k === 'className') {
            $el.className = '';
        } else if ($el.getAttribute(k)) {
            $el.removeAttribute(k);
        }
        return $el;
    }

    // remove all custom attribute from element
    private removeAttributes($el: HTMLElementEx, attrs: Record<string, any>): void {
        for (const k in attrs) { this.removeAttribute($el, k); }
    }

    // Replace existing DON elem with newly created one (note: newEl could be virtual DOM element or real element)
    public mount($oldEl: HTMLElementEx, newEl: JSX.Element): HTMLElementEx {
        let $newEl: HTMLElementEx = this.render(newEl as JSX.Element);

        if (!this.$root || $oldEl === this.$root) {
            this.$root = $newEl;
        }
        // update $elem reference in vDom structure for replaced elem
        if ($oldEl.vRef && $newEl.nodeType === 1) {
            $oldEl.vRef.$elem = $newEl;
            if (!$newEl.vRef) $newEl.vRef = newEl;
            if ($oldEl.vRef.parent) $newEl.vRef.parent = $oldEl.vRef.parent;
        }
        this.removeChilds($oldEl);
        $oldEl.replaceWith($newEl);
        return $newEl;
    }

    // insert child into an parent virtual dom object
    public insertChild($el: HTMLElementEx, vChild: JSX.Element): void {
        if (!$el || !$el.nodeType || !$el.vRef ) { console.error('Not assigned virtual DOM for real DOM', $el); }
        const vParent = $el.vRef;
        if (!vParent || !vParent.children) return;
        const children = [ ...vParent.children, vChild ];
        const newVParent = { ...vParent, children };
        vChild.parent = vParent;
        this.mount($el, newVParent);
    }

    // arranging the arrays
    private zip(xs: IVDOM.NodeModifier[], ys: NodeListOf<ChildNode>): [IVDOM.NodeModifier, ChildNode][] {
        const zipped: [IVDOM.NodeModifier, ChildNode][] = [];
        const max = Math.min(xs.length, ys.length);
        let i = 0;
        for (; i < max; i++) zipped.push([xs[i], ys[i]]);
        return zipped;
    }

    // diffing the attributes and return the patcher function (ex. updateAttrs(oldAttrs, newAttrs)(element))
    private updateAttrs(oldAttrs: IAttrs, newAttrs?: IAttrs): IVDOM.NodeModifier {
        const updates: IVDOM.Update[] = [];

        // remove old attributes
        for (const k in oldAttrs) {
            if (newAttrs && k in newAttrs && !this.isEventProp(k)) continue;
            updates.push(($node: HTMLElementEx) => this.removeAttribute($node, k));
        }

        // set the new attribute
        if (newAttrs) {
            objFor<IAttrs>(newAttrs, (k, v) => updates.push(($node: HTMLElementEx) => this.setAttribute($node, k, v)));
        }
        
        return (($node: HTMLElementEx) => {
            forEach(updates, (update: IVDOM.Update) => update($node));
            // remove & cache the old hook
            const oldHook: IVDOM.Hook = oldAttrs.hookKey && this.hookMap[oldAttrs.hookKey];
            const newHook: IVDOM.Hook = newAttrs && newAttrs.hookKey && this.hookMap[newAttrs.hookKey];

            if (newHook && newHook.effect && newHook.effect.shouldRun) {
                // && oldHook && oldHook.effect
                if (!oldHook || !newHook.effect.dep || (oldHook.effect && oldHook.effect.lastDep !== newHook.effect.lastDep)) {
                    newHook.effect.unmountCb = newHook.effect.mountCb() as IVDOM.EffectCb;
                }
            }
            
            if (oldHook && oldAttrs.hookKey && (!newAttrs || oldAttrs.hookKey !== newAttrs.hookKey)) {
                delete this.hookMap[oldAttrs.hookKey];
            }

            return $node;
        }) as IVDOM.NodeModifier1;
    }

    // return patcher, which convert virtual dom child into real dom and insert into an parent element
    private appendUpdateCb(child: JSX.Element) {
        return ($node: HTMLElementEx) => {
            $node.appendChild(this.render(child));
            return $node;
        }
    }

    // diffing the children between 2 virtual dom tree
    private updateChildren(oldVChildren: JSX.Element[], newVChildren: JSX.Element[]) {
        const childUpdates: IVDOM.NodeModifier[] = [];
        const additionalUpdates: IVDOM.NodeModifier[] = [];
        
        forEach(oldVChildren, (oldVChild: JSX.Element, i: number) => childUpdates.push(this.update(oldVChild, newVChildren[i])));
        concat(additionalUpdates, map(newVChildren.slice(oldVChildren.length), this.appendUpdateCb));

        return ($parent: HTMLElementEx) => {
            const updates = this.zip(childUpdates, $parent.childNodes);
            forEach(updates, ([update, $child]) => update($child as HTMLElementEx));
            forEach(additionalUpdates, (update: any) => update($parent));
            return $parent;
        };
    }

    // compare the 2 virtual dom tree and return patcher function (ex. update(oldTree, newTree)(element))
    private update(oldVTree: JSX.Element, newVTree?: JSX.Element): IVDOM.NodeModifier {
        if (newVTree === undefined) {
            if (oldVTree && oldVTree.attrs && oldVTree.attrs.hookKey) { console.info('remove elem'); }
            return ($node: HTMLElementEx = this.$App) => {
                this.removeElement($node);
                return undefined;
            }
        }

        if (typeof oldVTree !== 'object' || typeof newVTree !== 'object') {
            if (oldVTree !== newVTree) {
                return ($node: HTMLElementEx = this.$App) => this.mount($node, newVTree);
            } else {
                return ($node: HTMLElementEx = this.$App) => $node;
            }
        }

        if (oldVTree.tagName !== newVTree.tagName) {
            if (oldVTree.attrs.hookKey) { console.info('replace elem'); }
            return (($node: HTMLElementEx) => this.mount($node, newVTree)) as IVDOM.NodeModifier1;
        }

        return ($node: HTMLElementEx = this.$App) => {
            newVTree.$elem = $node;
            $node.vRef = newVTree;
            if (this.isElement($node)) {
                this.updateAttrs(oldVTree.attrs, newVTree.attrs)($node);
                this.updateChildren(oldVTree.children || [], newVTree.children || [])($node);
            }
            return $node;
        };
    }

    private isElement($el: any): boolean {
        return typeof $el === 'object' && $el.nodeType === 1;
    }

    private injectAttrs(vElem: JSX.Element, attrs: IAttrs) {
        objMerge(vElem.attrs, attrs);
        return vElem;
    }

    // Attribute propagation-
    public attrDown(childs: IChilds, downAttrs: IAttrs) {
        if (!childs || !childs.length || !downAttrs) return;
        childs.forEach((x, i) => {
            if (x && x.attrs && x.attrs.build) {
                const [func, attrs] = x.attrs.build;
                const newTree = func({...attrs, ...downAttrs}) as JSX.Element;
                childs[i] = newTree;
            }
        });
    }

    public find(tagName: ITagName, attrs: Record<string, any>, container: JSX.Element = this.App) {
        const attrArr = attrs ? attrs.split(',').map(x => x.split('=')) : [];
    }

    // loop over all child and call the removeElement method
    private removeChilds($elem: HTMLElementEx): void {
        if (!$elem.children) { return; }
        forEach(toArray($elem.children), ($el) => this.removeElement($el as HTMLElementEx));
    }

    // remove real dom element but also remove attributes and set isMount property to false (call unmount callback)
    public removeElement($elem: HTMLElementEx): void {
        if (!$elem) { return; }
        if ($elem.children) { this.removeChilds($elem); }
        const oldTree = $elem.vRef;
        if (oldTree) {
            const attrs = oldTree.attrs;
            if (Object.keys(attrs).length) this.removeAttributes($elem, attrs);
            this.events.removeListener($elem);
        }
        // remove from DOM tree
        $elem.remove();
        // Mysterious solution, add into another div then we use innerHTML and that remove from memory
        // but maybe i will reuse the DOM in future
        this.$recycleBin.appendChild($elem);
        this.$recycleBin.innerHTML = '';
    }

    // convert virtual dom element into real dom element and insert his childrens
    public renderElem({ tagName = 'div', attrs, children = [] }: JSX.Element) {
        const namespace: string = this.namespacedTags[tagName];
        const $el: HTMLElementEx = namespace
            ? document.createElementNS(namespace, tagName) as HTMLElementEx
            : tagName === 'fragment' 
                ? document.createDocumentFragment() as any
                : document.createElement(tagName) as HTMLElementEx;
        this.updateAttrs([], attrs)($el);
        forEach(children, (x: JSX.Element) => $el.appendChild(this.render(x)));
        return $el;
    }

    // convert virtual dom object into real dom element, assign his virtual dom object and return the real dom
    public render(vNode: JSX.Element): HTMLElementEx {
        if (typeof vNode !== 'object') return document.createTextNode(vNode || '') as unknown as HTMLElementEx;
        const $elem: HTMLElementEx = this.renderElem(vNode);
        $elem.vRef = vNode;     // get virtual DOM from real Elem
        vNode.$elem = $elem;    // get the real DOM from virtual DOM
        return $elem;
    }

    // update & render a virtual dom subtree
    public renderSubTree($oldElem: HTMLElementEx, a: IBuildCustomElem, b: any): void {
        const oldTree = $oldElem.vRef;
        if (oldTree) b['oldSym'] = oldTree.attrs.hookKey;
        const newTree = this.build(a, b);
        if (!oldTree) {
            console.error('Virtual tree on dom not exist!');
            this.mount($oldElem, newTree);
            return;
        }
        const vParent = oldTree.parent as JSX.Element;
        const idx = vParent.children.findIndex(x => x === oldTree);
        vParent.children[idx === -1 ? 0 : idx] = newTree;
        newTree.parent = vParent;
        // newTree.attrs.hookKey = oldTree.attrs.hookKey;
        // newTree.attrs.build = oldTree.attrs.build;
        $oldElem.vRef = newTree;
        const $newElem = this.update(oldTree, newTree)($oldElem) as HTMLElementEx;
        $newElem.vRef = newTree;
    }

    public hookSetter<S>(key: symbol) {
        return (value: S) => {
            const hook = this.hookMap[key]
            if (!hook) return console.error('Hook setter: Hook not exist', value);
            if (!hook.vElem) return console.error('Hook setter: Missing the vElem from the hook', hook, value);
            hook.state = value;
            const $el = hook.vElem.$elem;
            if (!$el) return console.error('Hook setter: Missing element from vTree', hook);
            this.hookKey = key;
            this.renderSubTree($el, hook.build, hook.props);
            this.hookKey = undefined;
        };
    }

   public useState<S>(initValue: S): IVDOM.UseState<S> {
        if (this.hookKey) {
            let hook: IVDOM.Hook = this.hookMap[this.hookKey];
            if (!hook) {
                this.hookMap[this.hookKey] = hook = {
                    id: this.hookKey
                };
            }
            if (!hook.setter) {
                hook.state = initValue;
                hook.setter = this.hookSetter(this.hookKey);
            }
            return [hook.state, hook.setter];
        } else {
            console.error('Use useState in functional component!')
            return [null as any, (e) => {}];
        }
    }

    public useEffect(cb: IVDOM.EffectCb, dep?: IVDOM.EffectDep): void {
        if (this.hookKey) {
            // EffectCb
            let hook: IVDOM.Hook = this.hookMap[this.hookKey];
            if (!hook) {
                this.hookMap[this.hookKey] = hook = {
                    id: this.hookKey
                };
            }
            if (!hook.effect) {
                hook.effect = {
                    mountCb: cb,
                    dep: dep,
                    lastDep: undefined,
                    shouldRun: true,
                }
            }
            const stringDep = dep ? JSON.stringify(dep) : undefined;
            hook.effect.shouldRun = !dep || stringDep !== hook.effect.lastDep;
            hook.effect.lastDep = stringDep;
        } else {
            console.error('Use useEffect in functional component!')
        }
    }

    public useRef(): IVDOM.Ref {
        return {
            current: null
        };
    }

    public build(element: string | IBuildCustomElem, attrs: IAttrs = {}, ...children: JSX.Element[] | JSX.Element[][]): JSX.Element {
        children = (children ? flat(children as JSX.Element[], 1) : []);
        if (typeof element === 'function') {
            let key = Symbol('fn');
            if (attrs && attrs['oldSym']) {
                key = attrs['oldSym'];
                delete attrs['oldSym'];
            }
            this.hookKey = key;
            attrs = { ...(attrs || {}), children: children};
            const vElem = element(attrs) as JSX.Element;
            vElem.attrs.build = [element, attrs] as IBuildAttr;
            if (vElem.tagName === 'form' && attrs['model']) {
                this.attrDown(vElem.children, { model: attrs.model } as IAttrs);
            }
            if (this.hookMap[key]) {
                const hook: IVDOM.Hook = this.hookMap[key];
                hook.build = element;
                hook.props = attrs;
                hook.vElem = vElem;
                vElem.attrs.hookKey = key;
            }
            this.hookKey = undefined;
            return vElem;
        }
        return this.ce(element, { attrs, children } as Omit<JSX.Element, 'tagName'>);
    }

    // rerender the virtual dom tree based on route data (function array with params)
    public loadPage(routeComponents: IBuildCustomElem[], params: Record<string, string>): void {
        let vComponent: JSX.Element | undefined;
        this.lastPageData = [routeComponents, params];
        document.title = 'Loading';
        if (!routeComponents || !routeComponents.length) { return console.error('Missing route components'); }
        let vTree: JSX.Element = this.build(routeComponents.pop() as IBuildCustomElem, params);
        
        do {
            const cmp = routeComponents.pop();
            if (!cmp) break;
            const vElem = this.build(cmp, params);
            vElem.children.push(vTree);
            vTree = vElem;
        } while (vComponent);

        vTree.parent = {
            tagName: 'div',
            attrs: {},
            children: [vTree]
        };

        if (!this.$App) {
            this.App = vTree;
            this.$App = this.render(this.App) as HTMLElementEx;
            this.$App.vRef = this.App;
            this.$root.appendChild(this.$App);
        } else {
            this.$App = this.update(this.App, vTree)(this.$App) as HTMLElementEx;
            this.App = vTree;
        }        

    }

    // refresh the whole dom tree with last data
    public refresh(): void {
        this.loadPage(...this.lastPageData);
    }

    public Fragment = (attrs: IAttrs) => {
        return this.build('fragment', {}, attrs.children);
    }
}


export const vDom = new VDom('#root');

export const build = vDom.build;
export const Fragment = vDom.Fragment;
export const ce = vDom.ce;
export const mount = vDom.mount;
export const render = vDom.render;
export const renderElem = vDom.renderElem;
export const refresh = vDom.refresh;
export const removeElement = vDom.removeElement;
export const renderSubTree = vDom.renderSubTree;
export const attrDown = vDom.attrDown;
export const useState = vDom.useState.bind(vDom);
export const useEffect = vDom.useEffect.bind(vDom);
export const useRef = vDom.useRef;

declare global {
    interface HTMLElementEx extends HTMLElement{
        childNodes: NodeListOf<ChildNode>;
        dataset: Record<string, string>;
        nodeType: number;
        setAttribute: (key: string, value: any) => void;
        uuid?: string;
        vRef?: JSX.Element;
    }

    export namespace JSX {
        
        interface FragmentProperty { Fragment: {}; }

        interface Attrs extends Record<string, any> {
            hookKey?: symbol;
        }

        interface Element { 
            attrs: Attrs,
            children: JSX.Element[];
            $elem?: HTMLElementEx;
            parent?: JSX.Element;
            tagName: string;
        }
        interface IntrinsicElements { 
            [key: string]: any;
        }
    }
}

// test purpose
// @ts-ignore
window.vDom = vDom;
