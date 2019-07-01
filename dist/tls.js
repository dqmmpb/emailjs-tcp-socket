"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _nodeForge = require("node-forge");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TlsClient =
/*#__PURE__*/
function () {
  function TlsClient() {
    var _this = this;

    _classCallCheck(this, TlsClient);

    this.open = false;
    this._outboundBuffer = [];
    this._tls = _nodeForge.tls.createConnection({
      server: false,
      verify: function verify(connection, verified, depth, certs) {
        if (!(certs && certs[0])) {
          return false;
        }

        if (!_this.verifyCertificate(certs[0], _this._host)) {
          return false;
        }
        /*
         * Please see the readme for an explanation of the behavior without a native TLS stack!
         */
        // without a pinned certificate, we'll just accept the connection and notify the upper layer


        if (!_this._ca) {
          // notify the upper layer of the new cert
          _this.tlscert(_nodeForge.pki.certificateToPem(certs[0])); // succeed only if this.tlscert is implemented (otherwise forge catches the error)


          return true;
        } // if we have a pinned certificate, things get a little more complicated:
        // - leaf certificates pin the host directly, e.g. for self-signed certificates
        // - we also allow intermediate certificates, for providers that are able to sign their own certs.
        // detect if this is a certificate used for signing by testing if the common name different from the hostname.
        // also, an intermediate cert has no SANs, at least none that match the hostname.


        if (!_this.verifyCertificate(_this._ca, _this._host)) {
          // verify certificate through a valid certificate chain
          return _this._ca.verify(certs[0]);
        } // verify certificate through host certificate pinning


        var fpPinned = _nodeForge.pki.getPublicKeyFingerprint(_this._ca.publicKey, {
          encoding: 'hex'
        });

        var fpRemote = _nodeForge.pki.getPublicKeyFingerprint(certs[0].publicKey, {
          encoding: 'hex'
        }); // check if cert fingerprints match


        if (fpPinned === fpRemote) {
          return true;
        } // notify the upper layer of the new cert


        _this.tlscert(_nodeForge.pki.certificateToPem(certs[0])); // fail when fingerprint does not match


        return false;
      },
      connected: function connected(connection) {
        if (!connection) {
          _this.tlserror('Unable to connect');

          _this.tlsclose();

          return;
        } // tls connection open


        _this.open = true;

        _this.tlsopen(); // empty the buffer


        while (_this._outboundBuffer.length) {
          _this.prepareOutbound(_this._outboundBuffer.shift());
        }
      },
      tlsDataReady: function tlsDataReady(connection) {
        return _this.tlsoutbound(s2a(connection.tlsData.getBytes()));
      },
      dataReady: function dataReady(connection) {
        return _this.tlsinbound(s2a(connection.data.getBytes()));
      },
      closed: function closed() {
        return _this.tlsclose();
      },
      error: function error(connection, _error) {
        _this.tlserror(_error.message);

        _this.tlsclose();
      }
    });
  }

  _createClass(TlsClient, [{
    key: "configure",
    value: function configure(options) {
      this._host = options.host;

      if (options.ca) {
        this._ca = _nodeForge.pki.certificateFromPem(options.ca);
      }
    }
  }, {
    key: "prepareOutbound",
    value: function prepareOutbound(buffer) {
      if (!this.open) {
        this._outboundBuffer.push(buffer);

        return;
      }

      this._tls.prepare(a2s(buffer));
    }
  }, {
    key: "processInbound",
    value: function processInbound(buffer) {
      this._tls.process(a2s(buffer));
    }
  }, {
    key: "handshake",
    value: function handshake() {
      this._tls.handshake();
    }
    /**
     * Verifies a host name by the Common Name or Subject Alternative Names
     * Expose as a method of TlsClient for testing purposes
     *
     * @param {Object} cert A forge certificate object
     * @param {String} host The host name, e.g. imap.gmail.com
     * @return {Boolean} true, if host name matches certificate, otherwise false
     */

  }, {
    key: "verifyCertificate",
    value: function verifyCertificate(cert, host) {
      var _this2 = this;

      var entries;
      var subjectAltName = cert.getExtension({
        name: 'subjectAltName'
      });
      var cn = cert.subject.getField('CN'); // If subjectAltName is present then it must be used and Common Name must be discarded
      // http://tools.ietf.org/html/rfc2818#section-3.1
      // So we check subjectAltName first and if it does not exist then revert back to Common Name

      if (subjectAltName && subjectAltName.altNames && subjectAltName.altNames.length) {
        entries = subjectAltName.altNames.map(function (entry) {
          return entry.value;
        });
      } else if (cn && cn.value) {
        entries = [cn.value];
      } else {
        return false;
      } // find matches for hostname and if any are found return true, otherwise returns false


      return !!entries.filter(function (sanEntry) {
        return _this2.compareServername(host.toLowerCase(), sanEntry.toLowerCase());
      }).length;
    }
    /**
     * Compares servername with a subjectAltName entry. Returns true if these values match.
     *
     * Wildcard usage in certificate hostnames is very limited, the only valid usage
     * form is "*.domain" and not "*sub.domain" or "sub.*.domain" so we only have to check
     * if the entry starts with "*." when comparing against a wildcard hostname. If "*" is used
     * in invalid places, then treat it as a string and not as a wildcard.
     *
     * @param {String} servername Hostname to check
     * @param {String} sanEntry subjectAltName entry to check against
     * @returns {Boolean} Returns true if hostname matches entry from SAN
     */

  }, {
    key: "compareServername",
    value: function compareServername() {
      var servername = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var sanEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      // if the entry name does not include a wildcard, then expect exact match
      if (sanEntry.substr(0, 2) !== '*.') {
        return sanEntry === servername;
      } // otherwise ignore the first subdomain


      return servername.split('.').slice(1).join('.') === sanEntry.substr(2);
    }
  }]);

  return TlsClient;
}();

