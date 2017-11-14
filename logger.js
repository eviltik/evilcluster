const winston = require('winston');
const cluster = require('cluster');
const util = require('util');
const path = require('path');
const fs = require('fs');
const sprintf = require('sprintf').sprintf;

process.argz = require('minimist')(process.argv.slice(2));

let event;
let allowedMessageCount = [5,10,50,100,500,1000,2000,5000,10000,50000,100000,500000,1000000];
let lastMessage = '';
let lastMessageRepeat = 0;
let regexpDebug;
let message;

if (process.argz.debug) process.argz.logLevel = 'debug';

let winstonTransportOptions = {
	//filename:process.argz.log || null,
	json:false,
	colorize: true,
	level: 'debug', // log level is handle by before winston transporter
	timestamp: function() {
		var d = new Date();
		var h = (d.getHours() < 10 ? "0" : "") + d.getHours();
		var m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
		var s = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();
		var mm = d.getMilliseconds();
		if (mm < 10) mm = '0' + mm;
		if (mm < 100) mm = '0' + mm;
		var date = h + ':' + m + ':' + s + '.' + mm;
		var ms = ' | '+sprintf('%10s',(process.argz.worker || 'master'));
		return date + ms;
	}
};


/**
 * reopen log files when SIGUP received from logrotate
 */
function reopenTransportOnHupSignal(fileTransport) {

	// workaround for circular require
	// wait for eventManager (which depend on logger) to be fully initialized first

	if (!process.sockmq) return;

	process.nextTick(function reopenTransportOnHupSignalNextTick() {

		process.sockmq.on('event.signal.sigterm', function () {
			log.info('logger: flushing logs due to SIGTERM');
			fileTransport.flush();
		});

		process.sockmq.on('event.signal.sighup', function () {

			log.info('logger: reopening log files due to SIGHUP');

			let fullname = path.join(fileTransport.dirname, fileTransport._getFile(false));

			function reopen() {
				if (fileTransport._stream) {
					fileTransport._stream.end();
					fileTransport._stream.destroySoon();
				}

				let stream = fs.createWriteStream(fullname, fileTransport.options);
				stream.setMaxListeners(Infinity);

				fileTransport._size = 0;
				fileTransport._stream = stream;

				fileTransport.once('flush', function () {
					log.info('logger: logs flushed');
					fileTransport.opening = false;
					fileTransport.emit('open', fullname);
				});

				fileTransport.flush();
			}

			fs.stat(fullname, function (err) {
				if (err && err.code == 'ENOENT') {
					return reopen();
				}
			});

		});

	});
}

process.nextTick(function reopenTransportOnHupSignalNextTick() {

	if (!process.sockmq) return;

	process.sockmq.on('event.configuration.debug.rdos.enabled', function() {
		process.argz.logLevel = 'debug';
		process.argz.debug = true;
		log.info('Debug mode enabled');
	});

	process.sockmq.on('event.configuration.debug.rdos.disabled', function() {
		process.argz.logLevel = 'info';
		process.argz.debug = undefined;
		log.info('Debug mode disabled');
	})

});

/**
 * prevent same message to be displayed too often
 */
function handleLastMessage(args,func) {
	message = util.format.apply(this,args);
	if (message != lastMessage) {
		lastMessage = message;
		lastMessageRepeat = 0;
		if (regexpDebug) {
			if (message.match(regexpDebug)) {
				return func(message);
			}
			return;
		}
		return func(message);
	}

	lastMessageRepeat++;

	if (lastMessageRepeat>1000000) {
		return func(' last message repeated more than 1000000 times: '+lastMessage);
	}

	if (allowedMessageCount.indexOf(lastMessageRepeat)>=0) {
		return func(' last message repeated '+lastMessageRepeat+' times: '+lastMessage);
	}

	if (lastMessageRepeat < 5) {
		return func(message);
	}
}


let transports = [];

let transportConsole = new (winston.transports.Console)(winstonTransportOptions);
transports.push(transportConsole);

let winstonLogger = new(winston.Logger)({transports: transports});

function isDebugEnabled() {
	return process.argz.debug;
}

let log = {
    _currentFileName : "unknown",
    _prependLogOrigin: function(str, forceDevInfo) {

		if ((isDebugEnabled() && process.argz.dev )|| forceDevInfo) {
			var origin = this.__stack[2];
			if (typeof str !== "string") {
				try {
					str = JSON.stringify(str, null, 2);
				} catch (e) {
					str = str + ' (' + e + ')';
				}
			}
			return this._currentFileName
				+ '::'
				+ (origin.getFunctionName() || origin.getMethodName() || "anonymous")
				+ '@' + origin.getLineNumber()
					//+':'+ origin.getColumnNumber()+' '
				+ (str ? (' | ' + str) : ' | entering');
		} else if (isDebugEnabled() && !process.argz.dev) {
				//var origin = this.__stack[2];
				if (typeof str !== "string") {
					try {
						str = JSON.stringify(str, null, 2);
					} catch(e) {
						str = str+' ('+e+')';
					}
				}
				return this._currentFileName
						//+':'+ origin.getColumnNumber()+' '
					+ (str ? (' | '+str) : ' | entering');
		} else if (process.argz.dev) {
			return this._currentFileName
				+ " | "
				+ (str || '>>');
		} else {
			return this._currentFileName
				+ " | "
				+ (str || '>>');
		}
    },

	info: function() {
		// Just add an extra space for a better alignment
		arguments[0] = ' '+arguments[0];
		handleLastMessage(arguments,winstonLogger.info);
	},

	debug: function() {

		//console.log(process.argz.debug);

		// ignore debug message when not in debug mode
		if (isDebugEnabled() === undefined) return;

		// ignore empty log.debug() is we are not dev+debug mode
		if (arguments[0] == undefined && !process.argz.dev) return;

		let argz = Array.prototype.slice.call(arguments);
		argz[0] = this._prependLogOrigin(argz[0]);

		// debug mode enabled, but no pattern specified
		if (isDebugEnabled() === true) {
			return handleLastMessage(argz, winstonLogger.debug);
		}

		// debug enabled with a pattern,
		// convert arguments into a string
		// and then match debug regexp pattern

		let str = context.worker+' '+Array.prototype.slice.call(argz).join(' ');
		if (str.match(regexpDebug)) {
			winstonLogger.debug(util.format.apply(this,argz));
		}
	},

	warn: function() {
        //arguments[0] = this._prependLogOrigin(arguments[0]);
		// Just add an extra space for a better alignment
		arguments[0] = ' ' + arguments[0];
		handleLastMessage(arguments, winstonLogger.warn);
	},

	error: function() {
        //arguments[0] = this._prependLogOrigin(arguments[0], process.argz.debug);
		//arguments[0] = ' ' + arguments[0];
		handleLastMessage(arguments, winstonLogger.error);
	}
};

Object.defineProperty(log, '__stack', {
    get: function() {
        let orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
		let err = new Error;
        Error.captureStackTrace(err, arguments.callee);
		let stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

module.exports = {
	log: log,
    logger : function logger(){
        return {
            __proto__ : log,
            _currentFileName : log.__stack[1].getFileName().replace(/.*\/server\//, '').replace(/\.js$/,'')
        };
    }
};