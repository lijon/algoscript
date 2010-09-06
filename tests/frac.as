// ASCII Mandelbrot fractal
var mandelbrot = ^(w,h,it,x1,y1,x2,y2) {
    var a, b, c, i, dx = (x2-x1)/w, dy = (y2-y1)/h;
    for (var y = y1; y < y2; y += dy) {
        for (var line = "", x = x1; x < x2; x += dx) {
            for (a = b = c = i = 0; i < it; i++) {
                var z = a*a-b*b;
                b = 2*a*b+y;
                a = z+x;
                if (z > 4) break;
            };
            line += String.fromCharCode (i+39);
        };
		print (line);
    };
};
mandelbrot (110, 40, 70, -2, -1.5, 1, 1.5);


