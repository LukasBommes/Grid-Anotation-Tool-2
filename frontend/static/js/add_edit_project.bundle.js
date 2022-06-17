/*! For license information please see add_edit_project.bundle.js.LICENSE.txt */
(()=>{"use strict";var t,e=function(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,o=!(arguments.length>4&&void 0!==arguments[4])||arguments[4],i={method:t},a={};o&&(a.Authorization="Bearer "+localStorage.getItem("access_token")),n?(i.body=JSON.stringify(n),a["Content-Type"]="application/json"):r&&(i.body=r),i.headers=new Headers(a);var c=fetch(e,i);return c},n=(t=API_URL,{getProjects:function(n,r,o,i){var a="".concat(t,"/projects/?skip=").concat(n,"&limit=").concat(r,"&orderby=").concat(o,"&orderdir=").concat(i);return e("GET",a,null,null,!0)},getProject:function(n){var r="".concat(t,"/project/").concat(n);return e("GET",r,null,null,!0)},deleteProject:function(n){var r="".concat(t,"/project/").concat(n);return e("DELETE",r,null,null,!0)},createProject:function(n){var r="".concat(t,"/projects/");return e("POST",r,n,null,!0)},updateProject:function(n,r){var o="".concat(t,"/project/").concat(n);return e("PUT",o,r,null,!0)},getAnnotationIds:function(){var n="".concat(t,"/annotation_ids/");return e("GET",n,null,null,!0)},exportProject:function(n){var r="".concat(t,"/export/").concat(n);return e("GET",r,null,null,!0)},importProject:function(n){var r="".concat(t,"/import/");return e("POST",r,null,n,!0)},getImages:function(n){var r="".concat(t,"/project/").concat(n,"/images/");return e("GET",r,null,null,!0)},getImageFile:function(n){var r="".concat(t,"/image_file/").concat(n);return e("GET",r,null,null,!0)},createImages:function(n,r){var o="".concat(t,"/project/").concat(n,"/images/");return e("POST",o,null,r,!0)},deleteImage:function(n){var r="".concat(t,"/image/").concat(n);return e("DELETE",r,null,null,!0)},getAnnotation:function(n){var r="".concat(t,"/annotation/").concat(n);return e("GET",r,null,null,!0)},updateAnnotation:function(n,r){var o="".concat(t,"/annotation/").concat(n);return e("PUT",o,r,null,!0)},createUser:function(n){var r="".concat(t,"/users/");return e("POST",r,n,null,!1)},loginUser:function(n){var r="".concat(t,"/token");return e("POST",r,null,n,!1)},isValid:function(n){var r="".concat(t,"/isvalid/").concat(n);return e("GET",r,null,null,!1)}});function r(t){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},r(t)}function o(){o=function(){return t};var t={},e=Object.prototype,n=e.hasOwnProperty,i="function"==typeof Symbol?Symbol:{},a=i.iterator||"@@iterator",c=i.asyncIterator||"@@asyncIterator",u=i.toStringTag||"@@toStringTag";function l(t,e,n){return Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{l({},"")}catch(t){l=function(t,e,n){return t[e]=n}}function s(t,e,n,r){var o=e&&e.prototype instanceof h?e:h,i=Object.create(o.prototype),a=new _(r||[]);return i._invoke=function(t,e,n){var r="suspendedStart";return function(o,i){if("executing"===r)throw new Error("Generator is already running");if("completed"===r){if("throw"===o)throw i;return{value:void 0,done:!0}}for(n.method=o,n.arg=i;;){var a=n.delegate;if(a){var c=E(a,n);if(c){if(c===d)continue;return c}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if("suspendedStart"===r)throw r="completed",n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);r="executing";var u=f(t,e,n);if("normal"===u.type){if(r=n.done?"completed":"suspendedYield",u.arg===d)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(r="completed",n.method="throw",n.arg=u.arg)}}}(t,n,a),i}function f(t,e,n){try{return{type:"normal",arg:t.call(e,n)}}catch(t){return{type:"throw",arg:t}}}t.wrap=s;var d={};function h(){}function p(){}function v(){}var y={};l(y,a,(function(){return this}));var m=Object.getPrototypeOf,g=m&&m(m(j([])));g&&g!==e&&n.call(g,a)&&(y=g);var w=v.prototype=h.prototype=Object.create(y);function b(t){["next","throw","return"].forEach((function(e){l(t,e,(function(t){return this._invoke(e,t)}))}))}function x(t,e){function o(i,a,c,u){var l=f(t[i],t,a);if("throw"!==l.type){var s=l.arg,d=s.value;return d&&"object"==r(d)&&n.call(d,"__await")?e.resolve(d.__await).then((function(t){o("next",t,c,u)}),(function(t){o("throw",t,c,u)})):e.resolve(d).then((function(t){s.value=t,c(s)}),(function(t){return o("throw",t,c,u)}))}u(l.arg)}var i;this._invoke=function(t,n){function r(){return new e((function(e,r){o(t,n,e,r)}))}return i=i?i.then(r,r):r()}}function E(t,e){var n=t.iterator[e.method];if(void 0===n){if(e.delegate=null,"throw"===e.method){if(t.iterator.return&&(e.method="return",e.arg=void 0,E(t,e),"throw"===e.method))return d;e.method="throw",e.arg=new TypeError("The iterator does not provide a 'throw' method")}return d}var r=f(n,t.iterator,e.arg);if("throw"===r.type)return e.method="throw",e.arg=r.arg,e.delegate=null,d;var o=r.arg;return o?o.done?(e[t.resultName]=o.value,e.next=t.nextLoc,"return"!==e.method&&(e.method="next",e.arg=void 0),e.delegate=null,d):o:(e.method="throw",e.arg=new TypeError("iterator result is not an object"),e.delegate=null,d)}function L(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function k(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function _(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(L,this),this.reset(!0)}function j(t){if(t){var e=t[a];if(e)return e.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var r=-1,o=function e(){for(;++r<t.length;)if(n.call(t,r))return e.value=t[r],e.done=!1,e;return e.value=void 0,e.done=!0,e};return o.next=o}}return{next:S}}function S(){return{value:void 0,done:!0}}return p.prototype=v,l(w,"constructor",v),l(v,"constructor",p),p.displayName=l(v,u,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===p||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,v):(t.__proto__=v,l(t,u,"GeneratorFunction")),t.prototype=Object.create(w),t},t.awrap=function(t){return{__await:t}},b(x.prototype),l(x.prototype,c,(function(){return this})),t.AsyncIterator=x,t.async=function(e,n,r,o,i){void 0===i&&(i=Promise);var a=new x(s(e,n,r,o),i);return t.isGeneratorFunction(n)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},b(w),l(w,u,"Generator"),l(w,a,(function(){return this})),l(w,"toString",(function(){return"[object Generator]"})),t.keys=function(t){var e=[];for(var n in t)e.push(n);return e.reverse(),function n(){for(;e.length;){var r=e.pop();if(r in t)return n.value=r,n.done=!1,n}return n.done=!0,n}},t.values=j,_.prototype={constructor:_,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(k),!t)for(var e in this)"t"===e.charAt(0)&&n.call(this,e)&&!isNaN(+e.slice(1))&&(this[e]=void 0)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var e=this;function r(n,r){return a.type="throw",a.arg=t,e.next=n,r&&(e.method="next",e.arg=void 0),!!r}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],a=i.completion;if("root"===i.tryLoc)return r("end");if(i.tryLoc<=this.prev){var c=n.call(i,"catchLoc"),u=n.call(i,"finallyLoc");if(c&&u){if(this.prev<i.catchLoc)return r(i.catchLoc,!0);if(this.prev<i.finallyLoc)return r(i.finallyLoc)}else if(c){if(this.prev<i.catchLoc)return r(i.catchLoc,!0)}else{if(!u)throw new Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return r(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,d):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),d},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.finallyLoc===t)return this.complete(n.completion,n.afterLoc),k(n),d}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.tryLoc===t){var r=n.completion;if("throw"===r.type){var o=r.arg;k(n)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,e,n){return this.delegate={iterator:j(t),resultName:e,nextLoc:n},"next"===this.method&&(this.arg=void 0),d}},t}function i(t,e,n,r,o,i,a){try{var c=t[i](a),u=c.value}catch(t){return void n(t)}c.done?e(u):Promise.resolve(u).then(r,o)}function a(t){return function(){var e=this,n=arguments;return new Promise((function(r,o){var a=t.apply(e,n);function c(t){i(a,r,o,c,u,"next",t)}function u(t){i(a,r,o,c,u,"throw",t)}c(void 0)}))}}function c(t){return u.apply(this,arguments)}function u(){return(u=a(o().mark((function t(e){var r,i,a;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,n.getImageFile(e);case 2:if(200!=(r=t.sent).status){t.next=11;break}return t.next=6,r.blob();case 6:return i=t.sent,a=URL.createObjectURL(i),t.abrupt("return",a);case 11:if(401!=r.status){t.next=15;break}d(),t.next=16;break;case 15:throw new Error("Failed to get image file with id ".concat(e));case 16:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function l(){return s.apply(this,arguments)}function s(){return(s=a(o().mark((function t(){var e,r,i;return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(e=localStorage.getItem("access_token")){t.next=3;break}return t.abrupt("return",!1);case 3:return t.next=5,n.isValid(e);case 5:if(200!=(r=t.sent).status){t.next=13;break}return t.next=9,r.json();case 9:return i=t.sent,t.abrupt("return",i.isvalid);case 13:throw new Error("Failed to determine whether user is logged in");case 14:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function f(){return(f=a(o().mark((function t(e){return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,l();case 2:t.sent?e():d();case 4:case"end":return t.stop()}}),t)})))).apply(this,arguments)}function d(){window.location.href=FRONTEND_URLS.login}function h(){return([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,(function(t){return(t^crypto.getRandomValues(new Uint8Array(1))[0]&15>>t/4).toString(16)}))}function p(t){var e=document.createElement("template");return e.innerHTML=t,e.content}function v(t,e){e.detail.forEach((function(e){var n=e.loc[1];console.log(n),t[n].helperTextContent=e.msg,t[n].valid=!1}))}function y(t){return y="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},y(t)}function m(){m=function(){return t};var t={},e=Object.prototype,n=e.hasOwnProperty,r="function"==typeof Symbol?Symbol:{},o=r.iterator||"@@iterator",i=r.asyncIterator||"@@asyncIterator",a=r.toStringTag||"@@toStringTag";function c(t,e,n){return Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{c({},"")}catch(t){c=function(t,e,n){return t[e]=n}}function u(t,e,n,r){var o=e&&e.prototype instanceof f?e:f,i=Object.create(o.prototype),a=new _(r||[]);return i._invoke=function(t,e,n){var r="suspendedStart";return function(o,i){if("executing"===r)throw new Error("Generator is already running");if("completed"===r){if("throw"===o)throw i;return{value:void 0,done:!0}}for(n.method=o,n.arg=i;;){var a=n.delegate;if(a){var c=E(a,n);if(c){if(c===s)continue;return c}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if("suspendedStart"===r)throw r="completed",n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);r="executing";var u=l(t,e,n);if("normal"===u.type){if(r=n.done?"completed":"suspendedYield",u.arg===s)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(r="completed",n.method="throw",n.arg=u.arg)}}}(t,n,a),i}function l(t,e,n){try{return{type:"normal",arg:t.call(e,n)}}catch(t){return{type:"throw",arg:t}}}t.wrap=u;var s={};function f(){}function d(){}function h(){}var p={};c(p,o,(function(){return this}));var v=Object.getPrototypeOf,g=v&&v(v(j([])));g&&g!==e&&n.call(g,o)&&(p=g);var w=h.prototype=f.prototype=Object.create(p);function b(t){["next","throw","return"].forEach((function(e){c(t,e,(function(t){return this._invoke(e,t)}))}))}function x(t,e){function r(o,i,a,c){var u=l(t[o],t,i);if("throw"!==u.type){var s=u.arg,f=s.value;return f&&"object"==y(f)&&n.call(f,"__await")?e.resolve(f.__await).then((function(t){r("next",t,a,c)}),(function(t){r("throw",t,a,c)})):e.resolve(f).then((function(t){s.value=t,a(s)}),(function(t){return r("throw",t,a,c)}))}c(u.arg)}var o;this._invoke=function(t,n){function i(){return new e((function(e,o){r(t,n,e,o)}))}return o=o?o.then(i,i):i()}}function E(t,e){var n=t.iterator[e.method];if(void 0===n){if(e.delegate=null,"throw"===e.method){if(t.iterator.return&&(e.method="return",e.arg=void 0,E(t,e),"throw"===e.method))return s;e.method="throw",e.arg=new TypeError("The iterator does not provide a 'throw' method")}return s}var r=l(n,t.iterator,e.arg);if("throw"===r.type)return e.method="throw",e.arg=r.arg,e.delegate=null,s;var o=r.arg;return o?o.done?(e[t.resultName]=o.value,e.next=t.nextLoc,"return"!==e.method&&(e.method="next",e.arg=void 0),e.delegate=null,s):o:(e.method="throw",e.arg=new TypeError("iterator result is not an object"),e.delegate=null,s)}function L(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function k(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function _(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(L,this),this.reset(!0)}function j(t){if(t){var e=t[o];if(e)return e.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var r=-1,i=function e(){for(;++r<t.length;)if(n.call(t,r))return e.value=t[r],e.done=!1,e;return e.value=void 0,e.done=!0,e};return i.next=i}}return{next:S}}function S(){return{value:void 0,done:!0}}return d.prototype=h,c(w,"constructor",h),c(h,"constructor",d),d.displayName=c(h,a,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===d||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,h):(t.__proto__=h,c(t,a,"GeneratorFunction")),t.prototype=Object.create(w),t},t.awrap=function(t){return{__await:t}},b(x.prototype),c(x.prototype,i,(function(){return this})),t.AsyncIterator=x,t.async=function(e,n,r,o,i){void 0===i&&(i=Promise);var a=new x(u(e,n,r,o),i);return t.isGeneratorFunction(n)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},b(w),c(w,a,"Generator"),c(w,o,(function(){return this})),c(w,"toString",(function(){return"[object Generator]"})),t.keys=function(t){var e=[];for(var n in t)e.push(n);return e.reverse(),function n(){for(;e.length;){var r=e.pop();if(r in t)return n.value=r,n.done=!1,n}return n.done=!0,n}},t.values=j,_.prototype={constructor:_,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(k),!t)for(var e in this)"t"===e.charAt(0)&&n.call(this,e)&&!isNaN(+e.slice(1))&&(this[e]=void 0)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var e=this;function r(n,r){return a.type="throw",a.arg=t,e.next=n,r&&(e.method="next",e.arg=void 0),!!r}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],a=i.completion;if("root"===i.tryLoc)return r("end");if(i.tryLoc<=this.prev){var c=n.call(i,"catchLoc"),u=n.call(i,"finallyLoc");if(c&&u){if(this.prev<i.catchLoc)return r(i.catchLoc,!0);if(this.prev<i.finallyLoc)return r(i.finallyLoc)}else if(c){if(this.prev<i.catchLoc)return r(i.catchLoc,!0)}else{if(!u)throw new Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return r(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,s):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),s},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.finallyLoc===t)return this.complete(n.completion,n.afterLoc),k(n),s}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.tryLoc===t){var r=n.completion;if("throw"===r.type){var o=r.arg;k(n)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,e,n){return this.delegate={iterator:j(t),resultName:e,nextLoc:n},"next"===this.method&&(this.arg=void 0),s}},t}function g(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i=[],a=!0,c=!1;try{for(n=n.call(t);!(a=(r=n.next()).done)&&(i.push(r.value),!e||i.length!==e);a=!0);}catch(t){c=!0,o=t}finally{try{a||null==n.return||n.return()}finally{if(c)throw o}}return i}}(t,e)||function(t,e){if(t){if("string"==typeof t)return w(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?w(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function w(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function b(t,e,n,r,o,i,a){try{var c=t[i](a),u=c.value}catch(t){return void n(t)}c.done?e(u):Promise.resolve(u).then(r,o)}function x(t){return function(){var e=this,n=arguments;return new Promise((function(r,o){var i=t.apply(e,n);function a(t){b(i,r,o,a,c,"next",t)}function c(t){b(i,r,o,a,c,"throw",t)}a(void 0)}))}}function E(){return E=x(m().mark((function t(e,r){var o,i,a,u,l,s,f,y,w,b,E,L,k,_,j,S,T,O,P,I,F,G,N,U,A,B,R,D;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:D=function(t,e){event.currentTarget.classList.contains("mdc-icon-button--on")?(event.currentTarget.classList.remove("mdc-icon-button--on"),e?f=f.filter((function(e){return e!==t})):l.push(t)):(event.currentTarget.classList.add("mdc-icon-button--on"),e?f.push(t):l=l.filter((function(e){return e!==t}))),console.log("image_ids_to_delete: "+f),console.log("image_ids_to_upload: "+l),console.log("image_files_to_upload: "+s)},R=function(t){if(t.target.files.length){for(var e=0;e<t.target.files.length;e++){var n=t.target.files[e],r=h();s[r]=n,l.push(r);var o=(i=n,window.URL?window.URL.createObjectURL(i):window.webkitURL.createObjectURL(i));F(r,!1,"".concat(o),"image-not-uploaded")}G(!0)}var i},B=function(){U()},A=function(){for(var t={name:document.getElementById("text-field-name-input").value,description:document.getElementById("text-field-description-input").value},n=new FormData,o=0,i=Object.entries(s);o<i.length;o++){var a=g(i[o],2),c=a[0],u=a[1];l.includes(c)&&n.append("files",u,u.name)}"add"==r?_(t,n):"edit"==r?S(e,t,n):console.log("Unknown mode. Must be either 'add' or 'edit'.")},U=function(){window.location.href=FRONTEND_URLS.projects},N=function(t){G(t.length>0),document.getElementById("images-list"),t.forEach((function(t){c(t.id).then((function(e){F(t.id,!0,e,"image-already-uploaded")}))}))},G=function(t){document.getElementById("image-list-title").style.display=t?"block":"none"},F=function(t,e,n,r){var o='\n            <div class="image-list__item">\n                <div class="mdc-elevation--z2">\n                    <img class="image-list-image__'.concat(r,'" src="').concat(n,'">\n                    <div class="image-list-image__delete-button">\n                        <button class="mdc-icon-button material-icons" id="image-list-image-').concat(t,'" aria-describedby="tooltip-delete-image">\n                            <div class="mdc-icon-button__ripple"></div>\n                            <span class="mdc-icon-button__focus-ring"></span>\n                            <i class="material-icons mdc-icon-button__icon mdc-icon-button__icon--on">delete</i>\n                            <i class="material-icons mdc-icon-button__icon">delete_outline</i>\n                        </button>\n                    </div>\n                </div>\n            </div>');document.getElementById("images-list").appendChild(p(o)),document.getElementById("image-list-image-".concat(t)).addEventListener("click",D.bind(event,t,e),!1)},I=function(t){a.description.value=t,t.length&&(document.getElementById("text-field-description").classList.add("mdc-text-field--label-floating"),document.getElementById("text-field-description-label").classList.add("mdc-floating-label--float-above"))},P=function(t){a.name.value=t,document.getElementById("text-field-name").classList.add("mdc-text-field--label-floating"),document.getElementById("text-field-name-label").classList.add("mdc-floating-label--float-above")},O=function(t){null!=t&&y(t)},T=function(){return T=x(m().mark((function t(e,r,o){var c,l;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,n.updateProject(e,r);case 2:if(200!=(c=t.sent).status){t.next=7;break}L(e,o),t.next=22;break;case 7:if(422!=c.status){t.next=14;break}return t.next=10,c.json();case 10:l=t.sent,v(a,l),t.next=22;break;case 14:if(401!=c.status){t.next=18;break}d(),t.next=22;break;case 18:throw console.log(i),u.labelText=i,u.open(),new Error("Failed to update project with id ".concat(e));case 22:case"end":return t.stop()}}),t)}))),T.apply(this,arguments)},S=function(t,e,n){return T.apply(this,arguments)},j=function(){return(j=x(m().mark((function t(e,r){var o,c,l,s;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,n.createProject(e);case 2:if(201!=(o=t.sent).status){t.next=11;break}return t.next=6,o.json();case 6:c=t.sent,l=c.id,L(l,r),t.next=26;break;case 11:if(422!=o.status){t.next=18;break}return t.next=14,o.json();case 14:s=t.sent,v(a,s),t.next=26;break;case 18:if(401!=o.status){t.next=22;break}d(),t.next=26;break;case 22:throw console.log(i),u.labelText=i,u.open(),new Error("Failed to create project");case 26:case"end":return t.stop()}}),t)})))).apply(this,arguments)},_=function(t,e){return j.apply(this,arguments)},k=function(){return k=x(m().mark((function t(e,r){var o;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!r.has("files")){t.next=18;break}return t.next=3,n.createImages(e,r);case 3:if(201!=(o=t.sent).status){t.next=8;break}b(),t.next=16;break;case 8:if(401!=o.status){t.next=12;break}d(),t.next=16;break;case 12:throw console.log(i),u.labelText=i,u.open(),new Error("Failed to create images");case 16:t.next=19;break;case 18:b();case 19:case"end":return t.stop()}}),t)}))),k.apply(this,arguments)},L=function(t,e){return k.apply(this,arguments)},E=function(){return E=x(m().mark((function t(){var e;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!f.length){t.next=22;break}return console.log("Deleting: "+f),t.next=4,Promise.all(f.map(function(){var t=x(m().mark((function t(e){return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,n.deleteImage(e);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}()));case 4:if(!(e=t.sent).every((function(t){return 200==t.status}))){t.next=12;break}console.log(o),u.labelText=o,u.open(),U(),t.next=20;break;case 12:if(!e.some((function(t){return 401==t.status}))){t.next=16;break}d(),t.next=20;break;case 16:throw console.log(i),u.labelText=i,u.open(),new Error("Failed to delete images");case 20:t.next=26;break;case 22:console.log(o),u.labelText=o,u.open(),U();case 26:case"end":return t.stop()}}),t)}))),E.apply(this,arguments)},b=function(){return E.apply(this,arguments)},w=function(){return w=x(m().mark((function t(e){var r,o;return m().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,n.getProject(e);case 2:if(200!=(r=t.sent).status){t.next=11;break}return t.next=6,r.json();case 6:o=t.sent,["name","description","images"].every((function(t){return Object.keys(o).includes(t)}))&&(P(o.name),I(o.description),N(o.images)),t.next=16;break;case 11:if(401!=r.status){t.next=15;break}d(),t.next=16;break;case 15:throw new Error("Failed to get data for project with id ".concat(e));case 16:case"end":return t.stop()}}),t)}))),w.apply(this,arguments)},y=function(t){return w.apply(this,arguments)},o="Project saved successfully.",i="Failed to save project.",a={name:new mdc.textField.MDCTextField(document.querySelector("#text-field-name")),description:new mdc.textField.MDCTextField(document.querySelector("#text-field-description"))},u=new mdc.snackbar.MDCSnackbar(document.querySelector(".mdc-snackbar")),l=[],s={},f=[],document.getElementById("image-upload-input").addEventListener("input",R),document.getElementById("edit-project-cancel-button").addEventListener("click",B),document.getElementById("edit-project-submit-button").addEventListener("click",A),O(e);case 32:case"end":return t.stop()}}),t)}))),E.apply(this,arguments)}!function(t){f.apply(this,arguments)}((function(){!function(t,e){E.apply(this,arguments)}(project_id,mode)}))})();