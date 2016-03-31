# CIA - Central Inner Authority 

- **C**entral: One place for all your state and sub-state
- **I**nner: Stuff that happens inside an app (state and user actions)
- **A**uthority: Provides final say on state values; a single source of truth

View [online docs](http://danml.com/cia/docs.html) to make this text prettier and smarter.

## About 

### Preface
Shared mutable state is the root of all evil, but take one of those away and it's cool. Why do coders use shared mutable state? It's easy to write. Problem is, it's hard to maintain and expand. If you want a centralized way to use shared immutable or private mutable state, keep reading. 

### Data Flow
|State Object <br>*( Model )*|&#8594;|User Offerings<br>*( View )*|
|:---------:|:---:|:---:|
|  &#8593; | |         &#8595;    |
|State Changers<br>*( Controller )*| &#8592; |User Actions<br>*( Events )*|


### Show Me Some Code
**Usage:** `var store = CIA( Actions, State );`

Using immutable state and discrete ES6 arrows:  [live demo](http://pagedemos.com/76vz3ksdm76u/)
```js
  var store=CIA({
  // Actions:
    INCREMENT: state=>({
		counter: state.counter + 1,
        clicks:  state.clicks  + 1,
	}),
    
	DECREMENT:  state=>({
		counter: state.counter - 1,
        clicks:  state.clicks  + 1,
	}),
    
  // State:
  }, { counter: 0, clicks: 0 });
  
  store.dispatch("INCREMENT"); // dispatch an increment action
  store.actions.INCREMENT(); // alias of above
  store.dispatch("DECREMENT");// dispatch a decrement action
  
  alert(JSON.stringify(store.getState())); // shows: {"counter":1,"clicks":3}
  store.undo(); // (works without state snapshots or special code)
  alert(JSON.stringify(store.getState())); // shows: {"counter":2,"clicks":2}
```

### Modus Operandi
> And ye shall know the truth, and the truth shall make you free of bugs.

#### State only modifiable by actions
Only actions can directly modify or replace the state, all others get a _copy_ of it via `.getState() Having only a copy, even poorly written code can safely consume the state without fear of pollution or cross-talk. This applies even to non-immutable states, which can often be simpler to implement/integrate than immutable structures. CIA makes both options simple and reliable. 

#### State changes from dynamic action collections
All state changes happen from one place (the store), from one (or more) discrete named methods, forming single-concern self-contained interchangeable parts. Action methods are known at author-time, assisting IDE features and code-completion. Defining an action type automatically creates a corresponding method. Actions can be `.dispatch()`ed or called methodically (`.actions.SAVE()`).


#### undo() capability w/o state snapshots
One can replay a chess game by writing down the position of each piece at every turn, but piece-move _notations_ better for the wrist. Likewise, CIA makes one snapshot of the state at init, then accumulates any actions and params applied from there. Only action names and options are stored, not whole state, which scales well to very large models of state.


Re-starting at the beginning and re-applying every action to a given point can re-create any state achieved since init. Following the convention that actions cannot dispatch other actions, even slow async jobs that eventually dispatched actions will instantly re-apply their results, so "doing it all over" is not painful.



### Usage:
`cia({methods}, {state} || {} )`  <br />
`cia({methods}, {state} || {}, objOptions )`



### Part List
Let's quickly get familiar with the terms we'll use in this documentation


<a id=pullup></a>

#### State
The model of your application's data and user-iterface particulars. CIA's state can be an object (immutable or dynamic), or an immutable primitive like a Number or String.

#### Actions
Happenings that affect state including actions taken by the user, internal errors occouring, background data arriving, etc. CIA demands these happenings be given a name and a function(s) to run when they occour. This seperates the source of the event from the effect of the event, un-tangling inter-connected piplines into a simple big pipe. 



#### Changers
Changers are the functions defined by actions. Upon invocation, they are passed two arguments: 
1. `state`  - the current internal state
2. `data`   - additional argument given to `.dispatch()` (if any)
 
The `this` value of changers is not specified, so it can be used to `.bind()` data or elements to an individual changer. The `this` vaule can also be set at dispatch-time for any un-bound changer using a 3rd argument to `.dispatch()`

Returning a value from the changer will replace the state with the return, great for immutable state. Without a return, the only way to affect change is to mutate the state object which was passed in as the first argument. Either are acceptable to CIA. If you want to use cleaner arrow functions on mutable state (they typically return the tail), you can set an option, `store._blnPureMutations = true`, to ignore the return of all changers on the instance, only allow mutation.



#### Events
Events are how users affect the state. Users raise an event, like a click, which in turn can (or not) `.dispatch()` a state change action, which in turn activates any awaiting changers, which in turn activates a state-change event, typically updating the screen to reflect the state change wrought by the click.

##### Typical Event Chain
1. User clicks `<button on-click=this.save id=btnSave >`
2. DOM Event `btnSave.click()` fires, running an event we defined which runs
3. `.dispatch("SAVE")` to call the SAVE changer
4. `SAVE` changer fires, clearing buffer and dirty flag
5. State-Change Callback is fired
6. render function finds difference in view markup
7. DOM updates by removing it's unsaved work warning and closing the item editor interface






## Setup

### Obtain Script

#### GitHub
[Project Page on GitHub](https://github.com/rndme/cia/)

#### NPM
`npm install cia`

#### Bower
`bower install cia`

#### Git
`# git https://github.com/rndme/cia.git`

#### Download
[source on GitHub](https://github.com/rndme/cia/raw/master/cia.js)
[zip on GitHub](https://github.com/rndme/cia/archive/master.zip)

#### Deep Link (HTTP-only)
`<script src="http://danml.com/bundle/cia_.js"></script>`



### Use Script

#### node.js (ES2015)
```js
let CIA = require("cia");
let store = CIA({
  INC: x=>x+1
}, 0);
```

#### browser (ES5)
```js
var store = CIA({
  INC: function(state){ return state + 1; }
}, 0);
```


## Config

* [Error Handling](#error-handling)
* [Mutable *-vs-* Immutable](#immutable-state-vs-normal-state)

<hr>


### Error Handling
CIA provides some internal events that you can bind in order to catch errors that arise whilst running your code.


You can catch these event with on(), for example: <br />
`store.on("_ERROR_", console.error.bind(console));`


During application development you might want more feedback from your code than you do when it runs in a production environment. There are a couple settings you can enable to fine-tune this behavior.

#### Missing changer invocations

##### Event
`_MISSING_` with a data argument of an array:  `[strType, data]`, is fired when an action type without a known changer was `dispatch()`ed.<br >

##### Option
`._blnStrictChangers` - Boolean. If true, dispatch()ing missing changer types will throw instead of firing a \_MISSING\_ internal event<br >

Without setting `._blnStrictChangers` you can subscribe to a `_MISSING_` event to become aware of missing changer calls, the error changer will be invoked with arguments containing the state (as all changers are) and an Array with the missing type name and any argument passed to dispatch, ex:  `(state, ["SOMETHING_FAKE", 12345])`. 

<br>Here's a [live demo of catching missing changer types](http://pagedemos.com/v7tu8r4c4c7e/).


#### Changer exceptions
##### Event
`_ERROR_` with a data argument of an array: `[objError, strType, data]` |is fired when an exception was encountered in a changer.<br >
##### Option
`._blnErrorThrowing`  - Boolean.	If true, throw on errors instead of dispatch()ing changer errors as an \_ERROR\_ type internal event.

Without setting `._blnErrorThrowing` you can subscribe to an `_ERROR_` event to become aware of exceptions inside of changer calls. The error changer will be invoked with arguments containing the state (as all changers are) and an Array with the Error instance, the missing type name and any argument passed to dispatch, ex:  `(state, [{ERR},"SOMETHING_FAKE", 12345])`. 

<br>Here's a [live demo of catching changer exceptions](http://pagedemos.com/qykaqvg7ckp4/).


<hr>

### Immutable State vs Normal State
The biggest early choice to make is between mutable and immutable state. Immutable states make it easy to backup and find differences between states, but usually (as of 2016) require more implementation effort than "regular/mutable" JS objects. Both work with CIA, it's just a matter of taste/need.



#### Mutable State Example: ([live demo](http://pagedemos.com/pypy2bdsdqjw/))
Use mutable state like a plain object, modifying the properties needed and NOT returning a value:
```js
  var store=CIA({ // state-changing actions and state:

    INCREMENT: function(state){
		state.counter++;
	    state.clicks++;
	},
	DECREMENT: function(state){
		state.counter--;
        state.clicks++;
	}
  }, { counter: 0, clicks: 0 });
```
If you want to use tiny arrow functions for changers with mutable state, set the `store._blnPureMutations = true` to ignore the return of the arrow function, to prevent the state form being replaced by the return.

<br>

#### Immutable State Example: ([live demo](http://pagedemos.com/vv4y784xy7bb/))
Use Immutable state by returning a whole new state:
```js
  var store=CIA({ // state-changing actions and state:

    INCREMENT: state=>({
		counter: state.counter + 1,
        clicks:  state.clicks  + 1,
	}),
	DECREMENT:  state=>({
		counter: state.counter - 1,
        clicks:  state.clicks  + 1,
	})
  }, { counter: 0, clicks: 0 });
```
Many libraries like Immutable.js  make it simpler to use immutable states, and ES2016 spread operators (once they arrive) will make it even easier in plain objects.





## Subscribing


### Changers
Changers are functions associated with actions that return a new state or modify the state and return nothing.


#### on/off Flexibility
* Wildcards: `*` as changer prop fires on all types, `.off('TYPE', '*')` removes all TYPE changers
* Pass a single object of methods `to on()` and `off()` to manage changers in bulk
* Changer definition object can have an array of many changers under one type property name.
* Name more than one event while subscribing ex:`.on("ADD,REM,CLR", fnDebugMe)`
* Give more than one handler when subscribing to an event ex:`.on("ADD", [fnValidate, fnFormat])`


#### Enhanced on/off Features
* Change on given event type(s) only the next time they happen with `.once(event, changer)`
* Change on a dependent event only _after_ another type w/ `.after(needyEvent, strWaitEvent, changer)`
* Change on an event only before another type has fired w/ `.before(event, strWaitEvent, changer)`
* `before()` and `after()` also take function conditionals for _waiting_ instead of a string type name
* `.now()` is just like `.on()` except that it dispatches immediately after subscribing

#### Integration
* Context-free changer invocation means you can bind `this` in your changers without drawbacks.
* Push certain events to another instance with `.push(events, instance)`
* Pull certain events from another instance with `.pull(events, instance)`
 

### State Observation
* `.watch(property, type)` dispatches the type when `state.property` changes.
* `.when(property, value, type, data)` dispatches the type when `state.property` changes to match a value.


#### State Change Handlers
* Mark a state-change callback _subscription_ for certain events, or a conditional function `.subscribe(fn, strName(s)/fnBoolean)`





## Dispatching Actions

* dispatch a string name; no `{type: ""}` object needed because the 2nd argument is passed in whole
* Redux-style action objects work too: `.dispatch({type:"ADD", value:4})` instead of `.dispatch("ADD", 4)`
* `dispatch()`ing a RegExp as a type triggers any matching changer type(s)
* Fire multiple events at once (ltr) from a single dispatch() call: `.dispatch("NEW,LOG,DRAW", uName)`
* Set flags to fire future changers immediately upon adding  `.flag(strType, value)`
* Non-strings: dispatch `.types.KEY` instead of `"KEY"` for validity and IDE happiness
* Action Creators: types can be invoked as methods using `.actions.KEY(data)`, call/apply set `this`
* Over-ride un-bound changer contexts on `.dispatch()` with a 3rd argument; a `this` value for the changers
* 

### Async Dispatching
There are a few patterns you can use to dispatch promises or other async functions.


#### Dispatching Action-Returning Promises

You can dispatch() a `promise` that returns a redux-style action object:
```js
store.dispatch(
	fetch("/")
	.then(x=>x.text())
	.then(x=>x.length)
	.then(
		x=>({type: "BYTES", count: x})  
	)  
);
```
The data is consumed in a changer like `BYTES: (state, data)=> state.byteCount = data.count,`:


#### Dispatching Data-Returning Promises

You can dispatch() a `type` _and_ a `promise` that returns data by pre-naming the type in the dispatch call:
  
```js  
  store.dispatch( "BYTES", 
	fetch("/")
	.then(x=>x.text())
	.then(x=>x.length)	
  );
```
The data is consumed in a changer like `BYTES: (state, count)=> state.byteCount = count,`. <br>
This results in a cleaner syntax using CIA-style 2-argument dispatches to avoid a custom _.then_.
  



#### Dispatching Via Promises and actions

Instead of dispatch()ing a `Promise`, you can have the `promise` itself use an action, which makes it easier to pass the `type` name:
```js  
	fetch("/")
	.then(x=>x.text())
	.then(x=>x.length)
	.then(store.actions.BYTES)
```
The data is consumed in a changer like `BYTES: (state, count)=> state.byteCount = count,`.


## Comparing


### Compared to Angular
* State can be loosely thought of as `$scope` or the model
* Unlike `$scope`, CIA's state can only be altered by changers and read with a `.getState()` method returning a copy
* changers can be thought of as a controller
* CIA doesn't come with any view features, hook into state changes via [`.subscribe()`](../api/methods.md#subscribe)


### Compared to Redux:
* States need not be immutable: `.getState()` returns a copy and only changers can mutate the state
* Accepts an object of methods instead of hard-coded `switch(action.type)` statements
* Action type is a string instead of a property, action data is stand-alone ex:`.dispatch("ADD", 4)`
* Known changer types can be called methodically: `.dispatch("ADD", 4)` simplifies to `.actions.ADD(4)`
* Returning state in a changer is optional; defaults to existing state if returning `undefined`
* Subscribe actions to typed events w/ `.on(TYPE, fn)` and  `.dispatch("TYPE")` to fire action(s)
* `.subscribe(fn)` state-changed callbacks for rendering, backup, etc...
* Can add/remove individual changers and state-change callbacks at runtime





## API Methods 

CIA inherits features not just from redux, but from EventEmitters like those in Node.js, the DOM, and dozens of popular JS event libraries.

<br><a id=top></a>
#### CIA Instance Methods
- [`after(strType, trigger, fnChanger)`](#after)  *do something only after some other thing*
- [`before(strType, trigger, fnChanger)`](#before) *do something only before some other thing*
- [`dispatch(strType, data, context)`](#dispatch) *trigger changers to alter/replace the state*
- [`flag(strType, value)`](#flag) *mark something as having happened*
- [`forget()`](#forget) *clear the undo history*
- [`getState()`](#getState) *grab a copy of the current state*
- [`now(strType, fnChanger, context)`](#now) *add changer + trigger right away*
- [`off(strType, fnChanger)`](#off) *remove a changer or changers*
- [`on(strType, fnChanger)`](#on) *add a changer or changers*
- [`once(strType, fnChanger)`](#once) *add a changer to do something one time only*
- [`pull(strEvent, objCIA)`](#pull) *make remote dispatches local*
- [`push(strEvent, objCIA)`](#push) *make local dispatches remote*
- [`subscribe(fnHandler, matcher)`](#subscribe) *add a procedure to execute after state changes*
- [`undo(n)`](#undo) *revert the state to a prior condition*
- [`unflag(strType)`](#unflag) *unmark something as having happened*
- [`unsubscribe(fnHandler)`](#unsubscribe) *removes a procedure that executes after state changes*
- [`watch(property, type)`](#watch) *fires each time a root state property changes*
- [`when(property, value, type, data)`](#when) *fires when a state property is a certain value*


#### <a id='utils'></a> Utility Methods
- [`assign(objBase, objUpdates)`](#assign) *copy props from one object to another*
- [`dupe(objOrig)`](#dupe) *shallow duplicate and freeze and object*
- [`each(arrLike, fnCallback)`](#each) *iterate an array/collection with a callback*

<br>
<hr>
<br>


### CIA Instance Methods


#### <a id='after'></a>[`after(strType, trigger, fnChanger)`](#after)  *thanks, but I need to wait*
[*top*](#top) Adds a state modification changer, but only after another pre-requisite condition is met.

##### Arguments

1. `strType` (*String*): The action to respond to
2. `trigger` (*String* or *Function*): What to wait for: a string event name, or a function that given `(state, data)` returns `true/false`. Once the condition is met, the next time strType is dispatched, fnChanger will run.
3. `fnChanger` (*Function*):  a normal action function that performs a state change or returns a new state

##### Returns
A function that removes the binding (a custom [`.off()`](#off))

##### Notes
This is a good tool to wait for async data to arrive or creating a soft load event.

##### Example
```js
store.after("KEY_PRESS", "USER_DATA_LOAD", this.handleKeys);
```




<hr>
#### <a id='before'></a>[`before(strType, trigger, fnChanger)`](#before)  *thanks, but I gave up*
[*top*](#top) Like on(), but removes itself once the _trigger_ condition is met.

##### Arguments

1. `strType` (*String*): The action to respond to
2. `trigger` (*String* or *Function*): What to cancel upon: a string event name, or a function that given `(state, data)` returns `true/false`. Once the condition is met, the changer will be turned [`.off()`](#off)
3. `fnChanger` (*Function*):  a normal action function that performs a state change or returns a new state

##### Returns
A function that removes the binding ( a custom [`off()`](#off) )


##### Notes
This is a good tool to handle actions before async data arrives or a user authenticates.

##### Example
```js
store.before("SAVE", "USER_LOGIN", this.warnNoSave);
```





<hr>
#### <a id='dispatch'></a>[`dispatch(strType, data, context)`](#dispatch)  *do this now with that*
[*top*](#top) Invokes a new state change event, triggering any changers subscribed to the type, then triggering any state-change callbacks to re-render, save, etc.

The flexible input handling can dispatch single redux-style action objects, or CIA-style actions with 2 arguments.

Passing the _type_ as a string on the first argument prevents the `{type:}` boilerplate when using objects, and allows passing any kind of data without wrapper objects.

##### Arguments

1. `strType` (*String*, *Object* [redux action], *RegExp*, or *Array*):  
    1. String: type name of the change. use a comma to separate multiple types
    2. Object: a redux-stlye (`{type:"ADD", amount: 22}`) action object
    3. RegExp: dispatches any action types that match the pattern. eg. (`/ERROR_[A-Z]+/`)
    4. Array: a list of types to trigger
2. `data` (*any*): optional. passed to the changer, can be any (or no) value, not just objects
3. `context` (*any*): optional. specifies the value of `this` in state changers.

##### Returns
The CIA instance.




<hr>
#### <a id='flag'></a>[`flag(strType, value)`](#flag)  *so, this happened*
[*top*](#top) Allows you to bind to an event even after it has happened.  Dispatches right away, and stores the value. The next time the type is bound using `on()/once()/etc`, it will fire right away with the stored value. flag can be useful for events that only happen once like _load_, _complete_ and _ready_ events, allowing late-added changers to init successfully. 

##### Arguments

1. `strType` (*String*, *Array*): The event types to flag as being activated
2. `value` (*any*):  the value to store to auto-dispatch the next time strType is bound

##### Returns
The instance.




<hr>
#### <a id='forget'></a>[`forget()`](#forget) *pretend all that didn't happen*

[*top*](#top) Empties the state change history, restores the state to initial, and dispatches an INIT internal change event

##### Arguments
none

##### Returns
The instance.




<hr>
#### <a id='getState'></a>[`getState()`](#getState) *here, I made you a copy*
[*top*](#top) Returns a representation of the internal state.

If the state is an object, it is shallow copied then shallow frozen by default.<br />
To prevent freezing state object copies, set `._freeze=Object;`. <br />
There is no way to prevent the shallow copying of a state object before returning. <br />

##### Returns
A copy of the state, typically an object.




<hr>
#### <a id='now'></a>[`now(strType, fnChanger, context)`](#now) *do this now, and later too*
[*top*](#top) Like [`.on()`](#on), but dispatches the event upon adding (with no data)

##### Arguments
1. `strType` (*String*, *Object*, *Array*): The name(s) of the change type to associate with the changer. An object used here must contain `type: fnChanger,` pairs. Use a comma to separate names in a String. Use  `"*"` as the type to bind a universal changer (use sparingly).
2. `fnChanger` (*Function*, *Array*): function(s) that make changes to the state when the type(s) are dispatched
3. `context` (*any*): the value of `this` for the changer call that fires immediately

##### Returns
The instance.




<hr>
#### <a id='off'></a>[`off(strType, fnChanger)`](#off) *don't do this anymore*
[*top*](#top) Remove a changer by type and function, or "*" for all.

##### Arguments
1. `strType` (*String*, *Object*, *Array*): The name(s) of the change type associated with the changer. An object used here must contain `type: fnChanger,` pairs. Use a comma to separate names in a String.
2. `fnChanger` (*Function*, *Array*): function(s) that made changes to the state

##### Returns
The instance.




<hr>
#### <a id='on'></a>[`on(strType, fnChanger)`](#on) *upon this do that*

[*top*](#top) Adds changer(s) for type(s) to makes changes to the state when a named action is `.dispatch()`ed.

##### Arguments
1. `strType` (*String*, *Object*, *Array*): The name(s) of the change type to associate with the changer. An object used here must contain `type: fnChanger,` pairs. Use a comma to separate names in a String. Use  `"*"` as the type to bind a universal changer (use sparingly).
2. `fnChanger` (*Function*, *Array*): function(s) that make changes to the state when the type(s) are dispatched

##### Returns
The instance.




<hr>
#### <a id='once'></a>[`once(strType, fnChanger)`](#once) *do this next time. only.*

[*top*](#top) Like on(), but removes itself after the first time the event fires. Note that multiple types are removed one-at-a-time as they are dispatched. 

##### Arguments

1. `strType` (*String*, *Object*, *Array*): The name(s) of the change type to associate with the changer. An object used here must contain `type: fnChanger,` pairs. Use a comma to separate names in a String. Use  `"*"` as the type to bind a universal changer (use sparingly).
2. `fnChanger` (*Function*, *Array*): function(s) that make changes to the state when the type(s) are dispatched

##### Returns
The instance.




<hr>
#### <a id='pull'></a>[`pull(strEvent, objCIA)`](#pull) *let me know if something happens*

[*top*](#top) dispatch an event FROM another instance when it happens remotely

##### Arguments
1. `strEvent` (*String*, *Array*): name(s) of change types to proxy. Use comma to seperate many.
2. `objCIA` (*Object*):  Another instance of CIA, or something with a `.dispatch(strEvent)` signature.

##### Returns
The instance.




<hr>
#### <a id='push'></a>[`push(strEvent, objCIA)`](#push) *I'll tell you if something happens*

[*top*](#top) Dispatch an event ON another instance when it happens locally. 

##### Arguments
1. `strEvent` (*String*, *Array*): name(s) of change types to proxy. Use comma to seperate many.
2. `objCIA` (*Object*):  Another instance of CIA, or something with a `.dispatch(strEvent)` signature.

##### Returns
The instance.




<hr>
#### <a id='subscribe'></a>[`subscribe(fnHandler, matcher)`](#subscribe)  *upon this do that*

[*top*](#top) Add handlers that execute after state changes. These callbacks run after any and all change events are dispatched. Don't modify state in these callbacks, use them to render, save, or otherwise reflect state change.

##### Arguments

1. `fnHandler` (*Function*): a function to call after the state changes. 
2. `matcher` (*String*, *Function*, *RegExp*): a string, function, or RegExp to filter by event type, preventing firing unless a specified _type_ caused the change. A function here is passed one argument, the event type, and expected to return true-ish if the handler should fire.

##### Returns
The instance.

##### Notes
The `matcher` option can reduce CPU costs by only rendering in response to certain type of state changes early in the pipline.

Use caution when using the `matcher` feature in conjunction with the `._blnDeferSubscriptions` option, as only the last change event type in a burst would be compared by the filter.



<hr>
#### <a id='undo'></a>[`undo(n)`](#undo)   *wait, nevermind...*

[*top*](#top) Reverses state changes. Built-in, fast, and efficient, but no frills.

##### Arguments

1. `n` (*Number*):  the # of steps backwards to take. defaults to 1.

##### Returns
The instance.

##### Notes
No `redo()` capability is provided because it  requires custom per-app code. Immutable state need not be used for this feature to work. Use [`.forget`](#forget) to clear the change history at any time to save RAM or protect privacy. The `_blnForget` option keeps `.undo()` from working for obvious reasons. 

Intermediate states are recovered by starting from a copy of the intitial state, and re-dispatching all known actions to a certain point. This uses less RAM and more CPU compared to state-memorizing undo-strategies. If you need redo(), or reconfigure changers at run time, use something more advanced/complicated.

##### Caveats
- Only JSON-represent-able state can be un-done
- State cannot inherit prototype properties for this to work (JSON again)
- Configuring changers mid-application in a way that re-interprets past changes won't work
- Can't be used if any changer somehow (even async) invokes a future changer (an anti-pattern)





<hr>([top](#top))
#### <a id='unflag'></a>[`unflag(strType)`](#unflag)  *don't ask me about that again*

[*top*](#top) Removes a future events auto-dispatch [flag](flag) for the specified change event.

##### Arguments

1. `strType` (*String*, *Array*):  flag(s) to remove. separate with commas or use Array for many

##### Returns
The instance.




<hr>
#### <a id='unsubscribe'></a>[`unsubscribe(fnHandler)`](#unsubscribe)   *don't worry about what i did*

[*top*](#top) removes [un-named callbacks](#subscribe) that execute after state changes

##### Arguments

1. `fnHandler` (*Function*): Which handler to remove (typically a `render()` or such)

##### Returns
The instance.



<hr>([top](#top))
#### <a id='watch'></a>[`watch(property, type)`](#watch)  *if it moves, scream*

[*top*](#top) Given a property , dispatch a given event when the property value changes

##### Arguments
1. `property` (*any*):  root state property to monitor for changes
2. `type` (*String*):  name of change type to dispatch change objects to

##### Returns
An un-subscribing function.

##### Notes
dispatches the type with a change object argument: 
```
{
    property: property, 
    was: value, 
    now: value=state[property]
}
```



<hr>
#### <a id='when'></a>[`when(property, value, type, data)`](#when)  *if he turns blue call 911*

[*top*](#top) if the _property_ of the state becomes a certain _value_ or one of a list of values, dispatch _type_ event with _data_.

Performs watch on the state for specific values. 

##### Arguments

1. `property` (*any*): root property of the state to watch
2. `value` (*any*):  value to watch for; one or an array of values
3. `type` (*any*):  type of reporting event to dispatch upon changing
4. `data` (*any*):  optional. passed with reporting event

##### Returns
An un-subscribeing function.

##### Notes
As with  _watch()_, use _when()_ sparingly since comparisons need checked upon each state change. Unlike watch, it un-subscribes itself after it dispatches.







### Utility Methods
<hr>


#### <a id='assign'></a>[`assign(objBase, objUpdates)`](#assign)  *`{a:1}`+`{b:2}`=`{a:1,b:2}`*

[*top*](#top) Ultra-fast implimentation of `Object.assign()/$.extend()`. Accepts only 2 arguments.

##### Arguments
1. `objBase` (*Object*): An object that will be modified with new properties
2. `objUpdates` (*Object*): An object containing properties to copy onto the base

##### Returns
`objBase` modified to contain the ptoprties and values from `objUpdates`

##### Notes
Optimized for a limited internal use. If you need to pass 3 arguments, use `assign(assign({}, base), updates);`, or `assign(dupe(base), updates)` to create a new object from a base and a patch object.


##### Example
```js
// modify an immutable state's count property
return store.utils.assign(state, {count: state.count+1});
```


<hr>
#### <a id='dupe'></a>[`dupe(objBase)`](#dupe)  *make me a copy*
[*top*](#top) Returns a shallow-frozen (by default) shallow-copy of a given object.


##### Arguments
1. `objBase` (*Object*): An object whose properties will be copied into a new object

##### Returns
`objBase` modified to contain the ptoprties and values from `objUpdates`

##### Notes
This method calls `._freeze`, which by default refers to `Object.freeze`; a shallow freeze. It also makes a shallow copy of the object, so sub-objects are still mutable. You can modify `._freeze` to a function that deep copies and/or deep freezes for increased isolation at the cost of performance.


<hr>
#### <a id='each'></a>[`each(arrLike, fnCallback)`](#each)  *do something to many things*
[*top*](#top) A super-fast implimentation of `[].forEach()` to perform a function on a list of value.


##### Arguments
1. `arrLike` (*Object*): Array or collection of values
2. `fnCallback` (*Function*): Function to be called for each value int he array with a signature of `(value, index, wholeArrayLike)`.

##### Returns
`objBase` modified to contain the ptoprties and values from `objUpdates`

##### Notes
For increased performance, this method doesn't behave the same as `[].forEach()` on edge cases:

1. there is no `this` arguments to set the context in callback functions
2. sparse arrays will invoke the function with `undefined` as the arguments[0]
3. `this` is not checked for `null` or `undefined` or coerced to an object
4. the callback is not validated to be a function
5. the `.length` of the array-like is not validated to be a positive integer (don't be dumb)





## API Events


These events fire without explicit `dispatch()` calls to reflect the life-cyle and usage of the store. They do NOT provide access to the state or appear in `.history`.

| Action | arguments[0] | Description |
|----|----|----|
|\_INIT\_ |`[]` 	| the store is ready to use ; fired once at boot	|
|\_SUBSCRIBE\_ |`[fnHandler, matcher]` |	a handler has subscribed to the state-changed pool |
|\_UNSUBSCRIBE\_ | `[fnHandler]`	| a handler has un-subscribed to the state-changed pool |
|\_ON\_ | `[strType, fnChanger]`	| a changer has subscribed to a specific type of event |
|\_OFF\_ | `[strType, fnChanger]`	| a changer has subscribed to a specific type of event |
|\_MISSING\_ | `[strType, data]` | a type without a known changer was `dispatch()`ed |
|\_ERROR\_ | `[objError, strType, data]` | an exception was encountered in a changer |
|\_UNDO\_ | `[numSteps]`	|  state will soon be restored from an `.undo()` call |
|\_UNDONE\_ | `[arrActions]`	|  state is was restored by an `.undo()` call |






## API Properties

Properties starting with `_` are options. These options can be set globally, and percolate to an instance upon instantiation. You can modify the options on the instance for more localized control. 

The publish options affect setup, and thus can only be applied globally before instantiation; you can set them true, create an instance, and set them false after that to instantiate unique-options instances.



| Property | Type | Description |
|----|----|----|
|history |Array 	| a log of the actions dispatched since `_INIT_` or `.forget()`	|
|utils|Object|	a collection of simple utility functions, documented in [methods](methods.md#utils) |
|types |Object| an object of string values matching the key, defined TYPES of changer actions. |
|actions|Object	| methods that dispatch a specific TYPE, pass one argument for the data argument of dispatch (if needed) |
| *Option*   |||
|_blnPureMutations|Boolean|	if true, ignore the return from changers to allow simple one-line arrow functions to mod state. <br >	Use this option only when using a mutable state, otherwise you won't be able to update.|
|_blnPublishState|Boolean|		if true, add a _state_ property to instance to allow outside mutations (not usually recommended). This can allow non-action access to state for extension, debugging, or integration.|
|_blnPublishChangers|Boolean|		if true, add a _changers_ property to the instance to allow customization. The changers will be on an object of arrays of functions, keyed by event type. Any changes made are live. |
|_blnStrictChangers|Boolean|		if true, dispatch()ing missing changer types will throw instead of firing a \_MISSING\_ internal |
|_blnErrorThrowing|Boolean|		if true, throw on errors instead of dispatch()ing changer errors as an \_ERROR\_ type internal |
|_blnForget|Boolean|		if true, don't keep dispatched actions in .history. Prevents .after()'s firing on adding capability, but can reduce ram usage for long-running applications. use `.forget()` at any time to achieve the same once. |
|_blnDeferSubscriptions|Boolean|	if true, debounce state-change callbacks. note: only the last state-change event of a cluster is passed, which is typically ok since callbacks should not care about what just happens except to optimize. |
|_blnDeferPeriod= 15|Boolean|			w/\_blnDeferSubscriptions, ms to wait for activity to cease before firing a state-change. Reduces "hammering" when dispatching an action upon every _keypress_ or _scroll_ event.|
|_freeze|Function| default: `Object.freeze`,	used to freeze state, change to just "Object" for mutable state, or a deep freezer. |
|_blnMergeReturns|Boolean|	if true, shallow merge changer returns into state instead of replacing the whole state. |






## Examples
### Basic Example (inspired by [the redux demo](https://github.com/reactjs/redux/blob/master/examples/counter-vanilla/index.html))

[Live demo](http://pagedemos.com/5je4v7cnejdh/) 

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


### TodoMVC

#### The ["rosetta stone"](http://todomvc.com/) of web app frameworks

##### View the [Online Demo](http://danml.com/cia/todo/).

#### Source

##### index.html (uses [VCC](https://github.com/rndme/vcc))

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>VCC+CIA • TodoMVC</title>
		<link rel="stylesheet" href="node_modules/todomvc-common/base.css">
		<link rel="stylesheet" href="node_modules/todomvc-app-css/index.css">
		<link rel="stylesheet" href="css/app.css">
	</head>
	<body>
		<section class="todoapp">
		
			<header class="header">
				<vcc-header id=myheader></vcc-header>
			</header>
	  
			<section class="main">
			  	<vcc-todolist id=mylist></vcc-todolist>
			</section>	  
			
			<vcc-footer class=footer id=myfooter></vcc-footer>
			
		</section>
	  
		<footer class="info">
			<p>Double-click to edit a todo</p>
			<p>Created by <a href="http://danml.com/">dandavis</a></p>
			<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
		</footer>

		<!-- Scripts here. Don't remove ↓ -->
		<script src="http://danml.com/bundle/rndme.vcc_rndme.cia_.js"></script>
		<script src="js/app.js"></script>
	</body>
</html>
```


<hr>


##### app.js [Online Copy](http://danml.com/cia/todo/js/app.js)

```js
/*
 _____ _        _        ______         _                         
/  ___| |      | |       | ___ \       | |                        
\ `--.| |_ __ _| |_ ___  | |_/ /___  __| |_   _  ___ ___ _ __ ___ 
 `--. \ __/ _` | __/ _ \ |    // _ \/ _` | | | |/ __/ _ \ '__/ __|
/\__/ / || (_| | ||  __/ | |\ \  __/ (_| | |_| | (_|  __/ |  \__ \
\____/ \__\__,_|\__\___| \_| \_\___|\__,_|\__,_|\___\___|_|  |___/	
[[ reducers modify state in CIA; each action type gets it's own controlling method ]] */

var store = CIA(()=>({
	ADD:	(state,title)=>	state.items.push({title: title.trim(), completed: false}),
	ALL:	(state, ok)=>	state.items.forEach(x=>  x.completed = ok),
	CANCEL:	(state)=>	state.editing = -1,
	CLEAR:	(state)=>	state.items=state.items.filter(x=> !x.completed ),
	DONE:	(state, e)=>	state.items[e.index].completed= e.checked,
	EDIT:	(state, n)=>	state.editing= n,
	REM:	(state, n)=>	state.items.splice(n, 1),
	SHOW:	(state, mode)=>{
		state.visLeft = mode !== 'completed';	// show active items?
		state.visDone =	mode !== 'active';	// show completed items?
	},
	UPDATE: (state, e)=>{			// item editor box completions
		state.editing = -1;		// not editing an item anymore
		var item=state.items[e.index];	// find the master item from the index
		if(item.title===e.title) return;// if it hasn't change, bail; nothing to do
		if(e.title) item.title=e.title;	//  if it has a title, save it with the new info
			else 	state.items.splice(e.index, 1); // empty editor input, remove item
	} 
}), /*
______      __            _ _     _____ _        _       
|  _  \    / _|          | | |   /  ___| |      | |      
| | | |___| |_ __ _ _   _| | |_  \ `--.| |_ __ _| |_ ___ 
| | | / _ \  _/ _` | | | | | __|  `--. \ __/ _` | __/ _ \
| |/ /  __/ || (_| | |_| | | |_  /\__/ / || (_| | ||  __/
|___/ \___|_| \__,_|\__,_|_|\__| \____/ \__\__,_|\__\___| 
[[ state contains all the model data and settings used and shown by the app ]]*/

{
	visDone:	!VCC.hasRoute("active"),	// visibility for done items
	visLeft:	!VCC.hasRoute("completed"),	// visibility for active items
	left:		0, 	// how many todos are left?
	editing:	-1,	// which todo is being edited? (-1 for none)
	items: 	JSON.parse(localStorage['todos-vcc']||0) || [] // load the saved items (if any)
});

/*
______                 _                         _                
| ___ \               | |                       (_)               
| |_/ / ___   ___  ___| |_ _ __ __ _ _ __  _ __  _ _ __   __ _    
| ___ \/ _ \ / _ \/ __| __| '__/ _` | '_ \| '_ \| | '_ \ / _` |   
| |_/ / (_) | (_) \__ \ |_| | | (_| | |_) | |_) | | | | | (_| |   
\____/ \___/ \___/|___/\__|_|  \__,_| .__/| .__/|_|_| |_|\__, |   
                                    | |   | |             __/ |   
                                    |_|   |_|            |___/    
[[ configure the store, subscribe to state changes, define helpers, etc... ]]*/

// lets render() be pure (closure-free + generic) by providing this.store to components:
VCC.prototype.store=store; 

// use mutated state for this demo (allows tiny reducers, and we can still undo):
store._blnPureMutations= true; 

store.subscribe(state=> // when the state changes:
	localStorage['todos-vcc']=JSON.stringify(state.items) // save todo items to localStorage
);	  

// a utility to compute the remaining todo count:
store.count=state=> state.items.filter(x=>!x.completed).length;

/*
_____                                              _             
/  __ \                                            | |            
| /  \/ ___  _ __ ___  _ __   ___  _ __   ___ _ __ | |_ ___       
| |    / _ \| '_ ` _ \| '_ \ / _ \| '_ \ / _ \ '_ \| __/ __|      
| \__/\ (_) | | | | | | |_) | (_) | | | |  __/ | | | |_\__ \      
 \____/\___/|_| |_| |_| .__/ \___/|_| |_|\___|_| |_|\__|___/      
                      | |                                         
                      |_|               
[[  smart view components defined by custom HTML elements ]] */

VCC({ // setup header:
	displayName: 'header',
	componentDidMount: function () { // subscribe to state changes 
		this.store.subscribe( this._renderer );
	},
	save: function(inp){ // dispatches and handles the DOM input
		store.actions.ADD(inp.value);
		inp.value='';
		inp.focus();
	},
	render: function(){ // returns a string of HTML for the header
	  var ss=this.store.getState(), 
	  left=this.store.count(ss);  return `
		<h1> todos </h1>		  
		
		<input class="toggle-all" type="checkbox"  
			${ VCC.checked(left===0 && ss.items.length) }
			on-change="store.actions.ALL(event.target.checked)"> 
			
		<input class="new-todo" placeholder="What needs to be done?" 
			autofocus					
			on-change="this.save($0)" /> 
	`;}
 }); // end header definition 

VCC({ // setup todo list:	
	displayName: "todolist",  
	getDefaultProps: function(){ // holds an array of editor inputs refs
		return {
			inputs: []  
		}	  
	},
	componentDidMount: function () { // subscribe to state changes 
		store.subscribe( this._renderer );
	},
	cancel: function(target){ // handles DOM actions and dispatches
		target.value = store.getState().items[target.dataset.index].title;
		target.blur();
		store.actions.CANCEL();
	},
	edit: function(index){  // finds input from props, sets value to state, handles DOM and dispatches
		var target =this.props.inputs[index];
		target.value = store.getState().items[index].title;
		setTimeout(function(){target.focus(); target.select();}, 75); // timeout allows dblclick to decay before focusing
		store.actions.EDIT(index);
	},
	censor: function(e){ // a keydown handler to catch [esc] and [enter]
		switch( VCC.keys['_'+(e.which||e.keyCode)]){
			case 'RETURN': 	return e.target.blur();
			case 'ESCAPE': 	return this.cancel(e.target);
		}
	},
	render: function(){ var ss=this.store.getState(); return ` 
		<ul class="todo-list"> ${ss.items.map(function(item, index){return `

		<li ${VCC.show( item.completed ? ss.visDone : ss.visLeft )}
			class="${VCC.classes({todo: 1, editing: index===ss.editing , completed: item.completed })}">
			<div class="view">
			
				<input class="toggle" type="checkbox" 
					${ VCC.checked(item.completed) } 
					on-change="store.actions.DONE({ index:${index}, checked: $0.checked });">
					
				<label><span on-dblclick="this.edit(${index})">${item.title}</span></label>

				<button class="destroy" on-click="store.actions.REM(${index});"></button>
			</div>
			
			<input class="edit" type="text" data-index=${index} 
				ref="function(e){this.props.inputs[${index}]=e;}" 
				on-keydown="this.censor"
				on-blur="store.actions.UPDATE({index:${index}, title: $0.value});">

		</li>	`},this).join('')} 
		
		</ul>`}
}); // end item list definition 

VCC({ // setup footer:
	displayName: "footer",	
	_delegate: true,	// allow delegated events on synthetic events (on-something)
	componentDidMount: function () { // subscribe to state changes 
		store.subscribe( this._renderer );
	},
	render: function(){
		var ss=this.store.getState(), 
		left=this.store.count(ss);
		this.hidden = !ss.items.length; // hide the whole thing if no todo items
		return `
		<span class="todo-count"><strong>${left}</strong> item${left==1?'':'s'} left</span>
		
		<ul class="filters"  on-click="this.store.actions.SHOW($0.hash.slice(2))" >
			<li><a href="#/" class="${ VCC.classes({ selected:  ss.visDone && ss.visLeft }) }">All</a></li>
			<li><a href="#/active" class="${ VCC.classes({ selected: !ss.visDone && ss.visLeft  }) }">Active</a></li>
			<li><a href="#/completed" class="${ VCC.classes({ selected: ss.visDone && !ss.visLeft }) }">Completed</a></li>
		</ul>
		
		<button class="clear-completed"  ${VCC.show(left-ss.items.length)} on-click="store.actions.CLEAR;">Clear completed</button>
	`;}
});  // end footer definition 

```


### Word Game

View [Online Demo](http://pagedemos.com/p6hp3tnw867u/) to see in action.


#### Source
```html
<!doctype html><html>
<head>
    <meta charset="UTF-8">
    <title>word guessing game</title>
    <style>
        .btn[hidden]{display: none;}
        .btn[on-click]{ margin: 0.3em; }
    </style>
    <link rel=stylesheet href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css' />
</head>
<body class=container>
<h1>word guessing game</h1>

<vcc-game></vcc-game>

<script src="http://danml.com/bundle/rndme.cia_rndme.vcc_.js"></script>
<script src="https://query.yahooapis.com/v1/public/yql?q=select%20content%20from%20html%20where%20url%3D%22https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FDolch_word_list%22%20and%0A%20%20%20%20%20%20xpath%3D'%2F%2Fp'&format=json&callback=store.boot" defer async></script>
<script>
	var store = CIA({ //changer methods:

	GUESS: function(state, letter) {
		var hits= state.word.split(letter).length-1;    // # of word letters that match guess
		state.guesses.push(letter);                     // mark letter as having been guessed
		state.score+= hits ? (state.points_per_letter * (2 * hits)) : -2; // adjust score for hit/miss
		if(hits) state.remainingLetters=state.remainingLetters.replace(RegExp(letter, "g"),""); // show correctly letters in-context
	},

	RESET: function(state, words) {
		if(words && words.length) state.words=words;			// allow loading words
		var index = ~~(Math.random() * state.words.length);	// choose a random slot in word list
		state.word= state.words[index];						// make the word in the slot "the word"
		state.remainingLetters= state.word;					// word w/o guesses
		state.guesses.length=0;								// no guesses made yet this round
	}

	}, { // initial state:
		words: [],			// a list of words to try to guess
		word: "",			// the particular word in the list we're currently guessing
		score: 0,			// the user's score in the game
		guesses: [],		// tracks letters guessed in a round
		remainingLetters: "",	// the letters in the word that have not yet been guessed.
		points_per_letter: 4,	// a correct guess gets this many points
		letters: "abcdefghijklmnopqrstuvwxyz",	// all the letters the user can guess 
});

store.boot=function(res){ // incoming jsonp callback takes a result object with words and start the game
    var words = res.query.results.p.slice(-5).join(" ").toLowerCase().match(/\w{5,}/g); // find words
	this.actions.RESET(words); 	// start game
};
					
VCC({	displayName: "game",		// the custom tag name
    guess: store.actions.GUESS,		// proxied by component to keep globals out of template
	renderTrigger: store.subscribe,    // tells component when to refresh (after a state change)
	
	render: function(me) {				// returns a string that defines the html interface
			return me = store.getState(), `<hr>

	<aside ${VCC.show(!me.words.length)}>
		<progress></progress> Loading Word List from Wikipedia...
	</aside>

	<section ${VCC.show(me.words.length)}>

		<h3> 
			<span class=pull-right>Score: ${me.score} </span>
			Word: ${[].map.call(me.word, l=>me.guesses.includes(l)?l:"_").join(" ")} 
		</h3>

		<aside ${VCC.show(!me.remainingLetters)}>
			<button class="btn btn-lg btn-success" on-click=store.actions.RESET 
				type=button > 
					New Word 
			</button>
		</aside>

	</section>

	<hr>

	<section ${VCC.show(me.remainingLetters)}>
		${[].map.call(me.letters, letter=>`

			<button class='btn btn-primary btn-lg' 
				${VCC.show(!me.guesses.includes(letter))} 
				on-click="this.guess('${letter}')"
				type=button > 
					${letter} 
			</button>

		`).join("")}
	</section>	`;
	}
});
</script>
</body>
</html>
```




### TicTacToe

#### Made with VCC and CIA. ([live demo](http://pagedemos.com/27sy8rnysj62/))

Note the lack of traditional game events like `nextTurn()` and `gameOver()`. In fact, there are only two state changers for the whole game logic, and they both affect the view. Mutable private state works well for this application.


```html
<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>tic tac toe game</title>
<style>
  #game { width: 20em; height: 20em;}
  #game td { border: 1px solid #000; text-align: center; 
			width: 33%; height: 33%; font-size: 4em; font-weight: bold; }
</style>
<link rel=stylesheet href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css' />
</head><body class=container>
<h1>tic tac toe  game</h1>

<vcc-game></vcc-game>

<script src="http://danml.com/bundle/rndme.cia_rndme.vcc_.js"></script>

<script>

  
var store = CIA({
 // actions:
	MOVE: function(state, pos) { // makes a move, determines if game is over
 
		state.slots[pos[0]][pos[1]]=state.players[state.player]; // mark square as taken

	  	//find winner:
	  	var s = state.slots,
	  	winner= s.filter(/./.test, /([XO]),\1,\1/g)[0] || 
				s[0].filter((cell, i)=> s[1][i].trim()===cell && s[2][i]===cell)[0] ||
				(s[0][0].trim() == s[1][1] &&  s[0][0]== s[2][2] &&  s[0][0]) || 
				(s[0][2].trim() == s[1][1] &&  s[0][2]== s[2][0] &&  s[0][2]) || "";

		if(!winner && !/ /.test(s)) winner=[[" Nobody"]]; // no winner and no moves? a tie.
	  
	  	if(winner)	state.winner=winner[0].slice(0,1);	// set the state's winner
			else	state.player=+!state.player;		// change turn by toggling 1/0
	},

  	RESET: function(state) {
		state.slots = state.slots.map(r=>r.map(c=>" "));	// clear every square
	  	state.winner = "";	// reset current winner to nobody
	}
  
}, 
// state:				
{
  	players:["X","O"],	// the tokens for each player
  	player: 0,			// the active player number (0 or 1)
  	winner: "",			// the name of the winner (if any)
  	slots: [	// the squares of the board, (' '=empty,X or O)
	   [" "," "," "],
	   [" "," "," "],
	   [" "," "," "]	 
	 ]
});

					
VCC({	
  	displayName: "game", // the custom tag name

  	move: store.actions.MOVE,	// proxied by component to keep globals out of template
  
	renderTrigger: store.subscribe,
	
	render: function(VCC, me) {
			return me = store.getState(), `

		<h3 id=gameover  ${VCC.show(me.winner)}> 
				Game Over! ${me.winner} Won! <br>
				<button onclick=store.actions.RESET()>New Game!</button>
		</h3>

		<div id=board ${VCC.show(!me.winner)}>
			<h3> ${me.players[me.player]}'s turn </h3>
			<table id=game cellspacing=3 cellpadding=4}>
			${me.slots.map((row, i)=>`<tr>
				${row.map((col, n)=>`
					<td on-click="' '==='${col}' && this.move([${i},${n}])">
						${ col }
					</td>`).join("")
				}
			</tr>`).join("")
			}
			</table> 
		</div>
					`;
	}
});
</script>
</body>
</html>
```

