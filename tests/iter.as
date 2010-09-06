var Loop = class
{
    init: ^(a) {
        @.seq = a;
        @.counter = 0;
        @.length = a.length;
    },

    next: ^{
        if (@.counter >= @.length)
            @.counter = 0;
        @.seq[@.counter++];
    },

    reset: ^{
        @.counter = 0;
        @.seq[@.counter];
    }
};

