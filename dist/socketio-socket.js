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
        _this._emit('error', new Error(message));

        _this.close();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXRpby1zb2NrZXQuanMiXSwibmFtZXMiOlsiVENQU29ja2V0IiwiaG9zdCIsInBvcnQiLCJvcHRpb25zIiwic3NsIiwiYnVmZmVyZWRBbW91bnQiLCJyZWFkeVN0YXRlIiwiYmluYXJ5VHlwZSIsIkVycm9yIiwiX2NhIiwiY2EiLCJfdXNlVExTIiwiX3VzZVNUQVJUVExTIiwiX3dzSG9zdCIsIndpbmRvdyIsImxvY2F0aW9uIiwib3JpZ2luIiwiX3dzT3B0aW9ucyIsInJlY29ubmVjdGlvbiIsIm11bHRpcGxleCIsIl9zb2NrZXQiLCJlbWl0IiwicHJveHlIb3N0bmFtZSIsIl9wcm94eUhvc3RuYW1lIiwiX2VtaXQiLCJvbiIsImJ1ZmZlciIsIl90bHNXb3JrZXIiLCJwb3N0TWVzc2FnZSIsIkVWRU5UX0lOQk9VTkQiLCJfdGxzIiwicHJvY2Vzc0luYm91bmQiLCJtZXNzYWdlIiwiY2xvc2UiLCJkaXNjb25uZWN0IiwidGVybWluYXRlIiwiRVZFTlRfT1VUQk9VTkQiLCJwcmVwYXJlT3V0Ym91bmQiLCJfc2VuZCIsImRhdGEiLCJ0eXBlIiwidGFyZ2V0Iiwib25vcGVuIiwib25lcnJvciIsIm9uZGF0YSIsIm9uZHJhaW4iLCJvbmNsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUFLcUJBLFM7Ozs7O3lCQUNOQyxJLEVBQU1DLEksRUFBb0I7QUFBQSxVQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFDckMsYUFBTyxJQUFJSCxTQUFKLENBQWM7QUFBRUMsUUFBQUEsSUFBSSxFQUFKQSxJQUFGO0FBQVFDLFFBQUFBLElBQUksRUFBSkEsSUFBUjtBQUFjQyxRQUFBQSxPQUFPLEVBQVBBO0FBQWQsT0FBZCxDQUFQO0FBQ0Q7OztBQUVELDJCQUFzQztBQUFBOztBQUFBLFFBQXZCRixJQUF1QixRQUF2QkEsSUFBdUI7QUFBQSxRQUFqQkMsSUFBaUIsUUFBakJBLElBQWlCO0FBQUEsUUFBWEMsT0FBVyxRQUFYQSxPQUFXOztBQUFBOztBQUNwQyxTQUFLRixJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLRSxHQUFMLEdBQVcsS0FBWDtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsQ0FBdEI7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLFlBQWxCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQixtQkFBTyxhQUFQLEVBQXNCLFlBQXRCLEVBQW9DSixPQUFwQyxDQUFsQjs7QUFFQSxRQUFJLEtBQUtJLFVBQUwsS0FBb0IsYUFBeEIsRUFBdUM7QUFDckMsWUFBTSxJQUFJQyxLQUFKLENBQVUsa0NBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUtDLEdBQUwsR0FBV04sT0FBTyxDQUFDTyxFQUFuQjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxtQkFBTyxLQUFQLEVBQWMsb0JBQWQsRUFBb0NSLE9BQXBDLENBQWY7QUFDQSxTQUFLUyxZQUFMLEdBQW9CLEtBQXBCO0FBRUEsU0FBS0MsT0FBTCxHQUFlLG1CQUFPQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLE1BQXZCLEVBQStCLENBQUMsSUFBRCxFQUFPLEtBQVAsQ0FBL0IsRUFBOENiLE9BQTlDLENBQWY7QUFDQSxTQUFLYyxVQUFMLEdBQWtCLG1CQUFPLEVBQVAsRUFBVyxDQUFDLElBQUQsRUFBTyxTQUFQLENBQVgsRUFBOEJkLE9BQTlCLENBQWxCO0FBQ0EsU0FBS2MsVUFBTCxDQUFnQkMsWUFBaEIsR0FBK0IsS0FBS0QsVUFBTCxDQUFnQkMsWUFBaEIsSUFBZ0MsS0FBL0Q7QUFDQSxTQUFLRCxVQUFMLENBQWdCRSxTQUFoQixHQUE0QixLQUFLRixVQUFMLENBQWdCRSxTQUFoQixJQUE2QixLQUF6RDtBQUVBLFNBQUtDLE9BQUwsR0FBZSx3QkFBRyxLQUFLUCxPQUFSLEVBQWlCLEtBQUtJLFVBQXRCLENBQWY7O0FBQ0EsU0FBS0csT0FBTCxDQUFhQyxJQUFiLENBQWtCLE1BQWxCLEVBQTBCO0FBQUVwQixNQUFBQSxJQUFJLEVBQUpBLElBQUY7QUFBUUMsTUFBQUEsSUFBSSxFQUFKQTtBQUFSLEtBQTFCLEVBQTBDLFVBQUFvQixhQUFhLEVBQUk7QUFDekQsTUFBQSxLQUFJLENBQUNDLGNBQUwsR0FBc0JELGFBQXRCOztBQUNBLFVBQUksS0FBSSxDQUFDWCxPQUFULEVBQWtCO0FBQ2hCO0FBQ0Esa0NBQVUsS0FBVjtBQUNELE9BSEQsTUFHTztBQUNMO0FBQ0EsUUFBQSxLQUFJLENBQUNhLEtBQUwsQ0FBVyxNQUFYLEVBQW1CO0FBQ2pCRixVQUFBQSxhQUFhLEVBQUUsS0FBSSxDQUFDQztBQURILFNBQW5CO0FBR0Q7O0FBRUQsTUFBQSxLQUFJLENBQUNILE9BQUwsQ0FBYUssRUFBYixDQUFnQixNQUFoQixFQUF3QixVQUFBQyxNQUFNLEVBQUk7QUFDaEMsWUFBSSxLQUFJLENBQUNmLE9BQUwsSUFBZ0IsS0FBSSxDQUFDQyxZQUF6QixFQUF1QztBQUNyQztBQUNBLGNBQUksS0FBSSxDQUFDZSxVQUFULEVBQXFCO0FBQ25CLFlBQUEsS0FBSSxDQUFDQSxVQUFMLENBQWdCQyxXQUFoQixDQUE0QixnQ0FBY0MsMEJBQWQsRUFBNkJILE1BQTdCLENBQTVCLEVBQWtFLENBQUNBLE1BQUQsQ0FBbEU7QUFDRCxXQUZELE1BRU87QUFDTCxZQUFBLEtBQUksQ0FBQ0ksSUFBTCxDQUFVQyxjQUFWLENBQXlCTCxNQUF6QjtBQUNEO0FBQ0YsU0FQRCxNQU9PO0FBQ0wsVUFBQSxLQUFJLENBQUNGLEtBQUwsQ0FBVyxNQUFYLEVBQW1CRSxNQUFuQjtBQUNEO0FBQ0YsT0FYRDs7QUFhQSxNQUFBLEtBQUksQ0FBQ04sT0FBTCxDQUFhSyxFQUFiLENBQWdCLE9BQWhCLEVBQXlCLFVBQUFPLE9BQU8sRUFBSTtBQUNsQyxRQUFBLEtBQUksQ0FBQ1IsS0FBTCxDQUFXLE9BQVgsRUFBb0IsSUFBSWhCLEtBQUosQ0FBVXdCLE9BQVYsQ0FBcEI7O0FBQ0EsUUFBQSxLQUFJLENBQUNDLEtBQUw7QUFDRCxPQUhEOztBQUtBLE1BQUEsS0FBSSxDQUFDYixPQUFMLENBQWFLLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUI7QUFBQSxlQUFNLEtBQUksQ0FBQ1EsS0FBTCxFQUFOO0FBQUEsT0FBekI7QUFDRCxLQS9CRDtBQWdDRDs7Ozs0QkFFUTtBQUNQLFdBQUszQixVQUFMLEdBQWtCLFNBQWxCOztBQUVBLFdBQUtjLE9BQUwsQ0FBYUMsSUFBYixDQUFrQixLQUFsQjs7QUFDQSxXQUFLRCxPQUFMLENBQWFjLFVBQWI7O0FBRUEsVUFBSSxLQUFLUCxVQUFULEVBQXFCO0FBQ25CLGFBQUtBLFVBQUwsQ0FBZ0JRLFNBQWhCO0FBQ0Q7O0FBRUQsV0FBS1gsS0FBTCxDQUFXLE9BQVg7QUFDRDs7O3lCQUVLRSxNLEVBQVE7QUFDWixVQUFJLEtBQUtmLE9BQUwsSUFBZ0IsS0FBS0MsWUFBekIsRUFBdUM7QUFDckM7QUFDQSxZQUFJLEtBQUtlLFVBQVQsRUFBcUI7QUFDbkIsZUFBS0EsVUFBTCxDQUFnQkMsV0FBaEIsQ0FBNEIsZ0NBQWNRLDJCQUFkLEVBQThCVixNQUE5QixDQUE1QixFQUFtRSxDQUFDQSxNQUFELENBQW5FO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsZUFBS0ksSUFBTCxDQUFVTyxlQUFWLENBQTBCWCxNQUExQjtBQUNEOztBQUNEO0FBQ0Q7O0FBRUQsV0FBS1ksS0FBTCxDQUFXWixNQUFYO0FBQ0Q7OzswQkFFTWEsSSxFQUFNO0FBQUE7O0FBQ1gsV0FBS25CLE9BQUwsQ0FBYUMsSUFBYixDQUFrQixNQUFsQixFQUEwQmtCLElBQTFCLEVBQWdDO0FBQUEsZUFBTSxNQUFJLENBQUNmLEtBQUwsQ0FBVyxPQUFYLENBQU47QUFBQSxPQUFoQztBQUNEOzs7c0NBRWtCO0FBQ2pCLFVBQUksS0FBS3BCLEdBQUwsSUFBWSxLQUFLUSxZQUFyQixFQUFtQztBQUVuQyxXQUFLQSxZQUFMLEdBQW9CLElBQXBCO0FBQ0EsZ0NBQVUsSUFBVjtBQUNEOzs7MEJBRU00QixJLEVBQU1ELEksRUFBTTtBQUNqQixVQUFNRSxNQUFNLEdBQUcsSUFBZjs7QUFDQSxjQUFRRCxJQUFSO0FBQ0UsYUFBSyxNQUFMO0FBQ0UsZUFBS2xDLFVBQUwsR0FBa0IsTUFBbEI7QUFDQSxlQUFLb0MsTUFBTCxJQUFlLEtBQUtBLE1BQUwsQ0FBWTtBQUFFRCxZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUQsWUFBQUEsSUFBSSxFQUFKQSxJQUFWO0FBQWdCRCxZQUFBQSxJQUFJLEVBQUpBO0FBQWhCLFdBQVosQ0FBZjtBQUNBOztBQUNGLGFBQUssT0FBTDtBQUNFLGVBQUtJLE9BQUwsSUFBZ0IsS0FBS0EsT0FBTCxDQUFhO0FBQUVGLFlBQUFBLE1BQU0sRUFBTkEsTUFBRjtBQUFVRCxZQUFBQSxJQUFJLEVBQUpBLElBQVY7QUFBZ0JELFlBQUFBLElBQUksRUFBSkE7QUFBaEIsV0FBYixDQUFoQjtBQUNBOztBQUNGLGFBQUssTUFBTDtBQUNFLGVBQUtLLE1BQUwsSUFBZSxLQUFLQSxNQUFMLENBQVk7QUFBRUgsWUFBQUEsTUFBTSxFQUFOQSxNQUFGO0FBQVVELFlBQUFBLElBQUksRUFBSkEsSUFBVjtBQUFnQkQsWUFBQUEsSUFBSSxFQUFKQTtBQUFoQixXQUFaLENBQWY7QUFDQTs7QUFDRixhQUFLLE9BQUw7QUFDRSxlQUFLTSxPQUFMLElBQWdCLEtBQUtBLE9BQUwsQ0FBYTtBQUFFSixZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUQsWUFBQUEsSUFBSSxFQUFKQSxJQUFWO0FBQWdCRCxZQUFBQSxJQUFJLEVBQUpBO0FBQWhCLFdBQWIsQ0FBaEI7QUFDQTs7QUFDRixhQUFLLE9BQUw7QUFDRSxlQUFLakMsVUFBTCxHQUFrQixRQUFsQjtBQUNBLGVBQUt3QyxPQUFMLElBQWdCLEtBQUtBLE9BQUwsQ0FBYTtBQUFFTCxZQUFBQSxNQUFNLEVBQU5BLE1BQUY7QUFBVUQsWUFBQUEsSUFBSSxFQUFKQSxJQUFWO0FBQWdCRCxZQUFBQSxJQUFJLEVBQUpBO0FBQWhCLFdBQWIsQ0FBaEI7QUFDQTtBQWpCSjtBQW1CRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhdGhPciwgcHJvcE9yIH0gZnJvbSAncmFtZGEnXG5pbXBvcnQgY3JlYXRlVGxzIGZyb20gJy4vdGxzLXV0aWxzJ1xuaW1wb3J0IGlvIGZyb20gJ3NvY2tldC5pby1jbGllbnQnXG5pbXBvcnQge1xuICBFVkVOVF9JTkJPVU5ELCBFVkVOVF9PVVRCT1VORCxcbiAgY3JlYXRlTWVzc2FnZVxufSBmcm9tICcuL3dvcmtlci11dGlscydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVENQU29ja2V0IHtcbiAgc3RhdGljIG9wZW4gKGhvc3QsIHBvcnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgVENQU29ja2V0KHsgaG9zdCwgcG9ydCwgb3B0aW9ucyB9KVxuICB9XG5cbiAgY29uc3RydWN0b3IgKHsgaG9zdCwgcG9ydCwgb3B0aW9ucyB9KSB7XG4gICAgdGhpcy5ob3N0ID0gaG9zdFxuICAgIHRoaXMucG9ydCA9IHBvcnRcbiAgICB0aGlzLnNzbCA9IGZhbHNlXG4gICAgdGhpcy5idWZmZXJlZEFtb3VudCA9IDBcbiAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY29ubmVjdGluZydcbiAgICB0aGlzLmJpbmFyeVR5cGUgPSBwcm9wT3IoJ2FycmF5YnVmZmVyJywgJ2JpbmFyeVR5cGUnKShvcHRpb25zKVxuXG4gICAgaWYgKHRoaXMuYmluYXJ5VHlwZSAhPT0gJ2FycmF5YnVmZmVyJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGFycmF5YnVmZmVycyBhcmUgc3VwcG9ydGVkIScpXG4gICAgfVxuXG4gICAgdGhpcy5fY2EgPSBvcHRpb25zLmNhXG4gICAgdGhpcy5fdXNlVExTID0gcHJvcE9yKGZhbHNlLCAndXNlU2VjdXJlVHJhbnNwb3J0Jykob3B0aW9ucylcbiAgICB0aGlzLl91c2VTVEFSVFRMUyA9IGZhbHNlXG5cbiAgICB0aGlzLl93c0hvc3QgPSBwYXRoT3Iod2luZG93LmxvY2F0aW9uLm9yaWdpbiwgWyd3cycsICd1cmwnXSkob3B0aW9ucylcbiAgICB0aGlzLl93c09wdGlvbnMgPSBwYXRoT3Ioe30sIFsnd3MnLCAnb3B0aW9ucyddKShvcHRpb25zKVxuICAgIHRoaXMuX3dzT3B0aW9ucy5yZWNvbm5lY3Rpb24gPSB0aGlzLl93c09wdGlvbnMucmVjb25uZWN0aW9uIHx8IGZhbHNlXG4gICAgdGhpcy5fd3NPcHRpb25zLm11bHRpcGxleCA9IHRoaXMuX3dzT3B0aW9ucy5tdWx0aXBsZXggfHwgZmFsc2VcblxuICAgIHRoaXMuX3NvY2tldCA9IGlvKHRoaXMuX3dzSG9zdCwgdGhpcy5fd3NPcHRpb25zKVxuICAgIHRoaXMuX3NvY2tldC5lbWl0KCdvcGVuJywgeyBob3N0LCBwb3J0IH0sIHByb3h5SG9zdG5hbWUgPT4ge1xuICAgICAgdGhpcy5fcHJveHlIb3N0bmFtZSA9IHByb3h5SG9zdG5hbWVcbiAgICAgIGlmICh0aGlzLl91c2VUTFMpIHtcbiAgICAgICAgLy8gdGhlIHNvY2tldCBpcyB1cCwgZG8gdGhlIHRscyBoYW5kc2hha2VcbiAgICAgICAgY3JlYXRlVGxzKHRoaXMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzb2NrZXQgaXMgdXAgYW5kIHJ1bm5pbmdcbiAgICAgICAgdGhpcy5fZW1pdCgnb3BlbicsIHtcbiAgICAgICAgICBwcm94eUhvc3RuYW1lOiB0aGlzLl9wcm94eUhvc3RuYW1lXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3NvY2tldC5vbignZGF0YScsIGJ1ZmZlciA9PiB7XG4gICAgICAgIGlmICh0aGlzLl91c2VUTFMgfHwgdGhpcy5fdXNlU1RBUlRUTFMpIHtcbiAgICAgICAgICAvLyBmZWVkIHRoZSBkYXRhIHRvIHRoZSB0bHMgc29ja2V0XG4gICAgICAgICAgaWYgKHRoaXMuX3Rsc1dvcmtlcikge1xuICAgICAgICAgICAgdGhpcy5fdGxzV29ya2VyLnBvc3RNZXNzYWdlKGNyZWF0ZU1lc3NhZ2UoRVZFTlRfSU5CT1VORCwgYnVmZmVyKSwgW2J1ZmZlcl0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Rscy5wcm9jZXNzSW5ib3VuZChidWZmZXIpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2VtaXQoJ2RhdGEnLCBidWZmZXIpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3InLCBtZXNzYWdlID0+IHtcbiAgICAgICAgdGhpcy5fZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IobWVzc2FnZSkpXG4gICAgICAgIHRoaXMuY2xvc2UoKVxuICAgICAgfSlcblxuICAgICAgdGhpcy5fc29ja2V0Lm9uKCdjbG9zZScsICgpID0+IHRoaXMuY2xvc2UoKSlcbiAgICB9KVxuICB9XG5cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zaW5nJ1xuXG4gICAgdGhpcy5fc29ja2V0LmVtaXQoJ2VuZCcpXG4gICAgdGhpcy5fc29ja2V0LmRpc2Nvbm5lY3QoKVxuXG4gICAgaWYgKHRoaXMuX3Rsc1dvcmtlcikge1xuICAgICAgdGhpcy5fdGxzV29ya2VyLnRlcm1pbmF0ZSgpXG4gICAgfVxuXG4gICAgdGhpcy5fZW1pdCgnY2xvc2UnKVxuICB9XG5cbiAgc2VuZCAoYnVmZmVyKSB7XG4gICAgaWYgKHRoaXMuX3VzZVRMUyB8fCB0aGlzLl91c2VTVEFSVFRMUykge1xuICAgICAgLy8gZ2l2ZSBidWZmZXIgdG8gZm9yZ2UgdG8gYmUgcHJlcGFyZWQgZm9yIHRsc1xuICAgICAgaWYgKHRoaXMuX3Rsc1dvcmtlcikge1xuICAgICAgICB0aGlzLl90bHNXb3JrZXIucG9zdE1lc3NhZ2UoY3JlYXRlTWVzc2FnZShFVkVOVF9PVVRCT1VORCwgYnVmZmVyKSwgW2J1ZmZlcl0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90bHMucHJlcGFyZU91dGJvdW5kKGJ1ZmZlcilcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuX3NlbmQoYnVmZmVyKVxuICB9XG5cbiAgX3NlbmQgKGRhdGEpIHtcbiAgICB0aGlzLl9zb2NrZXQuZW1pdCgnZGF0YScsIGRhdGEsICgpID0+IHRoaXMuX2VtaXQoJ2RyYWluJykpXG4gIH1cblxuICB1cGdyYWRlVG9TZWN1cmUgKCkge1xuICAgIGlmICh0aGlzLnNzbCB8fCB0aGlzLl91c2VTVEFSVFRMUykgcmV0dXJuXG5cbiAgICB0aGlzLl91c2VTVEFSVFRMUyA9IHRydWVcbiAgICBjcmVhdGVUbHModGhpcylcbiAgfVxuXG4gIF9lbWl0ICh0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpc1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuJ1xuICAgICAgICB0aGlzLm9ub3BlbiAmJiB0aGlzLm9ub3Blbih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkYXRhJzpcbiAgICAgICAgdGhpcy5vbmRhdGEgJiYgdGhpcy5vbmRhdGEoeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2RyYWluJzpcbiAgICAgICAgdGhpcy5vbmRyYWluICYmIHRoaXMub25kcmFpbih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2VkJ1xuICAgICAgICB0aGlzLm9uY2xvc2UgJiYgdGhpcy5vbmNsb3NlKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG59XG4iXX0=