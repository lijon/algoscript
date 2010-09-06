/*
These extensions are loaded into new AlgoScript contexts,
so that they are able to execute the compiled algoscript code.
*/
var GLib = imports.gi.GLib;

(function() {
    var toString = Object.prototype.toString;
    __typeOf = function(x) {
        if(x===null) return "null";
        else if(x===undefined) return "undefined";
//        return x._className || toString.call(x).slice(8, -1).toLowerCase();
        return toString.call(x).slice(8, -1).toLowerCase();
    }
})();

function __inContainer(a,b) {
//NOTE: we could inline this but if b has side effects we need to store it in a temp var..
    return (b.indexOf?b.indexOf(a)>=0:b.hasOwnProperty(a));
}

var __sprintf = imports.platform.sprintf;


/*
NOTE: An alternative to throwing an error is to let the constructor call itself with 'new' if
it wasn't already:

Foo = function(args) {
    if (!(this instanceof arguments.callee))
        return new arguments.callee(arguments);
    this.init.apply( this, args.callee ? args : arguments );
}

*/

var __namedCall = function(func, self, namedargs) {
    // called with 'new', do some magic!
    if (this instanceof arguments.callee) {
//        var m = func.__isDefaultConstructor ? func.prototype.init : func.__initMethod;
//        var m = func.__initMethod;
        var m = func.prototype[func.__initMethod];
        var x = [m,,namedargs].concat(Array.prototype.slice.call(arguments,3));
        var f = function() {
            x[1] = this;
            __namedCall.apply(null,x);
        }
        f.prototype = func.prototype;
        return new f;
    }

    var a = Array.prototype.slice.call(arguments,3);
    var names = func.argumentNames();

    for (var i=0;i<names.length;i++) {
        var x = namedargs[names[i]];
        if(x) a[i] = x
    }
   
    return func.apply(self,a);
}

var __makeConstructor = function(init) {
    // this shortcut saves us one lookup for the default constructor...
    if(init=='init')
        var c = function() {
            if (!(this instanceof arguments.callee))
                throw TypeError("Constructor called as function");
            this.init.apply(this, arguments);
        };
    else
        var c = function() {
            if (!(this instanceof arguments.callee))
                throw TypeError("Constructor called as function");
            this[init].apply(this, arguments);
        };
    c.__initMethod = init;
    c.toString = function() {
        return "[Constructor function]";
    }
    return c;
}

var __makeClass = function (parent, obj) {
    if(arguments.length<2) {
        obj=parent;
        parent=undefined;
    }

    var c = __makeConstructor('init');
        
    if(parent) {
        c.prototype.__proto__ = parent.prototype;
        c.__superClass = parent;
//        c.prototype.superClass = c.__superClass && c.__superClass.prototype;
    }

    if(!parent)
        c.prototype.init = function() { };

    // copy constructors
    // no, not good since it's not a real copy and we don't want to change
    // the prototype of the parentclass constructor!
/*    for(var k in parent) {
        if(parent[k] instanceof Function && parent[k].__initMethod && k !== 'init') {
            c[k] = parent[k];
            c[k].prototype = c.prototype;
        }
    }*/
        
    __extendClass(c,obj);
    return c;
};

