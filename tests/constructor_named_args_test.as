DEBUG=0

Foo = class {
    init: {a=42,b -> @.x = [a,b]; print("Foo init");},
    *test: {a,b ->
        print("Hello "+[a,b]);
        @.y = 70707;
        @.init(a,b);
    }
};

Baz = class < Foo, {
    init: {->
//        var sup = arguments.callee.__superMethod.bind(this);
        var sup = super;
//        sup(123,456);
        var f = {->
            sup(111,222);
            print("beep");
        };
        f();
    }
}

x.constructor == Baz
Baz.__superClass
x.constructor.__superClass == Foo
x = new Baz
x.x
x.superClass == Foo.prototype
JSON.stringify(x.superClass)
Foo.__methodNames

Object.keys(Foo)

Foo.prototype.jobba = 123

x kindof Foo

x.constructor.__superClass
x = new Foo:1,2
x = new Foo.test:12,b=>125;
x = new Foo.test:b=>10,a=>5
x = new Foo.test(b=>125)
x = new Foo.test(6,7)
x.x
x.y
x = new Foo(10,b=>123)
x = new Foo:b=>123
x = new Foo()
x = new Foo:b=>11,a=>51
x.x

Bar = class < Foo, {
    foo: {-> print("Bar "+@.x)},
    *test: true
//    *test: Foo.prototype.$NEW$test,
//    *test: {-> super(11,22)},
//    *bar: Foo.test
}

b = new Bar:b=>7
b = new Bar:10,b=>11
b = new Bar.test:2,8
//Bar.test.prototype = Bar.prototype
b.foo()
b.x

//Bar.test.prototype == Foo.test.prototype

//nope, since no argnames in Bar.bar..
b = new Bar.bar(5,b=>8)
b.foo()


f = {a,b,c -> print:[a,b,c,this]}

g = f.bind(7)
g = f.bind(7,1,2,3)
g()


DEBUG=0
Singleton = {
    _C: class {
        init: {->
            print("Singleton Init");
            @.counter = 0;
        },
        foo: {-> print(@.counter++)}
    },
    _I: undefined,
    getInstance: {-> @._I || (@._I = new @._C); }
};

Singleton.getInstance().foo()

