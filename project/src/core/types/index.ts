export interface IGallery extends IEntity {
    description: string;
    name: string;
    slug: string;
    status: number;
    thumb: string;
    title: string;
    user_id: number;
}

export interface IImage extends IEntity {
    album_id: number;
    description: string;
    status: number;
    path: string;
    user_id: number;
}

export interface INews extends IEntity {
    user_id?: number;       // who created
    status?: number;
    title: string;
    message: string;
    name: string;           // author name
}

export interface IGuest extends IEntity {}

export interface IEntity {
    id: number;
    created: string;
    updated: string;
}

export interface IFPromise<T> extends Promise<T> {
    isPending?: boolean;
    isResolved?: boolean;
    isRejected?: boolean;
    result?: IRequest.ApiResponse<T>;
}

export type IFP<T> = IFPromise<IRequest.ApiResponse<T>>

export declare namespace IFileUploader {

    interface FileInputConfig {
        timerId: number;
        timeout: number;
        timeoutCb: () => void;
    }

    type SimpleReadAs = 'text' | 'data' | 'buffer' | 'binary' | 'json';
    type ReadAs = 'readAsText' | 'readAsDataURL' | 'readAsArrayBuffer' | 'readAsBinaryString';

    interface Progress {
        index: number;
        name: string;
        uploaded: number;
        size: number;
        error?: boolean;
    }
}

export declare namespace IFS {
    interface FileInputConfig {
        timerId: number;
        timeout: number;
        timeoutCb: () => void;
    }

    type SimpleReadAs = 'text' | 'data' | 'buffer' | 'binary' | 'json';
    type ReadAs = 'readAsText' | 'readAsDataURL' | 'readAsArrayBuffer' | 'readAsBinaryString';

    interface Chunk {
        current: number;
        size: number;
        part: string;
        total: number;
        type: string;
        name: string;
        temp: string;
        data: Blob;
    }
}

/*
----------------------------------------------
----------------- Global types----------------
----------------------------------------------
*/

export type ObjPart<T, K> = Partial<Record<keyof T, K>>;
export type ObjPartAny<T> = Partial<Record<keyof T, any>>;
export type StrKeyOf<T> = Extract<keyof T, string>;

export type ValueOf<T> = T[keyof T];

export type IGlobalEventConfig = [any, string];

export interface MouseClickEvent extends MouseEvent {
    target: HTMLElement;
}

/*
----------------------------------------------
------------------- Request ------------------
----------------------------------------------
*/

export declare namespace IRequest {

    interface Data<T> {
        data: T | any;
        error: any;
        message?: any;
    }

    type ApiResponse<T> = { data: T | any, error: any }

    type Response<T> = Promise<ApiResponse<T>>

    interface ConnectionError {
        code: number,
        message: string
    }

    type Callback = () => void;
    type ContentType = 'multipart/form-data' | 'application/x-www-form-urlencoded';
    type ResponseType = 'json' | 'text' | 'document' | 'blob' | 'arraybuffer';
    type EventCallback = (arg0: ProgressEvent) => void;

    interface Config {
        abort?: true | Callback;
        cache?: boolean;
        data?: Record<string, any>;
        file?: File;
        header?: Record<string, string>;
        method?: Method;
        progress?: EventCallback;
        contentType?: string;
        responseType?: ResponseType;
        timeoutLimit?: number;
    }

    type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

    interface InjectedServices {
        notify?: any;
    }
}

/*
----------------------------------------------
--------------------- CRUD -------------------
----------------------------------------------
*/

export declare namespace ICRUD {

    interface Config {
        endpoint: string;
        credentials?: Record<string, string>;
    }

    interface Core<T> {
        auth: any;
        notify: any;
        request: any;
        post: (arg0: T) => IRequest.Response<T>;
        get: (arg0?: any) =>  IRequest.Response<T>;
        put: (arg0: Partial<T>) => IRequest.Response<T>;
        delete: (arg0: string | any) => IRequest.Response<boolean>;
        getUrl: (arg0: string) => string;
    }

}

export declare namespace JSS {
    type StyleRule = { [key: string]: string | number };

    interface CssProperties {
        [key: string]: string | number | CssProperties;
    }

    type WithStyle = Record<string, CssProperties>;
}

/*
-------------------------------------------------
----------------- Event Handler -----------------
-------------------------------------------------
*/

export declare namespace IEvents {
    type EventCallback = (event: Event) => void;

    type EventCondition = (event: Event) => boolean;
    type Condition = Element | (EventCondition | boolean);

    type NodeListener = [Element, EventCallback];
    type ConditionalListener = [EventCondition | boolean, EventCallback];

    type Listener = NodeListener | ConditionalListener;
    type Listeners = Record<string, Listener[]>;

    interface Core {
        addListener: (condition: IEvents.Condition, type: string, cb: IEvents.EventCallback) => void;
        removeListener: (condition: HTMLElementEx | IEvents.EventCallback, type?: string) => void;
    }
}

/*
----------------------------------------------
-------------- Router and Routes -------------
----------------------------------------------
*/


export type IRoute = [string, string[] | null, any, IRouter.Route | null ];
//export type IRoute = [string, string[] | null, IComponent.BaseConstructor, IRouter.Route | null ];

export declare namespace IRouter {

    export interface UrlError {
        [key: string]: [number, string];
    }

    export interface Route extends IRoute { }

    export interface Data {
        depth: number;
        matchedRoute: IRouter.Route | any;
        matchedUrl: string;
        params: Record<string, string>;
        urlArray: string[];
        components: (() => JSX.Element)[];
    }

    type ILoadPAge = {
        loadPage: (arg0: Data['components'], arg1: Data['params']) => void;
    }

    export interface Config {
        $routeList: Route[];
        vDom: ILoadPAge;
        defaultRoute?: Route;
        error?: (url: string) => void;
        success?: (data: Data) => void;
    }

    interface IURL_DATA_BASE {
        DIR: string;
        HOSTNAME: string;
        ROOT: string;
        PROTOCOL: string;
    }

    interface IURL_DATA_DYNAMIC {
        HASH: null | string;
        PARAMS: Record<string, string>;
        QUERY: Record<string, string>;
        URL: null | string;
    }

    export interface IURL_DATA {
        BASE: IURL_DATA_BASE,
        DYNAMIC: IURL_DATA_DYNAMIC;
    }

    export interface HistoryItem {
        props?: object | null;
        url: string;
        title?: string;
    }

    export interface Core {
        history: HistoryItem[];
        redirect: (url?: string, title?: string, props?: object) => void;
    }
}
