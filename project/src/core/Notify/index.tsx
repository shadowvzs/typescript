// import './Notify.css';
import { events } from "@core/Events";
import { build, renderElem } from "@core/VDom";
import { createStyles } from "@core/JSS";

const notificationStyles = createStyles({
    '& .notify-container': {
        position: 'fixed',
        top: 0,
        right: 0,
        margin: '0 4px',
        minWidth: 200,
        maxWidth: 400,
        height: 'auto',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 9999,
        width: 300,
        '& .notify': {
            position: 'relative',
            color: '#fff',
            border: '1px solid rgba(0, 0, 0, 0.3)',
            borderRadius: 4,
            padding: 15,
            paddingRight: 20,
            width: 'auto',
            maxWidth: 400,
            height: 'auto',
            opacity: 1,
            margin: '3px 0 3px 3px',
            transform: 'translateX(100%)',
            fontFamily: 'arial',
            fontSize: 14,
            transition: 'transform 0.72s',
            boxShadow: '0px 0 2px 2px rgba(0, 0, 0, 0.2)',
            '&.warning': {
                borderColor: 'rgba(255, 255, 0, 0.9)',
                backgroundColor: 'rgba(255, 255, 0, 0.5)'
            },
            '&.notice': {
                borderColor: 'rgba(0, 0, 200, 0.9)',
                backgroundColor: 'rgba(0, 0, 200, 0.5)'
            },       
            '&.success': {
                borderColor: 'rgba(100, 100, 255, 0.9)',
                backgroundColor: 'rgba(100, 100, 255, 0.5)'
            },        
            '&.error': {
                borderColor: 'rgba(255, 50, 50, 0.9)',
                backgroundColor: 'rgba(255, 50, 50, 0.5)'
            },       
            '&.normal': {
                borderColor: 'rgba(0, 0, 0, 0.9)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            },
            '&.slidein': { transform: 'translateX(0%)' },
            '&.fade-out': {
                opacity: 0,
                transition: 'opacity 500ms ease-in-out'  
            },
            '& .close-notify': {
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-block',
                margin: 'auto',
                right: 10,
                fontFamily: 'arial',
                fontSize: 30,
                color: 'red',
                opacity: 0.3,
                cursor: 'pointer',
                textShadow: '1px 0 1px #000, -1px 0 1px #000, 0 -1px 1px #000, 0 1px 1px #000',
                '&:hover': {
                    opacity: 0.7
                }
            }
        }
    }
});

type IAvaliableNotifyTypes = 'success' | 'error' | 'warning' | 'normal';

interface IMessage {
    closeClass: string;
    message: string | JSX.Element | JSX.Element[];
    onTransitionEnd: (event: KeyboardEvent) => void;
    type: string; 
}

const Message = ({ closeClass, message, onTransitionEnd, type }: IMessage) => {
    return (
        <div className={"notify " + type} ontransitionend={onTransitionEnd}>
            <span>{message}</span>
            <div className={closeClass} children="✗" />
        </div>
    );
};

class Notify {
    private container: HTMLDivElement;
    private events = events;
    private map = new WeakMap();
    private NOTIFY_DURATION = 2000;
    private LETTER_DURATION_RATIO = 100;
    private CLOSE_CLASS = 'close-notify';
    private TRANSITION_CLASS = 'slidein';

    constructor() {
        document.body.appendChild(renderElem(
            <div className='notify-container' ref={[this, 'container']} />
        ));
        this.events.addListener(true, 'click', this.onClick);
    }

    private onClick = (event: Event) => {
        const target = event.target as HTMLDivElement;
        if (target.className === this.CLOSE_CLASS) {
            (target.closest('.notify') as HTMLDivElement).classList.remove(this.TRANSITION_CLASS);
        }
    }

    public send(type: IAvaliableNotifyTypes, message: string | JSX.Element | JSX.Element[]) {
        const newMsg = renderElem(Message({ type, message, onTransitionEnd: this.onTransitionEnd, closeClass: this.CLOSE_CLASS}));
        const timer = setTimeout(
            () => this.map.get(newMsg) && newMsg.classList.remove(this.TRANSITION_CLASS),
            this.NOTIFY_DURATION + this.LETTER_DURATION_RATIO * (typeof message === 'string' ? message.length : 10)
        );
        this.map.set(newMsg, timer);
        this.container.appendChild(newMsg);
        setTimeout( () => newMsg.classList.add(this.TRANSITION_CLASS), 100);
    }

    private onTransitionEnd = (event: Event): void => {
        const target = event.target as HTMLDivElement;
        if (target.classList.contains(this.TRANSITION_CLASS)) return;
        target.removeEventListener("transitionend", this.onTransitionEnd);
        this.removeNotify(target as HTMLDivElement);
        this.map.delete(target);
    }

    private removeNotify(elem: HTMLDivElement) {
        clearTimeout(this.map.get(elem));
        elem.remove();
    }

    // if have special case when we would remove our service
    destructor() {
        this.events.removeListener(this.onClick, 'click');
        this.container.remove();
    }
}

export const notify = new Notify();
