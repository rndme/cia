# CIA
## Centralized Inner Authority - Nothing but the truth

## Main Objectives
It's not just another redux re-hash, though it could be...

### State only modifiable by actions
Only actions can directly modify or replace the state, all others get a _copy_ of it via `.getState()`. Having only a copy, even poorly written code can safely consume the state without fear of pollution or cross-talk. This applies even to non-immutable states, which can often be simpler to implement/integrate than immutable structures. CIA makes both options simple and reliable. 

### State changes from dynamic action collections
All state changes happen from one place (the store), from one (or more) discrete named methods, forming single-concern self-contained interchangable parts. Action methods are known at author-time, assisting IDE features and code-completion. Defining an action type automatically creates a corresponding method. Actions can be `.dispatch()`ed or called methodically (`.actions.SAVE()`).


### undo() capability w/o state snapshots
One can replay a chess game by writing down the position of each piece at every turn, but piece-move _notations_ better for the wrist. Likewise, CIA makes one snapshot of the state at init, then accumulates any actions and params applied from there. Only action names and options are stored, not whole state, which scales well to very large models of state.


Re-starting at the beginning and re-applying every action to a given point can re-create any state achieved since init. Following the convention that actions cannot dispatch other actions, even slow async jobs that eventually dispatched actions will instantly re-apply their results, so "doing it all over" is not painful.



## Setup:
`npm install cia` - _or_ - `bower install cia`

## Usage:
`cia({methods}, {state} || {}, [handlers] || [] )`  <br />
`cia({methods}, {state} || {}, fnPoolReturningFunction )`


## Alterations from redux:
* States need not be immutable: `.getState()` returns a copy and only reducers can mutate the state
* Accepts an object of methods instead of hard-coded `switch(action.type)` statements
* Action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD", 4)`
* Known reducer types can be called methodically: `.dispatch("ADD", 4)` simplifies to `.actions.ADD(4)`
* Returning state in a reducer is optional; defaults to existing state if returning `undefined`
* Subscribe actions to typed events w/ `.on(TYPE, fn)` and  `.dispatch("TYPE")` to fire action(s)
* `.subscribe(fn)` state-changed callbacks for rendering, backup, etc...
* Can add/remove individual reducers and state-change callbacks at runtime


## Additional Features:

### System:
* Built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* Clear the `.history` with `.reset()`
* Push certain events to another instance with `.push(events, instance)`
* Pull certain events from another instance with `.pull(events, instance)`
* Mark _subscription_ for certain events, or a conditional function `.subscribe(fn, strName(s)/fnBoolean)`
* `.watch(property, type)` dispatches the type when `state.property` changes. use sparingly, if at all.
* Configure specific options at creation time with a thrid argument to CIA, `objOptions` of options


