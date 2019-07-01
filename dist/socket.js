"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TCPSocket;

var DummySocket =
/*#__PURE__*/
function () {
  function DummySocket() {
    _classCallCheck(this, DummySocket);
  }

  _createClass(DummySocket, null, [{
    key: "open",
    value: function open() {
      throw new Error('Runtime does not offer raw sockets!');
    }
  }]);

  return DummySocket;
}();

if (typeof process !== 'undefined' && !process.browser) {
  TCPSocket = require('./node-socket');
} else if (typeof chrome !== 'undefined' && (chrome.socket || chrome.sockets)) {
  TCPSocket = require('./chrome-socket');
} else if ((typeof Windows === "undefined" ? "undefined" : _typeof(Windows)) === 'object' && Windows && Windows.Networking && Windows.Networking.Sockets && Windows.Networking.Sockets.StreamSocket) {
  TCPSocket = require('./windows-socket');
} else if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object') {
  TCPSocket = require('./socketio-socket');
} else {
  TCPSocket = DummySocket;
}

module.exports = TCPSocket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXQuanMiXSwibmFtZXMiOlsiVENQU29ja2V0IiwiRHVtbXlTb2NrZXQiLCJFcnJvciIsInByb2Nlc3MiLCJicm93c2VyIiwicmVxdWlyZSIsImNocm9tZSIsInNvY2tldCIsInNvY2tldHMiLCJXaW5kb3dzIiwiTmV0d29ya2luZyIsIlNvY2tldHMiLCJTdHJlYW1Tb2NrZXQiLCJ3aW5kb3ciLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBSUEsU0FBSjs7SUFFTUMsVzs7Ozs7Ozs7OzJCQUNXO0FBQ2IsWUFBTSxJQUFJQyxLQUFKLENBQVUscUNBQVYsQ0FBTjtBQUNEOzs7Ozs7QUFHSCxJQUFJLE9BQU9DLE9BQVAsS0FBbUIsV0FBbkIsSUFBa0MsQ0FBQ0EsT0FBTyxDQUFDQyxPQUEvQyxFQUF3RDtBQUN0REosRUFBQUEsU0FBUyxHQUFHSyxPQUFPLENBQUMsZUFBRCxDQUFuQjtBQUNELENBRkQsTUFFTyxJQUFJLE9BQU9DLE1BQVAsS0FBa0IsV0FBbEIsS0FBa0NBLE1BQU0sQ0FBQ0MsTUFBUCxJQUFpQkQsTUFBTSxDQUFDRSxPQUExRCxDQUFKLEVBQXdFO0FBQzdFUixFQUFBQSxTQUFTLEdBQUdLLE9BQU8sQ0FBQyxpQkFBRCxDQUFuQjtBQUNELENBRk0sTUFFQSxJQUFJLFFBQU9JLE9BQVAseUNBQU9BLE9BQVAsT0FBbUIsUUFBbkIsSUFBK0JBLE9BQS9CLElBQTBDQSxPQUFPLENBQUNDLFVBQWxELElBQWdFRCxPQUFPLENBQUNDLFVBQVIsQ0FBbUJDLE9BQW5GLElBQThGRixPQUFPLENBQUNDLFVBQVIsQ0FBbUJDLE9BQW5CLENBQTJCQyxZQUE3SCxFQUEySTtBQUNoSlosRUFBQUEsU0FBUyxHQUFHSyxPQUFPLENBQUMsa0JBQUQsQ0FBbkI7QUFDRCxDQUZNLE1BRUEsSUFBSSxRQUFPUSxNQUFQLHlDQUFPQSxNQUFQLE9BQWtCLFFBQXRCLEVBQWdDO0FBQ3JDYixFQUFBQSxTQUFTLEdBQUdLLE9BQU8sQ0FBQyxtQkFBRCxDQUFuQjtBQUNELENBRk0sTUFFQTtBQUNMTCxFQUFBQSxTQUFTLEdBQUdDLFdBQVo7QUFDRDs7QUFFRGEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCZixTQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImxldCBUQ1BTb2NrZXRcblxuY2xhc3MgRHVtbXlTb2NrZXQge1xuICBzdGF0aWMgb3BlbiAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSdW50aW1lIGRvZXMgbm90IG9mZmVyIHJhdyBzb2NrZXRzIScpXG4gIH1cbn1cblxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAhcHJvY2Vzcy5icm93c2VyKSB7XG4gIFRDUFNvY2tldCA9IHJlcXVpcmUoJy4vbm9kZS1zb2NrZXQnKVxufSBlbHNlIGlmICh0eXBlb2YgY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJiAoY2hyb21lLnNvY2tldCB8fCBjaHJvbWUuc29ja2V0cykpIHtcbiAgVENQU29ja2V0ID0gcmVxdWlyZSgnLi9jaHJvbWUtc29ja2V0Jylcbn0gZWxzZSBpZiAodHlwZW9mIFdpbmRvd3MgPT09ICdvYmplY3QnICYmIFdpbmRvd3MgJiYgV2luZG93cy5OZXR3b3JraW5nICYmIFdpbmRvd3MuTmV0d29ya2luZy5Tb2NrZXRzICYmIFdpbmRvd3MuTmV0d29ya2luZy5Tb2NrZXRzLlN0cmVhbVNvY2tldCkge1xuICBUQ1BTb2NrZXQgPSByZXF1aXJlKCcuL3dpbmRvd3Mtc29ja2V0Jylcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHtcbiAgVENQU29ja2V0ID0gcmVxdWlyZSgnLi9zb2NrZXRpby1zb2NrZXQnKVxufSBlbHNlIHtcbiAgVENQU29ja2V0ID0gRHVtbXlTb2NrZXRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUQ1BTb2NrZXRcbiJdfQ==