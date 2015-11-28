var Args = require("args-js");
var _ = require("lodash");
var CircuitBreaker = require("circuit-breaker-js");
var feignjs = require("feignjs");
/// <reference path="lib/feign-cb.d.ts" />
var feign_cb;
(function (feign_cb) {
    /**
     * creates a feign builder that wraps all
     * requests in circuit breakers.
     *
     * @param {object} config circuit breaker configuration
     * @param {boolean} promise promise or callback api-style
     */
    function builder() {
        var args = Args.call(null, [
            { config: Args.OBJECT | Args.Optional, _default: {} },
            { promise: Args.BOOL | Args.Optional, _default: true }
        ], arguments);
        var circuitBreaker = new CircuitBreaker(args.config);
        var builder = feignjs.builder.call(null, args.promise);
        builder.proxyFactory(args.promise ? feign_cb.promiseProxyFactory(circuitBreaker) : feign_cb.cbProxyFactory(circuitBreaker));
        return builder;
    }
    feign_cb.builder = builder;
    feign_cb.cbProxyFactory = function (circuitBreaker) {
        return function (baseUrl, requestObj) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.pop();
                var command = function (success, failed) {
                    requestObj.executeRequest(baseUrl, args)
                        .then(function (result) {
                        callback(null, result);
                        success();
                    }, function (error) {
                        callback(error, null);
                        failed();
                    });
                };
            };
        };
    };
    /**
     * creates the factory-function which closes over the circuitBreaker
     */
    feign_cb.promiseProxyFactory = function (circuitBreaker) {
        return function (baseUrl, requestObj) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                var deferred = Promise["defer"](); //work around typescript...
                var command = function (success, failed) {
                    requestObj.executeRequest(baseUrl, args)
                        .then(function (result) {
                        deferred.resolve(result);
                        success();
                    }, function (error) {
                        deferred.reject(error);
                        failed();
                    });
                };
                console.log("fallback: ", requestObj.options["fallback"]);
                circuitBreaker.run(command, requestObj.options["fallback"]);
                return deferred.promise;
            };
        };
    };
})(feign_cb || (feign_cb = {}));
module.exports = {
    builder: feign_cb.builder
};
//# sourceMappingURL=feign-circuit-breaker.js.map