### Binding Reducers:
* Wildcards: `*` as reducer prop fires on all types, `.off('TYPE', '*')` removes all TYPE reducers
* Pass a single object of methods `to on()` and `off()` to manage reducers in bulk
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnRefresh)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnDraw])`
* Reducer definition object can have an array of many reducers under one type property name.
* Reduce on given event type(s) only the next time they happen with `.once(event, reducer)`
* Reduce on a dependent event only _after_ another type w/ `.after(needyEvent, strWaitEvent, reducer)`
* Reduce on an event only before another type has fired w/ `.before(event, strWaitEvent, reducer)`
* `before()` and `after()` also take function conditionals for _waiting_ instead of a string type name
* Context-free reducer invocation means you can bind `this` in your reducers without drawbacks.
* `.now()` is just like `.on()` except that it dispatches immediately after subscribing  
 

### Dispatching Actions:
* dispatch a string name; no `{type: ""}` object needed because the 2nd argument is passed in whole.
* Redux-style action objects work too: `.dispatch({type:"ADD", value:4})` instead of `.dispatch("ADD", 4)`
* `dispatch()`ing a RegExp as a type triggers any matching reducer type(s)
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Set flags to fire future reducers immediately upon adding  `.flag(strType, value)`
* Non-strings: dispatch `reducers.KEY`or `.types.KEY` instead of `"KEY"` for validity and IDE happiness
* Action Creators: types can be invoked as methods using `.actions.KEY(data)`, call/apply set `this`
* Over-ride un-bound conexts on `.dispatch()` with a third argument; the `this` value for the reducers


## Options
Options are set globally, and percolate to an instance upon instantiation. You can modify the options on the instance for more localized control. The publish options affect setup, and thus can only be applied globally before instantiation; you can set them true, create an instance, and set them false after that to instantiate unique-options instances.

Globally, these are set as `CIA._optionName`, on the instance as `_optionName`, or as a 3rd argument to `CIA()`

`._freeze= Object.freeze;`	used to freeze state, change to just "Object" for mutable state, or a deep freezer. <br />
`._blnPureMutations`	if true, ignore the return from reducers to allow simple one-line arrow functions to mod state. 
	Presumably with this option you are using a mutable state, otherwise you won't be able to update. <br />
`._blnPublishState`	if true, add a _state_ property to instance to allow outside mutations (not usually recommended). This can allow non-action access to state for extension, debugging, or integration. <br />
`._blnPublishReducers`	if true, add a _reducers_ property to the instance to allow customization. The reducers will be on an object of arrays, keyed by event type. Any changes made are live. <br />
`._blnStrictReducers`	if true, dispatch()ing missing reducer types will throw instead of firing a _MISSING_ internal <br />
`._blnErrorThrowing`	if true, throw on errors instead of dispatch()ing reducer errors as an _ERROR_ type internal <br />
`._blnForget`		if true, don't keep dispatched actions in .history. Prevents .after()'s firing on adding capability, but can reduce ram usage for long-running applications. use `.forget()` at any time to achieve the same once. <br />
`._blnDeferSubscriptions`	if true, debounce state-change callbacks. note: only last state-change event of a cluster will be passed, which is typically ok since callbacks should not care about what just happens except to optimize. <br />
`._blnDeferPeriod= 15`		w/\_blnDeferSubscriptions, ms to wait for activity to cease before firing a state-change. Reduces "hammering" when dispatching an action upon every _keypress_ or _scroll_ event.



## Methods

`.after(strType, trigger, fnReducer)` - like on(), but removes itself once the trigger has occurred <br>
`.before(strType, trigger, fnReducer)` - like on(), but won't execute unless the trigger has occurred <br>
`.dispatch(strType, data, context)` - allows reducer return values to be fed to handlers via this: <br>
`.flag(strType, value)` - fires knowns and news when subscribed, good for ready() <br>
`.getState()` - returns a representation of the internal state <br>
`.now(strType, fnReducer, context)` - like on, but dispatches the event upon adding <br>
`.off(strType, fnReducer)` - remove a reducer by type and function, or "*" for all <br>
`.on(strType, fnReducer)` - adds reducer(s) for type(s) <br>
`.once(strType, fnReducer)` - like on(), but removes after the first time it fires. <br>
`.pull(strEvent, objCIA)` - dispatch an event FROM another instance when it happens remotely <br>
`.push(strEvent, objCIA)` - dispatch an event ON another instance when it happens locally <br>
`.reset()` - empties the state change history, restores the state to initial, and dispatches _INIT_ <br>
`.subscribe(fnHandler, matcher)` - add handlers that execute after state changes <br>
`.undo(n)` - restore initial state and re-fire events 0 - (last - n) <br>
`.unflag(strType)` - un-set an auto-dispatch event <br>
`.unsubscribe(fnHandler)` - removes handlers that execute after state changes <br>
`.watch(property, type)` - given a property , dispatch a given event when the property value changes <br>
`.when(property, value, type, data)` - given a property and value/array of values, dispatch a given event with given data


## Internal Events
These events fire without explicit `dispatch()` calls to reflect the lifecyle and usage of the store.

| Action | arguments[0] | Description |
|----|----|----|
|\_INIT\_ |`[]` 	| the store is ready to use ; fired once at boot	|
|\_SUBSCRIBE\_ |`[fnHandler, matcher]` |	a handler has subscribed to the state-changed pool |
|\_UNSUBSCRIBE\_ | `[fnHandler]`	| a handler has un-subscribed to the state-changed pool |
|\_ON\_ | `[strType, fnReducer]`	| a reducer has subscribed to a specific type of event |
|\_OFF\_ | `[strType, fnReducer]`	| a reducer has subscribed to a specific type of event |
|\_MISSING\_ | `[strType, data]` | a type without a known reducer was `dispatch()`ed |
|\_ERROR\_ | `[objError, strType, data]` | an exception was encountered in a reducer |



## State Mutability
While an immutable state address many concerns of complex data flow, implementing it (at least currently) raises its own concerns about performance, tooling, and readability/familiarity. When CIA's state is fetched by non-reducers,a shallow-frozen copy via `Object.assign({},state)`  and  `Object.freeze()`. Since only reducers can modify state, all modifications happen in a centralized spot instead of sprinkled throughout an application, which curtails the need for strictly locking down the state object to prevent consumer modification. Data consumers can still modify their copy of the state, but it won't change the actual state, which makes CIA authoritative.

Note that you can easily modify this behavior by setting CIA._freeze to function that will deep-freeze or coerce the returned state into an immutableJS data structure. The `Object.freeze` default is mainly to assist development by throwing in strict mode when attempting to alter the state outside of reducers. You can also simply follow immutable conventions like returning a new state after each change via a new literal + spread operators. Just because CIA doesn't demand immutability doesn't mean the developer cannot.



## Examples

### View a [TodoMVC demo](http://danml.com/cia/todo/).

### Simplistic Example (inspired by [the redux demo](https://github.com/reactjs/redux/blob/master/examples/counter-vanilla/index.html) ):

```html
<html>
  <head>
    <title>CIA basic example</title>
    <script src="http://danml.com/bundle/rndme.cia_.js"></script>
  </head>
  <body>
    <div>
      <p>
        Clicked: <span id="value">0</span> times
        <button id="btnInc">+</button>
        <button id="btnDec">-</button>
        <button id="btnOdd">Increment if odd</button>
        <button id="btnAsync">Increment async</button>
		<button id="btnUndo">Undo</button>
      </p>
    </div>
