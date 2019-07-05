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
}(); // const a2s = arr => String.fromCharCode.apply(null, new Uint8Array(arr))

/**
 * When array is large(>=100KB), String.fromCharCode throw `Uncaught RangeError: Maximum call stack size exceeded`
 * @param arr
 * @returns {string}
 */


exports["default"] = TlsClient;

var a2s = function a2s(arr) {
  var array = new Uint8Array(arr);
  var chunk = 8 * 1024;
  var res = '';
  var i = 0;

  while (i < array.length / chunk) {
    res += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
    i++;
  }

  res += String.fromCharCode.apply(null, array.slice(i * chunk));
  return res;
};

var s2a = function s2a(str) {
  return new Uint8Array(str.split('').map(function (_char) {
    return _char.charCodeAt(0);
  })).buffer;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90bHMuanMiXSwibmFtZXMiOlsiVGxzQ2xpZW50Iiwib3BlbiIsIl9vdXRib3VuZEJ1ZmZlciIsIl90bHMiLCJ0bHMiLCJjcmVhdGVDb25uZWN0aW9uIiwic2VydmVyIiwidmVyaWZ5IiwiY29ubmVjdGlvbiIsInZlcmlmaWVkIiwiZGVwdGgiLCJjZXJ0cyIsInZlcmlmeUNlcnRpZmljYXRlIiwiX2hvc3QiLCJfY2EiLCJ0bHNjZXJ0IiwicGtpIiwiY2VydGlmaWNhdGVUb1BlbSIsImZwUGlubmVkIiwiZ2V0UHVibGljS2V5RmluZ2VycHJpbnQiLCJwdWJsaWNLZXkiLCJlbmNvZGluZyIsImZwUmVtb3RlIiwiY29ubmVjdGVkIiwidGxzZXJyb3IiLCJ0bHNjbG9zZSIsInRsc29wZW4iLCJsZW5ndGgiLCJwcmVwYXJlT3V0Ym91bmQiLCJzaGlmdCIsInRsc0RhdGFSZWFkeSIsInRsc291dGJvdW5kIiwiczJhIiwidGxzRGF0YSIsImdldEJ5dGVzIiwiZGF0YVJlYWR5IiwidGxzaW5ib3VuZCIsImRhdGEiLCJjbG9zZWQiLCJlcnJvciIsIm1lc3NhZ2UiLCJvcHRpb25zIiwiaG9zdCIsImNhIiwiY2VydGlmaWNhdGVGcm9tUGVtIiwiYnVmZmVyIiwicHVzaCIsInByZXBhcmUiLCJhMnMiLCJwcm9jZXNzIiwiaGFuZHNoYWtlIiwiY2VydCIsImVudHJpZXMiLCJzdWJqZWN0QWx0TmFtZSIsImdldEV4dGVuc2lvbiIsIm5hbWUiLCJjbiIsInN1YmplY3QiLCJnZXRGaWVsZCIsImFsdE5hbWVzIiwibWFwIiwiZW50cnkiLCJ2YWx1ZSIsImZpbHRlciIsInNhbkVudHJ5IiwiY29tcGFyZVNlcnZlcm5hbWUiLCJ0b0xvd2VyQ2FzZSIsInNlcnZlcm5hbWUiLCJzdWJzdHIiLCJzcGxpdCIsInNsaWNlIiwiam9pbiIsImFyciIsImFycmF5IiwiVWludDhBcnJheSIsImNodW5rIiwicmVzIiwiaSIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsImFwcGx5Iiwic3RyIiwiY2hhciIsImNoYXJDb2RlQXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7Ozs7SUFFcUJBLFM7OztBQUNuQix1QkFBZTtBQUFBOztBQUFBOztBQUNiLFNBQUtDLElBQUwsR0FBWSxLQUFaO0FBQ0EsU0FBS0MsZUFBTCxHQUF1QixFQUF2QjtBQUVBLFNBQUtDLElBQUwsR0FBWUMsZUFBSUMsZ0JBQUosQ0FBcUI7QUFDL0JDLE1BQUFBLE1BQU0sRUFBRSxLQUR1QjtBQUUvQkMsTUFBQUEsTUFBTSxFQUFFLGdCQUFDQyxVQUFELEVBQWFDLFFBQWIsRUFBdUJDLEtBQXZCLEVBQThCQyxLQUE5QixFQUF3QztBQUM5QyxZQUFJLEVBQUVBLEtBQUssSUFBSUEsS0FBSyxDQUFDLENBQUQsQ0FBaEIsQ0FBSixFQUEwQjtBQUN4QixpQkFBTyxLQUFQO0FBQ0Q7O0FBRUQsWUFBSSxDQUFDLEtBQUksQ0FBQ0MsaUJBQUwsQ0FBdUJELEtBQUssQ0FBQyxDQUFELENBQTVCLEVBQWlDLEtBQUksQ0FBQ0UsS0FBdEMsQ0FBTCxFQUFtRDtBQUNqRCxpQkFBTyxLQUFQO0FBQ0Q7QUFFRDs7O0FBSUE7OztBQUNBLFlBQUksQ0FBQyxLQUFJLENBQUNDLEdBQVYsRUFBZTtBQUNiO0FBQ0EsVUFBQSxLQUFJLENBQUNDLE9BQUwsQ0FBYUMsZUFBSUMsZ0JBQUosQ0FBcUJOLEtBQUssQ0FBQyxDQUFELENBQTFCLENBQWIsRUFGYSxDQUdiOzs7QUFDQSxpQkFBTyxJQUFQO0FBQ0QsU0FuQjZDLENBcUI5QztBQUNBO0FBQ0E7QUFFQTtBQUNBOzs7QUFDQSxZQUFJLENBQUMsS0FBSSxDQUFDQyxpQkFBTCxDQUF1QixLQUFJLENBQUNFLEdBQTVCLEVBQWlDLEtBQUksQ0FBQ0QsS0FBdEMsQ0FBTCxFQUFtRDtBQUNqRDtBQUNBLGlCQUFPLEtBQUksQ0FBQ0MsR0FBTCxDQUFTUCxNQUFULENBQWdCSSxLQUFLLENBQUMsQ0FBRCxDQUFyQixDQUFQO0FBQ0QsU0E5QjZDLENBZ0M5Qzs7O0FBQ0EsWUFBSU8sUUFBUSxHQUFHRixlQUFJRyx1QkFBSixDQUE0QixLQUFJLENBQUNMLEdBQUwsQ0FBU00sU0FBckMsRUFBZ0Q7QUFDN0RDLFVBQUFBLFFBQVEsRUFBRTtBQURtRCxTQUFoRCxDQUFmOztBQUdBLFlBQUlDLFFBQVEsR0FBR04sZUFBSUcsdUJBQUosQ0FBNEJSLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU1MsU0FBckMsRUFBZ0Q7QUFDN0RDLFVBQUFBLFFBQVEsRUFBRTtBQURtRCxTQUFoRCxDQUFmLENBcEM4QyxDQXdDOUM7OztBQUNBLFlBQUlILFFBQVEsS0FBS0ksUUFBakIsRUFBMkI7QUFDekIsaUJBQU8sSUFBUDtBQUNELFNBM0M2QyxDQTZDOUM7OztBQUNBLFFBQUEsS0FBSSxDQUFDUCxPQUFMLENBQWFDLGVBQUlDLGdCQUFKLENBQXFCTixLQUFLLENBQUMsQ0FBRCxDQUExQixDQUFiLEVBOUM4QyxDQStDOUM7OztBQUNBLGVBQU8sS0FBUDtBQUNELE9BbkQ4QjtBQW9EL0JZLE1BQUFBLFNBQVMsRUFBRSxtQkFBQ2YsVUFBRCxFQUFnQjtBQUN6QixZQUFJLENBQUNBLFVBQUwsRUFBaUI7QUFDZixVQUFBLEtBQUksQ0FBQ2dCLFFBQUwsQ0FBYyxtQkFBZDs7QUFDQSxVQUFBLEtBQUksQ0FBQ0MsUUFBTDs7QUFDQTtBQUNELFNBTHdCLENBT3pCOzs7QUFDQSxRQUFBLEtBQUksQ0FBQ3hCLElBQUwsR0FBWSxJQUFaOztBQUVBLFFBQUEsS0FBSSxDQUFDeUIsT0FBTCxHQVZ5QixDQVl6Qjs7O0FBQ0EsZUFBTyxLQUFJLENBQUN4QixlQUFMLENBQXFCeUIsTUFBNUIsRUFBb0M7QUFDbEMsVUFBQSxLQUFJLENBQUNDLGVBQUwsQ0FBcUIsS0FBSSxDQUFDMUIsZUFBTCxDQUFxQjJCLEtBQXJCLEVBQXJCO0FBQ0Q7QUFDRixPQXBFOEI7QUFxRS9CQyxNQUFBQSxZQUFZLEVBQUUsc0JBQUN0QixVQUFEO0FBQUEsZUFBZ0IsS0FBSSxDQUFDdUIsV0FBTCxDQUFpQkMsR0FBRyxDQUFDeEIsVUFBVSxDQUFDeUIsT0FBWCxDQUFtQkMsUUFBbkIsRUFBRCxDQUFwQixDQUFoQjtBQUFBLE9BckVpQjtBQXNFL0JDLE1BQUFBLFNBQVMsRUFBRSxtQkFBQzNCLFVBQUQ7QUFBQSxlQUFnQixLQUFJLENBQUM0QixVQUFMLENBQWdCSixHQUFHLENBQUN4QixVQUFVLENBQUM2QixJQUFYLENBQWdCSCxRQUFoQixFQUFELENBQW5CLENBQWhCO0FBQUEsT0F0RW9CO0FBdUUvQkksTUFBQUEsTUFBTSxFQUFFO0FBQUEsZUFBTSxLQUFJLENBQUNiLFFBQUwsRUFBTjtBQUFBLE9BdkV1QjtBQXdFL0JjLE1BQUFBLEtBQUssRUFBRSxlQUFDL0IsVUFBRCxFQUFhK0IsTUFBYixFQUF1QjtBQUM1QixRQUFBLEtBQUksQ0FBQ2YsUUFBTCxDQUFjZSxNQUFLLENBQUNDLE9BQXBCOztBQUNBLFFBQUEsS0FBSSxDQUFDZixRQUFMO0FBQ0Q7QUEzRThCLEtBQXJCLENBQVo7QUE2RUQ7Ozs7OEJBRVVnQixPLEVBQVM7QUFDbEIsV0FBSzVCLEtBQUwsR0FBYTRCLE9BQU8sQ0FBQ0MsSUFBckI7O0FBQ0EsVUFBSUQsT0FBTyxDQUFDRSxFQUFaLEVBQWdCO0FBQ2QsYUFBSzdCLEdBQUwsR0FBV0UsZUFBSTRCLGtCQUFKLENBQXVCSCxPQUFPLENBQUNFLEVBQS9CLENBQVg7QUFDRDtBQUNGOzs7b0NBRWdCRSxNLEVBQVE7QUFDdkIsVUFBSSxDQUFDLEtBQUs1QyxJQUFWLEVBQWdCO0FBQ2QsYUFBS0MsZUFBTCxDQUFxQjRDLElBQXJCLENBQTBCRCxNQUExQjs7QUFDQTtBQUNEOztBQUVELFdBQUsxQyxJQUFMLENBQVU0QyxPQUFWLENBQWtCQyxHQUFHLENBQUNILE1BQUQsQ0FBckI7QUFDRDs7O21DQUVlQSxNLEVBQVE7QUFDdEIsV0FBSzFDLElBQUwsQ0FBVThDLE9BQVYsQ0FBa0JELEdBQUcsQ0FBQ0gsTUFBRCxDQUFyQjtBQUNEOzs7Z0NBRVk7QUFDWCxXQUFLMUMsSUFBTCxDQUFVK0MsU0FBVjtBQUNEO0FBRUQ7Ozs7Ozs7Ozs7O3NDQVFtQkMsSSxFQUFNVCxJLEVBQU07QUFBQTs7QUFDN0IsVUFBSVUsT0FBSjtBQUVBLFVBQU1DLGNBQWMsR0FBR0YsSUFBSSxDQUFDRyxZQUFMLENBQWtCO0FBQ3ZDQyxRQUFBQSxJQUFJLEVBQUU7QUFEaUMsT0FBbEIsQ0FBdkI7QUFJQSxVQUFNQyxFQUFFLEdBQUdMLElBQUksQ0FBQ00sT0FBTCxDQUFhQyxRQUFiLENBQXNCLElBQXRCLENBQVgsQ0FQNkIsQ0FTN0I7QUFDQTtBQUNBOztBQUNBLFVBQUlMLGNBQWMsSUFBSUEsY0FBYyxDQUFDTSxRQUFqQyxJQUE2Q04sY0FBYyxDQUFDTSxRQUFmLENBQXdCaEMsTUFBekUsRUFBaUY7QUFDL0V5QixRQUFBQSxPQUFPLEdBQUdDLGNBQWMsQ0FBQ00sUUFBZixDQUF3QkMsR0FBeEIsQ0FBNEIsVUFBVUMsS0FBVixFQUFpQjtBQUNyRCxpQkFBT0EsS0FBSyxDQUFDQyxLQUFiO0FBQ0QsU0FGUyxDQUFWO0FBR0QsT0FKRCxNQUlPLElBQUlOLEVBQUUsSUFBSUEsRUFBRSxDQUFDTSxLQUFiLEVBQW9CO0FBQ3pCVixRQUFBQSxPQUFPLEdBQUcsQ0FBQ0ksRUFBRSxDQUFDTSxLQUFKLENBQVY7QUFDRCxPQUZNLE1BRUE7QUFDTCxlQUFPLEtBQVA7QUFDRCxPQXBCNEIsQ0FzQjdCOzs7QUFDQSxhQUFPLENBQUMsQ0FBQ1YsT0FBTyxDQUFDVyxNQUFSLENBQWUsVUFBQUMsUUFBUTtBQUFBLGVBQUksTUFBSSxDQUFDQyxpQkFBTCxDQUF1QnZCLElBQUksQ0FBQ3dCLFdBQUwsRUFBdkIsRUFBMkNGLFFBQVEsQ0FBQ0UsV0FBVCxFQUEzQyxDQUFKO0FBQUEsT0FBdkIsRUFBK0Z2QyxNQUF4RztBQUNEO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozt3Q0FZbUQ7QUFBQSxVQUFoQ3dDLFVBQWdDLHVFQUFuQixFQUFtQjtBQUFBLFVBQWZILFFBQWUsdUVBQUosRUFBSTs7QUFDakQ7QUFDQSxVQUFJQSxRQUFRLENBQUNJLE1BQVQsQ0FBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsTUFBMEIsSUFBOUIsRUFBb0M7QUFDbEMsZUFBT0osUUFBUSxLQUFLRyxVQUFwQjtBQUNELE9BSmdELENBTWpEOzs7QUFDQSxhQUFPQSxVQUFVLENBQUNFLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0JDLEtBQXRCLENBQTRCLENBQTVCLEVBQStCQyxJQUEvQixDQUFvQyxHQUFwQyxNQUE2Q1AsUUFBUSxDQUFDSSxNQUFULENBQWdCLENBQWhCLENBQXBEO0FBQ0Q7Ozs7S0FHSDs7QUFDQTs7Ozs7Ozs7O0FBS0EsSUFBTXBCLEdBQUcsR0FBRyxTQUFOQSxHQUFNLENBQUF3QixHQUFHLEVBQUk7QUFDakIsTUFBTUMsS0FBSyxHQUFHLElBQUlDLFVBQUosQ0FBZUYsR0FBZixDQUFkO0FBQ0EsTUFBTUcsS0FBSyxHQUFHLElBQUksSUFBbEI7QUFFQSxNQUFJQyxHQUFHLEdBQUcsRUFBVjtBQUNBLE1BQUlDLENBQUMsR0FBRyxDQUFSOztBQUNBLFNBQU9BLENBQUMsR0FBR0osS0FBSyxDQUFDOUMsTUFBTixHQUFlZ0QsS0FBMUIsRUFBaUM7QUFDL0JDLElBQUFBLEdBQUcsSUFBSUUsTUFBTSxDQUFDQyxZQUFQLENBQW9CQyxLQUFwQixDQUEwQixJQUExQixFQUFnQ1AsS0FBSyxDQUFDSCxLQUFOLENBQVlPLENBQUMsR0FBR0YsS0FBaEIsRUFBdUIsQ0FBQ0UsQ0FBQyxHQUFHLENBQUwsSUFBVUYsS0FBakMsQ0FBaEMsQ0FBUDtBQUNBRSxJQUFBQSxDQUFDO0FBQ0Y7O0FBQ0RELEVBQUFBLEdBQUcsSUFBSUUsTUFBTSxDQUFDQyxZQUFQLENBQW9CQyxLQUFwQixDQUEwQixJQUExQixFQUFnQ1AsS0FBSyxDQUFDSCxLQUFOLENBQVlPLENBQUMsR0FBR0YsS0FBaEIsQ0FBaEMsQ0FBUDtBQUVBLFNBQU9DLEdBQVA7QUFDRCxDQWJEOztBQWNBLElBQU01QyxHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFBaUQsR0FBRztBQUFBLFNBQUksSUFBSVAsVUFBSixDQUFlTyxHQUFHLENBQUNaLEtBQUosQ0FBVSxFQUFWLEVBQWNULEdBQWQsQ0FBa0IsVUFBQXNCLEtBQUk7QUFBQSxXQUFJQSxLQUFJLENBQUNDLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBSjtBQUFBLEdBQXRCLENBQWYsRUFBOER0QyxNQUFsRTtBQUFBLENBQWYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0bHMsIHBraSB9IGZyb20gJ25vZGUtZm9yZ2UnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRsc0NsaWVudCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZVxuICAgIHRoaXMuX291dGJvdW5kQnVmZmVyID0gW11cblxuICAgIHRoaXMuX3RscyA9IHRscy5jcmVhdGVDb25uZWN0aW9uKHtcbiAgICAgIHNlcnZlcjogZmFsc2UsXG4gICAgICB2ZXJpZnk6IChjb25uZWN0aW9uLCB2ZXJpZmllZCwgZGVwdGgsIGNlcnRzKSA9PiB7XG4gICAgICAgIGlmICghKGNlcnRzICYmIGNlcnRzWzBdKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeUNlcnRpZmljYXRlKGNlcnRzWzBdLCB0aGlzLl9ob3N0KSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICogUGxlYXNlIHNlZSB0aGUgcmVhZG1lIGZvciBhbiBleHBsYW5hdGlvbiBvZiB0aGUgYmVoYXZpb3Igd2l0aG91dCBhIG5hdGl2ZSBUTFMgc3RhY2shXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8vIHdpdGhvdXQgYSBwaW5uZWQgY2VydGlmaWNhdGUsIHdlJ2xsIGp1c3QgYWNjZXB0IHRoZSBjb25uZWN0aW9uIGFuZCBub3RpZnkgdGhlIHVwcGVyIGxheWVyXG4gICAgICAgIGlmICghdGhpcy5fY2EpIHtcbiAgICAgICAgICAvLyBub3RpZnkgdGhlIHVwcGVyIGxheWVyIG9mIHRoZSBuZXcgY2VydFxuICAgICAgICAgIHRoaXMudGxzY2VydChwa2kuY2VydGlmaWNhdGVUb1BlbShjZXJ0c1swXSkpXG4gICAgICAgICAgLy8gc3VjY2VlZCBvbmx5IGlmIHRoaXMudGxzY2VydCBpcyBpbXBsZW1lbnRlZCAob3RoZXJ3aXNlIGZvcmdlIGNhdGNoZXMgdGhlIGVycm9yKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgcGlubmVkIGNlcnRpZmljYXRlLCB0aGluZ3MgZ2V0IGEgbGl0dGxlIG1vcmUgY29tcGxpY2F0ZWQ6XG4gICAgICAgIC8vIC0gbGVhZiBjZXJ0aWZpY2F0ZXMgcGluIHRoZSBob3N0IGRpcmVjdGx5LCBlLmcuIGZvciBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXNcbiAgICAgICAgLy8gLSB3ZSBhbHNvIGFsbG93IGludGVybWVkaWF0ZSBjZXJ0aWZpY2F0ZXMsIGZvciBwcm92aWRlcnMgdGhhdCBhcmUgYWJsZSB0byBzaWduIHRoZWlyIG93biBjZXJ0cy5cblxuICAgICAgICAvLyBkZXRlY3QgaWYgdGhpcyBpcyBhIGNlcnRpZmljYXRlIHVzZWQgZm9yIHNpZ25pbmcgYnkgdGVzdGluZyBpZiB0aGUgY29tbW9uIG5hbWUgZGlmZmVyZW50IGZyb20gdGhlIGhvc3RuYW1lLlxuICAgICAgICAvLyBhbHNvLCBhbiBpbnRlcm1lZGlhdGUgY2VydCBoYXMgbm8gU0FOcywgYXQgbGVhc3Qgbm9uZSB0aGF0IG1hdGNoIHRoZSBob3N0bmFtZS5cbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeUNlcnRpZmljYXRlKHRoaXMuX2NhLCB0aGlzLl9ob3N0KSkge1xuICAgICAgICAgIC8vIHZlcmlmeSBjZXJ0aWZpY2F0ZSB0aHJvdWdoIGEgdmFsaWQgY2VydGlmaWNhdGUgY2hhaW5cbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2EudmVyaWZ5KGNlcnRzWzBdKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmVyaWZ5IGNlcnRpZmljYXRlIHRocm91Z2ggaG9zdCBjZXJ0aWZpY2F0ZSBwaW5uaW5nXG4gICAgICAgIHZhciBmcFBpbm5lZCA9IHBraS5nZXRQdWJsaWNLZXlGaW5nZXJwcmludCh0aGlzLl9jYS5wdWJsaWNLZXksIHtcbiAgICAgICAgICBlbmNvZGluZzogJ2hleCdcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIGZwUmVtb3RlID0gcGtpLmdldFB1YmxpY0tleUZpbmdlcnByaW50KGNlcnRzWzBdLnB1YmxpY0tleSwge1xuICAgICAgICAgIGVuY29kaW5nOiAnaGV4J1xuICAgICAgICB9KVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIGNlcnQgZmluZ2VycHJpbnRzIG1hdGNoXG4gICAgICAgIGlmIChmcFBpbm5lZCA9PT0gZnBSZW1vdGUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm90aWZ5IHRoZSB1cHBlciBsYXllciBvZiB0aGUgbmV3IGNlcnRcbiAgICAgICAgdGhpcy50bHNjZXJ0KHBraS5jZXJ0aWZpY2F0ZVRvUGVtKGNlcnRzWzBdKSlcbiAgICAgICAgLy8gZmFpbCB3aGVuIGZpbmdlcnByaW50IGRvZXMgbm90IG1hdGNoXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGNvbm5lY3RlZDogKGNvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy50bHNlcnJvcignVW5hYmxlIHRvIGNvbm5lY3QnKVxuICAgICAgICAgIHRoaXMudGxzY2xvc2UoKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGxzIGNvbm5lY3Rpb24gb3BlblxuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlXG5cbiAgICAgICAgdGhpcy50bHNvcGVuKClcblxuICAgICAgICAvLyBlbXB0eSB0aGUgYnVmZmVyXG4gICAgICAgIHdoaWxlICh0aGlzLl9vdXRib3VuZEJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLnByZXBhcmVPdXRib3VuZCh0aGlzLl9vdXRib3VuZEJ1ZmZlci5zaGlmdCgpKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdGxzRGF0YVJlYWR5OiAoY29ubmVjdGlvbikgPT4gdGhpcy50bHNvdXRib3VuZChzMmEoY29ubmVjdGlvbi50bHNEYXRhLmdldEJ5dGVzKCkpKSxcbiAgICAgIGRhdGFSZWFkeTogKGNvbm5lY3Rpb24pID0+IHRoaXMudGxzaW5ib3VuZChzMmEoY29ubmVjdGlvbi5kYXRhLmdldEJ5dGVzKCkpKSxcbiAgICAgIGNsb3NlZDogKCkgPT4gdGhpcy50bHNjbG9zZSgpLFxuICAgICAgZXJyb3I6IChjb25uZWN0aW9uLCBlcnJvcikgPT4ge1xuICAgICAgICB0aGlzLnRsc2Vycm9yKGVycm9yLm1lc3NhZ2UpXG4gICAgICAgIHRoaXMudGxzY2xvc2UoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBjb25maWd1cmUgKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9ob3N0ID0gb3B0aW9ucy5ob3N0XG4gICAgaWYgKG9wdGlvbnMuY2EpIHtcbiAgICAgIHRoaXMuX2NhID0gcGtpLmNlcnRpZmljYXRlRnJvbVBlbShvcHRpb25zLmNhKVxuICAgIH1cbiAgfVxuXG4gIHByZXBhcmVPdXRib3VuZCAoYnVmZmVyKSB7XG4gICAgaWYgKCF0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuX291dGJvdW5kQnVmZmVyLnB1c2goYnVmZmVyKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5fdGxzLnByZXBhcmUoYTJzKGJ1ZmZlcikpXG4gIH1cblxuICBwcm9jZXNzSW5ib3VuZCAoYnVmZmVyKSB7XG4gICAgdGhpcy5fdGxzLnByb2Nlc3MoYTJzKGJ1ZmZlcikpXG4gIH1cblxuICBoYW5kc2hha2UgKCkge1xuICAgIHRoaXMuX3Rscy5oYW5kc2hha2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgaG9zdCBuYW1lIGJ5IHRoZSBDb21tb24gTmFtZSBvciBTdWJqZWN0IEFsdGVybmF0aXZlIE5hbWVzXG4gICAqIEV4cG9zZSBhcyBhIG1ldGhvZCBvZiBUbHNDbGllbnQgZm9yIHRlc3RpbmcgcHVycG9zZXNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNlcnQgQSBmb3JnZSBjZXJ0aWZpY2F0ZSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IGhvc3QgVGhlIGhvc3QgbmFtZSwgZS5nLiBpbWFwLmdtYWlsLmNvbVxuICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlLCBpZiBob3N0IG5hbWUgbWF0Y2hlcyBjZXJ0aWZpY2F0ZSwgb3RoZXJ3aXNlIGZhbHNlXG4gICAqL1xuICB2ZXJpZnlDZXJ0aWZpY2F0ZSAoY2VydCwgaG9zdCkge1xuICAgIGxldCBlbnRyaWVzXG5cbiAgICBjb25zdCBzdWJqZWN0QWx0TmFtZSA9IGNlcnQuZ2V0RXh0ZW5zaW9uKHtcbiAgICAgIG5hbWU6ICdzdWJqZWN0QWx0TmFtZSdcbiAgICB9KVxuXG4gICAgY29uc3QgY24gPSBjZXJ0LnN1YmplY3QuZ2V0RmllbGQoJ0NOJylcblxuICAgIC8vIElmIHN1YmplY3RBbHROYW1lIGlzIHByZXNlbnQgdGhlbiBpdCBtdXN0IGJlIHVzZWQgYW5kIENvbW1vbiBOYW1lIG11c3QgYmUgZGlzY2FyZGVkXG4gICAgLy8gaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjgxOCNzZWN0aW9uLTMuMVxuICAgIC8vIFNvIHdlIGNoZWNrIHN1YmplY3RBbHROYW1lIGZpcnN0IGFuZCBpZiBpdCBkb2VzIG5vdCBleGlzdCB0aGVuIHJldmVydCBiYWNrIHRvIENvbW1vbiBOYW1lXG4gICAgaWYgKHN1YmplY3RBbHROYW1lICYmIHN1YmplY3RBbHROYW1lLmFsdE5hbWVzICYmIHN1YmplY3RBbHROYW1lLmFsdE5hbWVzLmxlbmd0aCkge1xuICAgICAgZW50cmllcyA9IHN1YmplY3RBbHROYW1lLmFsdE5hbWVzLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5LnZhbHVlXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoY24gJiYgY24udmFsdWUpIHtcbiAgICAgIGVudHJpZXMgPSBbY24udmFsdWVdXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIGZpbmQgbWF0Y2hlcyBmb3IgaG9zdG5hbWUgYW5kIGlmIGFueSBhcmUgZm91bmQgcmV0dXJuIHRydWUsIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlXG4gICAgcmV0dXJuICEhZW50cmllcy5maWx0ZXIoc2FuRW50cnkgPT4gdGhpcy5jb21wYXJlU2VydmVybmFtZShob3N0LnRvTG93ZXJDYXNlKCksIHNhbkVudHJ5LnRvTG93ZXJDYXNlKCkpKS5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wYXJlcyBzZXJ2ZXJuYW1lIHdpdGggYSBzdWJqZWN0QWx0TmFtZSBlbnRyeS4gUmV0dXJucyB0cnVlIGlmIHRoZXNlIHZhbHVlcyBtYXRjaC5cbiAgICpcbiAgICogV2lsZGNhcmQgdXNhZ2UgaW4gY2VydGlmaWNhdGUgaG9zdG5hbWVzIGlzIHZlcnkgbGltaXRlZCwgdGhlIG9ubHkgdmFsaWQgdXNhZ2VcbiAgICogZm9ybSBpcyBcIiouZG9tYWluXCIgYW5kIG5vdCBcIipzdWIuZG9tYWluXCIgb3IgXCJzdWIuKi5kb21haW5cIiBzbyB3ZSBvbmx5IGhhdmUgdG8gY2hlY2tcbiAgICogaWYgdGhlIGVudHJ5IHN0YXJ0cyB3aXRoIFwiKi5cIiB3aGVuIGNvbXBhcmluZyBhZ2FpbnN0IGEgd2lsZGNhcmQgaG9zdG5hbWUuIElmIFwiKlwiIGlzIHVzZWRcbiAgICogaW4gaW52YWxpZCBwbGFjZXMsIHRoZW4gdHJlYXQgaXQgYXMgYSBzdHJpbmcgYW5kIG5vdCBhcyBhIHdpbGRjYXJkLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmVybmFtZSBIb3N0bmFtZSB0byBjaGVja1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc2FuRW50cnkgc3ViamVjdEFsdE5hbWUgZW50cnkgdG8gY2hlY2sgYWdhaW5zdFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGhvc3RuYW1lIG1hdGNoZXMgZW50cnkgZnJvbSBTQU5cbiAgICovXG4gIGNvbXBhcmVTZXJ2ZXJuYW1lIChzZXJ2ZXJuYW1lID0gJycsIHNhbkVudHJ5ID0gJycpIHtcbiAgICAvLyBpZiB0aGUgZW50cnkgbmFtZSBkb2VzIG5vdCBpbmNsdWRlIGEgd2lsZGNhcmQsIHRoZW4gZXhwZWN0IGV4YWN0IG1hdGNoXG4gICAgaWYgKHNhbkVudHJ5LnN1YnN0cigwLCAyKSAhPT0gJyouJykge1xuICAgICAgcmV0dXJuIHNhbkVudHJ5ID09PSBzZXJ2ZXJuYW1lXG4gICAgfVxuXG4gICAgLy8gb3RoZXJ3aXNlIGlnbm9yZSB0aGUgZmlyc3Qgc3ViZG9tYWluXG4gICAgcmV0dXJuIHNlcnZlcm5hbWUuc3BsaXQoJy4nKS5zbGljZSgxKS5qb2luKCcuJykgPT09IHNhbkVudHJ5LnN1YnN0cigyKVxuICB9XG59XG5cbi8vIGNvbnN0IGEycyA9IGFyciA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIG5ldyBVaW50OEFycmF5KGFycikpXG4vKipcbiAqIFdoZW4gYXJyYXkgaXMgbGFyZ2UoPj0xMDBLQiksIFN0cmluZy5mcm9tQ2hhckNvZGUgdGhyb3cgYFVuY2F1Z2h0IFJhbmdlRXJyb3I6IE1heGltdW0gY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkYFxuICogQHBhcmFtIGFyclxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuY29uc3QgYTJzID0gYXJyID0+IHtcbiAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShhcnIpXG4gIGNvbnN0IGNodW5rID0gOCAqIDEwMjRcblxuICBsZXQgcmVzID0gJydcbiAgbGV0IGkgPSAwXG4gIHdoaWxlIChpIDwgYXJyYXkubGVuZ3RoIC8gY2h1bmspIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBhcnJheS5zbGljZShpICogY2h1bmssIChpICsgMSkgKiBjaHVuaykpXG4gICAgaSsrXG4gIH1cbiAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgYXJyYXkuc2xpY2UoaSAqIGNodW5rKSlcblxuICByZXR1cm4gcmVzXG59XG5jb25zdCBzMmEgPSBzdHIgPT4gbmV3IFVpbnQ4QXJyYXkoc3RyLnNwbGl0KCcnKS5tYXAoY2hhciA9PiBjaGFyLmNoYXJDb2RlQXQoMCkpKS5idWZmZXJcbiJdfQ==