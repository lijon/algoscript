{->
    // PRIVATE
    var _instance;
    var _Singleton = class {
        init: {->
            print("Creating singleton instance");
            @.a = Math.rand();
        },
        foo: {->
            print(@.a);
        }
    };

    // PUBLIC
    this.get_instance = {->
        _instance || (_instance = new _Singleton);
    };
}();

