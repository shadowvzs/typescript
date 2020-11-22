import { delay } from "@util/core";
import { MeasureAsync, Readonly, autobind } from "@decorators/index";
import Todo from "@model/Todo";

const someTodo = [
    {
        id: 'longguuuiiiiddd1',
        title: 'Buy flour',
        created: new Date(),
    },
    {
        id: 'longgeerrrgguuuiiiiddd1',
        title: 'Eat cake',
        created: new Date(),
    },

]

class TodoService {

    @Readonly({
        a: 1,
        b: 2
    })
    public test: { a: number; b: number; };

    public todos: Todo[] = [];

    @MeasureAsync
    @autobind
    public async loadTodos(): Promise<Todo[]> {
        const rndDelay = Math.random() * 3;
        await delay(rndDelay);
        const todos: Todo[] = JSON.parse(localStorage.getItem('todo') || '[]');
        if (todos.length === 0) {
            todos.push(...someTodo.map(x => Object.assign(new Todo(), x)));
        }
        this.todos = todos;
        return todos;
    }

    @MeasureAsync
    @autobind
    public async saveTodos(todos?: Todo[]): Promise<void> {
        if (!todos) { todos = this.todos; }
        localStorage.setItem('todo', JSON.stringify(todos));
    }

    @MeasureAsync
    @autobind
    public addTodo(title: string) {
        const newTodo: Todo = {
            id: Math.random().toString(),
            title: title,
            created: new Date()
        }
        this.todos.push(newTodo);
        this.saveTodos();
        return newTodo;
    }

    @MeasureAsync
    @autobind
    public deleteTodo(id: string) {
        this.todos = this.todos.filter(x => x.id !== id);
        this.saveTodos(this.todos);
        return this.todos;
    }
}

export default TodoService;

window['TodoService'] = TodoService;