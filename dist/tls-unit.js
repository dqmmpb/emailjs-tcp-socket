"use strict";

var _tls = _interopRequireDefault(require("./tls"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable no-unused-expressions */
describe('TlsClient unit tests', function () {
  describe('#verifyCertificate', function () {
    // Forge mocks
    var certNoAltWildcard = {
      subject: {
        getField: function getField() {
          return {
            value: '*.wmail.io'
          };
        }
      },
      getExtension: function getExtension() {
        return false;
      }
    };
    var certAlt = {
      subject: {
        getField: function getField() {
          return {
            value: '*.wmail.io'
          };
        }
      },
      getExtension: function getExtension() {
        return {
          altNames: [{
            value: '*.wmail.io'
          }, {
            value: 'wmail.io'
          }]
        };
      }
    };
    var certNoAltExact = {
      subject: {
        getField: function getField() {
          return {
            value: 'imap.wmail.io'
          };
        }
      },
      getExtension: function getExtension() {
        return false;
      }
    };
    it('should validate certificate hostname from CN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certNoAltExact, 'imap.wmail.io')).to.be["true"];
    });
    it('should validate certificate hostname from wildcard CN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certNoAltWildcard, 'wild.wmail.io')).to.be["true"];
    });
    it('should validate certificate hostname from wildcard SAN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'wild.wmail.io')).to.be["true"];
    });
    it('should validate certificate hostname from exact SAN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'wmail.io')).to.be["true"];
    });
    it('should not validate certificate hostname from CN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certNoAltExact, 'wmail.com')).to.be["false"];
      expect(_tls["default"].prototype.verifyCertificate(certNoAltExact, 'foo')).to.be["false"];
    });
    it('should not validate certificate hostname from wildcard CN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certNoAltWildcard, 'wmail.com')).to.be["false"];
      expect(_tls["default"].prototype.verifyCertificate(certNoAltWildcard, 'foo')).to.be["false"];
    });
    it('should not validate certificate hostname from wildcard SAN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'wmail.com')).to.be["false"];
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'foo')).to.be["false"];
    });
    it('should not validate certificate hostname from exact SAN', function () {
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'wmail.com')).to.be["false"];
      expect(_tls["default"].prototype.verifyCertificate(certAlt, 'foo')).to.be["false"];
    });
  });
  describe('#compareServername', function () {
    it('should find exact match', function () {
      expect(_tls["default"].prototype.compareServername('imap.wmail.io', 'imap.wmail.io')).to.be["true"];
      expect(_tls["default"].prototype.compareServername('imap.wmail.io', 'no-imap.wmail.io')).to.be["false"];
    });
    it('should find wildcard match', function () {
      expect(_tls["default"].prototype.compareServername('imap.wmail.io', '*.wmail.io')).to.be["true"];
      expect(_tls["default"].prototype.compareServername('imap.wmail.io', 'imap.*.io')).to.be["false"];
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90bHMtdW5pdC5qcyJdLCJuYW1lcyI6WyJkZXNjcmliZSIsImNlcnROb0FsdFdpbGRjYXJkIiwic3ViamVjdCIsImdldEZpZWxkIiwidmFsdWUiLCJnZXRFeHRlbnNpb24iLCJjZXJ0QWx0IiwiYWx0TmFtZXMiLCJjZXJ0Tm9BbHRFeGFjdCIsIml0IiwiZXhwZWN0IiwiVExTIiwicHJvdG90eXBlIiwidmVyaWZ5Q2VydGlmaWNhdGUiLCJ0byIsImJlIiwiY29tcGFyZVNlcnZlcm5hbWUiXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7QUFGQTtBQUlBQSxRQUFRLENBQUMsc0JBQUQsRUFBeUIsWUFBWTtBQUMzQ0EsRUFBQUEsUUFBUSxDQUFDLG9CQUFELEVBQXVCLFlBQVk7QUFDekM7QUFDQSxRQUFNQyxpQkFBaUIsR0FBRztBQUN4QkMsTUFBQUEsT0FBTyxFQUFFO0FBQ1BDLFFBQUFBLFFBQVEsRUFBRTtBQUFBLGlCQUFPO0FBQUVDLFlBQUFBLEtBQUssRUFBRTtBQUFULFdBQVA7QUFBQTtBQURILE9BRGU7QUFJeEJDLE1BQUFBLFlBQVksRUFBRTtBQUFBLGVBQU0sS0FBTjtBQUFBO0FBSlUsS0FBMUI7QUFPQSxRQUFNQyxPQUFPLEdBQUc7QUFDZEosTUFBQUEsT0FBTyxFQUFFO0FBQ1BDLFFBQUFBLFFBQVEsRUFBRTtBQUFBLGlCQUFPO0FBQUVDLFlBQUFBLEtBQUssRUFBRTtBQUFULFdBQVA7QUFBQTtBQURILE9BREs7QUFJZEMsTUFBQUEsWUFBWSxFQUFFO0FBQUEsZUFBTztBQUNuQkUsVUFBQUEsUUFBUSxFQUFFLENBQUM7QUFDVEgsWUFBQUEsS0FBSyxFQUFFO0FBREUsV0FBRCxFQUVQO0FBQ0RBLFlBQUFBLEtBQUssRUFBRTtBQUROLFdBRk87QUFEUyxTQUFQO0FBQUE7QUFKQSxLQUFoQjtBQWFBLFFBQU1JLGNBQWMsR0FBRztBQUNyQk4sTUFBQUEsT0FBTyxFQUFFO0FBQ1BDLFFBQUFBLFFBQVEsRUFBRTtBQUFBLGlCQUFPO0FBQUVDLFlB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QXhELENBQTJEQyxFQUEzRDtBQUNELEtBSEMsQ0FBRjtBQUlELEdBaEVPLENBQVI7QUFrRUFmLEVBQUFBLFFBQVEsQ0FBQyxvQkFBRCxFQUF1QixZQUFZO0FBQ3pDUyxJQUFBQSxFQUFFLENBQUMseUJBQUQsRUFBNEIsWUFBWTtBQUN4Q0MsTUFBQUEsTUFBTSxDQUFDQyxnQkFBSUMsU0FBSixDQUFjSSxpQkFBZCxDQUFnQyxlQUFoQyxFQUFpRCxlQUFqRCxDQUFELENBQU4sQ0FBMEVGLEVBQTFFLENBQTZFQyxFQUE3RTtBQUNBTCxNQUFBQSxNQUFNLENBQUNDLGdCQUFJQyxTQUFKLENBQWNJLGlCQUFkLENBQWdDLGVBQWhDLEVBQWlELGtCQUFqRCxDQUFELENBQU4sQ0FBNkVGLEVBQTdFLENBQWdGQyxFQUFoRjtBQUNELEtBSEMsQ0FBRjtBQUtBTixJQUFBQSxFQUFFLENBQUMsNEJBQUQsRUFBK0IsWUFBWTtBQUMzQ0MsTUFBQUEsTUFBTSxDQUFDQyxnQkFBSUMsU0FBSixDQUFjSSxpQkFBZCxDQUFnQyxlQUFoQyxFQUFpRCxZQUFqRCxDQUFELENBQU4sQ0FBdUVGLEVBQXZFLENBQTBFQyxFQUExRTtBQUNBTCxNQUFBQSxNQUFNLENBQUNDLGdCQUFJQyxTQUFKLENBQWNJLGlCQUFkLENBQWdDLGVBQWhDLEVBQWlELFdBQWpELENBQUQsQ0FBTixDQUFzRUYsRUFBdEUsQ0FBeUVDLEVBQXpFO0FBQ0QsS0FIQyxDQUFGO0FBSUQsR0FWTyxDQUFSO0FBV0QsQ0E5RU8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC1leHByZXNzaW9ucyAqL1xuXG5pbXBvcnQgVExTIGZyb20gJy4vdGxzJ1xuXG5kZXNjcmliZSgnVGxzQ2xpZW50IHVuaXQgdGVzdHMnLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCcjdmVyaWZ5Q2VydGlmaWNhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRm9yZ2UgbW9ja3NcbiAgICBjb25zdCBjZXJ0Tm9BbHRXaWxkY2FyZCA9IHtcbiAgICAgIHN1YmplY3Q6IHtcbiAgICAgICAgZ2V0RmllbGQ6ICgpID0+ICh7IHZhbHVlOiAnKi53bWFpbC5pbycgfSlcbiAgICAgIH0sXG4gICAgICBnZXRFeHRlbnNpb246ICgpID0+IGZhbHNlXG4gICAgfVxuXG4gICAgY29uc3QgY2VydEFsdCA9IHtcbiAgICAgIHN1YmplY3Q6IHtcbiAgICAgICAgZ2V0RmllbGQ6ICgpID0+ICh7IHZhbHVlOiAnKi53bWFpbC5pbycgfSlcbiAgICAgIH0sXG4gICAgICBnZXRFeHRlbnNpb246ICgpID0+ICh7XG4gICAgICAgIGFsdE5hbWVzOiBbe1xuICAgICAgICAgIHZhbHVlOiAnKi53bWFpbC5pbydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHZhbHVlOiAnd21haWwuaW8nXG4gICAgICAgIH1dXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGNlcnROb0FsdEV4YWN0ID0ge1xuICAgICAgc3ViamVjdDoge1xuICAgICAgICBnZXRGaWVsZDogKCkgPT4gKHsgdmFsdWU6ICdpbWFwLndtYWlsLmlvJyB9KVxuICAgICAgfSxcbiAgICAgIGdldEV4dGVuc2lvbjogKCkgPT4gZmFsc2VcbiAgICB9XG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGNlcnRpZmljYXRlIGhvc3RuYW1lIGZyb20gQ04nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBleHBlY3QoVExTLnByb3RvdHlwZS52ZXJpZnlDZXJ0aWZpY2F0ZShjZXJ0Tm9BbHRFeGFjdCwgJ2ltYXAud21haWwuaW8nKSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGNlcnRpZmljYXRlIGhvc3RuYW1lIGZyb20gd2lsZGNhcmQgQ04nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBleHBlY3QoVExTLnByb3RvdHlwZS52ZXJpZnlDZXJ0aWZpY2F0ZShjZXJ0Tm9BbHRXaWxkY2FyZCwgJ3dpbGQud21haWwuaW8nKSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGNlcnRpZmljYXRlIGhvc3RuYW1lIGZyb20gd2lsZGNhcmQgU0FOJywgZnVuY3Rpb24gKCkge1xuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUudmVyaWZ5Q2VydGlmaWNhdGUoY2VydEFsdCwgJ3dpbGQud21haWwuaW8nKSkudG8uYmUudHJ1ZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGNlcnRpZmljYXRlIGhvc3RuYW1lIGZyb20gZXhhY3QgU0FOJywgZnVuY3Rpb24gKCkge1xuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUudmVyaWZ5Q2VydGlmaWNhdGUoY2VydEFsdCwgJ3dtYWlsLmlvJykpLnRvLmJlLnRydWVcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgdmFsaWRhdGUgY2VydGlmaWNhdGUgaG9zdG5hbWUgZnJvbSBDTicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGV4cGVjdChUTFMucHJvdG90eXBlLnZlcmlmeUNlcnRpZmljYXRlKGNlcnROb0FsdEV4YWN0LCAnd21haWwuY29tJykpLnRvLmJlLmZhbHNlXG4gICAgICBleHBlY3QoVExTLnByb3RvdHlwZS52ZXJpZnlDZXJ0aWZpY2F0ZShjZXJ0Tm9BbHRFeGFjdCwgJ2ZvbycpKS50by5iZS5mYWxzZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5vdCB2YWxpZGF0ZSBjZXJ0aWZpY2F0ZSBob3N0bmFtZSBmcm9tIHdpbGRjYXJkIENOJywgZnVuY3Rpb24gKCkge1xuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUudmVyaWZ5Q2VydGlmaWNhdGUoY2VydE5vQWx0V2lsZGNhcmQsICd3bWFpbC5jb20nKSkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdChUTFMucHJvdG90eXBlLnZlcmlmeUNlcnRpZmljYXRlKGNlcnROb0FsdFdpbGRjYXJkLCAnZm9vJykpLnRvLmJlLmZhbHNlXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IHZhbGlkYXRlIGNlcnRpZmljYXRlIGhvc3RuYW1lIGZyb20gd2lsZGNhcmQgU0FOJywgZnVuY3Rpb24gKCkge1xuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUudmVyaWZ5Q2VydGlmaWNhdGUoY2VydEFsdCwgJ3dtYWlsLmNvbScpKS50by5iZS5mYWxzZVxuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUudmVyaWZ5Q2VydGlmaWNhdGUoY2VydEFsdCwgJ2ZvbycpKS50by5iZS5mYWxzZVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5vdCB2YWxpZGF0ZSBjZXJ0aWZpY2F0ZSBob3N0bmFtZSBmcm9tIGV4YWN0IFNBTicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGV4cGVjdChUTFMucHJvdG90eXBlLnZlcmlmeUNlcnRpZmljYXRlKGNlcnRBbHQsICd3bWFpbC5jb20nKSkudG8uYmUuZmFsc2VcbiAgICAgIGV4cGVjdChUTFMucHJvdG90eXBlLnZlcmlmeUNlcnRpZmljYXRlKGNlcnRBbHQsICdmb28nKSkudG8uYmUuZmFsc2VcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCcjY29tcGFyZVNlcnZlcm5hbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBmaW5kIGV4YWN0IG1hdGNoJywgZnVuY3Rpb24gKCkge1xuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUuY29tcGFyZVNlcnZlcm5hbWUoJ2ltYXAud21haWwuaW8nLCAnaW1hcC53bWFpbC5pbycpKS50by5iZS50cnVlXG4gICAgICBleHBlY3QoVExTLnByb3RvdHlwZS5jb21wYXJlU2VydmVybmFtZSgnaW1hcC53bWFpbC5pbycsICduby1pbWFwLndtYWlsLmlvJykpLnRvLmJlLmZhbHNlXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmluZCB3aWxkY2FyZCBtYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGV4cGVjdChUTFMucHJvdG90eXBlLmNvbXBhcmVTZXJ2ZXJuYW1lKCdpbWFwLndtYWlsLmlvJywgJyoud21haWwuaW8nKSkudG8uYmUudHJ1ZVxuICAgICAgZXhwZWN0KFRMUy5wcm90b3R5cGUuY29tcGFyZVNlcnZlcm5hbWUoJ2ltYXAud21haWwuaW8nLCAnaW1hcC4qLmlvJykpLnRvLmJlLmZhbHNlXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=