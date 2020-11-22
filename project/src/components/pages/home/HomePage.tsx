import NavMenu from "@layout/NavMenu";
import { createStyles } from "@core/JSS";
import classDecoratorTest from "../../decoratortests/class";
import metaDecoratorTest from "../../decoratortests/meta";
import { build, Fragment } from "@core/VDom";

classDecoratorTest();
metaDecoratorTest();

const css = createStyles({
    box: {
        maxWidth: 500,
        margin: 'auto',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginTop: 32,
    }
});

const HomePage = (): JSX.Element => {
    document.title = `Home Page`;
    return (
        <div>
            <NavMenu />
            <>
                <main className={css.box}>
                    <p>Welcome on PetraJS</p>
                    <span>
                        This is a for fun view render, it use JSX elements and virtual dom, 
                        you can find the config in <b>tsconfig.json</b>
                    </span>
                </main>
            </>
            {/* <UserTable initId={1} /> */}
        </div>
    );
}

export default HomePage;