<script>
  var store=CIA({ // state-changing actions and the default state:
  	INCREMENT: state=>state+1,
	DECREMENT: state=>state-1,
  }, 0 );

  // bind state changes to update view
  store.subscribe(()=> value.innerHTML= store.getState());

  // bind ui controls:
  btnInc.onclick= store.actions.INCREMENT;	  	
  btnDec.onclick= store.actions.DECREMENT;	  
  btnOdd.onclick= e=>(store.getState() % 2) && store.actions.INCREMENT();    
  btnAsync.onclick= setTimeout.bind(this, store.actions.INCREMENT, 1000);
  btnUndo.onclick= store.undo;
</script>
  </body>
</html>
```





## Real-World Example


[From a real-world SO question](http://stackoverflow.com/questions/35592078/cleaner-shorter-way-to-mutate-state-in-redux)
#### redux code
```
const initialState = {
    notificationBar: {
        open: false,
    },
};

export default function (state = initialState, action) {
  switch (action.type) {
    case actions.LAYOUT_NOTIFICATIONBAR_OPEN:
      	return {
    		...state,
    		notificationBar: {
        		...state.notificationBar,
        		open: true,
    		},
		};
    default:
      return state;
  }
}
```

#### becomes CIA code
```
export default CIA({
	LAYOUT_NOTIFICATIONBAR_OPEN: 
		state=> state.notificationBar.open = true
  },{
	notificationBar: {
		open: false,
	}
});
```
Allowing mutating state _greatly_ simplified the reducers. <br />
Since every piece of code that READS the state via `.getState()` gets a clone, consumers cannot damage/set/alter the state in CIA, which greatly reduces the benefits of a fully-immutable data flow, and saves the complications that result from immutable nesting.

The CIA version allows `.actions.LAYOUT_NOTIFICATIONBAR_OPEN()` to dispatch instead of calling `.dispatch()` passing a mis-spellable string.


