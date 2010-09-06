/*
    Read AlgoScript code from stdin and eval it inside a GTK mainloop.
    Results are printed to a logwindow.
    Code is terminated by ^E (ASCII 0x05).
*/


/*

some errors aren't printed in the log window, exceptions in signal handlers for example,
which are printed with g_warning.. (g_log)

GLib.set_print_handler seems to work fine, but not GLib.log_set_default_handler()...

would it be possible to just catch stdout and stderr and pass it to the log window instead
of redefining the print function?? I know how to do it with a child process but that makes
everything more complicated since there's no os.kill or os.killpg etc..

perhaps just fork and capture the child stdout, the parent would just forward its stdin to
the child.. if the child watches with iocondition HUP it should get an eof when the parent is killed?
both child and parent would run a gtk mainloop. the parent would have the log window and stuff..

also have a switch to not create log window, for situations where one wants to get the stdout from
as_shell..

*/

var Gtk = imports.gi.Gtk;
var os = imports.os;
var algoscript = imports.algoscript;
var rc_style = 'style "monofont" { font_name = "Mono 9" }\nwidget "*.as_log_textview" style "monofont"\n';

Gtk.init(null, null);
Gtk.rc_parse_string(rc_style);

var window = new Gtk.Window({
    title:"AlgoScript log output",
    default_width:400,
    default_height:600,
});
var scroll = new Gtk.ScrolledWindow({
    hscrollbar_policy:Gtk.PolicyType.AUTOMATIC
});
var view = new Gtk.TextView({
    editable:0,
    wrap_mode:Gtk.WrapMode.WORD_CHAR,
    name:'as_log_textview',
    left_margin:4,
    right_margin:4
});
var end = new Gtk.TextIter();
var start = new Gtk.TextIter();
var buffer = view.buffer;

window.signal.connect('delete-event',function() { return true; });
scroll.add(view);
window.add(scroll);
window.show_all();
//window.resize(400, 600);
buffer.get_end_iter(end);

//FIXME: can't get this tag thing to work...
var error_tag = new Gtk.TextTag;
buffer.tag_table.add(error_tag);
error_tag.foreground="red";
error_tag.foreground_set=1;

var _print = function(s) {
    buffer.get_end_iter(end);
    buffer.insert(end, s, -1);
    view.scroll_mark_onscreen(buffer.get_insert()); //better to get end iter as mark, or move cursor to end first?
}
var _printerr = function(s) {
    buffer.get_end_iter(start);
    buffer.insert(start, s, -1);
    buffer.get_end_iter(end);
    buffer.apply_tag(error_tag, start, end);
    view.scroll_mark_onscreen(buffer.get_insert());
}

GLib.set_print_handler(_print);
GLib.set_printerr_handler(_printerr);
//algoscript.Context.default_globals.print = print;

var ctx = new algoscript.Context;
ctx.global.DEBUG = 0;
ctx.global.__script_path__ = __script_path__;
ctx.global.clear = function() {
    buffer.text = "";
}

//var pipes = os.pipe();
//var fd = pipes[1];
/*var fd = os.open("/tmp/as_shell.log",os.O_RDWR+os.O_CREAT);
os.close(1);
var newfd = os.dup(fd);
_print("newfd: "+newfd+" (should be 1)");
os.close(fd);

//var stdout = GLib.io_channel_unix_new(pipes[0]);
var stdout = GLib.io_channel_unix_new(newfd);
//GLib.io_channel_set_flags(stdout,GLib.IOFlags.NONBLOCK);
GLib.io_add_watch(stdout, 0, GLib.IOCondition.IN, function(source, condition, data) {
    _print("TEST");
    var x = new GLib.String;
    GLib.io_channel_read_line_string(source,x);
    _print(x.str);
    return true;
});
*/

//var pipes = os.pipe();
//os.dup2(1,pipes[1]);
//os.dup2(pipes[1],1);
//os.close(pipes[1]);
//var stdout = GLib.io_channel_unix_new(pipes[0]);
/*var fd = os.dup(1);
_print(fd);
var stdout = GLib.io_channel_unix_new(fd);
//os.close(pipes[0]);
//os.close(1);
GLib.io_channel_set_flags(stdout,GLib.IOFlags.NONBLOCK);
os.close(1);
//GLib.io_add_watch(stdout, 0, GLib.IOCondition.OUT + GLib.IOCondition.IN + GLib.IOCondition.PRI, function(source,
GLib.io_add_watch(stdout, 0, GLib.IOCondition.IN, function(source, condition, data) {
//    _print("TEST");
    var x = new GLib.String;
    GLib.io_channel_read_line_string(source,x);
    _print(x.str);
    return true;
});
*/
print("AlgoScript interactive shell\nset DEBUG=1 for more output");

var codebuf = "";
var linebuf = new GLib.String;

var stdin = GLib.io_channel_unix_new(0);

GLib.io_add_watch(stdin, 0, GLib.IOCondition.IN, function(source, condition, data)
{
    GLib.io_channel_read_line_string(source,linebuf);
    codebuf += linebuf.str;
    
//    _print("Got something: "+codebuf+".");
    
    if(codebuf.slice(codebuf.length-2)!="\x05\n")
        return true;
        
    var str = codebuf.slice(0,codebuf.length-2);
    codebuf = "";
        
    try {
        var js = algoscript.parse(str);
        if(ctx.global.DEBUG)
            print(" => "+js);
        try { // runtime error
            var res = ctx.eval_js(js);
            if(ctx.global.DEBUG)
                print(JSON.stringify(res));
            else if(res!==undefined)
                print(res);
            //FIXME: always use JSON but ignore imported modules
            //or at least shorten very long strings..
        }
        catch(e) {
            print(e.name+": "+e.message);
        }
    } catch(e) { //parse error
        print(e.name+": "+e.message);
    }
    return true;
});

/*var stdout = GLib.io_channel_unix_new(1);
var outbuf = new GLib.String;
GLib.io_add_watch(stdout, 0, GLib.IOCondition.IN, function(source, condition, data)
{
    GLib.io_channel_read_line_string(source,outbuf);
    print(outbuf.str);
});

var stderr = GLib.io_channel_unix_new(2);
var errbuf = new GLib.String;
GLib.io_add_watch(stderr, 0, GLib.IOCondition.IN, function(source, condition, data)
{
    GLib.io_channel_read_line_string(source,errbuf);
    print(errbuf.str);
});*/

Gtk.main();

