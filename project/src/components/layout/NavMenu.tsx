import { build } from "@core/VDom";
import { createStyles } from "@core/JSS";

const menuList = [
    ['Home', '/home'],
    ['Todos', '/todo']
];

const css = createStyles({
    '&body': {
        padding: 0,
        margin: 0
    },
    navMenu: {
        backgroundColor: '#ddd',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        textAlign: 'center',
        display: 'block'
    },
    navItem: {
        padding: 16,
        color: '#000',
        backgroundColor: '#eee',
        transition: '0.7s',
        display: 'inline-block',
        '&:hover': {
            color: '#fff'
        }
    }
});

const NavMenu = (): JSX.Element => {
    return (
        <div className={css.navMenu}>
            { menuList.map(([label, path]) => (
                <a href={path} className={css.navItem} title={'go to: ' + path}> { label } </a>
            ))}
        </div>
    );
};

export default NavMenu;
