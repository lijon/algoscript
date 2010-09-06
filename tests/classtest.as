Animal = class {
    init: ^{
        @.name = "some animal";
        print("(Animal init)");
    },
    foo: ^(x) {
        print("TEST"+~x);
    },
    move: ^(meters) {
        print(@.name +~ " moved " +~ meters +~ "m.");
    }
};

Snake = class < Animal, {
    init: ^(name, speed) {
        super();
        @.name = name;
        @.speed = speed;
        print("(Snake init)");
    },
    *withDefaults: ^{
        @.init("FooBar",1234);
    },
    move: ^{
        print("Slithering...");
        super(@.speed);
    }
};

//private methods can be added with a function closure:

var MySnake = ^{
    var privmethod = ^{ print("PRIV: name is " +~ @.name)};
    class < Snake, {
        init: ^{
            super("My snake",42);
            privmethod() @ this;
            print: "(MySnake init)";
        },
    };
}();

Mixin = {
    foo: ^(x) {print: x*x},
    bar: ^{print("My name is " +~ @.name)}
};

Cat = class < Animal, Mixin +~ {
    init: ^(name) {
        super();
        @.name = name;
        print: "(Cat init)";
    },
    move: ^{
        print: "Jumping...";
        super("a lot of ");
    },
    < legs: ^{print("** custom getter"); 4},
    > legs: ^(x) {print("trying to set cat legs to "+~x+~", ignoring...")}
};

class + Cat, {
    mything: ^{print: "Hello there"}
};

// create some objects and do some stuff

x = new Snake: "Sammy the Python",5;
y = new Cat: "Liz the cat";
z = new MySnake;
z2 = new MySnake;
x2 = new Snake.withDefaults;

x.move();
y.move();
z.move();
z2.move();
x2.move();

y.foo: 42;
x.foo: 123;
y.bar();
y.mything();

x2.foo: 777;

print(z kindof Animal);

y.legs = 5;
print(y.legs);

//foo = Cat("foo"); //raises a type error since 'new' is missing

