
import { build, useEffect, useState } from "@core/VDom";
import { createStyles } from "@core/JSS";
import services from "@service/index";
import TodoItem from "./TodoItem";
import Todo from "@model/Todo";

const css = createStyles({
    input: {
        width: 'calc(100% - 16px)',
        marginBottom: 16,
        padding: '4px 8px'
    }
});

interface IState {
    loading: boolean;
    todos: Todo[];
    title: string;
}

const TodoContainer = () => {

    const [state, setState] = useState<IState>({
        loading: true,
        todos: [],
        title: '',
    });

    const { title } = state;

    useEffect(() => {
        services.todoService.loadTodos().then(todos => {
            setState({ ...state, todos, loading: false });
            services.todoService.todos = todos;
        })
    }, []);

    const onEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && title.length) {
            services.todoService.addTodo(title);
            const todos = services.todoService.todos;
            (e.target as HTMLInputElement).value = '';
            setState({ ...state, todos, title: '' });
        }
    }

    const onDelete = async (id: string) => {
        const todos = await services.todoService.deleteTodo(id);
        setState({ ...state, todos });
    }

    return (
        <div>
            {state.loading && (
                <div className='linear-activity'>
                    <div className='indeterminate'></div>
                </div>
            )}
            <input 
                className={css.input}
                style={{ backgroundColor: `rgba(255,255,255,${title.length ? 1 : 0.2})` }}
                type='text' 
                value={title} 
                onInput={(e: MouseEvent) => setState({...state, title: (e.target as HTMLInputElement).value })}
                onKeyUp={onEnter}
            />
            {(state.todos).map(todo => <TodoItem {...todo} onDelete={onDelete} />)}
        </div>
    );
}

export default TodoContainer;
