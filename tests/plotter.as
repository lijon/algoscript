Gtk = import gi.Gtk;
Gtk.init(0,0);
cairo = import cairo;

Plotter = class
{
    init: { src=[] ->
        @set_source: src;
        @win = new Gtk.Window;
        @dar = new Gtk.DrawingArea;
        @peak = 0;
        @win.add: @dar;
        @win.show_all();
        @dar.signal.expose_event.connect(@on_expose.bind(this));
        @update();
    },
    set_source: { s ->
        @src_obj = s;
        @peak = 0;
        s.do: { x -> if x>@peak @peak=x };
        @update();
    },
    on_expose: { d ->
        var cr = new cairo.Context.from_drawable(d.window);
        var size = d.window.get_size();
        cr.line_width = 2;
        cr.set_source_rgb(0,0,0);
        var dx = size.width/@src_obj.length;
        var x = 0;
        cr.move_to(x,size.height/2);
        print: dx;
        @src_obj.do: { val ->
            cr.line_to(x, val);
            x += dx;
        };
        cr.stroke();
        cr.destroy();
        false;
    },
    update: { ->
        if @dar
            @dar.queue_draw();
    }
};

p = new Plotter:[1,4,2,5,3,8,7,5];
p.set_source: [0..50].scramble();

Gtk.main();
//Gtk.main_quit()

