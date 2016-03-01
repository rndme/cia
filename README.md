# CIA - Central Inner Authority 

- **C**entral: One place for all your state and sub-state
- **I**nner: Stuff that happens inside an app (state and user actions)
- **A**uthority: Provides final say on state values; a single source of truth

## Docs
* [Guides](https://rndme.gitbooks.io/cia/content/guides/guides.html)
   * [Setup](https://rndme.gitbooks.io/cia/content/guides/setup.html)
   * [Config](https://rndme.gitbooks.io/cia/content/guides/config.html)
   * [Subscribing](https://rndme.gitbooks.io/cia/content/guides/binding.html)
   * [Dispatching](https://rndme.gitbooks.io/cia/content/guides/dispatching.html)
   * [Comparing](https://rndme.gitbooks.io/cia/content/guides/comparing.html)
* [API Reference](https://rndme.gitbooks.io/cia/content/api/api.html)
   * [Methods](https://rndme.gitbooks.io/cia/content/api/methods.html)
   * [Events](https://rndme.gitbooks.io/cia/content/api/events.html)
   * [Properties](https://rndme.gitbooks.io/cia/content/api/properties.html)
* [Examples](https://rndme.gitbooks.io/cia/content/examples/examples.html)
   * [Basic](https://rndme.gitbooks.io/cia/content/examples/basic.html)
   * [TodoMVC](https://rndme.gitbooks.io/cia/content/examples/todomvc.html)
   * [Real-World](https://rndme.gitbooks.io/cia/content/examples/realworld.html)
   * [Game](https://rndme.gitbooks.io/cia/content/examples/game.html)


## Preface
Shared mutable state is the root of all evil, but take one of those away and it's cool. Why do coders use shared mutable state? It's easy to write. Problem is, it's hard to maintain and expand. If you want a centralized way to use shared immutable or private mutable state, keep reading. 


## Data Flow
|State Object <br>*( Model )*|&#8594;|User Offerings<br>*( View )*|
|:---------:|:---:|:---:|
|  &#8593; | |         &#8595;    |
|State Changers<br>*( Controller )*| &#8592; |User Actions<br>*( Events )*|


## Modus Operandi
> And ye shall know the truth, and the truth shall make you free of bugs.

### State only modifiable by actions
Only actions can directly modify or replace the state, all others get a _copy_ of it via `.getState() Having only a copy, even poorly written code can safely consume the state without fear of pollution or cross-talk. This applies even to non-immutable states, which can often be simpler to implement/integrate than immutable structures. CIA makes both options simple and reliable. 

### State changes from dynamic action collections
All state changes happen from one place (the store), from one (or more) discrete named methods, forming single-concern self-contained interchangeable parts. Action methods are known at author-time, assisting IDE features and code-completion. Defining an action type automatically creates a corresponding method. Actions can be `.dispatch()`ed or called methodically (`.actions.SAVE()`).


### undo() capability w/o state snapshots
One can replay a chess game by writing down the position of each piece at every turn, but piece-move _notations_ better for the wrist. Likewise, CIA makes one snapshot of the state at init, then accumulates any actions and params applied from there. Only action names and options are stored, not whole state, which scales well to very large models of state.


Re-starting at the beginning and re-applying every action to a given point can re-create any state achieved since init. Following the convention that actions cannot dispatch other actions, even slow async jobs that eventually dispatched actions will instantly re-apply their results, so "doing it all over" is not painful.



## Usage:
`cia({methods}, {state} || {} )`  <br />
`cia({methods}, {state} || {}, objOptions )`



## Part List
Let's quickly get familiar with the terms we'll use in this documentation


<a id=pullup></a>

### State
The model of your application's data and user-iterface particulars. CIA's state can be an object (immutable or dynamic), or an immutable primitive like a Number or String.

### Actions
Happenings that affect state including actions taken by the user, internal errors occouring, background data arriving, etc. CIA demands these happenings be given a name and a function(s) to run when they occour. This seperates the source of the event from the effect of the event, un-tangling inter-connected piplines into a simple big pipe. 



### Changers
Changers are the functions defined by actions. Upon invocation, they are passed two arguments: 
1. `state`  - the current internal state
2. `data`   - additional argument given to `.dispatch()` (if any)
 
The `this` value of changers is not specified, so it can be used to `.bind()` data or elements to an individual changer. The `this` vaule can also be set at dispatch-time for any un-bound changer using a 3rd argument to `.dispatch()`

Returning a value from the changer will replace the state with the return, great for immutable state. Without a return, the only way to affect change is to mutate the state object which was passed in as the first argument. Either are acceptable to CIA. If you want to use cleaner arrow functions on mutable state (they typically return the tail), you can set an option, `store._blnPureMutations = true`, to ignore the return of all changers on the instance, only allow mutation.



### Events
Events are how users affect the state. Users raise an event, like a click, which in turn can (or not) `.dispatch()` a state change action, which in turn activates any awaiting changers, which in turn activates a state-change event, typically updating the screen to reflect the state change wrought by the click.

#### Typical Event Chain
1. User clicks `<button on-click=this.save id=btnSave >`
2. DOM Event `btnSave.click()` fires, running an event we defined which runs
3. `.dispatch("SAVE")` to call the SAVE changer
4. `SAVE` changer fires, clearing buffer and dirty flag
5. State-Change Callback is fired
6. render function finds difference in view markup
7. DOM updates by removing it's unsaved work warning and closing the item editor interface

