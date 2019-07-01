"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ramda = require("ramda");

var _timeout = _interopRequireDefault(require("./timeout"));

var _tlsUtils = _interopRequireDefault(require("./tls-utils"));

var _workerUtils = require("./worker-utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TCPSocket =
/*#__PURE__*/
function () {
  _createClass(TCPSocket, null, [{
    key: "open",
    value: function open(host, port) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return new TCPSocket({
        host: host,
        port: port,
        options: options
      });
    }
  }]);

  function TCPSocket(_ref) {
    var _this = this;

    var host = _ref.host,
        port = _ref.port,
        options = _ref.options;

    _classCallCheck(this, TCPSocket);

    this.host = host;
    this.port = port;
    this.ssl = false;
    this.bufferedAmount = 0;
    this.readyState = 'connecting';
    this.binaryType = (0, _ramda.propOr)('arraybuffer', 'binaryType')(options);

    if (this.binaryType !== 'arraybuffer') {
      throw new Error('Only arraybuffers are supported!');
    }

    this._ca = options.ca;
    this._useTLS = (0, _ramda.propOr)(false, 'useSecureTransport')(options);
    this._useSTARTTLS = false;
    this._socketId = 0;
    this._useLegacySocket = false;
    this._useForgeTls = false; // handles writes during starttls handshake, chrome socket only

    this._startTlsBuffer = [];
    this._startTlsHandshakeInProgress = false;
    chrome.runtime.getPlatformInfo(function (platformInfo) {
      if (platformInfo.os.indexOf('cordova') !== -1) {
        // chrome.sockets.tcp.secure is not functional on cordova
        // https://github.com/MobileChromeApps/mobile-chrome-apps/issues/269
        _this._useLegacySocket = false;
        _this._useForgeTls = true;
      } else {
        _this._useLegacySocket = true;
        _this._useForgeTls = false;
      }

      if (_this._useLegacySocket) {
        _this._createLegacySocket();
      } else {
        _this._createSocket();
      }
    });
  }
  /**
   * Creates a socket using the deprecated chrome.socket API
   */


  _createClass(TCPSocket, [{
    key: "_createLegacySocket",
    value: function _createLegacySocket() {
      var _this2 = this;

      chrome.socket.create('tcp', {}, function (createInfo) {
        _this2._socketId = createInfo.socketId;
        chrome.socket.connect(_this2._socketId, _this2.host, _this2.port, function (result) {
          if (result !== 0) {
            _this2.readyState = 'closed';

            _this2._emit('error', chrome.runtime.lastError);

            return;
          }

          _this2._onSocketConnected();
        });
      });
    }
    /**
     * Creates a socket using chrome.sockets.tcp
     */

  }, {
    key: "_createSocket",
    value: function _createSocket() {
      var _this3 = this;

      chrome.sockets.tcp.create({}, function (createInfo) {
        _this3._socketId = createInfo.socketId; // register for data events on the socket before connecting

        chrome.sockets.tcp.onReceive.addListener(function (readInfo) {
          if (readInfo.socketId === _this3._socketId) {
            // process the data available on the socket
            _this3._onData(readInfo.data);
          }
        }); // register for data error on the socket before connecting

        chrome.sockets.tcp.onReceiveError.addListener(function (readInfo) {
          if (readInfo.socketId === _this3._socketId) {
            // socket closed remotely or broken
            _this3.close();
          }
        });
        chrome.sockets.tcp.setPaused(_this3._socketId, true, function () {
          chrome.sockets.tcp.connect(_this3._socketId, _this3.host, _this3.port, function (result) {
            if (result < 0) {
              _this3.readyState = 'closed';

              _this3._emit('error', chrome.runtime.lastError);

              return;
            }

            _this3._onSocketConnected();
          });
        });
      });
    }
    /**
     * Invoked once a socket has been connected:
     * - Kicks off TLS handshake, if necessary
     * - Starts reading from legacy socket, if necessary
     */

  }, {
    key: "_onSocketConnected",
    value: function _onSocketConnected() {
      var _this4 = this;

      var read = function read() {
        if (_this4._useLegacySocket) {
          // the tls handshake is done let's start reading from the legacy socket
          _this4._readLegacySocket();

          _this4._emit('open');
        } else {
          chrome.sockets.tcp.setPaused(_this4._socketId, false, function () {
            _this4._emit('open');
          });
        }
      };

      if (!this._useTLS) {
        return read();
      } // do an immediate TLS handshake if this._useTLS === true


      this._upgradeToSecure(function () {
        read();
      });
    }
    /**
     * Handles the rough edges for differences between chrome.socket and chrome.sockets.tcp
     * for upgrading to a TLS connection with or without forge
     */

  }, {
    key: "_upgradeToSecure",
    value: function _upgradeToSecure() {
      var _this5 = this;

      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

      // invoked after chrome.socket.secure or chrome.sockets.tcp.secure have been upgraded
      var onUpgraded = function onUpgraded(tlsResult) {
        if (tlsResult !== 0) {
          _this5._emit('error', new Error('TLS handshake failed. Reason: ' + chrome.runtime.lastError.message));

          _this5.close();

          return;
        }

        _this5.ssl = true; // empty the buffer

        while (_this5._startTlsBuffer.length) {
          _this5.send(_this5._startTlsBuffer.shift());
        }

        callback();
      };

      if (!this._useLegacySocket && this.readyState !== 'open') {
        // use chrome.sockets.tcp.secure for TLS, not for STARTTLS!
        // use forge only for STARTTLS
        this._useForgeTls = false;
        chrome.sockets.tcp.secure(this._socketId, onUpgraded);
      } else if (this._useLegacySocket) {
        chrome.socket.secure(this._socketId, onUpgraded);
      } else if (this._useForgeTls) {
        // setup the forge tls client or webworker as tls fallback
        (0, _tlsUtils["default"])(this);
        callback();
      }
    }
  }, {
    key: "upgradeToSecure",
    value: function upgradeToSecure() {
      var _this6 = this;

      if (this.ssl || this._useSTARTTLS) {
        return;
      }

      this._useSTARTTLS = true;

      this._upgradeToSecure(function () {
        if (_this6._useLegacySocket) {
          _this6._readLegacySocket(); // tls handshake is done, restart reading

        }
      });
    }
    /**
     * Reads from a legacy chrome.socket.
     */

  }, {
    key: "_readLegacySocket",
    value: function _readLegacySocket() {
      var _this7 = this;

      if (this._socketId === 0) {
        // the socket is closed. omit read and stop further reads
        return;
      } // don't read from chrome.socket if we have chrome.socket.secure a handshake in progress!


      if ((this._useSTARTTLS || this._useTLS) && !this.ssl) {
        return;
      }

      chrome.socket.read(this._socketId, function (readInfo) {
        // socket closed remotely or broken
        if (readInfo.resultCode <= 0) {
          _this7._socketId = 0;

          _this7.close();

          return;
        } // process the data available on the socket


        _this7._onData(readInfo.data); // Queue the next read.
        // If a STARTTLS handshake might be upcoming, postpone this onto
        // the task queue so the IMAP client has a chance to call upgradeToSecure;
        // without this, we might eat the beginning of the handshake.
        // If we are already secure, just call it (for performance).


        if (_this7.ssl) {
          _this7._readLegacySocket();
        } else {
          (0, _timeout["default"])(function () {
            return _this7._readLegacySocket();
          });
        }
      });
    }
    /**
     * Invoked when data has been read from the socket. Handles cases when to feed
     * the data available on the socket to forge.
     *
     * @param {ArrayBuffer} buffer The binary data read from the socket
     */

  }, {
    key: "_onData",
    value: function _onData(buffer) {
      if ((this._useTLS || this._useSTARTTLS) && this._useForgeTls) {
        // feed the data to the tls client
        if (this._tlsWorker) {
          this._tlsWorker.postMessage((0, _workerUtils.createMessage)(_workerUtils.EVENT_INBOUND, buffer), [buffer]);
        } else {
          this._tls.processInbound(buffer);
        }
      } else {
        // emit data event
        this._emit('data', buffer);
      }
    }
    /**
     * Closes the socket
     * @return {[type]} [description]
     */

  }, {
    key: "close",
    value: function close() {
      this.readyState = 'closing';

      if (this._socketId !== 0) {
        if (this._useLegacySocket) {
          // close legacy socket
          chrome.socket.disconnect(this._socketId);
          chrome.socket.destroy(this._socketId);
        } else {
          // close socket
          chrome.sockets.tcp.disconnect(this._socketId);
        }

        this._socketId = 0;
      } // terminate the tls worker


      if (this._tlsWorker) {
        this._tlsWorker.terminate();

        this._tlsWorker = undefined;
      }

      this._emit('close');
    }
  }, {
    key: "send",
    value: function send(buffer) {
      if (!this._useForgeTls && this._useSTARTTLS && !this.ssl) {
        // buffer the unprepared data until chrome.socket(s.tcp) handshake is done
        this._startTlsBuffer.push(buffer);
      } else if (this._useForgeTls && (this._useTLS || this._useSTARTTLS)) {
        // give buffer to forge to be prepared for tls
        if (this._tlsWorker) {
          this._tlsWorker.postMessage((0, _workerUtils.createMessage)(_workerUtils.EVENT_OUTBOUND, buffer), [buffer]);
        } else {
          this._tls.prepareOutbound(buffer);
        }
      } else {
        // send the arraybuffer
        this._send(buffer);
      }
    }
  }, {
    key: "_send",
    value: function _send(data) {
      var _this8 = this;

      if (this._socketId === 0) {
        // the socket is closed.
        return;
      }

      if (this._useLegacySocket) {
        chrome.socket.write(this._socketId, data, function (writeInfo) {
          if (writeInfo.bytesWritten < 0 && _this8._socketId !== 0) {
            // if the socket is already 0, it has already been closed. no need to alert then...
            _this8._emit('error', new Error('Could not write ' + data.byteLength + ' bytes to socket ' + _this8._socketId + '. Chrome error code: ' + writeInfo.bytesWritten));

            _this8._socketId = 0;

            _this8.close();

            return;
          }

          _this8._emit('drain');
        });
      } else {
        chrome.sockets.tcp.send(this._socketId, data, function (sendInfo) {
          if (sendInfo.bytesSent < 0 && _this8._socketId !== 0) {
            // if the socket is already 0, it has already been closed. no need to alert then...
            _this8._emit('error', new Error('Could not write ' + data.byteLength + ' bytes to socket ' + _this8._socketId + '. Chrome error code: ' + sendInfo.bytesSent));

            _this8.close();

            return;
          }

          _this8._emit('drain');
        });
      }
    }
  }, {
    key: "_emit",
    value: function _emit(type, data) {
      var target = this;

      switch (type) {
        case 'open':
          this.readyState = 'open';
          this.onopen && this.onopen({
            target: target,
            type: type,
            data: data
          });
          break;

        case 'error':
          this.onerror && this.onerror({
            target: target,
            type: type,
            data: data
          });
          break;

        case 'data':
          this.ondata && this.ondata({
            target: target,
            type: type,
            data: data
          });
          break;

        case 'drain':
          this.ondrain && this.ondrain({
            target: target,
            type: type,
            data: data
          });
          break;

        case 'close':
          this.readyState = 'closed';
          this.onclose && this.onclose({
            target: target,
            type: type,
            data: data
          });
          break;
      }
    }
  }]);

  return TCPSocket;
}();

