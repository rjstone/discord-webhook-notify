export const id = 596;
export const ids = [596];
export const modules = {

/***/ 43596:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var fs = __webpack_require__(79896)

var wx = 'wx'
if (process.version.match(/^v0\.[0-6]/)) {
  var c = __webpack_require__(49140)
  wx = c.O_TRUNC | c.O_CREAT | c.O_WRONLY | c.O_EXCL
}

var os = __webpack_require__(70857)
exports.filetime = 'ctime'
if (os.platform() == "win32") {
  exports.filetime = 'mtime'
}

var debug
var util = __webpack_require__(39023)
if (util.debuglog)
  debug = util.debuglog('LOCKFILE')
else if (/\blockfile\b/i.test(process.env.NODE_DEBUG))
  debug = function() {
    var msg = util.format.apply(util, arguments)
    console.error('LOCKFILE %d %s', process.pid, msg)
  }
else
  debug = function() {}

var locks = {}

function hasOwnProperty (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

var onExit = __webpack_require__(66627)
onExit(function () {
  debug('exit listener')
  // cleanup
  Object.keys(locks).forEach(exports.unlockSync)
})

// XXX https://github.com/joyent/node/issues/3555
// Remove when node 0.8 is deprecated.
if (/^v0\.[0-8]\./.test(process.version)) {
  debug('uncaughtException, version = %s', process.version)
  process.on('uncaughtException', function H (er) {
    debug('uncaughtException')
    var l = process.listeners('uncaughtException').filter(function (h) {
      return h !== H
    })
    if (!l.length) {
      // cleanup
      try { Object.keys(locks).forEach(exports.unlockSync) } catch (e) {}
      process.removeListener('uncaughtException', H)
      throw er
    }
  })
}

exports.unlock = function (path, cb) {
  debug('unlock', path)
  // best-effort.  unlocking an already-unlocked lock is a noop
  delete locks[path]
  fs.unlink(path, function (unlinkEr) { cb && cb() })
}

exports.unlockSync = function (path) {
  debug('unlockSync', path)
  // best-effort.  unlocking an already-unlocked lock is a noop
  try { fs.unlinkSync(path) } catch (er) {}
  delete locks[path]
}


// if the file can be opened in readonly mode, then it's there.
// if the error is something other than ENOENT, then it's not.
exports.check = function (path, opts, cb) {
  if (typeof opts === 'function') cb = opts, opts = {}
  debug('check', path, opts)
  fs.open(path, 'r', function (er, fd) {
    if (er) {
      if (er.code !== 'ENOENT') return cb(er)
      return cb(null, false)
    }

    if (!opts.stale) {
      return fs.close(fd, function (er) {
        return cb(er, true)
      })
    }

    fs.fstat(fd, function (er, st) {
      if (er) return fs.close(fd, function (er2) {
        return cb(er)
      })

      fs.close(fd, function (er) {
        var age = Date.now() - st[exports.filetime].getTime()
        return cb(er, age <= opts.stale)
      })
    })
  })
}

exports.checkSync = function (path, opts) {
  opts = opts || {}
  debug('checkSync', path, opts)
  if (opts.wait) {
    throw new Error('opts.wait not supported sync for obvious reasons')
  }

  try {
    var fd = fs.openSync(path, 'r')
  } catch (er) {
    if (er.code !== 'ENOENT') throw er
    return false
  }

  if (!opts.stale) {
    try { fs.closeSync(fd) } catch (er) {}
    return true
  }

  // file exists.  however, might be stale
  if (opts.stale) {
    try {
      var st = fs.fstatSync(fd)
    } finally {
      fs.closeSync(fd)
    }
    var age = Date.now() - st[exports.filetime].getTime()
    return (age <= opts.stale)
  }
}



var req = 1
exports.lock = function (path, opts, cb) {
  if (typeof opts === 'function') cb = opts, opts = {}
  opts.req = opts.req || req++
  debug('lock', path, opts)
  opts.start = opts.start || Date.now()

  if (typeof opts.retries === 'number' && opts.retries > 0) {
    debug('has retries', opts.retries)
    var retries = opts.retries
    opts.retries = 0
    cb = (function (orig) { return function cb (er, fd) {
      debug('retry-mutated callback')
      retries -= 1
      if (!er || retries < 0) return orig(er, fd)

      debug('lock retry', path, opts)

      if (opts.retryWait) setTimeout(retry, opts.retryWait)
      else retry()

      function retry () {
        opts.start = Date.now()
        debug('retrying', opts.start)
        exports.lock(path, opts, cb)
      }
    }})(cb)
  }

  // try to engage the lock.
  // if this succeeds, then we're in business.
  fs.open(path, wx, function (er, fd) {
    if (!er) {
      debug('locked', path, fd)
      locks[path] = fd
      return fs.close(fd, function () {
        return cb()
      })
    }

    debug('failed to acquire lock', er)

    // something other than "currently locked"
    // maybe eperm or something.
    if (er.code !== 'EEXIST') {
      debug('not EEXIST error', er)
      return cb(er)
    }

    // someone's got this one.  see if it's valid.
    if (!opts.stale) return notStale(er, path, opts, cb)

    return maybeStale(er, path, opts, false, cb)
  })
  debug('lock return')
}


// Staleness checking algorithm
// 1. acquire $lock, fail
// 2. stat $lock, find that it is stale
// 3. acquire $lock.STALE
// 4. stat $lock, assert that it is still stale
// 5. unlink $lock
// 6. link $lock.STALE $lock
// 7. unlink $lock.STALE
// On any failure, clean up whatever we've done, and raise the error.
function maybeStale (originalEr, path, opts, hasStaleLock, cb) {
  fs.stat(path, function (statEr, st) {
    if (statEr) {
      if (statEr.code === 'ENOENT') {
        // expired already!
        opts.stale = false
        debug('lock stale enoent retry', path, opts)
        exports.lock(path, opts, cb)
        return
      }
      return cb(statEr)
    }

    var age = Date.now() - st[exports.filetime].getTime()
    if (age <= opts.stale) return notStale(originalEr, path, opts, cb)

    debug('lock stale', path, opts)
    if (hasStaleLock) {
      exports.unlock(path, function (er) {
        if (er) return cb(er)
        debug('lock stale retry', path, opts)
        fs.link(path + '.STALE', path, function (er) {
          fs.unlink(path + '.STALE', function () {
            // best effort.  if the unlink fails, oh well.
            cb(er)
          })
        })
      })
    } else {
      debug('acquire .STALE file lock', opts)
      exports.lock(path + '.STALE', opts, function (er) {
        if (er) return cb(er)
        maybeStale(originalEr, path, opts, true, cb)
      })
    }
  })
}

function notStale (er, path, opts, cb) {
  debug('notStale', path, opts)

  // if we can't wait, then just call it a failure
  if (typeof opts.wait !== 'number' || opts.wait <= 0) {
    debug('notStale, wait is not a number')
    return cb(er)
  }

  // poll for some ms for the lock to clear
  var now = Date.now()
  var start = opts.start || now
  var end = start + opts.wait

  if (end <= now)
    return cb(er)

  debug('now=%d, wait until %d (delta=%d)', start, end, end-start)
  var wait = Math.min(end - start, opts.pollPeriod || 100)
  var timer = setTimeout(poll, wait)

  function poll () {
    debug('notStale, polling', path, opts)
    exports.lock(path, opts, cb)
  }
}

exports.lockSync = function (path, opts) {
  opts = opts || {}
  opts.req = opts.req || req++
  debug('lockSync', path, opts)
  if (opts.wait || opts.retryWait) {
    throw new Error('opts.wait not supported sync for obvious reasons')
  }

  try {
    var fd = fs.openSync(path, wx)
    locks[path] = fd
    try { fs.closeSync(fd) } catch (er) {}
    debug('locked sync!', path, fd)
    return
  } catch (er) {
    if (er.code !== 'EEXIST') return retryThrow(path, opts, er)

    if (opts.stale) {
      var st = fs.statSync(path)
      var ct = st[exports.filetime].getTime()
      if (!(ct % 1000) && (opts.stale % 1000)) {
        // probably don't have subsecond resolution.
        // round up the staleness indicator.
        // Yes, this will be wrong 1/1000 times on platforms
        // with subsecond stat precision, but that's acceptable
        // in exchange for not mistakenly removing locks on
        // most other systems.
        opts.stale = 1000 * Math.ceil(opts.stale / 1000)
      }
      var age = Date.now() - ct
      if (age > opts.stale) {
        debug('lockSync stale', path, opts, age)
        exports.unlockSync(path)
        return exports.lockSync(path, opts)
      }
    }

    // failed to lock!
    debug('failed to lock', path, opts, er)
    return retryThrow(path, opts, er)
  }
}

function retryThrow (path, opts, er) {
  if (typeof opts.retries === 'number' && opts.retries > 0) {
    var newRT = opts.retries - 1
    debug('retryThrow', path, opts, newRT)
    opts.retries = newRT
    return exports.lockSync(path, opts)
  }
  throw er
}



/***/ }),

