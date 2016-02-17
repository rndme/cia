//cia.js  by dandavis [CCBY4]
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory({});
	} else {
		// Browser globals (root is window)
		root.CIA = factory(root);
  }
}(this, function (pub) {


function CIA(reductions, state, pool) {
	if(typeof reductions  != "object") throw new TypeError("Reduction definitions Object cannot be a non-Object");
  
    function arr(s){return String(s).trim().split(/\s*,\s*/).filter(Boolean);}
  	function forEach(r,f){var m=r.length, i=0;for(; i<m; i++)f(r[i],i,r);};
  
	state = state || {};
	pool = pool || [];
	Object.keys(reductions).forEach(function(k){var o=reductions[k]; if(!Array.isArray(o))reductions[k]=[o];});
  	var orig=Object.freeze(Object.assign({}, state)),
	flags={},
	rxInternal = /^_[A-Z]+_$/,
	ret={
	  	returnValue: true,
		history: [],
	  	undo: function(n){
		  	state=orig;
		  	var r=this.history.slice(0, -(n||1));
		  	this.history.length=0;
		  	r.forEach(function(e){ this.dispatch(e[0],e[1]); }, this);		  	
		},
	  
		getState: function(){ 
			return Object.assign({}, state);
		},
	  
	  
		flag: function(strType, value){ // fires knowns and news when subscribed, good for ready()
			forEach(arr(strType), function(strType){
				flags[strType] = value;
				ret.dispatch(strType, value);
			});			
		},

		unflag: function(strType){ // un-set an auto-dispatch event
			forEach(arr(strType), function(strType){
				delete flags[strType];
			});			
		},

		on: function(strType, fnReducer) {
			if(typeof strType==="object"){
				forEach(Object.keys(strType), function(k){
					ret.on(k, strType[k]);
				});
				return this;
			}
		  	if(!Array.isArray(fnReducer)) fnReducer = [fnReducer];
		  	forEach( arr(strType), function(strType){
				forEach(fnReducer, function(fnReducer){
					var r=reductions[strType] || (reductions[strType]=[]);
					r.push(fnReducer);
					ret.dispatch("_ON_", [strType, fnReducer]);
					if(flags[strType]!=null) ret.dispatch(strType, flags[strType]);
				});
			});
			return this;
		},
	  
		off: function(strType, fnReducer) {

			if(typeof strType==="object"){
				forEach(Object.keys(strType), function(k){
					ret.off(k, strType[k]);
				});
				return this;
			}

			var r=reductions[strType];
			if(!r) return false;
			ret.dispatch("_OFF_", [strType, fnReducer]);
			if(fnReducer==="*"){
			  return delete reductions[strType];
			}
		  
			var index=r.indexOf(fnReducer);
			if(index===-1) return false;
			r.splice(index, 1);
			return true;
		},
		subscribe: function(fnHandler, matcher){
			pool.push(fnHandler);
		  	fnHandler._matcher=matcher;
			ret.dispatch("_SUBSCRIBE_", [fnHandler, matcher]);
			return this.unsubscribe.bind(this, fnHandler);
		},

		unsubscribe: function(fnHandler){  
			pool = pool.filter(function(fn){return fn !== fnHandler;});
			ret.dispatch("_UNSUBSCRIBE_", [fnHandler]);
			return this;
		},
	  
		dispatch: function(strType, data){   // allows reducer return values to be fed to handlers via this:
		  	var that=this;
		  
		  forEach( arr(strType), function(strType){
			
			var heap = reductions[strType] || [];		  
			if(!heap.length && !rxInternal.test(strType)) return ret.dispatch("_MISSING_", [strType, data]);

		  	if(!rxInternal.test(strType)) that.history.push([strType, data]);

		  	forEach(heap, function(fn){
				try{
			  	if(that.returnValue) state = fn.call(that, state, data) || state;
				}catch(err){
					ret.dispatch("_ERROR_", [err, strType, data]);
				}
			});
		  	if(!that.returnValue){
			 	that.returnValue=true; 
			  	return that;
			}

			forEach(pool, function(fn){
			  if(fn._matcher){
				if(fn._matcher.call && !fn._matcher.call(that, strType)) return;
				if(strType.search(fn._matcher)===-1) return;
			  }
			  fn(state);
			});

			
		  });
		  
		   return this;
		}
	};
	ret.dispatch.call(ret, "_INIT_", []);
	return ret;
}; // end CIA()
  
return CIA;

}));
