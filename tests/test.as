//[10..20].map({x->x*x}).do: {x,i ->
//    print('value '+x+' at index '+i);
//};

//ctx = new algoscript.Context;
//ctx.global.y = \abc;
//ctx.eval('10.do: {x -> print(x+y)}');

gtk = module.gi.Gtk;
gtk.init(0,0);

w = new gtk.Window: {title: \Test, border_width: 20};
w.signal.connect: \hide, gtk.main_quit;
b = new gtk.Button: {label: 'Press me...'};
w.add: b;

b.signal.connect: \clicked, ^(widget) {widget.label = 'Okay!'};

w.show_all();

gtk.main();


