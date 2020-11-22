import NavMenu from "@layout/NavMenu";
import { build } from "@core/VDom";
import { createStyles } from "@core/JSS";
import TodoContainer from "./sub/TodoContainer";

const css = createStyles({
    box: {
        margin: '16px auto',
        width: 300,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        border: '1px dotted rgba(0,0,0,0.5)',
        borderRadius: 16
    }
});

const TodoPage = (): JSX.Element => {
    document.title = `Todo Page`;
    return (
        <div>
            <NavMenu />
            <div className={css.box}>
                <TodoContainer />
            </div>
        </div>
    );
}

export default TodoPage;
