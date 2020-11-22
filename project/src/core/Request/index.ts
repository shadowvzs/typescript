import { fPromise } from '@util/core';
import { objMap } from '@util/performance';
import { 
    IRequest, 
    IFP
} from "@typo";

const baseConfig: IRequest.Config = {
    // data: null,
    // file: null,
    header: {},
    method: 'GET',
    timeoutLimit: 10000,
    contentType: 'application/x-www-form-urlencoded',
    responseType: 'json',
}

class Request<T> {
    private cache: Record<string, IFP<T>> = {}
    private reqCache: string = 'reqCache';
    private token: string = '';

    constructor() {
        this.loadLS();
    }

    private serialize(obj: Record<string, any>, prefix?: string): string {
        const str: string[] = [];
        let p: string;
        for(p in obj) {
            if (obj.hasOwnProperty(p)) {
              const k = prefix ? prefix + "[" + p + "]" : p
              const v = obj[p];
              str.push((v !== null && typeof v === "object") ?
                this.serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
        return str.join("&");
    };

    public setToken(token: string) {
        this.token = token;
    }

    public send<T>(url: string, config: IRequest.Config = {}): IRequest.Response<T> | IFP<T> {
        const {
            cache,
            data,
            file,
            header,
            method,
            contentType,
            responseType,
            timeoutLimit = 10000,
        } = { ...baseConfig, ...config } as IRequest.Config;

        if (method === 'GET' && data) {
            const query = this.serialize(data);
            if (query) url = url + (~url.indexOf("?") ? "&" : "?") + this.serialize(data);
        }

        const promise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method || 'GET', url, true);
            if (header && typeof header === 'object' ) Object.keys(header).forEach(k =>  xhr.setRequestHeader(k, header[k]));
            if (this.token) xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);

            if (timeoutLimit) {
                xhr.timeout = timeoutLimit;
                xhr.ontimeout = () => {
                    reject({
                        code: 504,
                        message: 'Gateway Timeout',
                    } as IRequest.ConnectionError);
                };
            }

            if (config.abort) { config.abort = xhr.abort; }
            if (config.progress) { xhr.onprogress = config.progress; }

            xhr.responseType = responseType || 'json';
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const auth = (xhr.getResponseHeader('Authorization') || '').split('Bearer ');
                        const resp = xhr.response
                        if (auth.length === 2) this.setToken(auth[1]);
                        if (!resp || resp.error) {
                            return reject(resp ? resp.error : 'Request failed: ' + url,);
                        }
                        if (cache) this.saveLS(url, resp);
                        resolve(resp);
                    } else {
                        reject({
                            code: xhr.status,
                            message: xhr.statusText,
                        } as IRequest.ConnectionError);
                    }
                }
            }

            if (contentType && !file) xhr.setRequestHeader('Content-Type', contentType);

            if (file) {
                const formData = new FormData();
                formData.append('file', file, file.name);
                for (const k in data) { formData.append(`param[${k}]`, data[k]); }
                xhr.setRequestHeader('Content-Type', 'multipart/form-data');
                xhr.send(formData);
            } else if (data instanceof Blob) {
                xhr.send(data);
            } else if (method === "GET" || !data) {
                xhr.send(null);
            } else {
                xhr.send(this.serialize(data));
            }
        });

        if (method === 'GET' && cache) {
            if (this.cache[url]) {
                return this.cache[url] as IFP<T>;
            } else {
                this.cache[url] = fPromise(promise as IFP<T>);
                return this.cache[url] as IFP<T>;
            }
        }
        return promise as IRequest.Response<T>;
    }

    protected async saveLS(key: string, data: any) {
        if (this.cache[key]) {
            Object.assign(this.cache[key], {
                result: data,
                isPending: false,
                isResolved: true
            })
        }
        const cache = objMap(this.cache, (x: any) => x.result);
        localStorage.setItem(this.reqCache, JSON.stringify(cache));
    }

    protected async loadLS() {
        const cache = JSON.parse(localStorage.getItem(this.reqCache) || "{}");
        let url: string;
        for (url in cache) {
            this.cache[url] = fPromise(Promise.resolve(cache[url]));
            console.info('Cached requests: ', url);
        }
    }
}

export const request = new Request();
