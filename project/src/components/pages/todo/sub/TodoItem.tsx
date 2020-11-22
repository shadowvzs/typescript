import { createStyles } from "@core/JSS";
import { build } from "@core/VDom";
import Todo from "@model/Todo";

const css = createStyles({
    item: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        transition: '0.3s',
        '& span:last-child': {
            cursor: 'pointer'
        },
        '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.1)'
        }
    }
});

type FullProps = Todo & { onDelete: (id: string) => void; };

const TodoItem = ({ id, title, created, onDelete }: FullProps) => {

    return (
        <div className={css.item}>
            <span children={title} />
            <span children={'[DEL]'} onClick={() => onDelete(id)} /> 
        </div>
    );
}

export default TodoItem;
