/*
** (seed:3271): WARNING **: ArgumentError - probably due to incorrect gir file (which may be fixed upstream) argument 2 must not be null for function: thread_create_full 

[New Thread 0xb52efb70 (LWP 3275)]
3.05975143636762e+17

** (seed:3271): WARNING **: Exception in closure marshal. Line 12 in [undefined]: TypeError Result of expression '(GLib).idle_add' [undefined] is not a function. 

[Thread 0xb52efb70 (LWP 3275) exited]

bt
^C
Program received signal SIGINT, Interrupt.
0x0012d422 in __kernel_vsyscall ()
(gdb) bt
#0  0x0012d422 in __kernel_vsyscall ()
#1  0x00226b86 in poll () from /lib/tls/i686/cmov/libc.so.6
#2  0x0031441b in g_poll () from /lib/libglib-2.0.so.0
#3  0x00306d5c in ?? () from /lib/libglib-2.0.so.0
#4  0x003074c7 in g_main_loop_run () from /lib/libglib-2.0.so.0
#5  0x0132c3c9 in gtk_main () from /usr/lib/libgtk-x11-2.0.so.0
#6  0x003aa63f in ffi_call_SYSV () from /usr/lib/libffi.so.5
#7  0x003aa46f in ffi_call () from /usr/lib/libffi.so.5
#8  0x0039c799 in g_function_info_invoke () from /usr/lib/libgirepository-1.0.so.0
#9  0x0013bb4a in seed_gobject_method_invoked (ctx=0xb636eec8, function=0xb593d4c0, this_object=0xb61be500, argumentCount=0, 
    arguments=0xbfffed10, exception=0xbfffed5c) at seed-engine.c:656
#10 0x00be20be in ?? () from /usr/lib/libwebkit-1.0.so.2
#11 0x00c28f1a in ?? () from /usr/lib/libwebkit-1.0.so.2
#12 0x028c36c7 in ?? ()
#13 0x00c3a7ce in ?? () from /usr/lib/libwebkit-1.0.so.2
#14 0x00cf5b66 in ?? () from /usr/lib/libwebkit-1.0.so.2
#15 0x00bdc4a9 in JSEvaluateScript () from /usr/lib/libwebkit-1.0.so.2
#16 0x0013866a in seed_simple_evaluate (ctx=0xb67a2064, 
    source=0x809d410 "var Gtk=((module).gi).Gtk;\n(Gtk).init(0,0);\nvar w=new (Gtk).Window({border_width:20});\nvar b=new (Gtk).Button({label:\"Foo\"});\n(w).add(b);\n(w).show_all();\n((b).signal).connect('clicked',(function(){\nre"..., exception=0xbffff0fc)
    at seed-api.c:305
#17 0x026e6b4e in seed_context_eval (ctx=0xb636e0f8, function=0xb6184b00, this_object=0xb6184480, argument_count=1, 
    arguments=0xbffff0b0, exception=0xbffff0fc) at seed-sandbox.c:64
#18 0x00bdd7a3 in ?? () from /usr/lib/libwebkit-1.0.so.2
#19 0x00c28f1a in ?? () from /usr/lib/libwebkit-1.0.so.2
#20 0x028c29e3 in ?? ()
#21 0x00c3a7ce in ?? () from /usr/lib/libwebkit-1.0.so.2
#22 0x00cf5b66 in ?? () from /usr/lib/libwebkit-1.0.so.2
#23 0x00bdc4a9 in JSEvaluateScript () from /usr/lib/libwebkit-1.0.so.2
#24 0x0013860c in seed_evaluate (ctx=0xb67a2e24, s=0x80579d8, this=0x0) at seed-api.c:279
#25 0x08048f01 in seed_exec (filename=0xbffff62e "run_as.js") at main.c:95
#26 0x08049134 in main (argc=3, argv=0xbffff4a4) at main.c:161

*/

var dispatch = {};
dispatch.locks = {};
dispatch.main = function(func) {
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE,function(){func();return false;});
}
dispatch.lock = function(name) {
    var lock = dispatch.locks[name];
    if(!lock) {
        lock = new GLib.StaticRecMutex;
        GLib.static_rec_mutex_init(lock);
        dispatch.locks[name] = lock;
    }
    GLib.static_rec_mutex_lock(lock)
}
dispatch.unlock = function(name) {
    GLib.static_rec_mutex_unlock(dispatch.locks[name]);
}
dispatch.background = function(func) {
    return GLib.thread_create_full(func, null, 0, true);
}
dispatch.join = function(thread) {
    return GLib.thread_join(thread);
}

var Gtk = module.gi.Gtk;
//Gtk.threads_init();

Gtk.init(0,0);

var w = new Gtk.Window: {border_width: 20};
var b = new Gtk.Button: {label: "Foo"};
w.add(b);
w.show_all();

b.signal.connect: \clicked, ^{
    dispatch.background: ^{
        var i=0;
        var x=1.3;
        for(i=0;i<9999999;i++) {
            x *= 1.000004;
        };
        print(x);
//        dispatch.main: ^{
//            b.label = "Bar"+x;
//        };
        GLib.idle_add: GLib.PRIORITY_DEFAULT_IDLE, ^{
            b.label = "Bar"+x;
            0;
        };
    };
};

Gtk.main();

