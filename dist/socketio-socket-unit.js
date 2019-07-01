// /* eslint-disable no-unused-expressions */
//
// import TCPSocket from './socketio-socket'
//
// describe('TcpSocket websocket unit tests', function () {
//   var stubIo, socket
//
//   var Io = function () { }
//   Io.prototype.on = function () { }
//   Io.prototype.emit = function () { }
//   Io.prototype.disconnect = function () { }
//
//   beforeEach(function (done) {
//     stubIo = sinon.createStubInstance(Io)
//
//     global.window = {
//       location: {
//         origin: 'hostname.io'
//       }
//     }
//     global.io = function () {
//       return stubIo
//     }
//
//     stubIo.emit.withArgs('open').yieldsAsync('hostname.io')
//
//     socket = TCPSocket.open('127.0.0.1', 9000, {
//       useSecureTransport: false,
//       ca: '-----BEGIN CERTIFICATE-----\r\nMIIEBDCCAuygAwIBAgIDAjppMA0GCSqGSIb3DQEBBQUAMEIxCzAJBgNVBAYTAlVT\r\nMRYwFAYDVQQKEw1HZW9UcnVzdCBJbmMuMRswGQYDVQQDExJHZW9UcnVzdCBHbG9i\r\nYWwgQ0EwHhcNMTMwNDA1MTUxNTU1WhcNMTUwNDA0MTUxNTU1WjBJMQswCQYDVQQG\r\nEwJVUzETMBEGA1UEChMKR29vZ2xlIEluYzElMCMGA1UEAxMcR29vZ2xlIEludGVy\r\nbmV0IEF1dGhvcml0eSBHMjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\r\nAJwqBHdc2FCROgajguDYUEi8iT/xGXAaiEZ+4I/F8YnOIe5a/mENtzJEiaB0C1NP\r\nVaTOgmKV7utZX8bhBYASxF6UP7xbSDj0U/ck5vuR6RXEz/RTDfRK/J9U3n2+oGtv\r\nh8DQUB8oMANA2ghzUWx//zo8pzcGjr1LEQTrfSTe5vn8MXH7lNVg8y5Kr0LSy+rE\r\nahqyzFPdFUuLH8gZYR/Nnag+YyuENWllhMgZxUYi+FOVvuOAShDGKuy6lyARxzmZ\r\nEASg8GF6lSWMTlJ14rbtCMoU/M4iarNOz0YDl5cDfsCx3nuvRTPPuj5xt970JSXC\r\nDTWJnZ37DhF5iR43xa+OcmkCAwEAAaOB+zCB+DAfBgNVHSMEGDAWgBTAephojYn7\r\nqwVkDBF9qn1luMrMTjAdBgNVHQ4EFgQUSt0GFhu89mi1dvWBtrtiGrpagS8wEgYD\r\nVR0TAQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAQYwOgYDVR0fBDMwMTAvoC2g\r\nK4YpaHR0cDovL2NybC5nZW90cnVzdC5jb20vY3Jscy9ndGdsb2JhbC5jcmwwPQYI\r\nKwYBBQUHAQEEMTAvMC0GCCsGAQUFBzABhiFodHRwOi8vZ3RnbG9iYWwtb2NzcC5n\r\nZW90cnVzdC5jb20wFwYDVR0gBBAwDjAMBgorBgEEAdZ5AgUBMA0GCSqGSIb3DQEB\r\nBQUAA4IBAQA21waAESetKhSbOHezI6B1WLuxfoNCunLaHtiONgaX4PCVOzf9G0JY\r\n/iLIa704XtE7JW4S615ndkZAkNoUyHgN7ZVm2o6Gb4ChulYylYbc3GrKBIxbf/a/\r\nzG+FA1jDaFETzf3I93k9mTXwVqO94FntT0QJo544evZG0R0SnU++0ED8Vf4GXjza\r\nHFa9llF7b1cq26KqltyMdMKVvvBulRP/F/A8rLIQjcxz++iPAsbw+zOzlTvjwsto\r\nWHPbqCRiOwY1nQ2pM714A5AuTHhdUDqB1O6gyHA43LL5Z/qHQF1hwFGPa4NrzQU6\r\nyuGnBXj8ytqU0CwIPX4WecigUCAkVDNx\r\n-----END CERTIFICATE-----'
//     })
//     expect(socket).to.exist
//     expect(socket._ca).to.exist
//
//     stubIo.on.withArgs('data').callsArgWithAsync(1, new Uint8Array([0, 1, 2]).buffer)
//     socket.onopen = function (event) {
//       expect(event.data.proxyHostname).to.equal('hostname.io')
//     }
//     socket.ondata = function (e) {
//       expect(new Uint8Array(e.data)).to.deep.equal(new Uint8Array([0, 1, 2]))
//       done()
//     }
//   })
//
//   describe('close', function () {
//     it('should work', function (done) {
//       socket.onclose = function () {
//         expect(socket.readyState).to.equal('closed')
//         expect(stubIo.disconnect.callCount).to.equal(1)
//         expect(stubIo.emit.withArgs('end').callCount).to.equal(1)
//         done()
//       }
//
//       socket.close()
//     })
//   })
//
//   describe('send', function () {
//     it('should not explode', function (done) {
//       stubIo.emit.withArgs('data').callsArgWithAsync(2)
//
//       socket.ondrain = function () {
//         done()
//       }
//
//       socket.send(new Uint8Array([0, 1, 2]).buffer)
//     })
//   })
// })
"use strict";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zb2NrZXRpby1zb2NrZXQtdW5pdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLWV4cHJlc3Npb25zICovXG4vL1xuLy8gaW1wb3J0IFRDUFNvY2tldCBmcm9tICcuL3NvY2tldGlvLXNvY2tldCdcbi8vXG4vLyBkZXNjcmliZSgnVGNwU29ja2V0IHdlYnNvY2tldCB1bml0IHRlc3RzJywgZnVuY3Rpb24gKCkge1xuLy8gICB2YXIgc3R1YklvLCBzb2NrZXRcbi8vXG4vLyAgIHZhciBJbyA9IGZ1bmN0aW9uICgpIHsgfVxuLy8gICBJby5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoKSB7IH1cbi8vICAgSW8ucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoKSB7IH1cbi8vICAgSW8ucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7IH1cbi8vXG4vLyAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKGRvbmUpIHtcbi8vICAgICBzdHViSW8gPSBzaW5vbi5jcmVhdGVTdHViSW5zdGFuY2UoSW8pXG4vL1xuLy8gICAgIGdsb2JhbC53aW5kb3cgPSB7XG4vLyAgICAgICBsb2NhdGlvbjoge1xuLy8gICAgICAgICBvcmlnaW46ICdob3N0bmFtZS5pbydcbi8vICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgZ2xvYmFsLmlvID0gZnVuY3Rpb24gKCkge1xuLy8gICAgICAgcmV0dXJuIHN0dWJJb1xuLy8gICAgIH1cbi8vXG4vLyAgICAgc3R1YklvLmVtaXQud2l0aEFyZ3MoJ29wZW4nKS55aWVsZHNBc3luYygnaG9zdG5hbWUuaW8nKVxuLy9cbi8vICAgICBzb2NrZXQgPSBUQ1BTb2NrZXQub3BlbignMTI3LjAuMC4xJywgOTAwMCwge1xuLy8gICAgICAgdXNlU2VjdXJlVHJhbnNwb3J0OiBmYWxzZSxcbi8vICAgICAgIGNhOiAnLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tXFxyXFxuTUlJRUJEQ0NBdXlnQXdJQkFnSURBanBwTUEwR0NTcUdTSWIzRFFFQkJRVUFNRUl4Q3pBSkJnTlZCQVlUQWxWVFxcclxcbk1SWXdGQVlEVlFRS0V3MUhaVzlVY25WemRDQkpibU11TVJzd0dRWURWUVFERXhKSFpXOVVjblZ6ZENCSGJHOWlcXHJcXG5ZV3dnUTBFd0hoY05NVE13TkRBMU1UVXhOVFUxV2hjTk1UVXdOREEwTVRVeE5UVTFXakJKTVFzd0NRWURWUVFHXFxyXFxuRXdKVlV6RVRNQkVHQTFVRUNoTUtSMjl2WjJ4bElFbHVZekVsTUNNR0ExVUVBeE1jUjI5dloyeGxJRWx1ZEdWeVxcclxcbmJtVjBJRUYxZEdodmNtbDBlU0JITWpDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJcXHJcXG5BSndxQkhkYzJGQ1JPZ2FqZ3VEWVVFaThpVC94R1hBYWlFWis0SS9GOFluT0llNWEvbUVOdHpKRWlhQjBDMU5QXFxyXFxuVmFUT2dtS1Y3dXRaWDhiaEJZQVN4RjZVUDd4YlNEajBVL2NrNXZ1UjZSWEV6L1JURGZSSy9KOVUzbjIrb0d0dlxcclxcbmg4RFFVQjhvTUFOQTJnaHpVV3gvL3pvOHB6Y0dqcjFMRVFUcmZTVGU1dm44TVhIN2xOVmc4eTVLcjBMU3krckVcXHJcXG5haHF5ekZQZEZVdUxIOGdaWVIvTm5hZytZeXVFTldsbGhNZ1p4VVlpK0ZPVnZ1T0FTaERHS3V5Nmx5QVJ4em1aXFxyXFxuRUFTZzhHRjZsU1dNVGxKMTRyYnRDTW9VL000aWFyTk96MFlEbDVjRGZzQ3gzbnV2UlRQUHVqNXh0OTcwSlNYQ1xcclxcbkRUV0puWjM3RGhGNWlSNDN4YStPY21rQ0F3RUFBYU9CK3pDQitEQWZCZ05WSFNNRUdEQVdnQlRBZXBob2pZbjdcXHJcXG5xd1ZrREJGOXFuMWx1TXJNVGpBZEJnTlZIUTRFRmdRVVN0MEdGaHU4OW1pMWR2V0J0cnRpR3JwYWdTOHdFZ1lEXFxyXFxuVlIwVEFRSC9CQWd3QmdFQi93SUJBREFPQmdOVkhROEJBZjhFQkFNQ0FRWXdPZ1lEVlIwZkJETXdNVEF2b0MyZ1xcclxcbks0WXBhSFIwY0RvdkwyTnliQzVuWlc5MGNuVnpkQzVqYjIwdlkzSnNjeTluZEdkc2IySmhiQzVqY213d1BRWUlcXHJcXG5Ld1lCQlFVSEFRRUVNVEF2TUMwR0NDc0dBUVVGQnpBQmhpRm9kSFJ3T2k4dlozUm5iRzlpWVd3dGIyTnpjQzVuXFxyXFxuWlc5MGNuVnpkQzVqYjIwd0Z3WURWUjBnQkJBd0RqQU1CZ29yQmdFRUFkWjVBZ1VCTUEwR0NTcUdTSWIzRFFFQlxcclxcbkJRVUFBNElCQVFBMjF3YUFFU2V0S2hTYk9IZXpJNkIxV0x1eGZvTkN1bkxhSHRpT05nYVg0UENWT3pmOUcwSllcXHJcXG4vaUxJYTcwNFh0RTdKVzRTNjE1bmRrWkFrTm9VeUhnTjdaVm0ybzZHYjRDaHVsWXlsWWJjM0dyS0JJeGJmL2EvXFxyXFxuekcrRkExakRhRkVUemYzSTkzazltVFh3VnFPOTRGbnRUMFFKbzU0NGV2WkcwUjBTblUrKzBFRDhWZjRHWGp6YVxcclxcbkhGYTlsbEY3YjFjcTI2S3FsdHlNZE1LVnZ2QnVsUlAvRi9BOHJMSVFqY3h6KytpUEFzYncrek96bFR2andzdG9cXHJcXG5XSFBicUNSaU93WTFuUTJwTTcxNEE1QXVUSGhkVURxQjFPNmd5SEE0M0xMNVovcUhRRjFod0ZHUGE0TnJ6UVU2XFxyXFxueXVHbkJYajh5dHFVMEN3SVBYNFdlY2lnVUNBa1ZETnhcXHJcXG4tLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tJ1xuLy8gICAgIH0pXG4vLyAgICAgZXhwZWN0KHNvY2tldCkudG8uZXhpc3Rcbi8vICAgICBleHBlY3Qoc29ja2V0Ll9jYSkudG8uZXhpc3Rcbi8vXG4vLyAgICAgc3R1YklvLm9uLndpdGhBcmdzKCdkYXRhJykuY2FsbHNBcmdXaXRoQXN5bmMoMSwgbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKS5idWZmZXIpXG4vLyAgICAgc29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xuLy8gICAgICAgZXhwZWN0KGV2ZW50LmRhdGEucHJveHlIb3N0bmFtZSkudG8uZXF1YWwoJ2hvc3RuYW1lLmlvJylcbi8vICAgICB9XG4vLyAgICAgc29ja2V0Lm9uZGF0YSA9IGZ1bmN0aW9uIChlKSB7XG4vLyAgICAgICBleHBlY3QobmV3IFVpbnQ4QXJyYXkoZS5kYXRhKSkudG8uZGVlcC5lcXVhbChuZXcgVWludDhBcnJheShbMCwgMSwgMl0pKVxuLy8gICAgICAgZG9uZSgpXG4vLyAgICAgfVxuLy8gICB9KVxuLy9cbi8vICAgZGVzY3JpYmUoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuLy8gICAgIGl0KCdzaG91bGQgd29yaycsIGZ1bmN0aW9uIChkb25lKSB7XG4vLyAgICAgICBzb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgZXhwZWN0KHNvY2tldC5yZWFkeVN0YXRlKS50by5lcXVhbCgnY2xvc2VkJylcbi8vICAgICAgICAgZXhwZWN0KHN0dWJJby5kaXNjb25uZWN0LmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbi8vICAgICAgICAgZXhwZWN0KHN0dWJJby5lbWl0LndpdGhBcmdzKCdlbmQnKS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4vLyAgICAgICAgIGRvbmUoKVxuLy8gICAgICAgfVxuLy9cbi8vICAgICAgIHNvY2tldC5jbG9zZSgpXG4vLyAgICAgfSlcbi8vICAgfSlcbi8vXG4vLyAgIGRlc2NyaWJlKCdzZW5kJywgZnVuY3Rpb24gKCkge1xuLy8gICAgIGl0KCdzaG91bGQgbm90IGV4cGxvZGUnLCBmdW5jdGlvbiAoZG9uZSkge1xuLy8gICAgICAgc3R1YklvLmVtaXQud2l0aEFyZ3MoJ2RhdGEnKS5jYWxsc0FyZ1dpdGhBc3luYygyKVxuLy9cbi8vICAgICAgIHNvY2tldC5vbmRyYWluID0gZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICBkb25lKClcbi8vICAgICAgIH1cbi8vXG4vLyAgICAgICBzb2NrZXQuc2VuZChuZXcgVWludDhBcnJheShbMCwgMSwgMl0pLmJ1ZmZlcilcbi8vICAgICB9KVxuLy8gICB9KVxuLy8gfSlcbiJdfQ==