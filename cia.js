// cia.js  by dandavis [CCBY4]
(function(root, factory) {
	if(typeof define === 'function' && define.amd) {
		define([], factory);
	} else if(typeof exports === 'object') {
		module.exports = factory({});
	} else {
		root.CIA = factory(root);
	}
}(this, function(pub) {

function CIA(reductions, state, pool) {

	state = typeof state === "function" ? state() : (state || {});
	reductions = typeof reductions === "function" ? reductions() : reductions;

	if(typeof reductions != "object") throw new TypeError("Reduction definitions Object cannot be a non-Object");
	if(typeof state != "object") throw new TypeError("State Object cannot be a non-Object");

	pool = Array.isArray(pool) ? pool : (typeof pool === "function" ? pool() : []);

	var types = {}, oDef = reductions;
	reductions = assign({}, reductions); //dupe reductions

	// turn each prop into an array for later expansion:
	forEach(Object.keys(reductions), function(k) {
		var o = reductions[k];
		types["$" + k] = k;
		if(!Array.isArray(o)) reductions[k] = [o];
	});

	var orig = dupe(state),
		flags = {},
		rxInternal = /^_[A-Z]+_$/,
		ret = {
			history: [],
			types: {},
			undo: function(n) {
				state = orig;
				var r = this.history.slice(0, - (n || 1));
				this.history.length = 0;
				r.forEach(function(e) {
					this.dispatch(e[0], e[1]);
				}, this);
			},

			getState: function() {
				return dupe(state);
			},

			flag: function(strType, value) { // fires knowns and news when subscribed, good for ready()
				forEach(arr(strType), function(strType) {
					flags[strType] = value;
					ret.dispatch(strType, value);
				});
			},

			unflag: function(strType) { // un-set an auto-dispatch event
				forEach(arr(strType), function(strType) {
					delete flags[strType];
				});
			},

			on: function(strType, fnReducer) {
				if(typeof strType === "object") {
					forEach(Object.keys(strType), function(k) {
						ret.on(k, strType[k]);
					});
					return this;
				}
				if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];
				forEach(arr(strType), function(strType) {
					forEach(fnReducer, function(fnReducer) {
						var r = reductions[strType] || (reductions[strType] = []);
						r.push(fnReducer);
						ret["$" + strType] = strType;
						ret.dispatch("_ON_", [strType, fnReducer]);
						if(flags[strType] != null) ret.dispatch(strType, flags[strType]);
					});
				});
				return this;
			},

			off: function(strType, fnReducer) {

				if(typeof strType === "object") {
					forEach(Object.keys(strType), function(k) {
						ret.off(k, strType[k]);
					});
					return this;
				}

				var r = reductions[strType];
				if(!r) return false;
				ret.dispatch("_OFF_", [strType, fnReducer]);
				if(fnReducer === "*") {
					delete ret["$" + strType];
					return delete reductions[strType];
				}

				var index = r.indexOf(fnReducer);
				if(index === -1) return false;
				r.splice(index, 1);

				if(!r.length) {
					delete ret["$" + strType];
					delete reductions[strType];
				}
				return true;
			},

			once: function(strType, fnReducer) {

				if(typeof strType === "object") {
					forEach(Object.keys(strType), function(k) {
						ret.once(k, strType[k]);
					});
					return this;
				}

				if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];

				forEach(arr(strType), function(strType) {
					forEach(fnReducer, function(fnReducer) {
						ret.on(strType, function oncer(state, e) {
							fnReducer(state, e);
							ret.off(strType, oncer);
						});
					});
				});
				return this;
			},

			after: function(strType, trigger, fnReducer) {
				if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
					if(trigger(state, data)) {
						ret.off(strType, wait);
						ret.on(strType, fnReducer);
						fnReducer.call(ret, state, data);
					}
				});
				var ok = ret.history.some(function(x) {
					return x[0] === trigger;
				});
				if(ok) return ret.on(strType, fnReducer);
				return ret.once(trigger, fnReducer);
			},

			before: function(strType, trigger, fnReducer) {

				if(typeof trigger === "function") return ret.on(strType, function wait(state, data) {
					if(trigger(state, data)) {
						ret.off(strType, wait);
					} else {
						fnReducer.call(ret, state, data);
					}
				});

				var used = ret.history.some(function(x) {
					return x[0] === trigger;
				});
				if(used) return ret;
				ret.on(strType, fnReducer);
				return ret.once(trigger, function oncer() {
					ret.off(strType, fnReducer);
				});
			},

			push: function(strEvent, objCIA) {
				function pusher(state, e) {
					objCIA.dispatch(strEvent, e);
				}
				ret.on(strEvent, pusher);
				return ret.off.bind(ret, strEvent, pusher);
			},

			pull: function(strEvent, objCIA) {
				function puller(state, e) {
					ret.dispatch(strEvent, e);
				}
				objCIA.on(strEvent, puller);
				return objCIA.off.bind(objCIA, strEvent, puller);
			},

			subscribe: function(fnHandler, matcher) {
				pool.push([fnHandler, matcher]);
				ret.dispatch("_SUBSCRIBE_", [fnHandler, matcher]);
				return this.unsubscribe.bind(this, fnHandler);
			},

			unsubscribe: function(fnHandler) {
				pool = pool.filter(function(fn) {
					return fn[0] !== fnHandler;
				});
				ret.dispatch("_UNSUBSCRIBE_", [fnHandler]);
				return this;
			},

			dispatch: function(strType, data, context) { // allows reducer return values to be fed to handlers via this:

				if(strType.constructor === RegExp) strType = Object.keys(reductions).filter(/./.test, strType).join(",");
				if(Array.isArray(strType) && arr(strType)[0] == strType[0]) strType = strType.join(",");
				if(typeof strType != "string") for(var k in oDef) if(oDef[k] === strType) {
					strType = k;
					break;
				}

				forEach(arr(strType), function(strType) {

					var heap = reductions[strType] || [],
						isInternal = rxInternal.test(strType);

					if(!heap.length && !isInternal) {
						if(ret._blnStrictReducers) throw new TypeError("Unknown reducer type dispatched: " + strType);
						return ret.dispatch("_MISSING_", [strType, data]);
					}

					if("*" in reductions) heap = heap.concat(reductions['*']);

					if(!isInternal) ret.history.push([strType, data]);

					if(ret._blnErrorThrowing) {
						forEach(heap, function(fn) {

							state = (context ? fn.call(context, state, data) : fn(state, data)) || state;
						});
					} else { // catch errors:
						forEach(heap, function(fn) {
							try {
								state = (context ? fn.call(context, state, data) : fn(state, data)) || state;
							} catch(err) {
								ret.dispatch("_ERROR_", [err, strType, data]);
							}
						});
					} //end if throw on errors?

					forEach(pool, function(fn) {
						if(fn[1] && ((fn[1].call && !fn[1](strType)) || (strType.search(fn[1]) === -1))) return;
						fn[0].call(ret, state);
					});


				});

				return this;
			},

			reset: function() {
				ret.history.length = 0;
				state = orig;
				ret.dispatch.call(ret, "_INIT_", []);
				return true;
			}
		};

	forEach(Object.keys(CIA), function(k) {
		ret[k] = CIA[k];
	}); // "inherit" options to instance

	if(ret._blnPublishState) ret.state = state; // if publish state?
	if(ret._blnPublishReducers) ret.reducers = reducers; // if publish reducers?

	assign(ret, types);
	ret.dispatch.call(ret, "_INIT_", []);
	return ret;
}; // end CIA()


// global config, available externally
CIA._freeze= Object.freeze; 	// used to freeze state, change to just "Object" (or K) to allow mutable state properties.
CIA._blnPublishState= false; 	// if true, add a state property to instance to allow outside mutations (not usually recommended)
CIA._blnPublishReducers= false;	// if true, add a reducer property to the instance to allow customization
CIA._blnStrictReducers= false;	// if true, dispatch()ing missing reducer types will throw instead of fire a _MISSING_ internal
CIA._blnErrorThrowing= false;	// if true, throw on errors instead of dispatch()ing reducer errors as an _ERROR_ type internal

// common internal utils:
function assign(o, x){for (var k in x) if(assign.hasOwnProperty.call(x, k)) o[k] = x[k]; return o; }
function arr(s){return String(s).trim().split(/\s*,\s*/).filter(Boolean);}
function forEach(r,f){var m=r.length, i=0;for(; i<m; i++)f(r[i],i,r);};
function dupe(o){return CIA._freeze(assign({}, o));}

 // end packaging:  
  return CIA;

}));
