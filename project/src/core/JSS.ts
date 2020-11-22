
import { JSS } from "./types";
import { objFor, objMerge } from "@util/performance";
import { c2dashed } from '@util/core';

interface IClasses {
    [key: string]: string | IClasses;
}

// cache the built styles and the head element
const styleCache: IClasses = {};
let _head: HTMLHeadElement;

// get a single css style row from name and property
const getJssRow = (name: string, value: number | string) => {
    if (typeof value === 'number' && ['opacity', 'zIndex', 'flex'].indexOf(name) < 0) {
        value =  value + 'px';
    }
    return `${c2dashed(name)}: ${value};`;
}

    // convert JSS to string
const convertJSS = (jss: JSS.CssProperties, classes: IClasses = {}, prefix: string = ''): [IClasses, string] => {
    let curKey = '';
    let classKey: string;
    const curStyles: string[] = [];
    const subStyles: string[] = [];
    let curStyle: string;
    let wrapperClass: string;
    objFor(jss, (key, props) => {
        if (key[0] === '&') {
            // normal selectors
            classKey = key.replace(/\&/g, prefix);
        } else if (key[0] === '@') {
            // media query
            classKey = key;
            wrapperClass = key + ` {\r\n`;
            subStyles.length = 0;
            objFor(props, (name, value) => {
                if (typeof value === 'undefined') {
                    return;
                } else if (typeof value === 'object') {
                    if (!classes[name]) classes[name] = {};
                    const [sClasses, sStyles] = convertJSS({ [name]: value }, {}, '');
                    subStyles.push(sStyles);
                    classes[name] = sClasses;
                } else {
                    wrapperClass += '\t' + getJssRow(name, value as string | number) + '\r\n';
                }
            });
            wrapperClass += subStyles.join('') + `}\r\n`;
            curStyles.push(wrapperClass);
            return [classes[classKey], curStyle];
        } else {
            // dynamic named classNames
            curKey = `p_${Math.random().toString(36).substring(2)}`;
            classKey = `${(prefix ? prefix + ' ' : '')}.${curKey}`;
            classes[key] = curKey;
        }

        curStyle = `${classKey} { \r\n`;
        objFor(props, (name, value) => {
            if (typeof value === 'undefined') {
                return;
            } else if (typeof value === 'object') {
                if (!classes[name]) classes[name] = {};
                const [sClasses, sStyles] = convertJSS({ [name]: value }, classes[name] as IClasses, classKey);
                curStyles.push(sStyles);
                classes[name] = sClasses;
            } else {
                curStyle += '\t' + getJssRow(name, value as string | number) + '\r\n';
            }
        });
        curStyles.push(curStyle + `}\r\n\r\n`);
    });
    
    return [classes, curStyles.join('')];  
}

export const toStyle = (jss: JSS.StyleRule) => {
    const result: string[] = [];
    objFor(jss, (name, value) => typeof value !== 'undefined' && result.push(getJssRow(name, value)));
    return result.join('');
}

const getHead = () => {
    if (_head) return _head;
    return _head = document.head || document.getElementsByTagName('head')[0];
}

// create styles
export function createStyles(jss: JSS.WithStyle, name?: string): IClasses {
    const keys = Object.keys(jss);
    if (!keys.length) return {};
    const id = btoa(JSON.stringify(keys));
    if (styleCache[id]) return styleCache[id] as IClasses;
    const $head = getHead();
    const [classes, style] = convertJSS(jss);
    styleCache[id] = classes;
    const $style = document.createElement('style');
    $style.type = 'text/css';
    $style.setAttribute('data-id', `custom component ${name || ''}`);
    $style.appendChild(document.createTextNode(style));
    // load styles after page is loaded else our style should be ignored
    $head.appendChild($style);
    return classes as IClasses;
}
