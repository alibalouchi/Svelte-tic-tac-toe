
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.ctx, $$.dirty);
            $$.dirty = [-1];
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\components\Square.svelte generated by Svelte v3.16.0 */
    const file = "src\\components\\Square.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let t;
    	let div_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t = text(/*value*/ ctx[0]);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*className*/ ctx[1] ? "winner" : "") + " svelte-wprve0"));
    			add_location(div, file, 16, 4, 312);
    			add_location(main, file, 15, 0, 300);
    			dispose = listen_dev(div, "click", /*handleSquareClick*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);

    			if (dirty & /*className*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*className*/ ctx[1] ? "winner" : "") + " svelte-wprve0"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { id } = $$props;
    	let { className } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleSquareClick = () => {
    		dispatch("clicked", { id });
    	};

    	const writable_props = ["value", "id", "className"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Square> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("className" in $$props) $$invalidate(1, className = $$props.className);
    	};

    	$$self.$capture_state = () => {
    		return { value, id, className };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    		if ("className" in $$props) $$invalidate(1, className = $$props.className);
    	};

    	return [value, className, handleSquareClick, id];
    }

    class Square extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { value: 0, id: 3, className: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Square",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Square> was created without expected prop 'value'");
    		}

    		if (/*id*/ ctx[3] === undefined && !("id" in props)) {
    			console.warn("<Square> was created without expected prop 'id'");
    		}

    		if (/*className*/ ctx[1] === undefined && !("className" in props)) {
    			console.warn("<Square> was created without expected prop 'className'");
    		}
    	}

    	get value() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let dimension = 3;

    function indexFinder(board) {
        let xIndex = [];
        let oIndex = [];
        board.map(
          (item, index) => {
            item === "X" ? xIndex.push([Math.floor(index / dimension), (index % dimension)])
              : (item === "O" ? oIndex.push([Math.floor(index / dimension), index % dimension])
                : void (0));
          });
        return [xIndex, oIndex];
      }

    function checkX(board){
        let xIndex = indexFinder(board)[0];
        let xRow = Array(dimension).fill(0);
        let xColumn = Array(dimension).fill(0);
        let xMainDia = xIndex.filter((item) => item[0] == item[1]).length;
        let xSubDia = 0;
        let currentDimension = dimension;
        xIndex.forEach(item => { xRow[item[0]]++; xColumn[item[1]]++; });

        for (let iter = 0; iter <= dimension; iter++) {
          xIndex.forEach(item => {
            item[0] == iter && item[1] == (currentDimension - 1) && (xSubDia++);
          });
          currentDimension--;
        }
        return [xColumn, xRow, xMainDia, xSubDia];
      }

    function checkO(board){
        let oIndex = indexFinder(board)[1];
        let oRow = Array(dimension).fill(0);
        let oColumn = Array(dimension).fill(0);
        let oMainDia = oIndex.filter((item) => item[0] == item[1]).length;
        let currentDimension = dimension;
        let oSubDia = 0;
        oIndex.forEach((item) => { oRow[item[0]]++; oColumn[item[1]]++; });

        for (let iter = 0; iter <= dimension; iter++) {
          oIndex.map((item) => item[0] == iter && item[1] == (currentDimension - 1)
            ? oSubDia++ : void(0));
          currentDimension--;
        }
        return [oColumn, oRow, oMainDia, oSubDia];
      }

    function makeDias(board){
        let xSubDia = checkX(board)[3];
        let xMainDia = checkX(board)[2];
        let oSubDia = checkO(board)[3];
        let oMainDia = checkO(board)[2];

        return [xMainDia, oMainDia, xSubDia, oSubDia];
      }

    function checkWinner(board) {
        let xIndex = indexFinder(board)[0];
        let oIndex = indexFinder(board)[1];
        let xRow = checkX(board)[1];
        let oRow = checkO(board)[1];
        let oColumn = checkO(board)[0];
        let xColumn = checkX(board)[0];

        let winner = 0;
        let indexes = [];

        oRow.filter((item, index) => {if(item == 3) winner = ["O" , "row", index];});
        oColumn.filter((item, index) => {if(item == 3) winner = ["O", "column", index];});
        xRow.filter((item, index) => {if(item == 3) winner = ["X", "row", index];});
        xColumn.filter((item, index) => {if(item == 3) winner = ["X", "column", index];});
        
        let Dias = makeDias(board);
        if (Dias[0] == 3) winner = ["X", "Main"];
        if (Dias[1] == 3) winner = ["O", "Main"];
        if (Dias[2] == 3) winner = ["X", "Sub"];
        if (Dias[3] == 3) winner = ["O", "Sub"];

        if (xIndex.length + oIndex.length == 9) winner = ["Draw"];

        if (winner.length == 3){
          winner[1] == "row" ? indexes.push([winner[2] * dimension, (winner[2] * dimension) + 1, (winner[2] * dimension) + 2]) 
            : indexes.push([winner[2], winner[2] + dimension, winner[2] + (2 * dimension)]);
            return indexes[0]
        }else if (winner.length == 2){
          winner[1] == "Main" ? indexes.push([0, dimension + 1, 2 * (dimension + 1)]) 
            : indexes.push([dimension - 1, (dimension - 1) * 2, (dimension - 1) * 3]);
            return indexes[0]
        }else if (winner[0] == "Draw"){
          indexes.push(board.map((item, index) => index));
          return indexes[0]
        }
        return indexes
      }

    /* src\components\Board.svelte generated by Svelte v3.16.0 */
    const file$1 = "src\\components\\Board.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let t5;
    	let div2;
    	let t6;
    	let t7;
    	let t8;
    	let button;
    	let current;
    	let dispose;

    	const square0 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][0],
    				id: "0",
    				value: /*board*/ ctx[0][0] ? /*board*/ ctx[0][0] : ""
    			},
    			$$inline: true
    		});

    	square0.$on("clicked", /*handleClick*/ ctx[2]);

    	const square1 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][1],
    				id: "1",
    				value: /*board*/ ctx[0][1] ? /*board*/ ctx[0][1] : ""
    			},
    			$$inline: true
    		});

    	square1.$on("clicked", /*handleClick*/ ctx[2]);

    	const square2 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][2],
    				id: "2",
    				value: /*board*/ ctx[0][2] ? /*board*/ ctx[0][2] : ""
    			},
    			$$inline: true
    		});

    	square2.$on("clicked", /*handleClick*/ ctx[2]);

    	const square3 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][3],
    				id: "3",
    				value: /*board*/ ctx[0][3] ? /*board*/ ctx[0][3] : ""
    			},
    			$$inline: true
    		});

    	square3.$on("clicked", /*handleClick*/ ctx[2]);

    	const square4 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][4],
    				id: "4",
    				value: /*board*/ ctx[0][4] ? /*board*/ ctx[0][4] : ""
    			},
    			$$inline: true
    		});

    	square4.$on("clicked", /*handleClick*/ ctx[2]);

    	const square5 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][5],
    				id: "5",
    				value: /*board*/ ctx[0][5] ? /*board*/ ctx[0][5] : ""
    			},
    			$$inline: true
    		});

    	square5.$on("clicked", /*handleClick*/ ctx[2]);

    	const square6 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][6],
    				id: "6",
    				value: /*board*/ ctx[0][6] ? /*board*/ ctx[0][6] : ""
    			},
    			$$inline: true
    		});

    	square6.$on("clicked", /*handleClick*/ ctx[2]);

    	const square7 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][7],
    				id: "7",
    				value: /*board*/ ctx[0][7] ? /*board*/ ctx[0][7] : ""
    			},
    			$$inline: true
    		});

    	square7.$on("clicked", /*handleClick*/ ctx[2]);

    	const square8 = new Square({
    			props: {
    				className: /*winColor*/ ctx[1][8],
    				id: "8",
    				value: /*board*/ ctx[0][8] ? /*board*/ ctx[0][8] : ""
    			},
    			$$inline: true
    		});

    	square8.$on("clicked", /*handleClick*/ ctx[2]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(square0.$$.fragment);
    			t0 = space();
    			create_component(square1.$$.fragment);
    			t1 = space();
    			create_component(square2.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(square3.$$.fragment);
    			t3 = space();
    			create_component(square4.$$.fragment);
    			t4 = space();
    			create_component(square5.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			create_component(square6.$$.fragment);
    			t6 = space();
    			create_component(square7.$$.fragment);
    			t7 = space();
    			create_component(square8.$$.fragment);
    			t8 = space();
    			button = element("button");
    			button.textContent = "Reset The Game";
    			attr_dev(div0, "class", "row svelte-1dkw49o");
    			add_location(div0, file$1, 25, 1, 673);
    			attr_dev(div1, "class", "row svelte-1dkw49o");
    			add_location(div1, file$1, 30, 1, 1011);
    			attr_dev(div2, "class", "row svelte-1dkw49o");
    			add_location(div2, file$1, 35, 1, 1349);
    			attr_dev(button, "class", "svelte-1dkw49o");
    			add_location(button, file$1, 40, 1, 1687);
    			attr_dev(div3, "class", "container svelte-1dkw49o");
    			add_location(div3, file$1, 24, 0, 647);
    			add_location(main, file$1, 23, 0, 639);
    			dispose = listen_dev(button, "click", /*handleReset*/ ctx[3], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			mount_component(square0, div0, null);
    			append_dev(div0, t0);
    			mount_component(square1, div0, null);
    			append_dev(div0, t1);
    			mount_component(square2, div0, null);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			mount_component(square3, div1, null);
    			append_dev(div1, t3);
    			mount_component(square4, div1, null);
    			append_dev(div1, t4);
    			mount_component(square5, div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			mount_component(square6, div2, null);
    			append_dev(div2, t6);
    			mount_component(square7, div2, null);
    			append_dev(div2, t7);
    			mount_component(square8, div2, null);
    			append_dev(div3, t8);
    			append_dev(div3, button);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const square0_changes = {};
    			if (dirty & /*winColor*/ 2) square0_changes.className = /*winColor*/ ctx[1][0];
    			if (dirty & /*board*/ 1) square0_changes.value = /*board*/ ctx[0][0] ? /*board*/ ctx[0][0] : "";
    			square0.$set(square0_changes);
    			const square1_changes = {};
    			if (dirty & /*winColor*/ 2) square1_changes.className = /*winColor*/ ctx[1][1];
    			if (dirty & /*board*/ 1) square1_changes.value = /*board*/ ctx[0][1] ? /*board*/ ctx[0][1] : "";
    			square1.$set(square1_changes);
    			const square2_changes = {};
    			if (dirty & /*winColor*/ 2) square2_changes.className = /*winColor*/ ctx[1][2];
    			if (dirty & /*board*/ 1) square2_changes.value = /*board*/ ctx[0][2] ? /*board*/ ctx[0][2] : "";
    			square2.$set(square2_changes);
    			const square3_changes = {};
    			if (dirty & /*winColor*/ 2) square3_changes.className = /*winColor*/ ctx[1][3];
    			if (dirty & /*board*/ 1) square3_changes.value = /*board*/ ctx[0][3] ? /*board*/ ctx[0][3] : "";
    			square3.$set(square3_changes);
    			const square4_changes = {};
    			if (dirty & /*winColor*/ 2) square4_changes.className = /*winColor*/ ctx[1][4];
    			if (dirty & /*board*/ 1) square4_changes.value = /*board*/ ctx[0][4] ? /*board*/ ctx[0][4] : "";
    			square4.$set(square4_changes);
    			const square5_changes = {};
    			if (dirty & /*winColor*/ 2) square5_changes.className = /*winColor*/ ctx[1][5];
    			if (dirty & /*board*/ 1) square5_changes.value = /*board*/ ctx[0][5] ? /*board*/ ctx[0][5] : "";
    			square5.$set(square5_changes);
    			const square6_changes = {};
    			if (dirty & /*winColor*/ 2) square6_changes.className = /*winColor*/ ctx[1][6];
    			if (dirty & /*board*/ 1) square6_changes.value = /*board*/ ctx[0][6] ? /*board*/ ctx[0][6] : "";
    			square6.$set(square6_changes);
    			const square7_changes = {};
    			if (dirty & /*winColor*/ 2) square7_changes.className = /*winColor*/ ctx[1][7];
    			if (dirty & /*board*/ 1) square7_changes.value = /*board*/ ctx[0][7] ? /*board*/ ctx[0][7] : "";
    			square7.$set(square7_changes);
    			const square8_changes = {};
    			if (dirty & /*winColor*/ 2) square8_changes.className = /*winColor*/ ctx[1][8];
    			if (dirty & /*board*/ 1) square8_changes.value = /*board*/ ctx[0][8] ? /*board*/ ctx[0][8] : "";
    			square8.$set(square8_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(square0.$$.fragment, local);
    			transition_in(square1.$$.fragment, local);
    			transition_in(square2.$$.fragment, local);
    			transition_in(square3.$$.fragment, local);
    			transition_in(square4.$$.fragment, local);
    			transition_in(square5.$$.fragment, local);
    			transition_in(square6.$$.fragment, local);
    			transition_in(square7.$$.fragment, local);
    			transition_in(square8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(square0.$$.fragment, local);
    			transition_out(square1.$$.fragment, local);
    			transition_out(square2.$$.fragment, local);
    			transition_out(square3.$$.fragment, local);
    			transition_out(square4.$$.fragment, local);
    			transition_out(square5.$$.fragment, local);
    			transition_out(square6.$$.fragment, local);
    			transition_out(square7.$$.fragment, local);
    			transition_out(square8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(square0);
    			destroy_component(square1);
    			destroy_component(square2);
    			destroy_component(square3);
    			destroy_component(square4);
    			destroy_component(square5);
    			destroy_component(square6);
    			destroy_component(square7);
    			destroy_component(square8);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let xTurn = false;
    	let board = Array(9).fill(null);
    	let indexes = checkWinner(board);
    	let winColor = Array(9).fill(false);

    	const handleClick = event => {
    		let id = event.detail.id;
    		if (board[id]) return;
    		if (winColor.find(item => item == true)) return;
    		$$invalidate(0, board[id] = xTurn ? "X" : "O", board);
    		xTurn = !xTurn;
    		indexes = checkWinner(board);
    		indexes.map(item => $$invalidate(1, winColor[item] = true, winColor));
    	};

    	const handleReset = () => {
    		$$invalidate(0, board = Array(9).fill(null));
    		$$invalidate(1, winColor = Array(9).fill(false));
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("xTurn" in $$props) xTurn = $$props.xTurn;
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("indexes" in $$props) indexes = $$props.indexes;
    		if ("winColor" in $$props) $$invalidate(1, winColor = $$props.winColor);
    	};

    	return [board, winColor, handleClick, handleReset];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.0 */
    const file$2 = "src\\App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let current;
    	const board = new Board({ props: { dimension: 3 }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(board.$$.fragment);
    			add_location(main, file$2, 4, 0, 67);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(board, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(board);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
