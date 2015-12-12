/// <reference path="lib/feign-cb.d.ts" />

module feign_cb {
	
	
	/**
	 * creates a feign builder that wraps all
	 * requests in circuit breakers.
	 * 
	 * @param {object} config circuit breaker configuration
	 * @param {boolean} promise promise or callback api-style
	 */
	export function builder(): feign.IFeignBuilder {
		var args = Args.call(null, [
			{ config: Args.OBJECT | Args.Optional, _default: {} },
			{ promise: Args.BOOL | Args.Optional, _default: true }
		], arguments);
		
		var circuitBreaker = new CircuitBreaker(args.config)
		var builder = feignjs.builder.call(null, args.promise)
    builder.proxyFactory(args.promise ? promiseProxyFactory(circuitBreaker) : cbProxyFactory(circuitBreaker));
    
		return builder;
	}
	
  export var cbProxyFactory =  function(circuitBreaker){
    var fn = function (baseUrl: string, requestObj: feign.Wrapper): () => void {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        var command = function(success, failed){
          requestObj.executeRequest(baseUrl, args)
          .then(function (result) {
            callback(null, result);
            success();
          }, function (error) {
            callback(error, null);
            failed();
          });
        }
        
      };
    };
    fn['breaker'] = circuitBreaker;
    return fn;
  };
  
  /**
   * creates the factory-function which closes over the circuitBreaker
   */
  export var promiseProxyFactory = function(circuitBreaker){
    
    return function(baseUrl: string, requestObj: feign.Wrapper): () => Promise<feign.Response> {
      var fn = function () {
        var args = Array.prototype.slice.call(arguments);
        var deferred = Promise["defer"](); //work around typescript...
        var command = function(success, failed){
          requestObj.executeRequest(baseUrl, args)
            .then(function(result){
              deferred.resolve(result);
              success();
            }, function(error){
              deferred.reject(error);
              failed();
            });
        }
        var fallback = null; 
        if (requestObj.options["fallback"]){
          fallback = function(){ 
            var result = requestObj.options["fallback"]();
             deferred.resolve(result);
          }
        }
        process.nextTick( function(){
          circuitBreaker.run(command, fallback);
        });
        
        
        return deferred.promise;
      };
      fn['breaker'] = circuitBreaker;
      return fn;
    };
  };
}
