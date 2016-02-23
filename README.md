# CIA
## Centralized Inner Authority

### A redux-like central dispatcher providing a single source of truth.
Ever notice how the [redux store API](http://redux.js.org/docs/api/Store.html) looks like an EventEmitter? Me too, and I also noticed it doesn't have very many features, which made me sad :(

I wrote CIA to provide more Event-Emitter features while preserving the basic state-manager concept.

## Setup:
`npm install cia` - _or_ - `bower install cia`

## Usage:
`cia({methods}, {state} || {}, [handlers] || [] )`  <br />
`cia({methods}, {state} || {}, fnPoolReturningFunction )`


## Alterations from redux:
* Accepts an object of methods instead of hard-coded `switch(action.type)` statements
* Action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD", 4)`
* Known reducer types can be called methodically: `.dispatch("ADD", 4)` simplifies to `.actions.ADD(4)`
* Returning state in a reducer is optional; defaults to existing state
* States need not be immutable: `.getState()` returns a copy and only reducers can mutate the state
* Subscribe actions to typed events w/ `.on(TYPE, fn)` and  `.dispatch("TYPE")` to fire action(s)
* `.subscribe(fn)` state-changed callbacks for rendering, backup, etc...
* Can add reducers and state-change callbacks at runtime


## Additional Features:

### System:
* Built-in event stream `.history` and thus, a simple `.undo()` implementation (naive)
* Clear the `.history` with `.reset()`
* Push certain events to another instance with `.push(events, instance)`
* Pull certain events from another instance with `.pull(events, instance)`
* Mark _subscription_ for certain events, or a conditional function `.subscribe(fn, strName(s)/fnBoolean)`
* `.watch(property, type)` dispatches the type when `state.property` changes. use sparingly, if at all.


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
* Redux-style actions work too: `.dispatch({type:"ADD", value:4})` instead of `.dispatch("ADD", 4)`
* `dispatch()`ing a RegExp as a type triggers any matching reducer type(s)
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Set flags to fire future reducers immediately upon adding  `.flag(strType, value)`
* Non-strings: dispatch `reducers.KEY`or `.types.KEY` instead of `"KEY"` for validity and IDE happiness
* Action Creators: types can be invoked as methods using `.actions.KEY(data)`, call/apply set `this`
* Over-ride un-bound conexts on `.dispatch()` with a third argument; the `this` value for the reducers


## Options
Options are set globally, and percolate to an instance upon instantiation. You can modify the options on the instance for more localized control. The publish options affect setup, and thus can only be applied globally before instantiation; you can set them true, create an instance, and set them false after that to instantiate unique-options instances.

Globally, these are set as `CIA._optionName`, and on the instance as `_optionName`

`._freeze= Object.freeze;`	used to freeze state, change to just "Object" for mutable state, or a deep freezer. <br />
`._blnPublishState`	if true, add a state property to instance to allow outside mutations (not usually recommended) <br />
`._blnPublishReducers`	if true, add a reducer property to the instance to allow customization <br />
`._blnStrictReducers`	if true, dispatch()ing missing reducer types will throw instead of fire a _MISSING_ internal <br />
`._blnErrorThrowing`	if true, throw on errors instead of dispatch()ing reducer errors as an _ERROR_ type internal <br />
`._blnForget`		if true, don't keep dispatched actions in .history. Prevents .after()'s firing on adding capability
`._blnDeferSubscriptions`	if true, debounce state-change callbacks. note: only last event of cluster will be passed
`._blnDeferPeriod= 15`		w/_blnDeferSubscriptions, ms to wait for activity to cease before firing a state-change



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






## Examples

### View a [TodoMVC demo](http://danml.com/cia/todo/).

### Simplistic Example:

```html
<html>
  <main id=main></main>
  <script src="http://danml.com/js/cia.js"></script>
<script>

var store = CIA({ // action reducers (state-adjusting pure functions)
	ADD: function(state){
	  return {count: state.count+1};
	},
	SET : function(state, e){
		return {count: e};
	},
	_INIT_: console.log.bind(console, "booting") // optional internal event
},{  // default application state:
	count: 0
});

// subscribe() to render on each change event:
store.subscribe(function render(state, blnForce) {
	main.innerHTML="<pre>"+JSON.stringify([state, store.history], null, "\t");
});	  

// make some state changes:
store.dispatch("ADD");  // state.count == 1
store.dispatch("ADD");  // state.count == 2
store.dispatch("SET", 12 );// state.count == 12
store.dispatch("ADD");  // state.count == 13
store.undo(1);  // state.count == 12

</script>
</html>
```
which  shows:
```js
[
	{
		"count": 12
	},
	[
		[
			"ADD",
			null
		],
		[
			"ADD",
			null
		],
		[
			"SET",
			12
		]
	]
]
```