var __extendClass = function(c,obj) {
    var getset = {};
    var getPfx = "$GET$";
    var setPfx = "$SET$";

    if(!c.__methodNames)
        c.__methodNames=[];

//    c.prototype.superClass = c.__superClass && c.__superClass.prototype;

    for(var k in obj) {
        if(obj.hasOwnProperty(k)) {
            var v = obj[k];
            var p = c.__superClass && c.__superClass.prototype;
            var prefix = k.slice(0,5);
            if (p && v instanceof Function) {
                v.__superMethod = p[k];
            }
            
            if(prefix === getPfx || prefix === setPfx) {
                var name = k.slice(5);
                if(!getset[name]) getset[name]={};
                getset[name][prefix] = v;
//            } else if(prefix === "$NEW$") {
//                c[k.slice(5)] = v;
//                v.prototype = c.prototype;
//                v.__isConstructor = true;
            } else {
                if(prefix === "$NEW$") {
                    var c2 = __makeConstructor(k);
                    c[k.slice(5)] = c2;
                    c2.prototype = c.prototype;
                    if(!(v instanceof Function))
                        v = p[k];
                } //else if(k === "init")
//                    c.__initMethod = v;
            
                Object.defineProperty(c.prototype, k, {
                    value:v,
                    writable:false,
                    enumerable:false,
                    configurable:false
                });
            }
            c.__methodNames.push(k);
        }
    }
    // Add getters and setters
    for(var k in getset) {
        if(getset.hasOwnProperty(k)) {
            Object.defineProperty(c.prototype, k, {
                get:getset[k][getPfx],
                set:getset[k][setPfx],
                enumerable:false,
                configurable:false
            });
        }
    }
};

Object.copyProperty = function(dest,key,src) {
    Object.defineProperty(dest,key,Object.getOwnPropertyDescriptor(src,key));
}

__extendClass(Object,{
    copy: function() {
        var o={};
        for(k in this) {
//            if(this.hasOwnProperty(k))
//                o[k]=this[k];
            Object.copyProperty(o,k,this);
        }
        return o;
    },
    extend: function(o) {
        for(var k in o)
//            if(o.hasOwnProperty(k))
//                this[k]=o[k];
            Object.copyProperty(o,k,this);
        return this;
    },
    concat: function(o) {
        var u=this.copy();
        for(var k in o)
//            if(o.hasOwnProperty(k))
//                u[k]=o[k];
            Object.copyProperty(u,k,o);
        return u;
    },
    forEach: function(fun,self) {
        for(k in this)
//            if(this.hasOwnProperty(k))
                fun.call(self,this[k],k,this);
        return this;
    },
    map: function(fun,self) {
        var a = [];
        for(k in this)
//            if(this.hasOwnProperty(k))
                a.push(fun.call(self,this[k],k,this));
        return a;
    },
//    forAll: function(fun) {
//        for(k in this)
//            fun(this[k],k);
//        return this;
//    },
    $GET$count: function() {
        var n = 0;
        for(var k in this)
            if(this.hasOwnProperty(k)) n++;
        return n;
    }
});

__extendClass(Function,{
/*    named_call: function(self,namedargs) {
        var a = Array.prototype.slice.call(arguments,2);
        var names = this.argumentNames(); //this is the function f in f.named_call()...
        for (var i=0;i<names.length;i++) {
            var x = namedargs[names[i]];
            if(x) a[i] = x
        }
        return this.apply(self,a);
    },*/
    argumentNames: function() {
        if(this.__parmNames) return this.__parmNames;
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
          .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
          .replace(/\s+/g, '').split(',');
        return this.__parmNames = (names.length == 1 && !names[0] ? [] : names);
    },
    bind: function(context) {
//        if (arguments.length < 2 && typeof arguments[0]==="undefined") return this;
        var __method = this;
        if(arguments.length > 1) { // also curry
            var slice = Array.prototype.slice;
            var args = slice.call(arguments, 1);
            return function() {
                var a = args.concat(slice.call(arguments, 0));
                return __method.apply(context, a);
            }
        } else { // simple bind
            return function() {
                return __method.apply(context, arguments);
            }
        }
    },
    curry: function() {
        if (!arguments.length) return this;
        var __method = this, args = Array.prototype.slice.call(arguments, 0);
        return function() {
            var a = args.concat(Array.prototype.slice.call(arguments, 0));
            return __method.apply(this, a);
        }
    },
    dup: function(n,self) {
        return Array.fromFunc(n,this,self);
    }
});

/*
//FIXME: hide this
function __update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }
  
Function.prototype.wrap = function(wrapper) {
    var __method = this;
    return function() {
        var a = __update([__method.bind(this)], arguments);
        return wrapper.apply(this, a);
    }
}
*/

