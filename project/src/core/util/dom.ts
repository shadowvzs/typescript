import { betweenNr } from './core';

interface IModifier {
    top?: number | string;
    left?: number | string;
}

export const anchorElem = (anchor: HTMLElement, target: HTMLElement, modifier?: IModifier) => {
    const body: Element = document.body;
    const bodyRect = body.getBoundingClientRect();
    const docH = body.clientHeight || document.documentElement.clientHeight;
    const docW = body.clientWidth || document.documentElement.clientWidth;
    const elH = target.offsetHeight || (target.children[0] as HTMLElement).offsetHeight;
    const elW = target.offsetWidth || (target.children[0] as HTMLElement).offsetWidth;
    const elemRect = anchor.getBoundingClientRect();

    let modX = 0, modY = 0;
    if (modifier) {
        const { top, left } = modifier;
        if (left) modX = typeof left === 'number' ? left : elW / 100 * parseInt(left);
        if (top) modY = typeof top === 'number' ? top : elH / 100 * parseInt(top);
    }

    const offsetX  = betweenNr(elemRect.left - bodyRect.left + modX, [0, docW - elW - 10]);
    const offsetY  = betweenNr(elemRect.top - bodyRect.top + modY, [0, docH - elH - 10]);
    target.style.left = offsetX + 'px';
    target.style.top = offsetY + 'px';
}
