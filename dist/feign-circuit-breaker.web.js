(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.feign = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var Args = (typeof window !== "undefined" ? window['Args'] : typeof global !== "undefined" ? global['Args'] : null);
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"circuit-breaker-js":undefined,"feignjs":undefined}]},{},[1])(1)
});