/***/ 66627:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
// grab a reference to node's real process object right away
var process = global.process

const processOk = function (process) {
  return process &&
    typeof process === 'object' &&
    typeof process.removeListener === 'function' &&
    typeof process.emit === 'function' &&
    typeof process.reallyExit === 'function' &&
    typeof process.listeners === 'function' &&
    typeof process.kill === 'function' &&
    typeof process.pid === 'number' &&
    typeof process.on === 'function'
}

// some kind of non-node environment, just no-op
/* istanbul ignore if */
if (!processOk(process)) {
  module.exports = function () {
    return function () {}
  }
} else {
  var assert = __webpack_require__(42613)
  var signals = __webpack_require__(41430)
  var isWin = /^win/i.test(process.platform)

  var EE = __webpack_require__(24434)
  /* istanbul ignore if */
  if (typeof EE !== 'function') {
    EE = EE.EventEmitter
  }

  var emitter
  if (process.__signal_exit_emitter__) {
    emitter = process.__signal_exit_emitter__
  } else {
    emitter = process.__signal_exit_emitter__ = new EE()
    emitter.count = 0
    emitter.emitted = {}
  }

  // Because this emitter is a global, we have to check to see if a
  // previous version of this library failed to enable infinite listeners.
  // I know what you're about to say.  But literally everything about
  // signal-exit is a compromise with evil.  Get used to it.
  if (!emitter.infinite) {
    emitter.setMaxListeners(Infinity)
    emitter.infinite = true
  }

  module.exports = function (cb, opts) {
    /* istanbul ignore if */
    if (!processOk(global.process)) {
      return function () {}
    }
    assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler')

    if (loaded === false) {
      load()
    }

    var ev = 'exit'
    if (opts && opts.alwaysLast) {
      ev = 'afterexit'
    }

    var remove = function () {
      emitter.removeListener(ev, cb)
      if (emitter.listeners('exit').length === 0 &&
          emitter.listeners('afterexit').length === 0) {
        unload()
      }
    }
    emitter.on(ev, cb)

    return remove
  }

  var unload = function unload () {
    if (!loaded || !processOk(global.process)) {
      return
    }
    loaded = false

    signals.forEach(function (sig) {
      try {
        process.removeListener(sig, sigListeners[sig])
      } catch (er) {}
    })
    process.emit = originalProcessEmit
    process.reallyExit = originalProcessReallyExit
    emitter.count -= 1
  }
  module.exports.unload = unload

  var emit = function emit (event, code, signal) {
    /* istanbul ignore if */
    if (emitter.emitted[event]) {
      return
    }
    emitter.emitted[event] = true
    emitter.emit(event, code, signal)
  }

  // { <signal>: <listener fn>, ... }
  var sigListeners = {}
  signals.forEach(function (sig) {
    sigListeners[sig] = function listener () {
      /* istanbul ignore if */
      if (!processOk(global.process)) {
        return
      }
      // If there are no other listeners, an exit is coming!
      // Simplest way: remove us and then re-send the signal.
      // We know that this will kill the process, so we can
      // safely emit now.
      var listeners = process.listeners(sig)
      if (listeners.length === emitter.count) {
        unload()
        emit('exit', null, sig)
        /* istanbul ignore next */
        emit('afterexit', null, sig)
        /* istanbul ignore next */
        if (isWin && sig === 'SIGHUP') {
          // "SIGHUP" throws an `ENOSYS` error on Windows,
          // so use a supported signal instead
          sig = 'SIGINT'
        }
        /* istanbul ignore next */
        process.kill(process.pid, sig)
      }
    }
  })

  module.exports.signals = function () {
    return signals
  }

  var loaded = false

  var load = function load () {
    if (loaded || !processOk(global.process)) {
      return
    }
    loaded = true

    // This is the number of onSignalExit's that are in play.
    // It's important so that we can count the correct number of
    // listeners on signals, and don't wait for the other one to
    // handle it instead of us.
    emitter.count += 1

    signals = signals.filter(function (sig) {
      try {
        process.on(sig, sigListeners[sig])
        return true
      } catch (er) {
        return false
      }
    })

    process.emit = processEmit
    process.reallyExit = processReallyExit
  }
  module.exports.load = load

  var originalProcessReallyExit = process.reallyExit
  var processReallyExit = function processReallyExit (code) {
    /* istanbul ignore if */
    if (!processOk(global.process)) {
      return
    }
    process.exitCode = code || /* istanbul ignore next */ 0
    emit('exit', process.exitCode, null)
    /* istanbul ignore next */
    emit('afterexit', process.exitCode, null)
    /* istanbul ignore next */
    originalProcessReallyExit.call(process, process.exitCode)
  }

  var originalProcessEmit = process.emit
  var processEmit = function processEmit (ev, arg) {
    if (ev === 'exit' && processOk(global.process)) {
      /* istanbul ignore else */
      if (arg !== undefined) {
        process.exitCode = arg
      }
      var ret = originalProcessEmit.apply(this, arguments)
      /* istanbul ignore next */
      emit('exit', process.exitCode, null)
      /* istanbul ignore next */
      emit('afterexit', process.exitCode, null)
      /* istanbul ignore next */
      return ret
    } else {
      return originalProcessEmit.apply(this, arguments)
    }
  }
}


/***/ }),

/***/ 41430:
/***/ ((module) => {

// This is not the set of all possible signals.
//
// It IS, however, the set of all signals that trigger
// an exit on either Linux or BSD systems.  Linux is a
// superset of the signal names supported on BSD, and
// the unknown signals just fail to register, so we can
// catch that easily enough.
//
// Don't bother with SIGKILL.  It's uncatchable, which
// means that we can't fire any callbacks anyway.
//
// If a user does happen to register a handler on a non-
// fatal signal like SIGWINCH or something, and then
// exit, it'll end up firing `process.emit('exit')`, so
// the handler will be fired anyway.
//
// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
// artificially, inherently leave the process in a
// state from which it is not safe to try and enter JS
// listeners.
module.exports = [
  'SIGABRT',
  'SIGALRM',
  'SIGHUP',
  'SIGINT',
  'SIGTERM'
]

if (process.platform !== 'win32') {
  module.exports.push(
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT'
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  )
}

if (process.platform === 'linux') {
  module.exports.push(
    'SIGIO',
    'SIGPOLL',
    'SIGPWR',
    'SIGSTKFLT',
    'SIGUNUSED'
  )
}


/***/ })

};
