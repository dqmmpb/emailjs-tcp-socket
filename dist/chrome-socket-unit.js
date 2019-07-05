"use strict";

var _chromeSocket = _interopRequireDefault(require("./chrome-socket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable no-unused-expressions */
describe('TcpSocket Chrome Socket unit tests', function () {
  var socket;
  var socketStub;
  var testData = new Uint8Array([0, 1, 2]);
  before(function () {
    global.chrome = {};
  });
  describe('chrome.socket', function () {
    beforeEach(function () {
      // create chrome.socket stub
      var ChromeLegacySocket = function ChromeLegacySocket() {};

      ChromeLegacySocket.prototype.create = function () {};

      ChromeLegacySocket.prototype.connect = function () {};

      ChromeLegacySocket.prototype.read = function () {};

      ChromeLegacySocket.prototype.disconnect = function () {};

      ChromeLegacySocket.prototype.destroy = function () {};

      ChromeLegacySocket.prototype.write = function () {};

      ChromeLegacySocket.prototype.secure = function () {};

      chrome.socket = socketStub = sinon.createStubInstance(ChromeLegacySocket);
      chrome.sockets = undefined;
      chrome.runtime = {
        getPlatformInfo: function getPlatformInfo(fn) {
          fn({
            os: 'mac'
          });
        }
      };
      socketStub.create.withArgs('tcp').yields({
        socketId: 42
      });
      socketStub.connect.withArgs(42, '127.0.0.1', 9000).yieldsAsync(0);
      socketStub.secure.withArgs(42).yieldsAsync(0);
      socketStub.read.withArgs(42).yieldsAsync({
        resultCode: 1,
        data: testData.buffer
      });
      socketStub.write.withArgs(42).yieldsAsync({
        bytesWritten: 3
      });
    });
    it('should open, read, write, close without ssl', function (done) {
      var sent = false;
      socket = _chromeSocket["default"].open('127.0.0.1', 9000, {
        useSecureTransport: false
      });

      socket.onopen = function () {
        expect(socket._socketId).to.equal(42);
        expect(socket.ssl).to.be["false"];
      };

      socket.ondata = function (e) {
        var buf = new Uint8Array(e.data);
        expect(buf).to.deep.equal(testData);

        if (!sent) {
          sent = !sent;
          socket.send(new Uint8Array([0, 1, 2]).buffer);
        }
      };

      socket.ondrain = function () {
        socket.close();
      };

      socket.onclose = function () {
        expect(socket.readyState).to.equal('closed');
        expect(socket._socketId).to.equal(0);
        expect(socketStub.create.calledOnce).to.be["true"];
        expect(socketStub.connect.calledOnce).to.be["true"];
        expect(socketStub.secure.called).to.be["false"];
        expect(socketStub.read.called).to.be["true"];
        expect(socketStub.disconnect.calledOnce).to.be["true"];
        expect(socketStub.destroy.calledOnce).to.be["true"];
        done();
      };
    });
    it('should open, read, write, close with ssl', function (done) {
      var sent = false;
      socket = _chromeSocket["default"].open('127.0.0.1', 9000, {
        useSecureTransport: true
      });

      socket.onopen = function () {
        expect(socket._socketId).to.equal(42);
        expect(socket.ssl).to.be["true"];
      };

      socket.ondata = function (e) {
        var buf = new Uint8Array(e.data);
        expect(buf).to.deep.equal(testData);

        if (!sent) {
          sent = !sent;
          socket.send(new Uint8Array([0, 1, 2]).buffer);
        }
      };

      socket.ondrain = function () {
        socket.close();
      };

      socket.onclose = function () {
        expect(socket.readyState).to.equal('closed');
        expect(socket._socketId).to.equal(0);
        expect(socketStub.create.calledOnce).to.be["true"];
        expect(socketStub.connect.calledOnce).to.be["true"];
        expect(socketStub.secure.calledOnce).to.be["true"];
        expect(socketStub.read.called).to.be["true"];
        expect(socketStub.write.called).to.be["true"];
        expect(socketStub.disconnect.calledOnce).to.be["true"];
        expect(socketStub.destroy.calledOnce).to.be["true"];
        done();
      };
    });
  });
  describe('chrome.sockets', function () {
    beforeEach(function () {
      // create chrome.socket stub
      var ChromeSocket = function ChromeSocket() {};

      ChromeSocket.prototype.create = function () {};

      ChromeSocket.prototype.connect = function () {};

      ChromeSocket.prototype.disconnect = function () {};

      ChromeSocket.prototype.send = function () {};

      ChromeSocket.prototype.secure = function () {};

      ChromeSocket.prototype.setPaused = function () {};

      chrome.socket = undefined;
      socketStub = sinon.createStubInstance(ChromeSocket);
      chrome.sockets = {
        tcp: socketStub
      };
      chrome.runtime = {
        getPlatformInfo: function getPlatformInfo(fn) {
          fn({
            os: 'cordova'
          });
        }
      };
      socketStub.onReceive = {
        addListener: function addListener(fn) {
          setTimeout(function () {
            fn({
              socketId: 42,
              data: testData.buffer
            });
          }, 50);
        }
      };
      socketStub.onReceiveError = {
        addListener: function addListener() {}
      };
      socketStub.create.yields({
        socketId: 42
      });
      socketStub.connect.withArgs(42, '127.0.0.1', 9000).yieldsAsync(0);
      socketStub.secure.withArgs(42).yieldsAsync(0);
      socketStub.setPaused.withArgs(42, true).yieldsAsync();
      socketStub.setPaused.withArgs(42, false).yieldsAsync();
      socketStub.send.withArgs(42).yieldsAsync({
        bytesWritten: 3
      });
    });
    it('should open, read, write, close without ssl', function (done) {
      var sent = false;
      socket = _chromeSocket["default"].open('127.0.0.1', 9000, {
        useSecureTransport: false
      });

      socket.onopen = function () {
        expect(socket._socketId).to.equal(42);
        expect(socket.ssl).to.be["false"];
      };

      socket.ondata = function (e) {
        var buf = new Uint8Array(e.data);
        expect(buf).to.deep.equal(testData);

        if (!sent) {
          sent = !sent;
          socket.send(new Uint8Array([0, 1, 2]).buffer);
        }
      };

      socket.ondrain = function () {
        socket.close();
      };

      socket.onclose = function () {
        expect(socket.readyState).to.equal('closed');
        expect(socket._socketId).to.equal(0);
        expect(socketStub.create.calledOnce).to.be["true"];
        expect(socketStub.connect.calledOnce).to.be["true"];
        expect(socketStub.secure.called).to.be["false"];
        expect(socketStub.send.calledOnce).to.be["true"];
        expect(socketStub.disconnect.calledOnce).to.be["true"];
        expect(socketStub.setPaused.calledTwice).to.be["true"];
        done();
      };
    });
    it('should open, read, write, close with ssl', function (done) {
      var sent = false;
      socket = _chromeSocket["default"].open('127.0.0.1', 9000, {
        useSecureTransport: true
      });

      socket.onopen = function () {
        expect(socket._socketId).to.equal(42);
        expect(socket.ssl).to.be["true"];
      };

      socket.ondata = function (e) {
        var buf = new Uint8Array(e.data);
        expect(buf).to.deep.equal(testData);

        if (!sent) {
          sent = !sent;
          socket.send(new Uint8Array([0, 1, 2]).buffer);
        }
      };

      socket.ondrain = function () {
        socket.close();
      };

      socket.onclose = function () {
        expect(socket.readyState).to.equal('closed');
        expect(socket._socketId).to.equal(0);
        expect(socketStub.create.calledOnce).to.be["true"];
        expect(socketStub.connect.calledOnce).to.be["true"];
        expect(socketStub.secure.calledOnce).to.be["true"];
        expect(socketStub.send.calledOnce).to.be["true"];
        expect(socketStub.disconnect.calledOnce).to.be["true"];
        expect(socketStub.setPaused.calledTwice).to.be["true"];
        done();
      };
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jaHJvbWUtc29ja2V0LXVuaXQuanMiXSwibmFtZXMiOlsiZGVzY3JpYmUiLCJzb2NrZXQiLCJzb2NrZXRTdHViIiwidGVzdERhdGEiLCJVaW50OEFycmF5IiwiYmVmb3JlIiwiZ2xvYmFsIiwiY2hyb21lIiwiYmVmb3JlRWFjaCIsIkNocm9tZUxlZ2FjeVNvY2tldCIsInByb3RvdHlwZSIsImNyZWF0ZSIsImNvbm5lY3QiLCJyZWFkIiwiZGlzY29ubmVjdCIsImRlc3Ryb3kiLCJ3cml0ZSIsInNlY3VyZSIsInNpbm9uIiwiY3JlYXRlU3R1Ykluc3RhbmNlIiwic29ja2V0cyIsInVuZGVmaW5lZCIsInJ1bnRpbWUiLCJnZXRQbGF0Zm9ybUluZm8iLCJmbiIsIm9zIiwid2l0aEFyZ3MiLCJ5aWVsZHMiLCJzb2NrZXRJZCIsInlpZWxkc0FzeW5jIiwicmVzdWx0Q29kZSIsImRhdGEiLCJidWZmZXIiLCJieXRlc1dyaXR0ZW4iLCJpdCIsImRvbmUiLCJzZW50IiwiVENQU29ja2V0Iiwib3BlbiIsInVzZVNlY3VyZVRyYW5zcG9ydCIsIm9ub3BlbiIsImV4cGVjdCIsIl9zb2NrZXRJZCIsInRvIiwiZXF1YWwiLCJzc2wiLCJiZSIsIm9uZGF0YSIsImUiLCJidWYiLCJkZWVwIiwic2VuZCIsIm9uZHJhaW4iLCJjbG9zZSIsIm9uY2xvc2UiLCJyZWFkeVN0YXRlIiwiY2FsbGVkT25jZSIsImNhbGxlZCIsIkNocm9tZVNvY2tldCIsInNldFBhdXNlZCIsInRjcCIsIm9uUmVjZWl2ZSIsImFkZExpc3RlbmVyIiwic2V0VGltZW91dCIsIm9uUmVjZWl2ZUVycm9yIiwiY2FsbGVkVHdpY2UiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFGQTtBQUlBQSxRQUFRLENBQUMsb0NBQUQsRUFBdUMsWUFBWTtBQUN6RCxNQUFJQyxNQUFKO0FBQ0EsTUFBSUMsVUFBSjtBQUNBLE1BQUlDLFFBQVEsR0FBRyxJQUFJQyxVQUFKLENBQWUsQ0FBQyxDQUFELEVBQUksQ0FB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KiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvbnMgKi9cblxuaW1wb3J0IFRDUFNvY2tldCBmcm9tICcuL2Nocm9tZS1zb2NrZXQnXG5cbmRlc2NyaWJlKCdUY3BTb2NrZXQgQ2hyb21lIFNvY2tldCB1bml0IHRlc3RzJywgZnVuY3Rpb24gKCkge1xuICBsZXQgc29ja2V0XG4gIGxldCBzb2NrZXRTdHViXG4gIGxldCB0ZXN0RGF0YSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSlcblxuICBiZWZvcmUoKCkgPT4ge1xuICAgIGdsb2JhbC5jaHJvbWUgPSB7fVxuICB9KVxuXG4gIGRlc2NyaWJlKCdjaHJvbWUuc29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgLy8gY3JlYXRlIGNocm9tZS5zb2NrZXQgc3R1YlxuICAgICAgdmFyIENocm9tZUxlZ2FjeVNvY2tldCA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lTGVnYWN5U29ja2V0LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7IH1cbiAgICAgIENocm9tZUxlZ2FjeVNvY2tldC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lTGVnYWN5U29ja2V0LnByb3RvdHlwZS5yZWFkID0gZnVuY3Rpb24gKCkgeyB9XG4gICAgICBDaHJvbWVMZWdhY3lTb2NrZXQucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7IH1cbiAgICAgIENocm9tZUxlZ2FjeVNvY2tldC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lTGVnYWN5U29ja2V0LnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lTGVnYWN5U29ja2V0LnByb3RvdHlwZS5zZWN1cmUgPSBmdW5jdGlvbiAoKSB7IH1cblxuICAgICAgY2hyb21lLnNvY2tldCA9IHNvY2tldFN0dWIgPSBzaW5vbi5jcmVhdGVTdHViSW5zdGFuY2UoQ2hyb21lTGVnYWN5U29ja2V0KVxuICAgICAgY2hyb21lLnNvY2tldHMgPSB1bmRlZmluZWRcbiAgICAgIGNocm9tZS5ydW50aW1lID0ge1xuICAgICAgICBnZXRQbGF0Zm9ybUluZm86IGZuID0+IHsgZm4oeyBvczogJ21hYycgfSkgfVxuICAgICAgfVxuXG4gICAgICBzb2NrZXRTdHViLmNyZWF0ZS53aXRoQXJncygndGNwJykueWllbGRzKHsgc29ja2V0SWQ6IDQyIH0pXG4gICAgICBzb2NrZXRTdHViLmNvbm5lY3Qud2l0aEFyZ3MoNDIsICcxMjcuMC4wLjEnLCA5MDAwKS55aWVsZHNBc3luYygwKVxuICAgICAgc29ja2V0U3R1Yi5zZWN1cmUud2l0aEFyZ3MoNDIpLnlpZWxkc0FzeW5jKDApXG4gICAgICBzb2NrZXRTdHViLnJlYWQud2l0aEFyZ3MoNDIpLnlpZWxkc0FzeW5jKHsgcmVzdWx0Q29kZTogMSwgZGF0YTogdGVzdERhdGEuYnVmZmVyIH0pXG4gICAgICBzb2NrZXRTdHViLndyaXRlLndpdGhBcmdzKDQyKS55aWVsZHNBc3luYyh7IGJ5dGVzV3JpdHRlbjogMyB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG9wZW4sIHJlYWQsIHdyaXRlLCBjbG9zZSB3aXRob3V0IHNzbCcsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICB2YXIgc2VudCA9IGZhbHNlXG5cbiAgICAgIHNvY2tldCA9IFRDUFNvY2tldC5vcGVuKCcxMjcuMC4wLjEnLCA5MDAwLCB7XG4gICAgICAgIHVzZVNlY3VyZVRyYW5zcG9ydDogZmFsc2VcbiAgICAgIH0pXG5cbiAgICAgIHNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChzb2NrZXQuX3NvY2tldElkKS50by5lcXVhbCg0MilcbiAgICAgICAgZXhwZWN0KHNvY2tldC5zc2wpLnRvLmJlLmZhbHNlXG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbmRhdGEgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkoZS5kYXRhKVxuICAgICAgICBleHBlY3QoYnVmKS50by5kZWVwLmVxdWFsKHRlc3REYXRhKVxuXG4gICAgICAgIGlmICghc2VudCkge1xuICAgICAgICAgIHNlbnQgPSAhc2VudFxuICAgICAgICAgIHNvY2tldC5zZW5kKG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSkuYnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbmRyYWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzb2NrZXQuY2xvc2UoKVxuICAgICAgfVxuXG4gICAgICBzb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXhwZWN0KHNvY2tldC5yZWFkeVN0YXRlKS50by5lcXVhbCgnY2xvc2VkJylcbiAgICAgICAgZXhwZWN0KHNvY2tldC5fc29ja2V0SWQpLnRvLmVxdWFsKDApXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmNyZWF0ZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5zZWN1cmUuY2FsbGVkKS50by5iZS5mYWxzZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5yZWFkLmNhbGxlZCkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5kaXNjb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuZGVzdHJveS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG5cbiAgICAgICAgZG9uZSgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgb3BlbiwgcmVhZCwgd3JpdGUsIGNsb3NlIHdpdGggc3NsJywgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgIHZhciBzZW50ID0gZmFsc2VcblxuICAgICAgc29ja2V0ID0gVENQU29ja2V0Lm9wZW4oJzEyNy4wLjAuMScsIDkwMDAsIHtcbiAgICAgICAgdXNlU2VjdXJlVHJhbnNwb3J0OiB0cnVlXG4gICAgICB9KVxuXG4gICAgICBzb2NrZXQub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3Qoc29ja2V0Ll9zb2NrZXRJZCkudG8uZXF1YWwoNDIpXG4gICAgICAgIGV4cGVjdChzb2NrZXQuc3NsKS50by5iZS50cnVlXG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbmRhdGEgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkoZS5kYXRhKVxuICAgICAgICBleHBlY3QoYnVmKS50by5kZWVwLmVxdWFsKHRlc3REYXRhKVxuXG4gICAgICAgIGlmICghc2VudCkge1xuICAgICAgICAgIHNlbnQgPSAhc2VudFxuICAgICAgICAgIHNvY2tldC5zZW5kKG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSkuYnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbmRyYWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzb2NrZXQuY2xvc2UoKVxuICAgICAgfVxuXG4gICAgICBzb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXhwZWN0KHNvY2tldC5yZWFkeVN0YXRlKS50by5lcXVhbCgnY2xvc2VkJylcbiAgICAgICAgZXhwZWN0KHNvY2tldC5fc29ja2V0SWQpLnRvLmVxdWFsKDApXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmNyZWF0ZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmNvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5zZWN1cmUuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5yZWFkLmNhbGxlZCkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi53cml0ZS5jYWxsZWQpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuZGlzY29ubmVjdC5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmRlc3Ryb3kuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuXG4gICAgICAgIGRvbmUoKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2Nocm9tZS5zb2NrZXRzJywgZnVuY3Rpb24gKCkge1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgLy8gY3JlYXRlIGNocm9tZS5zb2NrZXQgc3R1YlxuICAgICAgdmFyIENocm9tZVNvY2tldCA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lU29ja2V0LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7IH1cbiAgICAgIENocm9tZVNvY2tldC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHsgfVxuICAgICAgQ2hyb21lU29ja2V0LnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkgeyB9XG4gICAgICBDaHJvbWVTb2NrZXQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoKSB7IH1cbiAgICAgIENocm9tZVNvY2tldC5wcm90b3R5cGUuc2VjdXJlID0gZnVuY3Rpb24gKCkgeyB9XG4gICAgICBDaHJvbWVTb2NrZXQucHJvdG90eXBlLnNldFBhdXNlZCA9IGZ1bmN0aW9uICgpIHsgfVxuXG4gICAgICBjaHJvbWUuc29ja2V0ID0gdW5kZWZpbmVkXG4gICAgICBzb2NrZXRTdHViID0gc2lub24uY3JlYXRlU3R1Ykluc3RhbmNlKENocm9tZVNvY2tldClcbiAgICAgIGNocm9tZS5zb2NrZXRzID0ge1xuICAgICAgICB0Y3A6IHNvY2tldFN0dWJcbiAgICAgIH1cblxuICAgICAgY2hyb21lLnJ1bnRpbWUgPSB7XG4gICAgICAgIGdldFBsYXRmb3JtSW5mbzogZm4gPT4geyBmbih7IG9zOiAnY29yZG92YScgfSkgfVxuICAgICAgfVxuXG4gICAgICBzb2NrZXRTdHViLm9uUmVjZWl2ZSA9IHtcbiAgICAgICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyBmbih7IHNvY2tldElkOiA0MiwgZGF0YTogdGVzdERhdGEuYnVmZmVyIH0pIH0sIDUwKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNvY2tldFN0dWIub25SZWNlaXZlRXJyb3IgPSB7XG4gICAgICAgIGFkZExpc3RlbmVyOiBmdW5jdGlvbiAoKSB7IH1cbiAgICAgIH1cblxuICAgICAgc29ja2V0U3R1Yi5jcmVhdGUueWllbGRzKHtcbiAgICAgICAgc29ja2V0SWQ6IDQyXG4gICAgICB9KVxuICAgICAgc29ja2V0U3R1Yi5jb25uZWN0LndpdGhBcmdzKDQyLCAnMTI3LjAuMC4xJywgOTAwMCkueWllbGRzQXN5bmMoMClcbiAgICAgIHNvY2tldFN0dWIuc2VjdXJlLndpdGhBcmdzKDQyKS55aWVsZHNBc3luYygwKVxuICAgICAgc29ja2V0U3R1Yi5zZXRQYXVzZWQud2l0aEFyZ3MoNDIsIHRydWUpLnlpZWxkc0FzeW5jKClcbiAgICAgIHNvY2tldFN0dWIuc2V0UGF1c2VkLndpdGhBcmdzKDQyLCBmYWxzZSkueWllbGRzQXN5bmMoKVxuICAgICAgc29ja2V0U3R1Yi5zZW5kLndpdGhBcmdzKDQyKS55aWVsZHNBc3luYyh7XG4gICAgICAgIGJ5dGVzV3JpdHRlbjogM1xuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBvcGVuLCByZWFkLCB3cml0ZSwgY2xvc2Ugd2l0aG91dCBzc2wnLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgdmFyIHNlbnQgPSBmYWxzZVxuXG4gICAgICBzb2NrZXQgPSBUQ1BTb2NrZXQub3BlbignMTI3LjAuMC4xJywgOTAwMCwge1xuICAgICAgICB1c2VTZWN1cmVUcmFuc3BvcnQ6IGZhbHNlXG4gICAgICB9KVxuXG4gICAgICBzb2NrZXQub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3Qoc29ja2V0Ll9zb2NrZXRJZCkudG8uZXF1YWwoNDIpXG4gICAgICAgIGV4cGVjdChzb2NrZXQuc3NsKS50by5iZS5mYWxzZVxuICAgICAgfVxuXG4gICAgICBzb2NrZXQub25kYXRhID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGUuZGF0YSlcbiAgICAgICAgZXhwZWN0KGJ1ZikudG8uZGVlcC5lcXVhbCh0ZXN0RGF0YSlcblxuICAgICAgICBpZiAoIXNlbnQpIHtcbiAgICAgICAgICBzZW50ID0gIXNlbnRcbiAgICAgICAgICBzb2NrZXQuc2VuZChuZXcgVWludDhBcnJheShbMCwgMSwgMl0pLmJ1ZmZlcilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzb2NrZXQub25kcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc29ja2V0LmNsb3NlKClcbiAgICAgIH1cblxuICAgICAgc29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChzb2NrZXQucmVhZHlTdGF0ZSkudG8uZXF1YWwoJ2Nsb3NlZCcpXG4gICAgICAgIGV4cGVjdChzb2NrZXQuX3NvY2tldElkKS50by5lcXVhbCgwKVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5jcmVhdGUuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5jb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuc2VjdXJlLmNhbGxlZCkudG8uYmUuZmFsc2VcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuc2VuZC5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLmRpc2Nvbm5lY3QuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5zZXRQYXVzZWQuY2FsbGVkVHdpY2UpLnRvLmJlLnRydWVcblxuICAgICAgICBkb25lKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBvcGVuLCByZWFkLCB3cml0ZSwgY2xvc2Ugd2l0aCBzc2wnLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgdmFyIHNlbnQgPSBmYWxzZVxuXG4gICAgICBzb2NrZXQgPSBUQ1BTb2NrZXQub3BlbignMTI3LjAuMC4xJywgOTAwMCwge1xuICAgICAgICB1c2VTZWN1cmVUcmFuc3BvcnQ6IHRydWVcbiAgICAgIH0pXG5cbiAgICAgIHNvY2tldC5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV4cGVjdChzb2NrZXQuX3NvY2tldElkKS50by5lcXVhbCg0MilcbiAgICAgICAgZXhwZWN0KHNvY2tldC5zc2wpLnRvLmJlLnRydWVcbiAgICAgIH1cblxuICAgICAgc29ja2V0Lm9uZGF0YSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheShlLmRhdGEpXG4gICAgICAgIGV4cGVjdChidWYpLnRvLmRlZXAuZXF1YWwodGVzdERhdGEpXG5cbiAgICAgICAgaWYgKCFzZW50KSB7XG4gICAgICAgICAgc2VudCA9ICFzZW50XG4gICAgICAgICAgc29ja2V0LnNlbmQobmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKS5idWZmZXIpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc29ja2V0Lm9uZHJhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNvY2tldC5jbG9zZSgpXG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBleHBlY3Qoc29ja2V0LnJlYWR5U3RhdGUpLnRvLmVxdWFsKCdjbG9zZWQnKVxuICAgICAgICBleHBlY3Qoc29ja2V0Ll9zb2NrZXRJZCkudG8uZXF1YWwoMClcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuY3JlYXRlLmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuY29ubmVjdC5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLnNlY3VyZS5jYWxsZWRPbmNlKS50by5iZS50cnVlXG4gICAgICAgIGV4cGVjdChzb2NrZXRTdHViLnNlbmQuY2FsbGVkT25jZSkudG8uYmUudHJ1ZVxuICAgICAgICBleHBlY3Qoc29ja2V0U3R1Yi5kaXNjb25uZWN0LmNhbGxlZE9uY2UpLnRvLmJlLnRydWVcbiAgICAgICAgZXhwZWN0KHNvY2tldFN0dWIuc2V0UGF1c2VkLmNhbGxlZFR3aWNlKS50by5iZS50cnVlXG5cbiAgICAgICAgZG9uZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=