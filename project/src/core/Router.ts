import {
    IRouter,
} from "./types";

import { validate } from "./RegExp";
import { vDom } from "@core/VDom";
import { events } from "@core/Events";

export class Router implements IRouter.Core {
    private events = events;
    private URL_DATA: IRouter.IURL_DATA;
    private MOUSE_BUTTON: string[] = ['left', 'middle', 'right'];
    public config: IRouter.Config;
    public currentRoute: string;
    public history: IRouter.HistoryItem[] = [];

    constructor() {
        const { protocol, hostname } = location as Location;
        const baseDir = '';   // it is empty if project is in root directory
        this.URL_DATA = {
            BASE: Object.freeze({
                PROTOCOL: protocol,
                HOSTNAME: hostname,
                DIR: baseDir,
                ROOT: protocol + '//' + hostname + baseDir,
            }),
            DYNAMIC: {
                HASH: null,
                QUERY: {},
                URL: null,
                PARAMS: {}
            }
        }

        this.onClick = this.onClick.bind(this);
        this.onBack = this.onBack.bind(this);
        this.registerRouter();
        this.getFullUrl();
    }

    public getFullUrl(url: string = '') {
        const root = this.URL_DATA.BASE.ROOT;
        if (root.substr(-1) !== '/' && url && url[0] !== '/') url = '/' + url;
        return root + url;
    }

    public init(config: IRouter.Config): void {
        this.config = config;
        const { URL } = this.getPath();
        this.history.push({ url: URL, title: '', props: null});
        this.dispatchRoute(URL);
    }

    // we must assign click and popstate global listener after page loaded
    private registerRouter(): void {
        if (document.readyState === 'complete') {
            this.createGlobalClickEvent();
        } else {
            document.onreadystatechange = () => {
                document.readyState === 'complete' && this.createGlobalClickEvent();
            };
        }
    }

    // register our events in events instance, register the events like in event instance
    private createGlobalClickEvent(): void {
        this.events.addListener(true, 'click', this.onClick);
        this.events.addListener(true, 'popstate', this.onBack);
    }

    // check the gived routes and if everything ok then redirect the page
    public redirect(url?: string, title?: string, props: object | null = null, noHistory: boolean = false): void {
        const { ROOT } = this.URL_DATA.BASE;
        const { URL } = this.getPath();

        if (!url || url === URL) return;
        this.addHistory(url, title, props, noHistory);
        this.dispatchRoute(url);
    }

    private addHistory(url: string, title?: string, props?: Record<string, any> | null, noHistory?: boolean) {
        const { ROOT } = this.URL_DATA.BASE;
        history.pushState(null, title || '', ROOT + url);
        history.replaceState(null, title || '', ROOT + url);
        if (!noHistory) this.history.push({ url, title, props: props });        
    }

    // check the gived routes and if everything ok then redirect the page
    public removeLastUrlChunk(): void {
        if (!this.history.length) return;
        const { title, url } = this.history[this.history.length - 1];
        const newUrl = (url[0] === '/' ? '' : '/') + url.split('/').slice(0, -1).join('/');
        this.addHistory(newUrl, title);
    }

    public replaceUrlChunk(newChunk: string, pos: number = -1, title?: string) {
        const newUrl = this.currentRoute.split('/');
        newUrl.splice(-1, 1, newChunk);
        if (!title && this.history.length) title = this.history[this.history.length - 1].title;
        this.addHistory(newUrl.join('/'), title);
    }

    private isValidUrl = (url: string): boolean => {
        if (!url.startsWith('http')) url = 'https://' + url;
        try {
            new URL(url);
            return true;
        } catch (err) {
            return false;  
        }
    }

    // popstate callback which fired when user click to back button in the browser
    private onBack(event: Event): void {
        const length = this.history.length;
        console.log('BACK', length, this.history)
        if (length < 2) return history.back();
        this.history.pop();
        const { url, title, props } = this.history[length-2] as IRouter.HistoryItem;
        this.redirect(url, title, props);
        event.preventDefault();
        // Uncomment below line to redirect to the previous page instead.
        // window.location = document.referrer // Note: IE11 is not supporting this.
        // history.pushprops(null, null, window.location.pathname);
    }

