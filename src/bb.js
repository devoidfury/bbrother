/**@license
 * {{name}} <{{homepage}}>
 * Version: {{version}} ({{build_date}})
 * License: {{license}}
 */
(function(window) {
    function makeArray(args) { return Array.prototype.slice.apply(args) }

    var loggers = {},
        opts = window.bb_opts || {};

    // util
    function nop() {}
    function inherit(orig, proto) {
        for (var prop in proto) {
            if (proto.hasOwnProperty(prop)){
                orig[prop] = proto[prop];
            }
        }
    }

    function Logger (name, opts, parent) {
        var self;
        if (!opts && name && name.opts) {
            self = name;
            inherit(self, Logger.prototype);
            opts = self.opts;
            parent = self.parent;
            name = self.name.split('.').pop();
        } else {
            self = this;
            if (!(self instanceof Logger)) return new Logger(name, opts, parent);
        }

        self.opts = opts || {};
        self.parent = parent;

        if (parent)
            name = [parent.name, name].join('.');


        self.events = [];

        self.name = name;
        self.level = self.opts.level || 0;
        self.sendCall = self.opts.sendCall || false;
        self.callback = self.opts.callback || nop;

        self.logNumber = Logger.count++;

        if (self.sendCall) {
            window["catchResponse" + self.logNumber] = self.opts.catchResponse || nop;
        }
        loggers[self.name] = self;
    }
    Logger.count = 0;
    Logger.levels = {
        TRUE_ERR:5,
        ERR:4,
        WARN:3,
        INFO:2,
        DEBUG:1,
        LOG:0
    };

    Logger.prototype = {
        log: function () { this.send(makeArray(arguments), Logger.levels.LOG) },
        debug: function () { this.send(makeArray(arguments), Logger.levels.DEBUG) },
        info: function () { this.send(makeArray(arguments), Logger.levels.INFO) },
        warn: function () { this.send(makeArray(arguments), Logger.levels.WARN) },
        err: function () { this.send(makeArray(arguments), Logger.levels.ERR) },

        pushEvent: function (args, lvl, name) {
            this.events.push({name:name, lvl:lvl, args:args});
            if (this.parent) {
                this.parent.pushEvent(args, lvl, name);
            }
        },
        send: function (args, lvl) {
            if (!(args instanceof Array))  args = [args];
            if (lvl >= this.level) {
                if (args.length === 1) args = args[0];
                this.pushEvent(args, lvl, this.name);
                this.callback(args, lvl, this.name);

                if (this.sendCall) this.sendRequest(args, lvl)
            }
        },
        sendRequest: function (args, lvl) {
            var data = encodeURIComponent(JSON.stringify(args)),
                script = document.createElement('script'),
                qs = '?n=' + encodeURIComponent(this.name);

            qs += '&l=' + lvl + '&d=' + data;
            qs += '&cb=catchResponse' + this.logNumber;

            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', this.sendCall + qs);

            var loadPoint = document.getElementById('bb');
            loadPoint.parentNode.insertBefore(script, loadPoint);
        },

        sub: function (name, opts) {
            return new Logger(name, opts, this);
        }
    };

    // load temp logs if anything happened before we were loaded.
    // async-loader only.
    var orig_loggers = window.loggers || [],
        logs = window.bbt || [];

    for (var i = 0; i < orig_loggers.length; i++) {
        if (!loggers[orig_loggers[i].name]) { Logger(orig_loggers[i]); }
    }
    for (i = 0; i < logs.length; i++) {
        loggers[logs[i][2]].send(makeArray(logs[i][0]), logs[i][1])
    }

    // get/create the main logger
    var bb = loggers[opts.name || 'main'] || new Logger(opts.name || 'main', opts);

    // make it available
    window[opts.global_name || 'bb'] = bb;

    // attach to window.onerror
    window.onerror = function (/*errMsg, url, lineno*/) {
        bb.send(makeArray(arguments), Logger.levels.TRUE_ERR);
        return bb.suppressErrors;
    };
})(window);