import { IModel, IValidationError, FormSymbolKey } from "@core/model/Base";
import { notify } from "@core/Notify";
import { build, renderSubTree } from "@core/VDom";
import { createStyles } from "@core/JSS";

/**
 * Style part
 */

const formStyles = createStyles({
    '&.form-input': {
        position: 'relative',
        display: 'block',
        '& input:not([type="submit"]), textarea, select': {
            padding: 4,
            width: '100%',
            borderRadius: 4
        },
        '& input + div,& select + div,& textarea + div': {
            color: 'inherit',
            fontSize: 12,
            marginTop: 4,
            padding: '2px 0',
            minHeight: '1.6em',
            opacity: 0,
            transition: 'opacity 0.5s ease',
        },
        '& input[error-message="true"],& select[error-message="true"],& textarea[error-message="true"]': {
            borderColor: 'red'
        },
        '& input[error-message="true"] + div,& select[error-message="true"] + div,& textarea[error-message="true"] + div': {
            color: 'red',
            opacity: 1
        },
    }
});

/**
 * Common onChange and  Error handlers for form inputs
 */

type IErrorHelper = (errors: IValidationError[]) => JSX.Element;

function defaultErrorHelper(errors: IValidationError[] = []): JSX.Element {
    return (
        <div className='helper-text'>
            {errors.map(x => <div>{x.message}</div>)}
        </div>
    );
}

function showHelperText<T>(model: IModel<T>): (name: keyof T) => void {
    return function(name: keyof T): void {
        const el = model[FormSymbolKey][name] as HTMLInputElement;
        const errors = model.getError(name);
        el.setAttribute('error-message', (errors.length > 0).toString());
        try {
            const helperDiv = el.nextSibling as HTMLElementEx;
            if (!helperDiv) return;
            renderSubTree(helperDiv, model[FormSymbolKey]['errorHelper'], errors);
        } catch (err) {
            // do nothing
        }
    }
}


function onChangeHelper<T>(el: HTMLInputElement, model: IModel<T>): void {
    if (!el || !el.name) return;
    const { name, value } = el as unknown as { name: keyof T, value: T[keyof T]};
    model.setProp(name, value)
    model.validator(name, value);
    if (model[FormSymbolKey]['showHelperText']) model[FormSymbolKey]['showHelperText'](name);
}

function onChangeHandler<T>(model: IModel<T>): (ev: KeyboardEvent) => void {
    return (ev: KeyboardEvent) => onChangeHelper(ev.target as HTMLInputElement, model)
}

/**
 * Form component - container
 */

interface IFormProps<T> {
    autocomplete?: 'on' | 'off';
    children?: JSX.Element | JSX.Element[];
    className?: string | any;
    errorHelper?: IErrorHelper;
    helperText?: boolean;
    model: IModel<T>;
    style?: Record<string, any>;
    onSubmit: (arg0: any) => any;
}

function onSubmitHandler<T>(onSubmit: IFormProps<T>['onSubmit'] , model: IModel<T>): () => false {
    return (e?: KeyboardEvent) => {
        model.runValidations();
        const errors = model.getError();
        errors.length 
            ? notify.send('error', errors.map(x => <div>{x.message}</div>)) 
            : onSubmit(model.getValues());
        return false;
    }
}

function Form<T>(props: IFormProps<T>): JSX.Element {
    const { 
        children,
        helperText,
        model, 
        onSubmit, 
        className,
        errorHelper, 
    } = props;
    if (!model) return (<div>Modeless form not allowed</div>);
    const errHelper = errorHelper || defaultErrorHelper;
    if (helperText && model[FormSymbolKey]) model[FormSymbolKey]['errorHelper'] = errHelper;
    if (helperText && model[FormSymbolKey]) model[FormSymbolKey]['showHelperText'] = showHelperText(model);
    return (
        <form 
            onsubmit={onSubmitHandler<T>(onSubmit, model)} 
            class={className || ''}
        >
            {children}
        </form>
    );
}

export default Form;

/**
 * Input component
 */

interface IInput<T> {
    // common props
    inputProp?: Record<string, any>;
    className?: string;
    type?: 'text' | 'number' | 'email' | 'password' | 'radio' | 'checkbox' | 'submit' | 'textarea' | 'select';
    name?: keyof T;
    model?: IModel<T>;
    placeholder?: string;
    // optional props
    value?: string;
    style?: string;
    // input props
    autocomplete?: 'on' | 'off';
    autofocus?: boolean;
    // select based props
    nonEmpty?: boolean;
    options?: [string, string][];
    // textarea based props
    cols?: string;
    rows?: string;
}

type ICommonInputProp = Omit<IInput<any>, 'model' | 'inputProp' | 'type' | 'options' | 'cols' | 'rows'>;
type IInputProps = ICommonInputProp;    
type ISelectProps =  ICommonInputProp & { options: [string, string][]};
type ITextareaProps =  ICommonInputProp & { cols: string, rows: string};

export function Input<T>(props: IInput<T>): JSX.Element {
    const {
        name,
        model,
        type = 'text',
        style,
        className,
        placeholder,
        inputProp = {},
    } = props;

    const value = props.value ? props.value : (model && name) ? model[name as string] : '';
    const oninput = (model && name) ? onChangeHandler(model) : undefined;
    const inputProps = {
        name,
        value,
        oninput,
        placeholder,
        type,
        ...inputProp
    } as IInputProps;
    let child: JSX.Element;
    let errHelper: IErrorHelper | null = null;

    if (type === 'textarea') {
        child = TextareaRender(Object.assign(inputProps, {cols: props.cols, rows: props.rows}) as ITextareaProps);
     } else if (type === 'select') {
        child = SelectRender(Object.assign(inputProps, {options: props.options || []}) as ISelectProps);
    } else {
        // normal input
        if (type === 'password') inputProps.autocomplete = 'off';
        child = InputRender(Object.assign(inputProps, { type }) as IInputProps);
    } 

    if (model && model[FormSymbolKey]) {
        child.attrs.ref = ($e: HTMLElement) => model[FormSymbolKey][name] = $e
        errHelper = model[FormSymbolKey]['errorHelper'];
    }

    return (
        <div className={'form-input ' + (className || '')} style={style}>
            {child}
            {model && errHelper && errHelper(model.getError(name as Partial<keyof T>))}
        </div>
    );
};

const InputRender = (props: IInputProps) => {
    return (<input {...props} />);
}

const SelectRender = ({ options, nonEmpty, value, ...props }: ISelectProps) => {
    const sValue = value || (nonEmpty && options.length ? options[0][0] : '');
    return (
        <select {...props}>
            {options.map(([value, text]) => (
                <option 
                    value={value} 
                    children={text} 
                    selected={value === sValue} 
                />
            ))}
        </select>    
    );
}

const TextareaRender = (props: ITextareaProps) => {
    return (
        <textarea {...props}>{props.value || ''}</textarea>          
    );
}