    // check if parent element got href (=potentional internal link) attribute or no (max 3 level)
    private getTarget(e: HTMLElement): string | void {
        const MAX_DEPTH = 3;
        let t = e, i = 0, href;
        for (; i < MAX_DEPTH; i++) {
            if (href = t.getAttribute("href")) {
                break;
            } else {
                t = t.parentElement as HTMLElement;
                if (!t) return console.warn('no href on clicked target also no parent');
            }
        }
        return href
    }

    // click handler for internal links
    private onClick (event: Event): void {
        const ev = event as MouseEvent;
        if (ev.button > 0) {
            return console.log('it was not left click, it was '+(this.MOUSE_BUTTON[ev.button] || 'unknow')+' button');
        }
        const t = event.target as HTMLElement;
        const href = this.getTarget(t);
        if (!href) return;
        // internal link handle redirect(url)
        if (href[0] === "/") {
            event.preventDefault();
            this.redirect(href);
        } else if (href === '*') {
            /*
            if (t.getAttribute('download')) {
                const url = t.getAttribute('download');
                if (this.isValidUrl(url)) fs.download(url);
            }
            */
        } else {
            console.log('normal link redirect to other page');
        }
    }

    // split the current url into query strings, hash, base url etc
    private getPath() {
        const { ROOT } = this.URL_DATA.BASE;
        const HASH = window.location.hash;
        const href = encodeURI(location.href);
        const full_url = href.substring(ROOT.length + 1, href.length - HASH.length);
        const QUERY: Record<string, string> = {};
        const [ URL, queries = false ] = full_url.split('?');

        if (queries && queries.length) {
            queries.split('&').forEach( q => {
                const [key, value] = q.split('=');
                QUERY[key] = value;
            });
        }
        return this.URL_DATA.DYNAMIC = {
            ...this.URL_DATA.DYNAMIC,
            HASH: HASH.replace('#', ''),
            QUERY,
            URL
        };
    }

    // go over on routes and check if the given url is fulfilled all condition
    private validateRoute(config: IRouter.Route, data: IRouter.Data): IRouter.Data | undefined {
        const urlArray = data.urlArray.slice(data.depth);
        const params: Record<string, string> = {};
        const [chunk, validations, VComponent, childConfig] = config;
        const chunkArray = chunk.split('/');

        if (chunkArray.length === 1 && !chunkArray[0] && !urlArray.length) {
            // default route
        } else if (chunkArray.length > urlArray.length) {
            return;
        } else {
            for (let [i, v] of chunkArray.entries()) {
                if (!v) return;
                if (v[0] === ':') {
                    v = v.substr(1);
                    if (validations) {
                        const validation = validations[Object.keys(params).length];
                        if (!validate(urlArray[i], validation)) return;
                    }
                    params[v] = urlArray[i];
                } else {
                    if (v !== urlArray[i]) return;
                }
            }
        }

        data.depth += chunkArray.length;
        Object.assign(data.params, {...params});
        data.components.push(VComponent);

        // if exist child and we still have remining chunk in current url then go deeper
        if (Array.isArray(childConfig) && data.depth < data.urlArray.length) {
            return this.validateRoute(childConfig, data);
        }

        data.matchedUrl = '/' + data.urlArray.join('/');
        return data;
    }

    private setCurrentRoute(result: IRouter.Data): void {
        this.currentRoute = result.matchedUrl;
    }

    // send the given url to validation and call loadPage or redirect depend if we found an matched route or no
    private dispatchRoute(url: string): void {
        this.URL_DATA.DYNAMIC.PARAMS = {};
        let result: IRouter.Data | false | undefined;

        const defaultData: IRouter.Data = {
            depth: 0,
            components: [],
            params: {},
            matchedUrl: '',
            urlArray: url.split('/').filter(e => e),
            matchedRoute: []
        }
        const routeMap = this.config.$routeList;
        for (const config of routeMap) {
            result = this.validateRoute(config, {...defaultData, matchedRoute: config});
            if (!!result) { break; }
        }

        const { success, error } = this.config;
        if (!!result) {
            this.URL_DATA.DYNAMIC.PARAMS = result.params;
            this.setCurrentRoute(result);
            if (success) { success(result); }
            this.config.vDom.loadPage(result.components, result.params);
        } else {
            console.log('Route missmatch!', url);
            if (error) { error(url); }
            this.redirect('/error/404', '', {}, true);
        }
    }
};

export const router = new Router();

// test purpose
// @ts-ignore
window.router = router;
