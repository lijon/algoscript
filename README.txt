A L G O S C R I P T
===================

This is a language parser that translates AlgoScript to JavaScript, and a
runtime library with some prototype extensions and other stuff.

The parser (as_parser.js) is made with the JS/CC parser generator (jscc.js), build it with ./make_parser.sh

The AlgoScript language is in many ways similar to JavaScript, but with some syntactic sugar
and extra features, it also tries to hide some of the inconsistencies and uglyness in JS.

USAGE
-----
From commandline, run with:

    seed run_as.js script.ags
or
    seed run_as.js
    
for an interactive interpreter.

Or from javascript:

    var ctx = new imports.algoscript.Context;
    var result = ctx.eval(codestring);
    ctx.destroy();

If you want to reuse the same code, you can divide the process into parse and eval:

    var js = imports.algoscript.parse(codestring);
    var result = ctx.eval_js(js);

The context is a sandboxed environment, with the algoscript extensions loaded at creation time.
You can reach the global object with ctx.global:

    ctx.global.foo = 42;
    ctx.eval("print(foo)"); //prints 42

algoscript.parse() takes an optional additional parserConfig object.
Currently there is only one property: 'makeBinOp' which tells the parser how to handle +-*/% binops:

> config = {makeBinOp:^(a,op,b){"binOp("+[a,"'"+op+"'",b].join()+")"; }}
> imports.algoscript.parse("5*4+1",config)
binOp(binOp(5,'*',4),'+',1)


STATEMENTS
----------
All statements must end with ';' except the last statement inside '{' code blocks '}' where it is optional.

Variables has lexical function scope, you can and should declare local variables
with "var NAME [ = value], ...;" statements.

FUNCTIONS
---------
    
Functions are written as ^(args) {code} and automatically return the last expression:

    var sqr = ^(x) {x*x};
    sqr(3); // returns 9

Functions without args can be written without the parens:

    var foo = ^{do_something(123)}

The last parameter can be marked with '*' to put any additional arguments as an array in it:

    var f = ^(x,y,b*) {print(x+y); print(b.stringify())}

    f(1,2,3,4,5);       // prints 3 and [3,4,5]

Parameters can have default values. that value is an expression which will be evaluated at
the top of the function, thus allowing it to refer to other parameters or variables from
an outer scope, etc.. the default value is used if the argument is not given or is explicitly
given the value 'undefined'.

    f = ^(x,y=42,z=y*10) {print([x,y,z].join())};

    f(1);               // 1,42,420
    f(1,2);             // 1,2,20
    f(1,2,3);           // 1,2,3
    f(1,undefined,3);   // 1,42,3

call functions and pass arguments by name, which must come after any unnamed args:

    f(12,z=>77);

NOTE: default values and named arguments does add some performance cost.

call a function and set the 'this' variable explicitly by using the '@' suffix:

    f(a,b,c) @ x;

since @ is also sugar for 'this', you can call a function on this object, ignoring what
object the function was bound to with a double @@:

    other.foo(a) @@;

alternative function call syntax:
    a: y, b: c, x;
=>
    a(y, b(c, x));

note that x = a?b:n:c is ambiguous, you should write x = a?b(n):c instead.

this alternative syntax is mainly useful when passing functions
or other big literals as arguments:

    a.map: ^(x) {x*x};
    
    button.signal.connect: \clicked, ^(b) {b.label="done"};

CONTROL STUCTURES
-----------------
if as in C/javascript, except that a statement before 'else' should not end with semicolon:
   
    if (x)
        foo()
    else
        bar();
        
    if (x) {
        foo();
    } else {
        bar();
    };

    if (y) {
        bar();
        zoo();
    };

switch statements looks like this, they can have multiple matches grouped by comma, and
an optional default last case:

    switch (a) {
        x,y,42  =>
            foo();

        'hello' => {
            do_stuff(a);
            print(123);
        }

        default =>
            no_match();
    };

try/catch as in javascript:

    try {
        if(!x) throw Error: "no x...";
    } catch(err) {
        print(err.name+": "+err.message);
    };

ITERATION
---------
loops as in C/javascript:

    for(var i=0;i<x;i++)
        print(i);

while does not need parenthesis around conditional expression, and takes a single statement or a block:

    while (x--) foo(x);

break and continue works as in C.

x.do is sugar for x.forEach, and takes a function and an optional 'this' argument and calls the function for each thing in x.
It works on Arrays, Objects and Numbers. For arrays and objects, it calls the function with three arguments:
value, index/key, and the object beeing iterated over. For numbers it passes one argument: The loop number, starting from zero.

    obj.do: ^(v,k) {print("key: "+k+" is "+v)};

Numbers and Objects has a .map() method too:
    
    8.map: ^(i) {2**i}    // returns [1,2,4,8,16,32,64,128]

MISC SYNTAX
-----------

symbols: \foo is the same as 'foo'

array shortcut:
    [0..10]
=>
    [0,1,2,3,4,5,6,7,8,9,10]