exports["default"] = TCPSocket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jaHJvbWUtc29ja2V0LmpzIl0sIm5hbWVzIjpbIlRDUFNvY2tldCIsImhvc3QiLCJwb3J0Iiwib3B0aW9ucyIsInNzbCIsImJ1ZmZlcmVkQW1vdW50IiwicmVhZHlTdGF0ZSIsImJpbmFyeVR5cGUiLCJFcnJvciIsIl9jYSIsImNhIiwiX3VzZVRMUyIsIl91c2VTVEFSVFRMUyIsIl9zb2NrZXRJZCIsIl91c2VMZWdhY3lTb2NrZXQiLCJfdXNlRm9yZ2VUbHMiLCJfc3RhcnRUbHNCdWZmZXIiLCJfc3RhcnRUbHNIYW5kc2hha2VJblByb2dyZXNzIiwiY2hyb21lIiwicnVudGltZSIsImdldFBsYXRmb3JtSW5mbyIsInBsYXRmb3JtSW5mbyIsIm9zIiwiaW5kZXhPZiIsIl9jcmVhdGVMZWdhY3lTb2NrZXQiLCJfY3JlYXRlU29ja2V0Iiwic29ja2V0IiwiY3JlYXRlIiwiY3JlYXRlSW5mbyIsInNvY2tldElkIiwiY29ubmVjdCIsInJlc3VsdCIsIl9lbWl0IiwibGFzdEVycm9yIiwiX29uU29ja2V0Q29ubmVjdGVkIiwic29ja2V0cyIsInRjcCIsIm9uUmVjZWl2ZSIsImFkZExpc3RlbmVyIiwicmVhZEluZm8iLCJfb25EYXRhIiwiZGF0YSIsIm9uUmVjZWl2ZUVycm9yIiwiY2xvc2UiLCJzZXRQYXVzZWQiLCJyZWFkIiwiX3JlYWRMZWdhY3lTb2NrZXQiLCJfdXBncmFkZVRvU2VjdXJlIiwiY2FsbGJhY2siLCJvblVwZ3JhZGVkIiwidGxzUmVzdWx0IiwibWVzc2FnZSIsImxlbmd0aCIsInNlbmQiLCJzaGlmdCIsInNlY3VyZSIsInJlc3VsdENvZGUiLCJidWZmZXIiLCJfdGxzV29ya2VyIiwicG9zdE1lc3NhZ2UiLCJFVkVOVF9JTkJPVU5EIiwiX3RscyIsInByb2Nlc3NJbmJvdW5kIiwiZGlzY29ubmVjdCIsImRlc3Ryb3kiLCJ0ZXJtaW5hdGUiLCJ1bmRlZmluZWQiLCJwdXNoIiwiRVZFTlRfT1VUQk9VTkQiLCJwcmVwYXJlT3V0Ym91bmQiLCJfc2VuZCIsIndyaXRlIiwid3JpdGVJbmZvIiwiYnl0ZXNXcml0dGVuIiwiYnl0ZUxlbmd0aCIsInNlbmRJbmZvIiwiYnl0ZXNTZW50IiwidHlwZSIsInRhcmdldCIsIm9ub3BlbiIsIm9uZXJyb3IiLCJvbmRhdGEiLCJvbmRyYWluIiwib25jbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0lBS3FCQSxTOzs7Ozt5QkFDTkMsSSxFQUFNQyxJLEVBQW9CO0FBQUEsVUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQ3JDLGFBQU8sSUFBSUgsU0FBSixDQUFjO0FBQUVDLFFBQUFBLElBQUksRUFBSkEsSUFBRjtBQUFRQyxRQUFBQSxJQUFJLEVBQUpBLElBQVI7QUFBY0MsUUFBQUEsT0FBTyxFQUFQQTtBQUFkLE9BQWQsQ0FBUDtBQUNEOzs7QUFFRCwyQkFBc0M7QUFBQTs7QUFBQSxRQUF2QkYsSUFBdUIsUUFBdkJBLElBQXVCO0FBQUEsUUFBakJDLElBQWlCLFFBQWpCQSxJQUFpQjtBQUFBLFFBQVhDLE9BQVcsUUFBWEEsT0FBVzs7QUFBQTs7QUFDcEMsU0FBS0YsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0UsR0FBTCxHQUFXLEtBQVg7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLENBQXRCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixZQUFsQjtBQUNBLFNBQUtDLFVBQUwsR0FBa0IsbUJBQU8sYUFBUCxFQUFzQixZQUF0QixFQUFvQ0osT0FBcEMsQ0FBbEI7O0FBRUEsUUFBSSxLQUFLSSxVQUFMLEtBQW9CLGFBQXhCLEVBQXVDO0FBQ3JDLFlBQU0sSUFBSUMsS0FBSixDQUFVLGtDQUFWLENBQU47QUFDRDs7QUFFRCxTQUFLQyxHQUFMLEdBQVdOLE9BQU8sQ0FBQ08sRUFBbkI7QUFDQSxTQUFLQyxPQUFMLEdBQWUsbUJBQU8sS0FBUCxFQUFjLG9CQUFkLEVBQW9DUixPQUFwQyxDQUFmO0FBQ0EsU0FBS1MsWUFB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WUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFiLENBQWhCO0FBQ0E7O0FBQ0YsYUFBSyxNQUFMO0FBQ0UsZUFBS3dDLE1BQUwsSUFBZSxLQUFLQSxNQUFMLENBQVk7QUFBRUgsWUFBQUEsTUFBTSxFQUFOQSxNQUFGO0FBQVVELFlBQUFBLElBQUksRUFBSkEsSUFBVjtBQUFnQnBDLFlBQUFBLElBQUksRUFBSkE7QUFBaEIsV0FBWixDQUFmO0FBQ0E7O0FBQ0YsYUFBSyxPQUFMO0FBQ0UsZUFBS3lDLE9BQUwsSUFBZ0IsS0FBS0EsT0FBTCxDQUFhO0FBQUVKLFlBQUFBLE1BQU0sRUFBTkEsTUFBRjtBQUFVRCxZQUFBQSxJQUFJLEVBQUpBLElBQVY7QUFBZ0JwQyxZQUFBQSxJQUFJLEVBQUpBO0FBQWhCLFdBQWIsQ0FBaEI7QUFDQTs7QUFDRixhQUFLLE9BQUw7QUFDRSxlQUFLbkMsVUFBTCxHQUFrQixRQUFsQjtBQUNBLGVBQUs2RSxPQUFMLElBQWdCLEtBQUtBLE9BQUwsQ0FBYTtBQUFFTCxZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUQsWUFBQUEsSUFBSSxFQUFKQSxJQUFWO0FBQWdCcEMsWUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFiLENBQWhCO0FBQ0E7QUFqQko7QUFtQkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcm9wT3IgfSBmcm9tICdyYW1kYSdcbmltcG9ydCBzY2hlZHVsZUluTmV4dEV2ZW50TG9vcCBmcm9tICcuL3RpbWVvdXQnXG5pbXBvcnQgY3JlYXRlVGxzIGZyb20gJy4vdGxzLXV0aWxzJ1xuaW1wb3J0IHtcbiAgRVZFTlRfSU5CT1VORCwgRVZFTlRfT1VUQk9VTkQsXG4gIGNyZWF0ZU1lc3NhZ2Vcbn0gZnJvbSAnLi93b3JrZXItdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRDUFNvY2tldCB7XG4gIHN0YXRpYyBvcGVuIChob3N0LCBwb3J0LCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFRDUFNvY2tldCh7IGhvc3QsIHBvcnQsIG9wdGlvbnMgfSlcbiAgfVxuXG4gIGNvbnN0cnVjdG9yICh7IGhvc3QsIHBvcnQsIG9wdGlvbnMgfSkge1xuICAgIHRoaXMuaG9zdCA9IGhvc3RcbiAgICB0aGlzLnBvcnQgPSBwb3J0XG4gICAgdGhpcy5zc2wgPSBmYWxzZVxuICAgIHRoaXMuYnVmZmVyZWRBbW91bnQgPSAwXG4gICAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nvbm5lY3RpbmcnXG4gICAgdGhpcy5iaW5hcnlUeXBlID0gcHJvcE9yKCdhcnJheWJ1ZmZlcicsICdiaW5hcnlUeXBlJykob3B0aW9ucylcblxuICAgIGlmICh0aGlzLmJpbmFyeVR5cGUgIT09ICdhcnJheWJ1ZmZlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBhcnJheWJ1ZmZlcnMgYXJlIHN1cHBvcnRlZCEnKVxuICAgIH1cblxuICAgIHRoaXMuX2NhID0gb3B0aW9ucy5jYVxuICAgIHRoaXMuX3VzZVRMUyA9IHByb3BPcihmYWxzZSwgJ3VzZVNlY3VyZVRyYW5zcG9ydCcpKG9wdGlvbnMpXG4gICAgdGhpcy5fdXNlU1RBUlRUTFMgPSBmYWxzZVxuICAgIHRoaXMuX3NvY2tldElkID0gMFxuICAgIHRoaXMuX3VzZUxlZ2FjeVNvY2tldCA9IGZhbHNlXG4gICAgdGhpcy5fdXNlRm9yZ2VUbHMgPSBmYWxzZVxuXG4gICAgLy8gaGFuZGxlcyB3cml0ZXMgZHVyaW5nIHN0YXJ0dGxzIGhhbmRzaGFrZSwgY2hyb21lIHNvY2tldCBvbmx5XG4gICAgdGhpcy5fc3RhcnRUbHNCdWZmZXIgPSBbXVxuICAgIHRoaXMuX3N0YXJ0VGxzSGFuZHNoYWtlSW5Qcm9ncmVzcyA9IGZhbHNlXG5cbiAgICBjaHJvbWUucnVudGltZS5nZXRQbGF0Zm9ybUluZm8ocGxhdGZvcm1JbmZvID0+IHtcbiAgICAgIGlmIChwbGF0Zm9ybUluZm8ub3MuaW5kZXhPZignY29yZG92YScpICE9PSAtMSkge1xuICAgICAgICAvLyBjaHJvbWUuc29ja2V0cy50Y3Auc2VjdXJlIGlzIG5vdCBmdW5jdGlvbmFsIG9uIGNvcmRvdmFcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01vYmlsZUNocm9tZUFwcHMvbW9iaWxlLWNocm9tZS1hcHBzL2lzc3Vlcy8yNjlcbiAgICAgICAgdGhpcy5fdXNlTGVnYWN5U29ja2V0ID0gZmFsc2VcbiAgICAgICAgdGhpcy5fdXNlRm9yZ2VUbHMgPSB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl91c2VMZWdhY3lTb2NrZXQgPSB0cnVlXG4gICAgICAgIHRoaXMuX3VzZUZvcmdlVGxzID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3VzZUxlZ2FjeVNvY2tldCkge1xuICAgICAgICB0aGlzLl9jcmVhdGVMZWdhY3lTb2NrZXQoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY3JlYXRlU29ja2V0KClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzb2NrZXQgdXNpbmcgdGhlIGRlcHJlY2F0ZWQgY2hyb21lLnNvY2tldCBBUElcbiAgICovXG4gIF9jcmVhdGVMZWdhY3lTb2NrZXQgKCkge1xuICAgIGNocm9tZS5zb2NrZXQuY3JlYXRlKCd0Y3AnLCB7fSwgY3JlYXRlSW5mbyA9PiB7XG4gICAgICB0aGlzLl9zb2NrZXRJZCA9IGNyZWF0ZUluZm8uc29ja2V0SWRcblxuICAgICAgY2hyb21lLnNvY2tldC5jb25uZWN0KHRoaXMuX3NvY2tldElkLCB0aGlzLmhvc3QsIHRoaXMucG9ydCwgcmVzdWx0ID0+IHtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gMCkge1xuICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zZWQnXG4gICAgICAgICAgdGhpcy5fZW1pdCgnZXJyb3InLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9vblNvY2tldENvbm5lY3RlZCgpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHNvY2tldCB1c2luZyBjaHJvbWUuc29ja2V0cy50Y3BcbiAgICovXG4gIF9jcmVhdGVTb2NrZXQgKCkge1xuICAgIGNocm9tZS5zb2NrZXRzLnRjcC5jcmVhdGUoe30sIGNyZWF0ZUluZm8gPT4ge1xuICAgICAgdGhpcy5fc29ja2V0SWQgPSBjcmVhdGVJbmZvLnNvY2tldElkXG5cbiAgICAgIC8vIHJlZ2lzdGVyIGZvciBkYXRhIGV2ZW50cyBvbiB0aGUgc29ja2V0IGJlZm9yZSBjb25uZWN0aW5nXG4gICAgICBjaHJvbWUuc29ja2V0cy50Y3Aub25SZWNlaXZlLmFkZExpc3RlbmVyKHJlYWRJbmZvID0+IHtcbiAgICAgICAgaWYgKHJlYWRJbmZvLnNvY2tldElkID09PSB0aGlzLl9zb2NrZXRJZCkge1xuICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIGRhdGEgYXZhaWxhYmxlIG9uIHRoZSBzb2NrZXRcbiAgICAgICAgICB0aGlzLl9vbkRhdGEocmVhZEluZm8uZGF0YSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gcmVnaXN0ZXIgZm9yIGRhdGEgZXJyb3Igb24gdGhlIHNvY2tldCBiZWZvcmUgY29ubmVjdGluZ1xuICAgICAgY2hyb21lLnNvY2tldHMudGNwLm9uUmVjZWl2ZUVycm9yLmFkZExpc3RlbmVyKHJlYWRJbmZvID0+IHtcbiAgICAgICAgaWYgKHJlYWRJbmZvLnNvY2tldElkID09PSB0aGlzLl9zb2NrZXRJZCkge1xuICAgICAgICAgIC8vIHNvY2tldCBjbG9zZWQgcmVtb3RlbHkgb3IgYnJva2VuXG4gICAgICAgICAgdGhpcy5jbG9zZSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNocm9tZS5zb2NrZXRzLnRjcC5zZXRQYXVzZWQodGhpcy5fc29ja2V0SWQsIHRydWUsICgpID0+IHtcbiAgICAgICAgY2hyb21lLnNvY2tldHMudGNwLmNvbm5lY3QodGhpcy5fc29ja2V0SWQsIHRoaXMuaG9zdCwgdGhpcy5wb3J0LCByZXN1bHQgPT4ge1xuICAgICAgICAgIGlmIChyZXN1bHQgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2VkJ1xuICAgICAgICAgICAgdGhpcy5fZW1pdCgnZXJyb3InLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9vblNvY2tldENvbm5lY3RlZCgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSW52b2tlZCBvbmNlIGEgc29ja2V0IGhhcyBiZWVuIGNvbm5lY3RlZDpcbiAgICogLSBLaWNrcyBvZmYgVExTIGhhbmRzaGFrZSwgaWYgbmVjZXNzYXJ5XG4gICAqIC0gU3RhcnRzIHJlYWRpbmcgZnJvbSBsZWdhY3kgc29ja2V0LCBpZiBuZWNlc3NhcnlcbiAgICovXG4gIF9vblNvY2tldENvbm5lY3RlZCAoKSB7XG4gICAgY29uc3QgcmVhZCA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl91c2VMZWdhY3lTb2NrZXQpIHtcbiAgICAgICAgLy8gdGhlIHRscyBoYW5kc2hha2UgaXMgZG9uZSBsZXQncyBzdGFydCByZWFkaW5nIGZyb20gdGhlIGxlZ2FjeSBzb2NrZXRcbiAgICAgICAgdGhpcy5fcmVhZExlZ2FjeVNvY2tldCgpXG4gICAgICAgIHRoaXMuX2VtaXQoJ29wZW4nKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hyb21lLnNvY2tldHMudGNwLnNldFBhdXNlZCh0aGlzLl9zb2NrZXRJZCwgZmFsc2UsICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9lbWl0KCdvcGVuJylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3VzZVRMUykge1xuICAgICAgcmV0dXJuIHJlYWQoKVxuICAgIH1cblxuICAgIC8vIGRvIGFuIGltbWVkaWF0ZSBUTFMgaGFuZHNoYWtlIGlmIHRoaXMuX3VzZVRMUyA9PT0gdHJ1ZVxuICAgIHRoaXMuX3VwZ3JhZGVUb1NlY3VyZSgoKSA9PiB7IHJlYWQoKSB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHJvdWdoIGVkZ2VzIGZvciBkaWZmZXJlbmNlcyBiZXR3ZWVuIGNocm9tZS5zb2NrZXQgYW5kIGNocm9tZS5zb2NrZXRzLnRjcFxuICAgKiBmb3IgdXBncmFkaW5nIHRvIGEgVExTIGNvbm5lY3Rpb24gd2l0aCBvciB3aXRob3V0IGZvcmdlXG4gICAqL1xuICBfdXBncmFkZVRvU2VjdXJlIChjYWxsYmFjayA9ICgpID0+IHt9KSB7XG4gICAgLy8gaW52b2tlZCBhZnRlciBjaHJvbWUuc29ja2V0LnNlY3VyZSBvciBjaHJvbWUuc29ja2V0cy50Y3Auc2VjdXJlIGhhdmUgYmVlbiB1cGdyYWRlZFxuICAgIGNvbnN0IG9uVXBncmFkZWQgPSB0bHNSZXN1bHQgPT4ge1xuICAgICAgaWYgKHRsc1Jlc3VsdCAhPT0gMCkge1xuICAgICAgICB0aGlzLl9lbWl0KCdlcnJvcicsIG5ldyBFcnJvcignVExTIGhhbmRzaGFrZSBmYWlsZWQuIFJlYXNvbjogJyArIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKSlcbiAgICAgICAgdGhpcy5jbG9zZSgpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB0aGlzLnNzbCA9IHRydWVcblxuICAgICAgLy8gZW1wdHkgdGhlIGJ1ZmZlclxuICAgICAgd2hpbGUgKHRoaXMuX3N0YXJ0VGxzQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnNlbmQodGhpcy5fc3RhcnRUbHNCdWZmZXIuc2hpZnQoKSlcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2soKVxuICAgIH1cblxuICAgIGlmICghdGhpcy5fdXNlTGVnYWN5U29ja2V0ICYmIHRoaXMucmVhZHlTdGF0ZSAhPT0gJ29wZW4nKSB7XG4gICAgICAvLyB1c2UgY2hyb21lLnNvY2tldHMudGNwLnNlY3VyZSBmb3IgVExTLCBub3QgZm9yIFNUQVJUVExTIVxuICAgICAgLy8gdXNlIGZvcmdlIG9ubHkgZm9yIFNUQVJUVExTXG4gICAgICB0aGlzLl91c2VGb3JnZVRscyA9IGZhbHNlXG4gICAgICBjaHJvbWUuc29ja2V0cy50Y3Auc2VjdXJlKHRoaXMuX3NvY2tldElkLCBvblVwZ3JhZGVkKVxuICAgIH0gZWxzZSBpZiAodGhpcy5fdXNlTGVnYWN5U29ja2V0KSB7XG4gICAgICBjaHJvbWUuc29ja2V0LnNlY3VyZSh0aGlzLl9zb2NrZXRJZCwgb25VcGdyYWRlZClcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3VzZUZvcmdlVGxzKSB7XG4gICAgICAvLyBzZXR1cCB0aGUgZm9yZ2UgdGxzIGNsaWVudCBvciB3ZWJ3b3JrZXIgYXMgdGxzIGZhbGxiYWNrXG4gICAgICBjcmVhdGVUbHModGhpcylcbiAgICAgIGNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICB1cGdyYWRlVG9TZWN1cmUgKCkge1xuICAgIGlmICh0aGlzLnNzbCB8fCB0aGlzLl91c2VTVEFSVFRMUykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fdXNlU1RBUlRUTFMgPSB0cnVlXG4gICAgdGhpcy5fdXBncmFkZVRvU2VjdXJlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl91c2VMZWdhY3lTb2NrZXQpIHtcbiAgICAgICAgdGhpcy5fcmVhZExlZ2FjeVNvY2tldCgpIC8vIHRscyBoYW5kc2hha2UgaXMgZG9uZSwgcmVzdGFydCByZWFkaW5nXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyBmcm9tIGEgbGVnYWN5IGNocm9tZS5zb2NrZXQuXG4gICAqL1xuICBfcmVhZExlZ2FjeVNvY2tldCAoKSB7XG4gICAgaWYgKHRoaXMuX3NvY2tldElkID09PSAwKSB7XG4gICAgICAvLyB0aGUgc29ja2V0IGlzIGNsb3NlZC4gb21pdCByZWFkIGFuZCBzdG9wIGZ1cnRoZXIgcmVhZHNcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIGRvbid0IHJlYWQgZnJvbSBjaHJvbWUuc29ja2V0IGlmIHdlIGhhdmUgY2hyb21lLnNvY2tldC5zZWN1cmUgYSBoYW5kc2hha2UgaW4gcHJvZ3Jlc3MhXG4gICAgaWYgKCh0aGlzLl91c2VTVEFSVFRMUyB8fCB0aGlzLl91c2VUTFMpICYmICF0aGlzLnNzbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY2hyb21lLnNvY2tldC5yZWFkKHRoaXMuX3NvY2tldElkLCByZWFkSW5mbyA9PiB7XG4gICAgICAvLyBzb2NrZXQgY2xvc2VkIHJlbW90ZWx5IG9yIGJyb2tlblxuICAgICAgaWYgKHJlYWRJbmZvLnJlc3VsdENvZGUgPD0gMCkge1xuICAgICAgICB0aGlzLl9zb2NrZXRJZCA9IDBcbiAgICAgICAgdGhpcy5jbG9zZSgpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBwcm9jZXNzIHRoZSBkYXRhIGF2YWlsYWJsZSBvbiB0aGUgc29ja2V0XG4gICAgICB0aGlzLl9vbkRhdGEocmVhZEluZm8uZGF0YSlcblxuICAgICAgLy8gUXVldWUgdGhlIG5leHQgcmVhZC5cbiAgICAgIC8vIElmIGEgU1RBUlRUTFMgaGFuZHNoYWtlIG1pZ2h0IGJlIHVwY29taW5nLCBwb3N0cG9uZSB0aGlzIG9udG9cbiAgICAgIC8vIHRoZSB0YXNrIHF1ZXVlIHNvIHRoZSBJTUFQIGNsaWVudCBoYXMgYSBjaGFuY2UgdG8gY2FsbCB1cGdyYWRlVG9TZWN1cmU7XG4gICAgICAvLyB3aXRob3V0IHRoaXMsIHdlIG1pZ2h0IGVhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBoYW5kc2hha2UuXG4gICAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBzZWN1cmUsIGp1c3QgY2FsbCBpdCAoZm9yIHBlcmZvcm1hbmNlKS5cbiAgICAgIGlmICh0aGlzLnNzbCkge1xuICAgICAgICB0aGlzLl9yZWFkTGVnYWN5U29ja2V0KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlSW5OZXh0RXZlbnRMb29wKCgpID0+IHRoaXMuX3JlYWRMZWdhY3lTb2NrZXQoKSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZWQgd2hlbiBkYXRhIGhhcyBiZWVuIHJlYWQgZnJvbSB0aGUgc29ja2V0LiBIYW5kbGVzIGNhc2VzIHdoZW4gdG8gZmVlZFxuICAgKiB0aGUgZGF0YSBhdmFpbGFibGUgb24gdGhlIHNvY2tldCB0byBmb3JnZS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyIFRoZSBiaW5hcnkgZGF0YSByZWFkIGZyb20gdGhlIHNvY2tldFxuICAgKi9cbiAgX29uRGF0YSAoYnVmZmVyKSB7XG4gICAgaWYgKCh0aGlzLl91c2VUTFMgfHwgdGhpcy5fdXNlU1RBUlRUTFMpICYmIHRoaXMuX3VzZUZvcmdlVGxzKSB7XG4gICAgICAvLyBmZWVkIHRoZSBkYXRhIHRvIHRoZSB0bHMgY2xpZW50XG4gICAgICBpZiAodGhpcy5fdGxzV29ya2VyKSB7XG4gICAgICAgIHRoaXMuX3Rsc1dvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKEVWRU5UX0lOQk9VTkQsIGJ1ZmZlciksIFtidWZmZXJdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGxzLnByb2Nlc3NJbmJvdW5kKGJ1ZmZlcilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZW1pdCBkYXRhIGV2ZW50XG4gICAgICB0aGlzLl9lbWl0KCdkYXRhJywgYnVmZmVyKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIHNvY2tldFxuICAgKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2luZydcblxuICAgIGlmICh0aGlzLl9zb2NrZXRJZCAhPT0gMCkge1xuICAgICAgaWYgKHRoaXMuX3VzZUxlZ2FjeVNvY2tldCkge1xuICAgICAgICAvLyBjbG9zZSBsZWdhY3kgc29ja2V0XG4gICAgICAgIGNocm9tZS5zb2NrZXQuZGlzY29ubmVjdCh0aGlzLl9zb2NrZXRJZClcbiAgICAgICAgY2hyb21lLnNvY2tldC5kZXN0cm95KHRoaXMuX3NvY2tldElkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY2xvc2Ugc29ja2V0XG4gICAgICAgIGNocm9tZS5zb2NrZXRzLnRjcC5kaXNjb25uZWN0KHRoaXMuX3NvY2tldElkKVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9zb2NrZXRJZCA9IDBcbiAgICB9XG5cbiAgICAvLyB0ZXJtaW5hdGUgdGhlIHRscyB3b3JrZXJcbiAgICBpZiAodGhpcy5fdGxzV29ya2VyKSB7XG4gICAgICB0aGlzLl90bHNXb3JrZXIudGVybWluYXRlKClcbiAgICAgIHRoaXMuX3Rsc1dvcmtlciA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHRoaXMuX2VtaXQoJ2Nsb3NlJylcbiAgfVxuXG4gIHNlbmQgKGJ1ZmZlcikge1xuICAgIGlmICghdGhpcy5fdXNlRm9yZ2VUbHMgJiYgdGhpcy5fdXNlU1RBUlRUTFMgJiYgIXRoaXMuc3NsKSB7XG4gICAgICAvLyBidWZmZXIgdGhlIHVucHJlcGFyZWQgZGF0YSB1bnRpbCBjaHJvbWUuc29ja2V0KHMudGNwKSBoYW5kc2hha2UgaXMgZG9uZVxuICAgICAgdGhpcy5fc3RhcnRUbHNCdWZmZXIucHVzaChidWZmZXIpXG4gICAgfSBlbHNlIGlmICh0aGlzLl91c2VGb3JnZVRscyAmJiAodGhpcy5fdXNlVExTIHx8IHRoaXMuX3VzZVNUQVJUVExTKSkge1xuICAgICAgLy8gZ2l2ZSBidWZmZXIgdG8gZm9yZ2UgdG8gYmUgcHJlcGFyZWQgZm9yIHRsc1xuICAgICAgaWYgKHRoaXMuX3Rsc1dvcmtlcikge1xuICAgICAgICB0aGlzLl90bHNXb3JrZXIucG9zdE1lc3NhZ2UoY3JlYXRlTWVzc2FnZShFVkVOVF9PVVRCT1VORCwgYnVmZmVyKSwgW2J1ZmZlcl0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90bHMucHJlcGFyZU91dGJvdW5kKGJ1ZmZlcilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2VuZCB0aGUgYXJyYXlidWZmZXJcbiAgICAgIHRoaXMuX3NlbmQoYnVmZmVyKVxuICAgIH1cbiAgfVxuXG4gIF9zZW5kIChkYXRhKSB7XG4gICAgaWYgKHRoaXMuX3NvY2tldElkID09PSAwKSB7XG4gICAgICAvLyB0aGUgc29ja2V0IGlzIGNsb3NlZC5cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh0aGlzLl91c2VMZWdhY3lTb2NrZXQpIHtcbiAgICAgIGNocm9tZS5zb2NrZXQud3JpdGUodGhpcy5fc29ja2V0SWQsIGRhdGEsIHdyaXRlSW5mbyA9PiB7XG4gICAgICAgIGlmICh3cml0ZUluZm8uYnl0ZXNXcml0dGVuIDwgMCAmJiB0aGlzLl9zb2NrZXRJZCAhPT0gMCkge1xuICAgICAgICAgIC8vIGlmIHRoZSBzb2NrZXQgaXMgYWxyZWFkeSAwLCBpdCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZC4gbm8gbmVlZCB0byBhbGVydCB0aGVuLi4uXG4gICAgICAgICAgdGhpcy5fZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ0NvdWxkIG5vdCB3cml0ZSAnICsgZGF0YS5ieXRlTGVuZ3RoICsgJyBieXRlcyB0byBzb2NrZXQgJyArIHRoaXMuX3NvY2tldElkICsgJy4gQ2hyb21lIGVycm9yIGNvZGU6ICcgKyB3cml0ZUluZm8uYnl0ZXNXcml0dGVuKSlcbiAgICAgICAgICB0aGlzLl9zb2NrZXRJZCA9IDBcbiAgICAgICAgICB0aGlzLmNsb3NlKClcblxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZW1pdCgnZHJhaW4nKVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgY2hyb21lLnNvY2tldHMudGNwLnNlbmQodGhpcy5fc29ja2V0SWQsIGRhdGEsIHNlbmRJbmZvID0+IHtcbiAgICAgICAgaWYgKHNlbmRJbmZvLmJ5dGVzU2VudCA8IDAgJiYgdGhpcy5fc29ja2V0SWQgIT09IDApIHtcbiAgICAgICAgICAvLyBpZiB0aGUgc29ja2V0IGlzIGFscmVhZHkgMCwgaXQgaGFzIGFscmVhZHkgYmVlbiBjbG9zZWQuIG5vIG5lZWQgdG8gYWxlcnQgdGhlbi4uLlxuICAgICAgICAgIHRoaXMuX2VtaXQoJ2Vycm9yJywgbmV3IEVycm9yKCdDb3VsZCBub3Qgd3JpdGUgJyArIGRhdGEuYnl0ZUxlbmd0aCArICcgYnl0ZXMgdG8gc29ja2V0ICcgKyB0aGlzLl9zb2NrZXRJZCArICcuIENocm9tZSBlcnJvciBjb2RlOiAnICsgc2VuZEluZm8uYnl0ZXNTZW50KSlcbiAgICAgICAgICB0aGlzLmNsb3NlKClcblxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZW1pdCgnZHJhaW4nKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBfZW1pdCAodHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXNcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnb3BlbidcbiAgICAgICAgdGhpcy5vbm9wZW4gJiYgdGhpcy5vbm9wZW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICAgIHRoaXMub25kYXRhICYmIHRoaXMub25kYXRhKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkcmFpbic6XG4gICAgICAgIHRoaXMub25kcmFpbiAmJiB0aGlzLm9uZHJhaW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nsb3NlZCdcbiAgICAgICAgdGhpcy5vbmNsb3NlICYmIHRoaXMub25jbG9zZSh7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxufVxuIl19