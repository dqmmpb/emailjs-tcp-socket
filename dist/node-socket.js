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
    this.servername = (0, _ramda.propOr)(host, 'servername')(options);

    if (this.binaryType !== 'arraybuffer') {
      throw new Error('Only arraybuffers are supported!');
    }

    this._socket = this.ssl ? _tls["default"].connect(this.port, this.host, {
      servername: this.servername
    }, function () {
      return _this._emit('open');
    }) : _net["default"].connect(this.port, this.host, function () {
      return _this._emit('open');
    });

    this._socket.setKeepAlive(true); // add all event listeners to the new socket


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9ub2RlLXNvY2tldC5qcyJdLCJuYW1lcyI6WyJUQ1BTb2NrZXQiLCJob3N0IiwicG9ydCIsIm9wdGlvbnMiLCJzc2wiLCJidWZmZXJlZEFtb3VudCIsInJlYWR5U3RhdGUiLCJiaW5hcnlUeXBlIiwic2VydmVybmFtZSIsIkVycm9yIiwiX3NvY2tldCIsInRscyIsImNvbm5lY3QiLCJfZW1pdCIsIm5ldCIsInNldEtlZXBBbGl2ZSIsIl9hdHRhY2hMaXN0ZW5lcnMiLCJvbiIsIm5vZGVCdWYiLCJub2RlQnVmZmVydG9BcnJheUJ1ZmZlciIsImVycm9yIiwiY29kZSIsImNsb3NlIiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwidHlwZSIsImRhdGEiLCJ0YXJnZXQiLCJvbm9wZW4iLCJvbmVycm9yIiwib25kYXRhIiwib25kcmFpbiIsIm9uY2xvc2UiLCJlbmQiLCJ3cml0ZSIsImFycmF5QnVmZmVyVG9Ob2RlQnVmZmVyIiwiYmluZCIsIl9yZW1vdmVMaXN0ZW5lcnMiLCJzb2NrZXQiLCJidWYiLCJVaW50OEFycmF5IiwiZnJvbSIsImJ1ZmZlciIsImFiIiwiQnVmZmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUFFcUJBLFM7Ozs7O3lCQUNOQyxJLEVBQU1DLEksRUFBb0I7QUFBQSxVQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFDckMsYUFBTyxJQUFJSCxTQUFKLENBQWM7QUFBRUMsUUFBQUEsSUFBSSxFQUFKQSxJQUFGO0FBQVFDLFFBQUFBLElBQUksRUFBSkEsSUFBUjtBQUFjQyxRQUFBQSxPQUFPLEVBQVBBO0FBQWQsT0FBZCxDQUFQO0FBQ0Q7OztBQUVELDJCQUFzQztBQUFBOztBQUFBLFFBQXZCRixJQUF1QixRQUF2QkEsSUFBdUI7QUFBQSxRQUFqQkMsSUFBaUIsUUFBakJBLElBQWlCO0FBQUEsUUFBWEMsT0FBVyxRQUFYQSxPQUFXOztBQUFBOztBQUNwQyxTQUFLRixJQUFMLEdBQVlBLElBQVo7QUFD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LFdBQUtZLGdCQUFMO0FBQ0Q7Ozs7Ozs7O0FBR0gsSUFBTUcsdUJBQXVCLEdBQUcsU0FBMUJBLHVCQUEwQixDQUFBbUIsR0FBRztBQUFBLFNBQUlDLFVBQVUsQ0FBQ0MsSUFBWCxDQUFnQkYsR0FBaEIsRUFBcUJHLE1BQXpCO0FBQUEsQ0FBbkM7O0FBQ0EsSUFBTVAsdUJBQXVCLEdBQUcsU0FBMUJBLHVCQUEwQixDQUFDUSxFQUFEO0FBQUEsU0FBUUMsTUFBTSxDQUFDSCxJQUFQLENBQVksSUFBSUQsVUFBSixDQUFlRyxFQUFmLENBQVosQ0FBUjtBQUFBLENBQWhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcHJvcE9yIH0gZnJvbSAncmFtZGEnXG5pbXBvcnQgbmV0IGZyb20gJ25ldCdcbmltcG9ydCB0bHMgZnJvbSAndGxzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUQ1BTb2NrZXQge1xuICBzdGF0aWMgb3BlbiAoaG9zdCwgcG9ydCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgcmV0dXJuIG5ldyBUQ1BTb2NrZXQoeyBob3N0LCBwb3J0LCBvcHRpb25zIH0pXG4gIH1cblxuICBjb25zdHJ1Y3RvciAoeyBob3N0LCBwb3J0LCBvcHRpb25zIH0pIHtcbiAgICB0aGlzLmhvc3QgPSBob3N0XG4gICAgdGhpcy5wb3J0ID0gcG9ydFxuICAgIHRoaXMuc3NsID0gcHJvcE9yKGZhbHNlLCAndXNlU2VjdXJlVHJhbnNwb3J0Jykob3B0aW9ucylcbiAgICB0aGlzLmJ1ZmZlcmVkQW1vdW50ID0gMFxuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjb25uZWN0aW5nJ1xuICAgIHRoaXMuYmluYXJ5VHlwZSA9IHByb3BPcignYXJyYXlidWZmZXInLCAnYmluYXJ5VHlwZScpKG9wdGlvbnMpXG4gICAgdGhpcy5zZXJ2ZXJuYW1lID0gcHJvcE9yKGhvc3QsICdzZXJ2ZXJuYW1lJykob3B0aW9ucylcblxuICAgIGlmICh0aGlzLmJpbmFyeVR5cGUgIT09ICdhcnJheWJ1ZmZlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBhcnJheWJ1ZmZlcnMgYXJlIHN1cHBvcnRlZCEnKVxuICAgIH1cblxuICAgIHRoaXMuX3NvY2tldCA9IHRoaXMuc3NsXG4gICAgICA/IHRscy5jb25uZWN0KHRoaXMucG9ydCwgdGhpcy5ob3N0LCB7IHNlcnZlcm5hbWU6IHRoaXMuc2VydmVybmFtZSB9LCAoKSA9PiB0aGlzLl9lbWl0KCdvcGVuJykpXG4gICAgICA6IG5ldC5jb25uZWN0KHRoaXMucG9ydCwgdGhpcy5ob3N0LCAoKSA9PiB0aGlzLl9lbWl0KCdvcGVuJykpXG5cbiAgICB0aGlzLl9zb2NrZXQuc2V0S2VlcEFsaXZlKHRydWUpXG5cbiAgICAvLyBhZGQgYWxsIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgbmV3IHNvY2tldFxuICAgIHRoaXMuX2F0dGFjaExpc3RlbmVycygpXG4gIH1cblxuICBfYXR0YWNoTGlzdGVuZXJzICgpIHtcbiAgICB0aGlzLl9zb2NrZXQub24oJ2RhdGEnLCBub2RlQnVmID0+IHRoaXMuX2VtaXQoJ2RhdGEnLCBub2RlQnVmZmVydG9BcnJheUJ1ZmZlcihub2RlQnVmKSkpXG4gICAgdGhpcy5fc29ja2V0Lm9uKCdlcnJvcicsIGVycm9yID0+IHtcbiAgICAgIC8vIElnbm9yZSBFQ09OTlJFU0VUIGVycm9ycy4gRm9yIHRoZSBhcHAgdGhpcyBpcyB0aGUgc2FtZSBhcyBub3JtYWwgY2xvc2VcbiAgICAgIGlmIChlcnJvci5jb2RlICE9PSAnRUNPTk5SRVNFVCcpIHtcbiAgICAgICAgdGhpcy5fZW1pdCgnZXJyb3InLCBlcnJvcilcbiAgICAgIH1cbiAgICAgIHRoaXMuY2xvc2UoKVxuICAgIH0pXG5cbiAgICB0aGlzLl9zb2NrZXQub24oJ2VuZCcsICgpID0+IHRoaXMuX2VtaXQoJ2Nsb3NlJykpXG4gIH1cblxuICBfcmVtb3ZlTGlzdGVuZXJzICgpIHtcbiAgICB0aGlzLl9zb2NrZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCdkYXRhJylcbiAgICB0aGlzLl9zb2NrZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCdlbmQnKVxuICAgIHRoaXMuX3NvY2tldC5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2Vycm9yJylcbiAgfVxuXG4gIF9lbWl0ICh0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpc1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuJ1xuICAgICAgICB0aGlzLm9ub3BlbiAmJiB0aGlzLm9ub3Blbih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkYXRhJzpcbiAgICAgICAgdGhpcy5vbmRhdGEgJiYgdGhpcy5vbmRhdGEoeyB0YXJnZXQsIHR5cGUsIGRhdGEgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2RyYWluJzpcbiAgICAgICAgdGhpcy5vbmRyYWluICYmIHRoaXMub25kcmFpbih7IHRhcmdldCwgdHlwZSwgZGF0YSB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2VkJ1xuICAgICAgICB0aGlzLm9uY2xvc2UgJiYgdGhpcy5vbmNsb3NlKHsgdGFyZ2V0LCB0eXBlLCBkYXRhIH0pXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gQVBJXG4gIC8vXG5cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zaW5nJ1xuICAgIHRoaXMuX3NvY2tldC5lbmQoKVxuICB9XG5cbiAgc2VuZCAoZGF0YSkge1xuICAgIC8vIGNvbnZlcnQgZGF0YSB0byBzdHJpbmcgb3Igbm9kZSBidWZmZXJcbiAgICB0aGlzLl9zb2NrZXQud3JpdGUoYXJyYXlCdWZmZXJUb05vZGVCdWZmZXIoZGF0YSksIHRoaXMuX2VtaXQuYmluZCh0aGlzLCAnZHJhaW4nKSlcbiAgfVxuXG4gIHVwZ3JhZGVUb1NlY3VyZSAoKSB7XG4gICAgaWYgKHRoaXMuc3NsKSByZXR1cm5cblxuICAgIHRoaXMuX3JlbW92ZUxpc3RlbmVycygpXG4gICAgdGhpcy5fc29ja2V0ID0gdGxzLmNvbm5lY3QoeyBzb2NrZXQ6IHRoaXMuX3NvY2tldCB9LCAoKSA9PiB7IHRoaXMuc3NsID0gdHJ1ZSB9KVxuICAgIHRoaXMuX2F0dGFjaExpc3RlbmVycygpXG4gIH1cbn1cblxuY29uc3Qgbm9kZUJ1ZmZlcnRvQXJyYXlCdWZmZXIgPSBidWYgPT4gVWludDhBcnJheS5mcm9tKGJ1ZikuYnVmZmVyXG5jb25zdCBhcnJheUJ1ZmZlclRvTm9kZUJ1ZmZlciA9IChhYikgPT4gQnVmZmVyLmZyb20obmV3IFVpbnQ4QXJyYXkoYWIpKVxuIl19