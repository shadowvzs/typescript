interface DateModifier {
    year?: number;
    month?: number;
    day?: number;
}

interface DateInfo {
    year: number;
    month: number;
    day: number;
    hour: number;
    min: number;
    sec: number;
}

interface DateMap extends DateInfo {
    currentDay: number;
    firstDay: number;
    prevMonthLastDay: number;
    monthLastDay: number;
    lastDay: number;
}

export const betweenDate = (dates: (string | Date)[]): Date => {
    const [ date, min, max ] = dates.map(d => toDate(d));
    if (+date < +min) return min;
    if (+date > +max) return max;
    return date;
}

export const toDate = (input?: string | Date): Date => (input ? (typeof input === 'string' ? new Date(input) : input) : new Date()) as Date;

export const toMysqlDate = (input: string | Date): string => {
    const date = toDate(input);
    return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

export const cloneDate = (date: Date) => new Date(date.getTime());

export const deltaDate = (input: string | Date, modifier: DateModifier): Date => {
    const date = toDate(input);
    const { year, month, day } = modifier;
    if (day) date.setDate(date.getDate() + day);
    if (month) date.setMonth(date.getMonth() + month);
    if (year) date.setFullYear(date.getFullYear() + year);
    return date;
}

export const setDate = (input: string | Date,  day?: number, month?: number, year?: number): Date => {
    const date = toDate(input);
    if (day) date.setDate(day);
    if (month) date.setMonth(month - 1);
    if (year) date.setFullYear(year);
    return date;
}

export const setTime = (input: string | Date,  hour?: number, min?: number, sec?: number): Date => {
    const date = toDate(input);
    if (hour) date.setHours(hour);
    if (min) date.setMinutes(min);
    if (sec) date.setSeconds(sec);
    return date;
}

export const getDate = (input?: string | Date): DateInfo => {
    const date = toDate(input);
    return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: date.getHours(),
        min: date.getMinutes(),
        sec: date.getSeconds()
    }
}

export const getMonthInfo = (input?: string | Date): DateMap => {
    const date = cloneDate(toDate(input));
    const dateInfo = getDate(date) as DateMap;
    dateInfo.currentDay = date.getDay();
    dateInfo.firstDay = setDate(date, 1).getDay();
    dateInfo.prevMonthLastDay = deltaDate(date, { day: -1 }).getDate();
    dateInfo.monthLastDay = deltaDate(setDate(date, 1, dateInfo.month + 1), { day: -1 }).getDate();
    dateInfo.lastDay = date.getDay();
    return dateInfo;
}

export const to2digit = (n: number, len = 2): string => {
    return n.toString().padStart(len, '0')
}

const getDateArray = (date: string): string[] => {
    return date.split(/[- :]/);
}