exports["default"] = TlsClient;

var a2s = function a2s(arr) {
  return String.fromCharCode.apply(null, new Uint8Array(arr));
};

var s2a = function s2a(str) {
  return new Uint8Array(str.split('').map(function (_char) {
    return _char.charCodeAt(0);
  })).buffer;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90bHMuanMiXSwibmFtZXMiOlsiVGxzQ2xpZW50Iiwib3BlbiIsIl9vdXRib3VuZEJ1ZmZlciIsIl90bHMiLCJ0bHMiLCJjcmVhdGVDb25uZWN0aW9uIiwic2VydmVyIiwidmVyaWZ5IiwiY29ubmVjdGlvbiIsInZlcmlmaWVkIiwiZGVwdGgiLCJjZXJ0cyIsInZlcmlmeUNlcnRpZmljYXRlIiwiX2hvc3QiLCJfY2EiLCJ0bHNjZXJ0IiwicGtpIiwiY2VydGlmaWNhdGVUb1BlbSIsImZwUGlubmVkIiwiZ2V0UHVibGljS2V5RmluZ2VycHJpbnQiLCJwdWJsaWNLZXkiLCJlbmNvZGluZyIsImZwUmVtb3RlIiwiY29ubmVjdGVkIiwidGxzZXJyb3IiLCJ0bHNjbG9zZSIsInRsc29wZW4iLCJsZW5ndGgiLCJwcmVwYXJlT3V0Ym91bmQiLCJzaGlmdCIsInRsc0RhdGFSZWFkeSIsInRsc291dGJvdW5kIiwiczJhIiwidGxzRGF0YSIsImdldEJ5dGVzIiwiZGF0YVJlYWR5IiwidGxzaW5ib3VuZCIsImRhdGEiLCJjbG9zZWQiLCJlcnJvciIsIm1lc3NhZ2UiLCJvcHRpb25zIiwiaG9zdCIsImNhIiwiY2VydGlmaWNhdGVGcm9tUGVtIiwiYnVmZmVyIiwicHVzaCIsInByZXBhcmUiLCJhMnMiLCJwcm9jZXNzIiwiaGFuZHNoYWtlIiwiY2VydCIsImVudHJpZXMiLCJzdWJqZWN0QWx0TmFtZSIsImdldEV4dGVuc2lvbiIsIm5hbWUiLCJjbiIsInN1YmplY3QiLCJnZXRGaWVsZCIsImFsdE5hbWVzIiwibWFwIiwiZW50cnkiLCJ2YWx1ZSIsImZpbHRlciIsInNhbkVudHJ5IiwiY29tcGFyZVNlcnZlcm5hbWUiLCJ0b0xvd2VyQ2FzZSIsInNlcnZlcm5hbWUiLCJzdWJzdHIiLCJzcGxpdCIsInNsaWNlIiwiam9pbiIsImFyciIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsImFwcGx5IiwiVWludDhBcnJheSIsInN0ciIsImNoYXIiLCJjaGFyQ29kZUF0Il0s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QUFDRCxPQUpnRCxDQU1qRDs7O0FBQ0EsYUFBT0EsVUFBVSxDQUFDRSxLQUFYLENBQWlCLEdBQWpCLEVBQXNCQyxLQUF0QixDQUE0QixDQUE1QixFQUErQkMsSUFBL0IsQ0FBb0MsR0FBcEMsTUFBNkNQLFFBQVEsQ0FBQ0ksTUFBVCxDQUFnQixDQUFoQixDQUFwRDtBQUNEOzs7Ozs7OztBQUdILElBQU1wQixHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFBd0IsR0FBRztBQUFBLFNBQUlDLE1BQU0sQ0FBQ0MsWUFBUCxDQUFvQkMsS0FBcEIsQ0FBMEIsSUFBMUIsRUFBZ0MsSUFBSUMsVUFBSixDQUFlSixHQUFmLENBQWhDLENBQUo7QUFBQSxDQUFmOztBQUNBLElBQU14QyxHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFBNkMsR0FBRztBQUFBLFNBQUksSUFBSUQsVUFBSixDQUFlQyxHQUFHLENBQUNSLEtBQUosQ0FBVSxFQUFWLEVBQWNULEdBQWQsQ0FBa0IsVUFBQWtCLEtBQUk7QUFBQSxXQUFJQSxLQUFJLENBQUNDLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBSjtBQUFBLEdBQXRCLENBQWYsRUFBOERsQyxNQUFsRTtBQUFBLENBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0bHMsIHBraSB9IGZyb20gJ25vZGUtZm9yZ2UnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRsc0NsaWVudCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMuX291dGJvdW5kQnVmZmVyID0gW11cblxuICAgIHRoaXMuX3RscyA9IHRscy5jcmVhdGVDb25uZWN0aW9uKHtcbiAgICAgIHNlcnZlcjogZmFsc2UsXG4gICAgICB2ZXJpZnk6IChjb25uZWN0aW9uLCB2ZXJpZmllZCwgZGVwdGgsIGNlcnRzKSA9PiB7XG4gICAgICAgIGlmICghKGNlcnRzICYmIGNlcnRzWzBdKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeUNlcnRpZmljYXRlKGNlcnRzWzBdLCB0aGlzLl9ob3N0KSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICogUGxlYXNlIHNlZSB0aGUgcmVhZG1lIGZvciBhbiBleHBsYW5hdGlvbiBvZiB0aGUgYmVoYXZpb3Igd2l0aG91dCBhIG5hdGl2ZSBUTFMgc3RhY2shXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8vIHdpdGhvdXQgYSBwaW5uZWQgY2VydGlmaWNhdGUsIHdlJ2xsIGp1c3QgYWNjZXB0IHRoZSBjb25uZWN0aW9uIGFuZCBub3RpZnkgdGhlIHVwcGVyIGxheWVyXG4gICAgICAgIGlmICghdGhpcy5fY2EpIHtcbiAgICAgICAgICAvLyBub3RpZnkgdGhlIHVwcGVyIGxheWVyIG9mIHRoZSBuZXcgY2VydFxuICAgICAgICAgIHRoaXMudGxzY2VydChwa2kuY2VydGlmaWNhdGVUb1BlbShjZXJ0c1swXSkpXG4gICAgICAgICAgLy8gc3VjY2VlZCBvbmx5IGlmIHRoaXMudGxzY2VydCBpcyBpbXBsZW1lbnRlZCAob3RoZXJ3aXNlIGZvcmdlIGNhdGNoZXMgdGhlIGVycm9yKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgcGlubmVkIGNlcnRpZmljYXRlLCB0aGluZ3MgZ2V0IGEgbGl0dGxlIG1vcmUgY29tcGxpY2F0ZWQ6XG4gICAgICAgIC8vIC0gbGVhZiBjZXJ0aWZpY2F0ZXMgcGluIHRoZSBob3N0IGRpcmVjdGx5LCBlLmcuIGZvciBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXNcbiAgICAgICAgLy8gLSB3ZSBhbHNvIGFsbG93IGludGVybWVkaWF0ZSBjZXJ0aWZpY2F0ZXMsIGZvciBwcm92aWRlcnMgdGhhdCBhcmUgYWJsZSB0byBzaWduIHRoZWlyIG93biBjZXJ0cy5cblxuICAgICAgICAvLyBkZXRlY3QgaWYgdGhpcyBpcyBhIGNlcnRpZmljYXRlIHVzZWQgZm9yIHNpZ25pbmcgYnkgdGVzdGluZyBpZiB0aGUgY29tbW9uIG5hbWUgZGlmZmVyZW50IGZyb20gdGhlIGhvc3RuYW1lLlxuICAgICAgICAvLyBhbHNvLCBhbiBpbnRlcm1lZGlhdGUgY2VydCBoYXMgbm8gU0FOcywgYXQgbGVhc3Qgbm9uZSB0aGF0IG1hdGNoIHRoZSBob3N0bmFtZS5cbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeUNlcnRpZmljYXRlKHRoaXMuX2NhLCB0aGlzLl9ob3N0KSkge1xuICAgICAgICAgIC8vIHZlcmlmeSBjZXJ0aWZpY2F0ZSB0aHJvdWdoIGEgdmFsaWQgY2VydGlmaWNhdGUgY2hhaW5cbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2EudmVyaWZ5KGNlcnRzWzBdKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmVyaWZ5IGNlcnRpZmljYXRlIHRocm91Z2ggaG9zdCBjZXJ0aWZpY2F0ZSBwaW5uaW5nXG4gICAgICAgIHZhciBmcFBpbm5lZCA9IHBraS5nZXRQdWJsaWNLZXlGaW5nZXJwcmludCh0aGlzLl9jYS5wdWJsaWNLZXksIHtcbiAgICAgICAgICBlbmNvZGluZzogJ2hleCdcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIGZwUmVtb3RlID0gcGtpLmdldFB1YmxpY0tleUZpbmdlcnByaW50KGNlcnRzWzBdLnB1YmxpY0tleSwge1xuICAgICAgICAgIGVuY29kaW5nOiAnaGV4J1xuICAgICAgICB9KVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIGNlcnQgZmluZ2VycHJpbnRzIG1hdGNoXG4gICAgICAgIGlmIChmcFBpbm5lZCA9PT0gZnBSZW1vdGUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm90aWZ5IHRoZSB1cHBlciBsYXllciBvZiB0aGUgbmV3IGNlcnRcbiAgICAgICAgdGhpcy50bHNjZXJ0KHBraS5jZXJ0aWZpY2F0ZVRvUGVtKGNlcnRzWzBdKSlcbiAgICAgICAgLy8gZmFpbCB3aGVuIGZpbmdlcnByaW50IGRvZXMgbm90IG1hdGNoXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGNvbm5lY3RlZDogKGNvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy50bHNlcnJvcignVW5hYmxlIHRvIGNvbm5lY3QnKVxuICAgICAgICAgIHRoaXMudGxzY2xvc2UoKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGxzIGNvbm5lY3Rpb24gb3BlblxuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlXG5cbiAgICAgICAgdGhpcy50bHNvcGVuKClcblxuICAgICAgICAvLyBlbXB0eSB0aGUgYnVmZmVyXG4gICAgICAgIHdoaWxlICh0aGlzLl9vdXRib3VuZEJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnByZXBhcmVPdXRib3VuZCh0aGlzLl9vdXRib3VuZEJ1ZmZlci5zaGlmdCgpKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdGxzRGF0YVJlYWR5OiAoY29ubmVjdGlvbikgPT4gdGhpcy50bHNvdXRib3VuZChzMmEoY29ubmVjdGlvbi50bHNEYXRhLmdldEJ5dGVzKCkpKSxcbiAgICAgIGRhdGFSZWFkeTogKGNvbm5lY3Rpb24pID0+IHRoaXMudGxzaW5ib3VuZChzMmEoY29ubmVjdGlvbi5kYXRhLmdldEJ5dGVzKCkpKSxcbiAgICAgIGNsb3NlZDogKCkgPT4gdGhpcy50bHNjbG9zZSgpLFxuICAgICAgZXJyb3I6IChjb25uZWN0aW9uLCBlcnJvcikgPT4ge1xuICAgICAgICB0aGlzLnRsc2Vycm9yKGVycm9yLm1lc3NhZ2UpXG4gICAgICAgIHRoaXMudGxzY2xvc2UoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBjb25maWd1cmUgKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9ob3N0ID0gb3B0aW9ucy5ob3N0XG4gICAgaWYgKG9wdGlvbnMuY2EpIHtcbiAgICAgIHRoaXMuX2NhID0gcGtpLmNlcnRpZmljYXRlRnJvbVBlbShvcHRpb25zLmNhKVxuICAgIH1cbiAgfVxuXG4gIHByZXBhcmVPdXRib3VuZCAoYnVmZmVyKSB7XG4gICAgaWYgKCF0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuX291dGJvdW5kQnVmZmVyLnB1c2goYnVmZmVyKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fdGxzLnByZXBhcmUoYTJzKGJ1ZmZlcikpXG4gIH1cblxuICBwcm9jZXNzSW5ib3VuZCAoYnVmZmVyKSB7XG4gICAgdGhpcy5fdGxzLnByb2Nlc3MoYTJzKGJ1ZmZlcikpXG4gIH1cblxuICBoYW5kc2hha2UgKCkge1xuICAgIHRoaXMuX3Rscy5oYW5kc2hha2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgaG9zdCBuYW1lIGJ5IHRoZSBDb21tb24gTmFtZSBvciBTdWJqZWN0IEFsdGVybmF0aXZlIE5hbWVzXG4gICAqIEV4cG9zZSBhcyBhIG1ldGhvZCBvZiBUbHNDbGllbnQgZm9yIHRlc3RpbmcgcHVycG9zZXNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNlcnQgQSBmb3JnZSBjZXJ0aWZpY2F0ZSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IGhvc3QgVGhlIGhvc3QgbmFtZSwgZS5nLiBpbWFwLmdtYWlsLmNvbVxuICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlLCBpZiBob3N0IG5hbWUgbWF0Y2hlcyBjZXJ0aWZpY2F0ZSwgb3RoZXJ3aXNlIGZhbHNlXG4gICAqL1xuICB2ZXJpZnlDZXJ0aWZpY2F0ZSAoY2VydCwgaG9zdCkge1xuICAgIGxldCBlbnRyaWVzXG5cbiAgICBjb25zdCBzdWJqZWN0QWx0TmFtZSA9IGNlcnQuZ2V0RXh0ZW5zaW9uKHtcbiAgICAgIG5hbWU6ICdzdWJqZWN0QWx0TmFtZSdcbiAgICB9KVxuXG4gICAgY29uc3QgY24gPSBjZXJ0LnN1YmplY3QuZ2V0RmllbGQoJ0NOJylcblxuICAgIC8vIElmIHN1YmplY3RBbHROYW1lIGlzIHByZXNlbnQgdGhlbiBpdCBtdXN0IGJlIHVzZWQgYW5kIENvbW1vbiBOYW1lIG11c3QgYmUgZGlzY2FyZGVkXG4gICAgLy8gaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjgxOCNzZWN0aW9uLTMuMVxuICAgIC8vIFNvIHdlIGNoZWNrIHN1YmplY3RBbHROYW1lIGZpcnN0IGFuZCBpZiBpdCBkb2VzIG5vdCBleGlzdCB0aGVuIHJldmVydCBiYWNrIHRvIENvbW1vbiBOYW1lXG4gICAgaWYgKHN1YmplY3RBbHROYW1lICYmIHN1YmplY3RBbHROYW1lLmFsdE5hbWVzICYmIHN1YmplY3RBbHROYW1lLmFsdE5hbWVzLmxlbmd0aCkge1xuICAgICAgZW50cmllcyA9IHN1YmplY3RBbHROYW1lLmFsdE5hbWVzLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5LnZhbHVlXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoY24gJiYgY24udmFsdWUpIHtcbiAgICAgIGVudHJpZXMgPSBbY24udmFsdWVdXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIGZpbmQgbWF0Y2hlcyBmb3IgaG9zdG5hbWUgYW5kIGlmIGFueSBhcmUgZm91bmQgcmV0dXJuIHRydWUsIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlXG4gICAgcmV0dXJuICEhZW50cmllcy5maWx0ZXIoc2FuRW50cnkgPT4gdGhpcy5jb21wYXJlU2VydmVybmFtZShob3N0LnRvTG93ZXJDYXNlKCksIHNhbkVudHJ5LnRvTG93ZXJDYXNlKCkpKS5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wYXJlcyBzZXJ2ZXJuYW1lIHdpdGggYSBzdWJqZWN0QWx0TmFtZSBlbnRyeS4gUmV0dXJucyB0cnVlIGlmIHRoZXNlIHZhbHVlcyBtYXRjaC5cbiAgICpcbiAgICogV2lsZGNhcmQgdXNhZ2UgaW4gY2VydGlmaWNhdGUgaG9zdG5hbWVzIGlzIHZlcnkgbGltaXRlZCwgdGhlIG9ubHkgdmFsaWQgdXNhZ2VcbiAgICogZm9ybSBpcyBcIiouZG9tYWluXCIgYW5kIG5vdCBcIipzdWIuZG9tYWluXCIgb3IgXCJzdWIuKi5kb21haW5cIiBzbyB3ZSBvbmx5IGhhdmUgdG8gY2hlY2tcbiAgICogaWYgdGhlIGVudHJ5IHN0YXJ0cyB3aXRoIFwiKi5cIiB3aGVuIGNvbXBhcmluZyBhZ2FpbnN0IGEgd2lsZGNhcmQgaG9zdG5hbWUuIElmIFwiKlwiIGlzIHVzZWRcbiAgICogaW4gaW52YWxpZCBwbGFjZXMsIHRoZW4gdHJlYXQgaXQgYXMgYSBzdHJpbmcgYW5kIG5vdCBhcyBhIHdpbGRjYXJkLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmVybmFtZSBIb3N0bmFtZSB0byBjaGVja1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc2FuRW50cnkgc3ViamVjdEFsdE5hbWUgZW50cnkgdG8gY2hlY2sgYWdhaW5zdFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGhvc3RuYW1lIG1hdGNoZXMgZW50cnkgZnJvbSBTQU5cbiAgICovXG4gIGNvbXBhcmVTZXJ2ZXJuYW1lIChzZXJ2ZXJuYW1lID0gJycsIHNhbkVudHJ5ID0gJycpIHtcbiAgICAvLyBpZiB0aGUgZW50cnkgbmFtZSBkb2VzIG5vdCBpbmNsdWRlIGEgd2lsZGNhcmQsIHRoZW4gZXhwZWN0IGV4YWN0IG1hdGNoXG4gICAgaWYgKHNhbkVudHJ5LnN1YnN0cigwLCAyKSAhPT0gJyouJykge1xuICAgICAgcmV0dXJuIHNhbkVudHJ5ID09PSBzZXJ2ZXJuYW1lXG4gICAgfVxuXG4gICAgLy8gb3RoZXJ3aXNlIGlnbm9yZSB0aGUgZmlyc3Qgc3ViZG9tYWluXG4gICAgcmV0dXJuIHNlcnZlcm5hbWUuc3BsaXQoJy4nKS5zbGljZSgxKS5qb2luKCcuJykgPT09IHNhbkVudHJ5LnN1YnN0cigyKVxuICB9XG59XG5cbmNvbnN0IGEycyA9IGFyciA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIG5ldyBVaW50OEFycmF5KGFycikpXG5jb25zdCBzMmEgPSBzdHIgPT4gbmV3IFVpbnQ4QXJyYXkoc3RyLnNwbGl0KCcnKS5tYXAoY2hhciA9PiBjaGFyLmNoYXJDb2RlQXQoMCkpKS5idWZmZXJcbiJdfQ==