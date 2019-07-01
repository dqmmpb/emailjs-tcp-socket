"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ramda = require("ramda");

var _net = _interopRequireDefault(require("net"));

var _tls = _interopRequireDefault(require("tls"));

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
    this.ssl = (0, _ramda.propOr)(false, 'useSecureTransport')(options);
    this.bufferedAmount = 0;
    this.readyState = 'connecting';
    this.binaryType = (0, _ramda.propOr)('arraybuffer', 'binaryType')(options);

    if (this.binaryType !== 'arraybuffer') {
      throw new Error('Only arraybuffers are supported!');
    }

    this._socket = this.ssl ? _tls["default"].connect(this.port, this.host, {}, function () {
      return _this._emit('open');
    }) : _net["default"].connect(this.port, this.host, function () {
      return _this._emit('open');
    }); // add all event listeners to the new socket

    this._attachListeners();
  }

  _createClass(TCPSocket, [{
    key: "_attachListeners",
    value: function _attachListeners() {
      var _this2 = this;

      this._socket.on('data', function (nodeBuf) {
        return _this2._emit('data', nodeBuffertoArrayBuffer(nodeBuf));
      });

      this._socket.on('error', function (error) {
        // Ignore ECONNRESET errors. For the app this is the same as normal close
        if (error.code !== 'ECONNRESET') {
          _this2._emit('error', error);
        }

        _this2.close();
      });

      this._socket.on('end', function () {
        return _this2._emit('close');
      });
    }
  }, {
    key: "_removeListeners",
    value: function _removeListeners() {
      this._socket.removeAllListeners('data');

      this._socket.removeAllListeners('end');

      this._socket.removeAllListeners('error');
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
    } //
    // API
    //

  }, {
    key: "close",
    value: function close() {
      this.readyState = 'closing';

      this._socket.end();
    }
  }, {
    key: "send",
    value: function send(data) {
      // convert data to string or node buffer
      this._socket.write(arrayBufferToNodeBuffer(data), this._emit.bind(this, 'drain'));
    }
  }, {
    key: "upgradeToSecure",
    value: function upgradeToSecure() {
      var _this3 = this;

      if (this.ssl) return;

      this._removeListeners();

      this._socket = _tls["default"].connect({
        socket: this._socket
      }, function () {
        _this3.ssl = true;
      });

      this._attachListeners();
    }
  }]);

  return TCPSocket;
}();

exports["default"] = TCPSocket;

var nodeBuffertoArrayBuffer = function nodeBuffertoArrayBuffer(buf) {
  return Uint8Array.from(buf).buffer;
};

