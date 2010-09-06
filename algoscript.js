/*
    This is the AlgoScript module, to be used from javascript:

    var ctx = new imports.algoscript.Context;
    ctx.global.foobar = 123;
    var result = ctx.eval(codestring);
    ctx.destroy();

    It also exposes a 'module' object to the contexts, which work just
    like seed 'imports' but also evaluates algoscripts (*.as)
*/

(function(){

// PRIVATE:
//var parser = imports.platform.scoped_include(__script_path__+'/as_parser.js');
var parser = imports.as_parser;
var GLib = imports.gi.GLib;
var _module_imports = {};

var make_importer = function(startPath, chain) {
//    var o = new imports.autoprop.Object;
    var o = imports.DynamicObject.create({
        getProperty: function(name) {
            if(name==="searchPath") return imports.searchPath;
            var searchPath = startPath || imports.searchPath;
            
            for(var i=0;i<searchPath.length;i++) {
                var path = searchPath[i];
                //NOTE: this.__script_path__ refers to the one in the calling context
                if(path==='.')
                    path = this.__script_path__ || GLib.get_current_dir();

                var file = path+'/'+name;
                var file_als = file+'.as';
                
//                print("Looking for "+file);
                
                if(_module_imports[file]) {
    //                print("Reusing cached object");
                    return _module_imports[file];
                }
                    
                if(GLib.file_test(file,GLib.FileTest.IS_DIR)) {
    //                print("Found dir, returning importer object");
                    return _module_imports[file]=make_importer([file],chain.concat(name));
                } else if(GLib.file_test(file_als,GLib.FileTest.IS_REGULAR)) {
    //                print("Found file, evaluating...");
                    var script = {};
                    GLib.file_get_contents(file_als,script);
                    var ctx = new Context;
                    ctx.global.__script_path__ = path;
                    ctx.eval(script.contents);
    //                print("Returning namespace for "+file_als);
    //FIXME: filter out private variables?
                    return _module_imports[file]=ctx.global;
                }
            }
    //        print("Seed imports fallback...");
            // fallback to seed imports
            var ns = imports;
            for(var i=0;i<chain.length;i++)
                ns = ns[chain[i]];
            return ns[name] || null;
        },
        setProperty: function(name, value) {
            if(name === "searchPath") {
                imports.searchPath = value;
                return true;
            }
            return false; //or true to not allow custom props to be set..
        }
    });
    return o;
}

var _root_module = make_importer(undefined, []);

var eval_file_in_context = function(ctx, fn) {
    var script = {};
    GLib.file_get_contents(fn,script);
    return ctx.eval(script.contents);
};

var Context = function() {
    var ctx = new imports.sandbox.Context();
    var script = {};
    ctx.add_globals();
    for(var k in Context.default_globals) {
        if(Context.default_globals.hasOwnProperty(k))
            ctx.global[k] = Context.default_globals[k];
    }
    eval_file_in_context(ctx,__script_path__+'/as_extensions.js');

    var g = ctx.global;
    g.__context__ = this;
    g.module = _root_module;
    g.eval = function(str) { return this.__context__.eval(str); }

    this.global = g;
    this._ctx = ctx;
}
Context.prototype.eval = function(str,config) {
    return this._ctx.eval(parser.__as_parse(str,config));
}
Context.prototype.eval_js = function(str) {
    return this._ctx.eval(str);
}
Context.prototype.destroy = function() {
    return this._ctx.destroy();
}
Context.default_globals = {};

// PUBLIC:
this.Context = Context;
this.parse = parser.__as_parse;

})();

