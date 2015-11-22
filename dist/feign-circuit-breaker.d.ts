/// <reference path="../src/lib/feign-cb.d.ts" />
declare var Args: Args.ArgsStatic;
declare var _: _.LoDashStatic;
declare var CircuitBreaker: any;
declare module feign_cb {
    /**
     * creates a feign builder that wraps all
     * requests in circuit breakers.
     *
     * @param {object} config circuit breaker configuration
     * @param {boolean} promise promise or callback api-style
     */
    function builder(): feign.IFeignBuilder;
    var cbProxyFactory: (circuitBreaker: any) => (baseUrl: string, requestObj: feign.Wrapper) => () => void;
    /**
     * creates the factory-function which closes over the circuitBreaker
     */
    var promiseProxyFactory: (circuitBreaker: any) => (baseUrl: string, requestObj: feign.Wrapper) => () => Promise<feign.Response>;
}