inline string formatting like sprintf:

    "that is %d items" %% (42);

heredoc syntax:

    foo = '''
This is a 'multiline' string
that can contain any characters...
    ''';

'@' is sugar for 'this' and refers to this object:

    @.foo = 123;

"typeof" operator works as expected on everything, gives "object", "number", "string", "function", "boolean", "undefined", "null", etc..

"a in b" tests for key/element/substring a in object/array/string b.

"a kindof b" checks if a is a kind of b, where b is a constructor function (class).
Also searches the inheritance chain and works for custom classes.
Example: "42 kindof Number" returns true.

"+~" binary op concatenuates strings and arrays and merge objects. (a.concat(b))

"**" is a shortcut for Math.pow(a,b)

"==" and "!=" behaves like "===" and "!==" in javascript

array, object, string and number literals are the same as in JS:

    "let's dance"
    'she said "hello"'
    1.023
    42
    2.3e+4
    0xdead1234
    [1,2,3]
    {a:1,b:'foo',c:[6,7]}
    {'my key':42}

return an array of all permutations of the word "algo":

    "algo".split("").permutations().map:^(v){v.join("")}

    // returns algo,lago,galo,aglo,lgao,glao,olag,loag,aolg,oalg,laog,
    // alog,agol,gaol,oagl,aogl,goal,ogal,ogla,gola,loga,olga,gloa,lgoa


MODULE IMPORTS
--------------
    m = module.something

Starts by searching in the paths specified in the array module.searchPath.
__script_path__ is used instead of '.' if set.

If something is a directory, it returns a new module object that searches in that directory only,
if something is a file ending with '.as', it evaluates it and returns its namespace,

If something was not found in module.searchPath, it tries the original seed imports object,
so stuff like Gtk = module.gi.Gtk works as well.

For example, this refers to the variable 'foo' in the file 'bar' in the directory 'zoo':

    f = module.zoo.bar.foo;

The variable __script_path__ is set in the global namespace of the module.


CLASSES
-------
Syntax:     MyClass = class methods;
    and     MySubClass = class < ParentClass, methods;
    and     class + SomeClass, more_methods;
    
Where methods is an object used to define the methods, at least 'init' should be specified.
The default constructor calls this.init() with all arguments.
You can also define alternative constructors by prefixing them with '*'. 

    MyClass = class {
        init: ^(name) {
            @.name = name;
        },
        *withDefaultName: ^{
            @.init("Foo");
        },
        dump: ^{
            print(@.name);
        }
    };

    x = new MyClass("Bar");
    y = new MyClass.withDefaultName();
    x.dump();                   // prints 'Bar'
    y.dump();                   // prints 'Foo'

'@' is sugar for 'this' and refers to this object.

Use 'super' inside a method to call the supermethod:

    MySubClass = class < MyClass, {
        init: ^(name, age) {
            super(name);
            @.age = age;
        },
        dumpAge: ^{
            print(@.age);
        }
    };

    x = new MySubClass: "foo", 42;
    
super() calls the supermethod with this object.
you can NOT pass another object as this-context with 'super(args) @ context' since 'super' gives the
super-method already bound to this object.
Just like 'this', 'super' isn't copied to inner functions. You would need to save it in the outer scope:

    foo : ^{
        var sup = super;
        var f = ^{
            sup(123);
        };
    }

Named argument call works on constructors too:

    x = new MySubClass: name=>"joe", age=>27;

alternative constructors are not inherited by default, but they are if set to 'true' instead of a function,
also super() works:

    MyClass = class < Foo, {
        *fromA: true, //inherit from Foo
        *fromX: ^(x) {super(x)}
    };

you could also just do your own factory functions, as static Class members or anywhere:

    SinOsc = class < UGen, { ... };
    SinOsc.ar = ^(f,p,m,a) {new SinOsc:\audio,f,p,m,a};
    
    x = SinOsc.ar(440,0,0.5);

the "kindof" operator works with inheritance:

    x kindof MyClass; // returns true

Mixins can be made with the concatenuate operator:

    Mixin = {
        something: ^{123},
        foobar: ^{print("hello")},
    };
    
    MyClass = class Mixin +~{
        init: ^{
            @.whatever = @.something();
        }
    };

Or you can mix in individual methods:

    MyClass = class {
        init: ^{
            @.whatever = @.foobar();
        },
        foobar: Mixin.foobar,
    };

You can extend existing classes:

    class + MyClass, {
        something: ^{123}
    };

You can put class variables and methods directly in the class:

    MyClass.FOO = 42;

You can define getters and setters:

    MyClass = class {
        < foo: ^{ @._foo},
        > foo: ^(x) {@._foo = Math.min(x,10)}
    };

All methods are added with writable, enumerable and configurable all set to false.

Note that parent class and methods can be any expression, for example to define a class
Zoo with parent class in array foo index i and methods in object returned from bar():

    Zoo = class : foo[i] bar();


