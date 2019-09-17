"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ramda = require("ramda");

var _tlsUtils = _interopRequireDefault(require("./tls-utils"));

var _socket = _interopRequireDefault(require("socket.io-client"));

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
    this._wsHost = (0, _ramda.pathOr)(window.location.origin, ['ws', 'url'])(options);
    this._wsOptions = (0, _ramda.pathOr)({}, ['ws', 'options'])(options);
    this._wsOptions.reconnection = this._wsOptions.reconnection || false;
    this._wsOptions.multiplex = this._wsOptions.multiplex || false;
    this._socket = (0, _socket["default"])(this._wsHost, this._wsOptions);

    this._socket.emit('open', {
      host: host,
      port: port
    }, function (proxyHostname) {
      _this._proxyHostname = proxyHostname;

      if (_this._useTLS) {
        // the socket is up, do the tls handshake
        (0, _tlsUtils["default"])(_this);
      } else {
        // socket is up and running
        _this._emit('open', {
          proxyHostname: _this._proxyHostname
        });
      }

      _this._socket.on('data', function (buffer) {
        if (_this._useTLS || _this._useSTARTTLS) {
          // feed the data to the tls socket
          if (_this._tlsWorker) {
            _this._tlsWorker.postMessage((0, _workerUtils.createMessage)(_workerUtils.EVENT_INBOUND, buffer), [buffer]);
          } else {
            _this._tls.processInbound(buffer);
          }
        } else {
          _this._emit('data', buffer);
        }
      });

      _this._socket.on('error', function (message) {
        _this._emit('error', new Error(message)); // this.close()

      });

      _this._socket.on('close', function () {
        return _this.close();
      });
    });
  }

  _createClass(TCPSocket, [{
    key: "close",
    value: function close() {
      this.readyState = 'closing';

      this._socket.emit('end');

      this._socket.disconnect();

      if (this._tlsWorker) {
        this._tlsWorker.terminate();
      }

      this._emit('close');
    }
  }, {
    key: "send",
    value: function send(buffer) {
      if (this._useTLS || this._useSTARTTLS) {
        // give buffer to forge to be prepared for tls
        if (this._tlsWorker) {
          this._tlsWorker.postMessage((0, _workerUtils.createMessage)(_workerUtils.EVENT_OUTBOUND, buffer), [buffer]);
        } else {
          this._tls.prepareOutbound(buffer);
        }

        return;
      }

      this._send(buffer);
    }
  }, {
    key: "_send",
    value: function _send(data) {
      var _this2 = this;

      this._socket.emit('data', data, function () {
        return _this2._emit('drain');
      });
    }
  }, {
    key: "upgradeToSecure",
    value: function upgradeToSecure() {
      if (this.ssl || this._useSTARTTLS) return;
      this._useSTARTTLS = true;
      (0, _tlsUtils["default"])(this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXRpby1zb2NrZXQuanMiXSwibmFtZXMiOlsiVENQU29ja2V0IiwiaG9zdCIsInBvcnQiLCJvcHRpb25zIiwic3NsIiwiYnVmZmVyZWRBbW91bnQiLCJyZWFkeVN0YXRlIiwiYmluYXJ5VHlwZSIsIkVycm9yIiwiX2NhIiwiY2EiLCJfdXNlVExTIiwiX3VzZVNUQVJUVExTIiwiX3dzSG9zdCIsIndpbmRvdyIsImxvY2F0aW9uIiwib3JpZ2luIiwiX3dzT3B0aW9ucyIsInJlY29ubmVjdGlvbiIsIm11bHRpcGxleCIsIl9zb2NrZXQiLCJlbWl0IiwicHJveHlIb3N0bmFtZSIsIl9wcm94eUhvc3RuYW1lIiwiX2VtaXQiLCJvbiIsImJ1ZmZlciIsIl90bHNXb3JrZXIiLCJwb3N0TWVzc2FnZSIsIkVWRU5UX0lOQk9VTkQiLCJfdGxzIiwicHJvY2Vzc0luYm91bmQiLCJtZXNzYWdlIiwiY2xvc2UiLCJkaXNjb25uZWN0IiwidGVybWluYXRlIiwiRVZFTlRfT1VUQk9VTkQiLCJwcmVwYXJlT3V0Ym91bmQiLCJfc2VuZCIsImRhdGEiLCJ0eXBlIiwidGFyZ2V0Iiwib25vcGVuIiwib25lcnJvciIsIm9uZGF0YSIsIm9uZHJhaW4iLCJvbmNsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUFLcUJBLFM7Ozs7O3lCQUNOQyxJLEVBQU1DLEksRUFBb0I7QUFBQSxVQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFDckMsYUFBTyxJQUFJSCxTQUFKLENBQWM7QUFBRUMsUUFBQUEsSUFBSSxFQUFKQSxJQUFGO0FBQVFDLFFBQUFBLElBQUksRUFBSkEsSUFBUjtBQUFjQyxRQUFBQSxPQUFPLEVBQVBBO0FBQWQsT0FBZCxDQUFQO0FBQ0Q7OztBQUVELDJCQUFzQztBQUFBOztBQUFBLFFBQXZCRixJQUF1QixRQUF2QkEsSUFBdUI7QUFBQSxRQUFqQkMsSUFBaUIsUUFBakJBLElBQWlCO0FBQUEsUUFBWEMs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LEdBQWtCLE1BQWxCO0FBQ0EsZUFBS29DLE1BQUwsSUFBZSxLQUFLQSxNQUFMLENBQVk7QUFBRUQsWUFBQUEsTUFBTSxFQUFOQSxNQUFGO0FBQVVELFlBQUFBLElBQUksRUFBSkEsSUFBVjtBQUFnQkQsWUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFaLENBQWY7QUFDQTs7QUFDRixhQUFLLE9BQUw7QUFDRSxlQUFLSSxPQUFMLElBQWdCLEtBQUtBLE9BQUwsQ0FBYTtBQUFFRixZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUQsWUFBQUEsSUFBSSxFQUFKQSxJQUFWO0FBQWdCRCxZQUFBQSxJQUFJLEVBQUpBO0FBQWhCLFdBQWIsQ0FBaEI7QUFDQTs7QUFDRixhQUFLLE1BQUw7QUFDRSxlQUFLSyxNQUFMLElBQWUsS0FBS0EsTUFBTCxDQUFZO0FBQUVILFlBQUFBLE1BQU0sRUFBTkEsTUFBRjtBQUFVRCxZQUFBQSxJQUFJLEVBQUpBLElBQVY7QUFBZ0JELFlBQUFBLElBQUksRUFBSkE7QUFBaEIsV0FBWixDQUFmO0FBQ0E7O0FBQ0YsYUFBSyxPQUFMO0FBQ0UsZUFBS00sT0FBTCxJQUFnQixLQUFLQSxPQUFMLENBQWE7QUFBRUosWUFBQUEsTUFBTSxFQUFOQSxNQUFGO0FBQVVELFlBQUFBLElBQUksRUFBSkEsSUFBVjtBQUFnQkQsWUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFiLENBQWhCO0FBQ0E7O0FBQ0YsYUFBSyxPQUFMO0FBQ0UsZUFBS2pDLFVBQUwsR0FBa0IsUUFBbEI7QUFDQSxlQUFLd0MsT0FBTCxJQUFnQixLQUFLQSxPQUFMLENBQWE7QUFBRUwsWUFBQUEsTUFBTSxFQUFOQSxNQUFGO0FBQVVELFlBQUFBLElBQUksRUFBSkEsSUFBVjtBQUFnQkQsWUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFiLENBQWhCO0FBQ0E7QUFqQko7QUFtQkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXRoT3IsIHByb3BPciB9IGZyb20gJ3JhbWRhJ1xuaW1wb3J0IGNyZWF0ZVRscyBmcm9tICcuL3Rscy11dGlscydcbmltcG9ydCBpbyBmcm9tICdzb2NrZXQuaW8tY2xpZW50J1xuaW1wb3J0IHtcbiAgRVZFTlRfSU5CT1VORCwgRVZFTlRfT1VUQk9VTkQsXG4gIGNyZWF0ZU1lc3NhZ2Vcbn0gZnJvbSAnLi93b3JrZXItdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRDUFNvY2tldCB7XG4gIHN0YXRpYyBvcGVuIChob3N0LCBwb3J0LCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFRDUFNvY2tldCh7IGhvc3QsIHBvcnQsIG9wdGlvbnMgfSlcbiAgfVxuXG4gIGNvbnN0cnVjdG9yICh7IGhvc3QsIHBvcnQsIG9wdGlvbnMgfSkge1xuICAgIHRoaXMuaG9zdCA9IGhvc3RcbiAgICB0aGlzLnBvcnQgPSBwb3J0XG4gICAgdGhpcy5zc2wgPSBmYWxzZVxuICAgIHRoaXMuYnVmZmVyZWRBbW91bnQgPSAwXG4gICAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nvbm5lY3RpbmcnXG4gICAgdGhpcy5iaW5hcnlUeXBlID0gcHJvcE9yKCdhcnJheWJ1ZmZlcicsICdiaW5hcnlUeXBlJykob3B0aW9ucylcblxuICAgIGlmICh0aGlzLmJpbmFyeVR5cGUgIT09ICdhcnJheWJ1ZmZlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBhcnJheWJ1ZmZlcnMgYXJlIHN1cHBvcnRlZCEnKVxuICAgIH1cblxuICAgIHRoaXMuX2NhID0gb3B0aW9ucy5jYVxuICAgIHRoaXMuX3VzZVRMUyA9IHByb3BPcihmYWxzZSwgJ3VzZVNlY3VyZVRyYW5zcG9ydCcpKG9wdGlvbnMpXG4gICAgdGhpcy5fdXNlU1RBUlRUTFMgPSBmYWxzZVxuXG4gICAgdGhpcy5fd3NIb3N0ID0gcGF0aE9yKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4sIFsnd3MnLCAndXJsJ10pKG9wdGlvbnMpXG4gICAgdGhpcy5fd3NPcHRpb25zID0gcGF0aE9yKHt9LCBbJ3dzJywgJ29wdGlvbnMnXSkob3B0aW9ucylcbiAgICB0aGlzLl93c09wdGlvbnMucmVjb25uZWN0aW9uID0gdGhpcy5fd3NPcHRpb25zLnJlY29ubmVjdGlvbiB8fCBmYWxzZVxuICAgIHRoaXMuX3dzT3B0aW9ucy5tdWx0aXBsZXggPSB0aGlzLl93c09wdGlvbnMubXVsdGlwbGV4IHx8IGZhbHNlXG5cbiAgICB0aGlzLl9zb2NrZXQgPSBpbyh0aGlzLl93c0hvc3QsIHRoaXMuX3dzT3B0aW9ucylcbiAgICB0aGlzLl9zb2NrZXQuZW1pdCgnb3BlbicsIHsgaG9zdCwgcG9ydCB9LCBwcm94eUhvc3RuYW1lID0+IHtcbiAgICAgIHRoaXMuX3Byb3h5SG9zdG5hbWUgPSBwcm94eUhvc3RuYW1lXG4gICAgICBpZiAodGhpcy5fdXNlVExTKSB7XG4gICAgICAgIC8vIHRoZSBzb2NrZXQgaXMgdXAsIGRvIHRoZSB0bHMgaGFuZHNoYWtlXG4gICAgICAgIGNyZWF0ZVRscyh0aGlzKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc29ja2V0IGlzIHVwIGFuZCBydW5uaW5nXG4gICAgICAgIHRoaXMuX2VtaXQoJ29wZW4nLCB7XG4gICAgICAgICAgcHJveHlIb3N0bmFtZTogdGhpcy5fcHJveHlIb3N0bmFtZVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9zb2NrZXQub24oJ2RhdGEnLCBidWZmZXIgPT4ge1xuICAgICAgICBpZiAodGhpcy5fdXNlVExTIHx8IHRoaXMuX3VzZVNUQVJUVExTKSB7XG4gICAgICAgICAgLy8gZmVlZCB0aGUgZGF0YSB0byB0aGUgdGxzIHNvY2tldFxuICAgICAgICAgIGlmICh0aGlzLl90bHNXb3JrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Rsc1dvcmtlci5wb3N0TWVzc2FnZShjcmVhdGVNZXNzYWdlKEVWRU5UX0lOQk9VTkQsIGJ1ZmZlciksIFtidWZmZXJdKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl90bHMucHJvY2Vzc0luYm91bmQoYnVmZmVyKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9lbWl0KCdkYXRhJywgYnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICB0aGlzLl9zb2NrZXQub24oJ2Vycm9yJywgbWVzc2FnZSA9PiB7XG4gICAgICAgIHRoaXMuX2VtaXQoJ2Vycm9yJywgbmV3IEVycm9yKG1lc3NhZ2UpKVxuICAgICAgICAvLyB0aGlzLmNsb3NlKClcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuX3NvY2tldC5vbignY2xvc2UnLCAoKSA9PiB0aGlzLmNsb3NlKCkpXG4gICAgfSlcbiAgfVxuXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2luZydcblxuICAgIHRoaXMuX3NvY2tldC5lbWl0KCdlbmQnKVxuICAgIHRoaXMuX3NvY2tldC5kaXNjb25uZWN0KClcblxuICAgIGlmICh0aGlzLl90bHNXb3JrZXIpIHtcbiAgICAgIHRoaXMuX3Rsc1dvcmtlci50ZXJtaW5hdGUoKVxuICAgIH1cblxuICAgIHRoaXMuX2VtaXQoJ2Nsb3NlJylcbiAgfVxuXG4gIHNlbmQgKGJ1ZmZlcikge1xuICAgIGlmICh0aGlzLl91c2VUTFMgfHwgdGhpcy5fdXNlU1RBUlRUTFMpIHtcbiAgICAgIC8vIGdpdmUgYnVmZmVyIHRvIGZvcmdlIHRvIGJlIHByZXBhcmVkIGZvciB0bHNcbiAgICAgIGlmICh0aGlzLl90bHNXb3JrZXIpIHtcbiAgICAgICAgdGhpcy5fdGxzV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoRVZFTlRfT1VUQk9VTkQsIGJ1ZmZlciksIFtidWZmZXJdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGxzLnByZXBhcmVPdXRib3VuZChidWZmZXIpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLl9zZW5kKGJ1ZmZlcilcbiAgfVxuXG4gIF9zZW5kIChkYXRhKSB7XG4gICAgdGhpcy5fc29ja2V0LmVtaXQoJ2RhdGEnLCBkYXRhLCAoKSA9PiB0aGlzLl9lbWl0KCdkcmFpbicpKVxuICB9XG5cbiAgdXBncmFkZVRvU2VjdXJlICgpIHtcbiAgICBpZiAodGhpcy5zc2wgfHwgdGhpcy5fdXNlU1RBUlRUTFMpIHJldHVyblxuXG4gICAgdGhpcy5fdXNlU1RBUlRUTFMgPSB0cnVlXG4gICAgY3JlYXRlVGxzKHRoaXMpXG4gIH1cblxuICBfZW1pdCAodHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXNcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnb3BlbidcbiAgICAgICAgdGhpcy5vbm9wZW4gJiYgdGhpcy5vbm9wZW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICAgIHRoaXMub25kYXRhICYmIHRoaXMub25kYXRhKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkcmFpbic6XG4gICAgICAgIHRoaXMub25kcmFpbiAmJiB0aGlzLm9uZHJhaW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nsb3NlZCdcbiAgICAgICAgdGhpcy5vbmNsb3NlICYmIHRoaXMub25jbG9zZSh7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxufVxuIl19