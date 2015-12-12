feignjs-circuit-breaker
============================

integration with [circuit-breaker-js](https://github.com/yammer/circuit-breaker-js)


## Installation
As with feign, you need to install both feignjs-circuit-breaker and a client to be used for feign.


```
npm install feignjs-circuit-breaker
npm install feignjs-<client>
```

or with bower

```
bower install feignjs-circuit-breaker
bower install feignjs-<client>
```

## Getting started
Api is basically the same as feignjs except that it supports circuitbreaker-specific options:

```javascript
var feignjs = require("feignjs-circuuit-breaker")
var FeignRequest = require("feignjs-request")

var apiDescription = {
  getUsers: 'GET /users',
  getUser:  {
    method: 'GET',
    uri: '/users/{id}',
    fallback: function(){
      return "fallback called";
    }
  }
};

var client = feign.builder()
        .client(new FeignRequest())        
        .target(apiDescription, 'http://jsonplaceholder.typicode.com');

        
client.getUser(1).then(console.log)
```
The method `getUser` has a fallback which is executed if the real call fails too often.


 ## Options:
 an option-object can be fed into feign.builder() with following options:
 
| Option | Note | default
|---|---|---|
| circuitbreaker-config |  config as defined by [circuit-breaker-js](https://github.com/yammer/circuit-breaker-js) | {} |
| promise | crate a promise-based api. false for callback-based api. | true |


 


