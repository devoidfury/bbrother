/**@license
 * {{name}} <{{homepage}}>
 * Version: {{version}} ({{build_date}})
 * License: {{license}} */
/* @usage
    To load bb.js asynchronously, use this script inline. Wrap in
    <script type="text/javascript" id="bb">
     var bb_opts = {
        path: "../src/bb.js", // path to bb.js
        // ... other logger options
     };

     // bb-loader source here

    </script>
 */
(function (window, document) {
    var loader = document.getElementById('bb'),
        scr = document.createElement('script');
    window['bbt'] = [];
    window['loggers'] = [];
    var bb_creator = function (n, o, p) {
        var self = this;
        o = o || {};
        window['loggers'].push(self);
        var fake_log = function (n) {
            return function () {
                window['bbt'].push([arguments, n, self.name]);
            };
        };
        self.parent = p;
        self.opts = o;
        self.name = (p && p.name ? p.name + '.' : '') + n;
        self.log = fake_log(5);
        self.debug = fake_log(4);
        self.info = fake_log(3);
        self.warn = fake_log(2);
        self.err = fake_log(1);
        self.true_err = fake_log(0);
        self.sub = function (n) {
            return new bb_creator(n, self.name, self);
        };
    };
    var bb = new bb_creator(bb_opts.name || 'main', bb_opts);
    window.onerror = function () { bb.true_err(arguments); };
    scr.type = 'text/javascript';
    scr.src = (bb_opts.path);
    loader.parentNode.insertBefore(scr, loader);
    window['bb'] = bb;
})(window, document);