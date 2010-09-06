var algoscript = imports.algoscript;
var GLib = imports.gi.GLib;
var ctx = new algoscript.Context;
ctx.global.DEBUG = 0;

ctx.global.__script_path__ = __script_path__;

var argv = imports.platform.argv;
    
if(argv.length>2) {
    var io = imports.gi.Gio;
    var script = io.simple_read(argv[2]);
    var js = algoscript.parse(script);
//    print("[\n"+js+"]\n\n");
    ctx.global.__script_path__ = GLib.path_get_dirname(imports.os.realpath(argv[2]));
    ctx.eval_js(js);
    imports.platform.quit();
}

var rl = imports.readline;
print("AlgoScript interactive shell\nset DEBUG=1 for more output");
//var shell = function() {
while(1) {
    var str = rl.readline("> ");
    if(!str) continue;
    var js;
    try {
        js = algoscript.parse(str);
        if(ctx.global.DEBUG)
            print(" => "+js);
        try { // runtime error
            var res = ctx.eval_js(js);
            if(ctx.global.DEBUG)
                print(JSON.stringify(res));
            else if(res!==undefined)
                print(res);
        }
        catch(e) {
            print(e.name+": "+e.message);
        }
    } catch(e) { //parse error
        print(e.name+": "+e.message);
    }
}
//}

//var gtk = imports.gi.Gtk;
//gtk.init(0,0);
//GLib.thread_create_full(shell, null, 0, true);
//gtk.main();

ctx.destroy();