LIBRARY
-------
AlgoScript comes with some library extensions, some of which are used by algoscript itself:

Math.rand_seed(x)                       - set random seed
Math.rand()                             - random number between 0.0 and 1.0
Math.randi()                            - random integer between 0 and some huge integer
Math.rrand(lo, hi)                      - random number between lo and hi
Math.rrandi(lo, hi)                     - random integer between lo and hi-1

Math.quant(x, q, s=1)                   - quantize x to steps of q. s controls quant force..
Math.midicps(n)                         - frequency of midi note n
Math.cpsmidi(f)                         - midi note of frequency f

Math.log2(x)                            - log2 of x
Math.factorial(x)                       - factorial of x (factorial(4) = 4*3*2*1 = 24)
Math.primes(n)                          - build an array of all primes less than or equal to n
Math.gcd(u, v)
Math.lcm(u, v)

Array.series(length, start, stepsize)   - return a new array with numbers
Array.range(start, end)                 - return a new array with numbers from start to end
Array.fromFunc(length, func[, self])    - return a new array filled with returned values from func.
                                          func is called with two args: index and the array object.

Array instance methods:

.extend(a)                              - append all elements from a
.copy()                                 - make a shallow copy of the array
.fill(value)                            - fill the array with value
.sum()                                  - return the sum of all elements
.product()                              - return the product of all elements
.normSum([n])                           - return copy of array normalized to the sum n (default 1.0)
.mean()                                 - mean average
.windex()                               - return an index weighted by the elements, the sum should be 1.0
.choose([probability])                  - randomly choose an element, with optional weighting in probability
.group(size)                            - group the array by size elements
.flatten()                              - return a flattened copy of the array
.partition(func[, self])                - build two arrays depending on return value of func(value,index)
.equals(a)                              - test if the array equals another array
.uniq()                                 - return array with all duplicates removed
.union(a)                               - merge with array a, removing duplicates
.intersect(a)                           - return an array with elements existing in both this and array a
.shuffle([n])                           - swap elements n times (default n=this.length)
.scramble()                             - return a random permutation
.permutations()                         - return all permutations of this array

Number instance methods:

.forEach(func[, self])                  - call func this number of times, passing the loop number as argument
.map(func[, self])                      - same as .forEach, but return an array of all values returned from func
.rand()                                 - random number between 0 and this
.randi()                                - random integer between 0 and this-1
.concat(x)                              - return a string of this number concatenuated with x

Function instance methods:

.argumentNames()                        - return an array of the functions argumentnames. this value is cached.
.bind(self[, args...])                  - bind the function to another 'this' value and optional first arguments
.curry(args...)                         - make a curry function that calls this function with the first arguments
.dup(n)                                 - call this function n times, passing loop number as argument, and return
                                          an array of the results.

String instance methods:
.trim()                                 - trim leading and trailing whitespace

Object.copyProperty(dest, key, source)  - copy property from source to dest, preserving the property descriptor.

Object instance methods:

.copy()                                 - make a shallow copy of this object
.extend(o)                              - extend this object by adding all items from object o
.concat(o)                              - return a new object which is this obj merged with o
.forEach(func[, self])                  - call func(value, key, obj) for every item in this obj
.map()                                  - same as .forEach, but return an array of all results from func
.count                                  - read-only property with number of items in object

__namedCall(func, self, namedargs[, firstargs...])
                                        - call the function with arguments passed by name.
                                          namedargs is an object in the form {argname: value, ...}
                                          works on constructors too!


JAVASCRIPT QUIRKS
-----------------
The original instanceof and typeof was discarded since they're totally broken,
instead typeof was replaced with this code:

    if(x===null) return "null";
    else if(x===undefined) return "undefined";
    return x._className || Object.prototype.toString.call(x).slice(8, -1);

and a new operator "kindof" was introduced that does "b.prototype.isPrototypeOf(Object(a))".
    
Even if AlgoScript tries to hide some of the ugly sides of javascript, some are hard
to work around without big performance costs (wrapping everything in custom functions).
For example, every arithmetic assignment on a variable tries to convert it to a string,
but if it fails then the previous value is destroyed, and no error is thrown:

    x = "42";
    x++;
    // x is now the _number_ 43..
    x = import foo.bar;
    x.MyClass--;
    // x.MyClass is now NaN and gone, and there's no way to get MyClass back.

Also, + and += does concatenuation if any of the operands are a string:

    > "1" + "2"
    "12"
    > 1 + "2"
    "12"
    > 1 + 2
    3

This is a bit confusing since we have a "real" concat operator in AlgoScript: +~
which calls a.concat(b) and work on every kind of object.
But note that str += x is faster than str = str +~ x..

'this' isn't copied to inner function definitions:

Foo = {};
Foo.x = 42;
Foo.f = function() {
    print("outer: "+this.x);
    var f2 = function() {
        print("inner: "+this.x);
    }
    f2();
}
Foo.f();

outer: 42
inner: undefined

You need to save it in the outer scope in a 'self' variable or something.