var arrayBufferToNodeBuffer = function arrayBufferToNodeBuffer(ab) {
  return Buffer.from(new Uint8Array(ab));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ub2RlLXNvY2tldC5qcyJdLCJuYW1lcyI6WyJUQ1BTb2NrZXQiLCJob3N0IiwicG9ydCIsIm9wdGlvbnMiLCJzc2wiLCJidWZmZXJlZEFtb3VudCIsInJlYWR5U3RhdGUiLCJiaW5hcnlUeXBlIiwiRXJyb3IiLCJfc29ja2V0IiwidGxzIiwiY29ubmVjdCIsIl9lbWl0IiwibmV0IiwiX2F0dGFjaExpc3RlbmVycyIsIm9uIiwibm9kZUJ1ZiIsIm5vZGVCdWZmZXJ0b0FycmF5QnVmZmVyIiwiZXJyb3IiLCJjb2RlIiwiY2xvc2UiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJ0eXBlIiwiZGF0YSIsInRhcmdldCIsIm9ub3BlbiIsIm9uZXJyb3IiLCJvbmRhdGEiLCJvbmRyYWluIiwib25jbG9zZSIsImVuZCIsIndyaXRlIiwiYXJyYXlCdWZmZXJUb05vZGVCdWZmZXIiLCJiaW5kIiwiX3JlbW92ZUxpc3RlbmVycyIsInNvY2tldCIsImJ1ZiIsIlVpbnQ4QXJyYXkiLCJmcm9tIiwiYnVmZmVyIiwiYWIiLCJCdWZmZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQUVxQkEsUzs7Ozs7eUJBQ05DLEksRUFBTUMsSSxFQUFvQjtBQUFBLFVBQWRDLE9BQWMsdUVBQUosRUFBSTtBQUNyQyxhQUFPLElBQUlILFNBQUosQ0FBYztBQUFFQyxRQUFBQSxJQUFJLEVBQUpBLElBQUY7QUFBUUMsUUFBQUEsSUFBSSxFQUFKQSxJQUFSO0FBQWNDLFFBQUFBLE9BQU8sRUFBUEE7QUFBZCxPQUFkLENBQVA7QUFDRDs7O0FBRUQsMkJBQXNDO0FBQUE7O0FBQUEsUUFBdkJGLElBQXVCLFFBQXZCQSxJQUF1QjtBQUFBLFFBQWpCQyxJQUFpQixRQUFqQkEsSUFBaUI7QUFBQSxRQUFYQyxPQUFXLFFBQVhBLE9BQVc7O0FBQUE7O0FBQ3BDLFNBQUtGLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLElBQUwsR0FBWUEsSUFBWjtBQUNB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QSx1QkFBMEIsQ0FBQ1EsRUFBRDtBQUFBLFNBQVFDLE1BQU0sQ0FBQ0gsSUFBUCxDQUFZLElBQUlELFVBQUosQ0FBZUcsRUFBZixDQUFaLENBQVI7QUFBQSxDQUFoQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHByb3BPciB9IGZyb20gJ3JhbWRhJ1xuaW1wb3J0IG5ldCBmcm9tICduZXQnXG5pbXBvcnQgdGxzIGZyb20gJ3RscydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVENQU29ja2V0IHtcbiAgc3RhdGljIG9wZW4gKGhvc3QsIHBvcnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgVENQU29ja2V0KHsgaG9zdCwgcG9ydCwgb3B0aW9ucyB9KVxuICB9XG5cbiAgY29uc3RydWN0b3IgKHsgaG9zdCwgcG9ydCwgb3B0aW9ucyB9KSB7XG4gICAgdGhpcy5ob3N0ID0gaG9zdFxuICAgIHRoaXMucG9ydCA9IHBvcnRcbiAgICB0aGlzLnNzbCA9IHByb3BPcihmYWxzZSwgJ3VzZVNlY3VyZVRyYW5zcG9ydCcpKG9wdGlvbnMpXG4gICAgdGhpcy5idWZmZXJlZEFtb3VudCA9IDBcbiAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY29ubmVjdGluZydcbiAgICB0aGlzLmJpbmFyeVR5cGUgPSBwcm9wT3IoJ2FycmF5YnVmZmVyJywgJ2JpbmFyeVR5cGUnKShvcHRpb25zKVxuXG4gICAgaWYgKHRoaXMuYmluYXJ5VHlwZSAhPT0gJ2FycmF5YnVmZmVyJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGFycmF5YnVmZmVycyBhcmUgc3VwcG9ydGVkIScpXG4gICAgfVxuXG4gICAgdGhpcy5fc29ja2V0ID0gdGhpcy5zc2xcbiAgICAgID8gdGxzLmNvbm5lY3QodGhpcy5wb3J0LCB0aGlzLmhvc3QsIHsgfSwgKCkgPT4gdGhpcy5fZW1pdCgnb3BlbicpKVxuICAgICAgOiBuZXQuY29ubmVjdCh0aGlzLnBvcnQsIHRoaXMuaG9zdCwgKCkgPT4gdGhpcy5fZW1pdCgnb3BlbicpKVxuXG4gICAgLy8gYWRkIGFsbCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIG5ldyBzb2NrZXRcbiAgICB0aGlzLl9hdHRhY2hMaXN0ZW5lcnMoKVxuICB9XG5cbiAgX2F0dGFjaExpc3RlbmVycyAoKSB7XG4gICAgdGhpcy5fc29ja2V0Lm9uKCdkYXRhJywgbm9kZUJ1ZiA9PiB0aGlzLl9lbWl0KCdkYXRhJywgbm9kZUJ1ZmZlcnRvQXJyYXlCdWZmZXIobm9kZUJ1ZikpKVxuICAgIHRoaXMuX3NvY2tldC5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgICAvLyBJZ25vcmUgRUNPTk5SRVNFVCBlcnJvcnMuIEZvciB0aGUgYXBwIHRoaXMgaXMgdGhlIHNhbWUgYXMgbm9ybWFsIGNsb3NlXG4gICAgICBpZiAoZXJyb3IuY29kZSAhPT0gJ0VDT05OUkVTRVQnKSB7XG4gICAgICAgIHRoaXMuX2VtaXQoJ2Vycm9yJywgZXJyb3IpXG4gICAgICB9XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9KVxuXG4gICAgdGhpcy5fc29ja2V0Lm9uKCdlbmQnLCAoKSA9PiB0aGlzLl9lbWl0KCdjbG9zZScpKVxuICB9XG5cbiAgX3JlbW92ZUxpc3RlbmVycyAoKSB7XG4gICAgdGhpcy5fc29ja2V0LnJlbW92ZUFsbExpc3RlbmVycygnZGF0YScpXG4gICAgdGhpcy5fc29ja2V0LnJlbW92ZUFsbExpc3RlbmVycygnZW5kJylcbiAgICB0aGlzLl9zb2NrZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCdlcnJvcicpXG4gIH1cblxuICBfZW1pdCAodHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXNcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnb3BlbidcbiAgICAgICAgdGhpcy5vbm9wZW4gJiYgdGhpcy5vbm9wZW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgdGhpcy5vbmVycm9yICYmIHRoaXMub25lcnJvcih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICAgIHRoaXMub25kYXRhICYmIHRoaXMub25kYXRhKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkcmFpbic6XG4gICAgICAgIHRoaXMub25kcmFpbiAmJiB0aGlzLm9uZHJhaW4oeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nsb3NlZCdcbiAgICAgICAgdGhpcy5vbmNsb3NlICYmIHRoaXMub25jbG9zZSh7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIEFQSVxuICAvL1xuXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2luZydcbiAgICB0aGlzLl9zb2NrZXQuZW5kKClcbiAgfVxuXG4gIHNlbmQgKGRhdGEpIHtcbiAgICAvLyBjb252ZXJ0IGRhdGEgdG8gc3RyaW5nIG9yIG5vZGUgYnVmZmVyXG4gICAgdGhpcy5fc29ja2V0LndyaXRlKGFycmF5QnVmZmVyVG9Ob2RlQnVmZmVyKGRhdGEpLCB0aGlzLl9lbWl0LmJpbmQodGhpcywgJ2RyYWluJykpXG4gIH1cblxuICB1cGdyYWRlVG9TZWN1cmUgKCkge1xuICAgIGlmICh0aGlzLnNzbCkgcmV0dXJuXG5cbiAgICB0aGlzLl9yZW1vdmVMaXN0ZW5lcnMoKVxuICAgIHRoaXMuX3NvY2tldCA9IHRscy5jb25uZWN0KHsgc29ja2V0OiB0aGlzLl9zb2NrZXQgfSwgKCkgPT4geyB0aGlzLnNzbCA9IHRydWUgfSlcbiAgICB0aGlzLl9hdHRhY2hMaXN0ZW5lcnMoKVxuICB9XG59XG5cbmNvbnN0IG5vZGVCdWZmZXJ0b0FycmF5QnVmZmVyID0gYnVmID0+IFVpbnQ4QXJyYXkuZnJvbShidWYpLmJ1ZmZlclxuY29uc3QgYXJyYXlCdWZmZXJUb05vZGVCdWZmZXIgPSAoYWIpID0+IEJ1ZmZlci5mcm9tKG5ldyBVaW50OEFycmF5KGFiKSlcbiJdfQ==