__extendClass(String,{
    trim: function() {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
});

__extendClass(Number,{
    forEach: function(f,self) {
        var n=this;
        for(var i=0;i<n;i++)
            f.call(self,i);
        return this;
    },
    map: function(f,self) {    
        return Array.fromFunc(this,f,self);
    },
    rand: function() {
        return Math.rrand(0,this.valueOf());
    },
    randi: function() {
        return Math.rrandi(0,this.valueOf());
    },
    concat: function(x) {
        return this.toString()+x;
    },
//    factorial: function() {
//        return Math.factorial(this);
//    }
});

/*
TODO:
zip should take multiple arguments.
*/

Array.series = function(len,start,step) {
    var a = Array(len);
    start = start || 0;
    step = step || 1;
    for(var i=0;i<len;++i) {
        a[i]=start;
        start+=step;
    }
    return a;
}

Array.range = function(start,end) {
    return Array.series(end-start+1,start);
}

Array.fromFunc = function(len, fun, self) {
    var a = Array(len);
    for(var i=0;i<len;++i)
        a[i] = fun.call(self,i,a);
    return a;
}

__extendClass(Array,{
    extend: function(x) {
        Array.prototype.push.apply(this,x)
        return this;
    },
    copy: function() {
        return this.slice(0);
    },
    fill: function(x) {
        for(var i=0;i<this.length;++i) this[i] = x;
        return this;
    },
    sum: function() {
        var a=this[0];
        for(var x=1;x<this.length;++x) a+=this[x];
        return a;
    },
    product: function() {
        var a=this[0];
        for(var x=1;x<this.length;++x) a*=this[x];
        return a;
    },
    normSum: function(n) {
        return this.div(this.sum()/(n||1));
    },
    mean: function() {
        return this.sum() / this.length;
    },
    windex: function() {
    	var sum = 0.0;
    	var r = Math.rand();
    	var size = this.length;
    	var j = size - 1;
    	for (i=0; i<size; i++) {
    		sum += this[i];
    		if (sum >= r) {
    			j = i;
    			break;
    		}
    	}
    	return j;
    },
    choose: function(p) {
//        var i = p?p.windex():Math.floor(Math.random()*this.length);
        var i = p?p.windex():Math.rrandi(0,this.length);
        return this[i];
    },
    group: function(number) {
        var index = -number, slices = [], array = this;
        if (number < 1) return array;
        while ((index += number) < array.length)
            slices.push(array.slice(index, index+number));
        return slices;
    },
    flatten: function() {
        return this.reduce(function(array, value) {
            if (value instanceof Array)
                return array.concat(value.flatten());
            array.push(value);
            return array;
        },[]);
    },
    partition: function(iterator, context) {
        iterator = iterator || function(x){return x};
        var trues = [], falses = [];
        this.forEach(function(value, index) {
          (iterator.call(context, value, index) ?
            trues : falses).push(value);
        });
        return [trues, falses];
    },
    equals: function(b) {
        if(this.length != b.length) return false;
        return this.every(function(x,i) {
            return x==b[i];
        });
    },
    uniq: function() {
        var a=[];
        this.forEach(function(x,i) {
            if(a.indexOf(x)<0)
                a.push(x);
        });
        return a;
    },
    union: function(b) {
        var a=this.uniq();
        b.forEach(function(x,i) {
            if(a.indexOf(x)<0)
                a.push(x);
        });
        return a;
    },
    intersect: function(b) {
        var a=[];
        this.forEach(function(x,i) {
            if(b.indexOf(x)>=0)
                a.push(x);
        });
        return a.uniq();
    },
    shuffle: function(n) {
        var l = this.length;
        var i = n || l;
//        var v = this.concat([]);
        var v = this.copy();
        while(i--) {
            var i1 = 0, i2 = 0;
            while(i1 == i2) {
//                i1 = Math.round(Math.random()*(l-1));
//                i2 = Math.round(Math.random()*(l-1));
                i1 = Math.rrandi(0,l);
                i2 = Math.rrandi(0,l);
            }
            var t=v[i1];
            v[i1]=v[i2];
            v[i2]=t;
        }
        return v;
    },
    scramble: function() {
//        var v = this.concat([]);
        var v = this.copy();
//        var n = this.length-1;
        var n = this.length;
        for(var i=0;i<n;i++) {
//            var i2 = i+Math.round(Math.random()*(n-i));
            var i2 = i+Math.rrandi(0,n-i);
            var t=v[i2];
            v[i2]=v[i];
            v[i]=t;
        }
        return v;
    },
    permutations: function() {
        var t,j,i,x;
        var N = this.length;
        var p = Array(N).fill(0);
        var a = this.copy();
        var r = [];
        r.push(this);
        i = 1;
        while(i<N) {
            if(p[i]<i) {
                var sv = [];
                j=i%2*p[i];
                t=a[j];
                a[j]=a[i];
                a[i]=t;
                for(x=0;x<N;x++)
                    sv.push(a[x]);
                r.push(sv);
                p[i]++;
                i=1;
            } else {
                p[i]=0;
                i++;
            }
        }
        return r;
    }
});


(function() {
    // There is a Number class, so we could easily add these methods to Number.prototype as well,
    // which would probably mean we could simplify the below function?
    // also, it always flattens the arrays (?), which is not nice..
    var _addArrayOp = function (obj,name,fun,nonrecurse) {
        var f = function(o) {
            o = o[name]?o:[o];
            var l1 = this.length;
            var l2 = o.length;
            var m = Math.max(l1,l2);
            var a=[];
            for(var i=0;i<m;i++) {
                var x = this[i%l1];
                var y = o[i%l2];
                if(!nonrecurse && (x[name] || y[name])) {
                    x = x[name]?x:[x];
                    a[i] = arguments.callee.call(x,y);
                } else
                    a[i] = fun(x,y);
            }
            return a;
        }
        Object.defineProperty(obj.prototype,name,{value:f,writable:false,enumerable:false,configurable:false});    
    }

    _addArrayOp(Array,"mul",function(a,b) {return a*b});
    _addArrayOp(Array,"div",function(a,b) {return a/b});
    _addArrayOp(Array,"add",function(a,b) {return a+b});
    _addArrayOp(Array,"sub",function(a,b) {return a-b});
    _addArrayOp(Array,"pow",function(a,b) {return Math.pow(a,b)});

    _addArrayOp(Array,"zip",function(a,b) {return [a,b]},true);
    
})();

//This is a better and seedable random generator:
Math.rand_seed = GLib.random_set_seed;
Math.rand = GLib.random_double;
Math.randi = GLib.random_int;
Math.rrand = GLib.random_double_range;
Math.rrandi = GLib.random_int_range;

Math.quant = function(x,q,s) {
    var x2 = x-(x%q);
    if(s!=1 && s!=undefined)
        return x2-(x2-x)*(1-s);
    else
        return x2;
}

Math.log2 = function(x) {
    return Math.log(Math.abs(x)) * Math.LOG2E;
}
Math.midicps = function(n) {
    return Math.pow(2,((n-69)/12))*440;
}
Math.cpsmidi = function(f) {
    return 69+12*Math.log2(f/440);
}

Math.factorial = function(x) {
    var n=x;
    if(n<1) return 0;
    while(--n>1) x*=n;
    return x;
}
Math.gcd = function(u,v) {
	var t;
	u = Math.abs(u);
	v = Math.abs(v);
	if (u <= 1 || v <= 1) return 1;
	while (u>0) {
		if (u<v) { t=u; u=v; v=t; }
		u = u % v;
	}
	return v;
}
Math.lcm = function(u,v) {
	return (u * v)/Math.gcd(u,v);
}
Math.primes = function(n) {
    var p = Array.range(2,n);
    for(var x=0; p[x] < Math.pow(n,0.5); x++)
        p = p.filter(function(y) {
            return(y==p[x] || y%p[x]);
        });
    return p;
}

