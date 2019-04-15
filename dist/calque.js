/**
 * CalqueJS /kalk/
 * @author: Daniel Mascena <danielmascena@gmail.com>
 */

/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.html = html;
exports.default = exports.innerHTML = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var innerHTML = Symbol('innerHTML');
exports.innerHTML = innerHTML;
var _calque = '📑';
var Calque = {
  innerHTML: innerHTML,
  html: html
};

var isEmptyObject = function isEmptyObject(obj) {
  return Object.entries(obj).length === 0 && obj.constructor === Object;
};

function htmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');
}

function hashCode(wUppercase) {
  var text = '',
      possible = "abcdefghijklmnopqrstuvwxyz".concat(wUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '', "0123456789");

  for (var i = 0; i < 15; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function HTMLtoJSON(template, Element) {
  var htmlMarkup;

  if (typeof template === 'string') {
    var docNode;

    if (window.DOMParser) {
      var parser = new DOMParser();
      docNode = parser.parseFromString(template, 'text/html');
    }
    /*else { 
          docNode = new ActiveXObject('Microsoft.XMLDOM');
          docNode.async = false;
          docNode.loadXML(htmlTmpl); 
    }*/


    if (Element != null && Element instanceof HTMLElement) {
      var tagName = Element.tagName,
          attributes = Element.attributes,
          body = docNode.body,
          firstChild = body.firstChild,
          textContent = body.textContent,
          children = docNode.body.children;
      htmlMarkup = {
        tagName: tagName,
        attributes: attributes,
        textContent: textContent,
        firstChild: firstChild.nodeType === 3 ? firstChild : document.createTextNode(''),
        children: children
      };
    }
  } else if (_typeof(template) === 'object') {
    htmlMarkup = template;
  }

  var toJSON = function toJSON(e) {
    return {
      tagName: e.tagName,
      textValue: e.firstChild && e.firstChild.nodeValue,
      textContent: e.textContent,
      attributes: Object.fromEntries(Array.from(e.attributes, function (_ref) {
        var name = _ref.name,
            value = _ref.value;
        return [name, value];
      })),
      children: Array.from(e.children, toJSON)
    };
  };

  return htmlMarkup && toJSON(htmlMarkup);
}

function html(literals) {
  var raw = literals.raw;

  var result = '',
      elemEvents = [],
      strMatch,
      recoverContent = function recoverContent(obj) {
    if (_typeof(obj) === 'object') {
      if (obj === null || Object.getOwnPropertyNames(obj).length === 0) return;else if ('_calque' in obj) {
        obj.elemEvents.length && (elemEvents = [].concat(_toConsumableArray(elemEvents), _toConsumableArray(obj.elemEvents)));
        return obj.result;
      }
      return Object.prototype.toString === obj.toString ? Object.keys(obj).reduce(function (acc, key) {
        return acc + "".concat(key, ": ").concat(obj[key], ",\n          ");
      }, '[Object toString] ') : obj;
    }
  };

  for (var _len = arguments.length, substs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    substs[_key - 1] = arguments[_key];
  }

  substs.forEach(function (subst, i) {
    var lit = raw[i];

    var type = _typeof(subst);

    if (subst == null || type === 'object' && Object.getOwnPropertyNames(subst).length === 0) {
      subst = '';
    } else {
      if (Array.isArray(subst)) {
        var tmp = '';
        subst.forEach(function (obj) {
          return tmp += recoverContent(obj);
        });
        subst = tmp || subst.join('');
      } else if (type === 'object') {
        /* HTML5 specification says:
              Then, the start tag may have a number of attributes, [...]. 
              Attributes must be separated from each other by one or more space characters.
            */
        subst = lit.slice(-8).match(/\s+style=["']/) ? Object.entries(subst).map(function (v) {
          return v.join(':');
        }).join(';') : recoverContent(subst);
      } else if (type === 'function' && (strMatch = lit.slice(-15).match(/\son.*=["']$/))) {
        var quote = lit.charAt(lit.length - 1);
        var charNumber = quote.charCodeAt();
        var eventType = strMatch[0].slice(3, -2);
        var calqueID = '_calque-id-' + hashCode();
        var calqueIDValue = hashCode(true);
        var handlerBody = String(subst);

        if (subst.name.startsWith('bound ') && handlerBody.startsWith(type) && handlerBody.includes('native code')) {
          var toggleQuote = charNumber === 34 ? "'" : "\"";
          handlerBody = "".concat(toggleQuote).concat(type, " ").concat(subst.name.substring(5), " ").concat(handlerBody.substring(9)).concat(toggleQuote);
        }

        elemEvents.push({
          calqueID: calqueID,
          calqueIDValue: calqueIDValue,
          eventHandler: subst,
          eventType: eventType,
          handlerBody: handlerBody
        });
        subst = "".concat(handlerBody).concat(quote, " ").concat(calqueID, "=").concat(quote).concat(calqueIDValue);
      }
    }

    if (lit.endsWith('!')) {
      subst = htmlEscape(subst);
      lit = lit.slice(0, -1);
    }

    result += lit;
    result += subst;
  });
  result += raw[raw.length - 1];
  return {
    result: result,
    elemEvents: elemEvents,
    _calque: _calque
  };
}

(function calque() {
  _calque in window || (window[_calque] = !function () {
    Object.defineProperty(HTMLElement.prototype, innerHTML, {
      get: function get() {
        return this.innerHTML;
      },
      set: function set(arr) {
        var _this = this;

        this.vdom || Object.defineProperty(this, 'vdom', {
          value: {},
          writable: true
        });
        var result = arr.result,
            elemEvents = arr.elemEvents;
        console.info('Element is in the DOM?: ' + this.isConnected);

        if (this.isConnected && !isEmptyObject(this.vdom) && document.contains(this)) {
          var nextMarkup = HTMLtoJSON(result, this);
          var previousMarkup = this.vdom;

          var searchDiffs = function searchDiffs(previousVDOM, nextVDOM) {
            var findDiff = function findDiff(elemPrev, elemNext, index) {
              var isEmptyPrev = Object.is(_typeof(elemPrev), 'undefined'),
                  isEmptyNext = Object.is(_typeof(elemNext), 'undefined');
              var elemPrevCopy = Object.assign({}, elemPrev),
                  elemNextCopy = Object.assign({}, elemNext);
              var diff = {
                newContent: '',
                oldContent: '',
                children: [],
                index: index
              };

              if (isEmptyPrev && isEmptyNext) {
                console.log('nothing to change');
                return;
              } else if (elemPrevCopy.textContent !== elemNextCopy.textContent) {
                var contentPrev = elemPrevCopy.textValue;
                var contentNext = elemNextCopy.textValue;

                if (contentPrev && !contentNext) {
                  // remove
                  diff.oldContent = contentPrev;
                  diff.newContent = contentNext;
                  diff.index = index;
                } else if (isEmptyPrev && !isEmptyNext) {
                  // add
                  diff.oldContent = '';
                  diff.newContent = contentNext;
                  diff.tagName = elemNextCopy.tagName;
                  diff.index = index + 1;
                } else {
                  // compare
                  if (contentPrev !== contentNext) {
                    diff.newContent = contentNext;
                    diff.oldContent = contentPrev;
                    diff.tagName = elemNextCopy.tagName;
                  } else {
                    diff.textContent = elemNextCopy.textContent;
                  }
                }

                var chPr = elemPrevCopy.children || [];
                var chNx = elemNextCopy.children || [];
                var length = Math.max(chPr.length, chNx.length);

                if (length > 0) {
                  for (var i = 0; i < length; i++) {
                    var returnedDiff = findDiff(chPr[i], chNx[i], i);

                    if (returnedDiff.newContent || returnedDiff.oldContent || elemPrevCopy.textContent !== elemNextCopy.textContent && returnedDiff.children.length > 0) {
                      diff.children.push(returnedDiff);
                    }
                  }
                }
                /*
                const previousKeys = Object.keys(elemPrev.attributes);
                const nextKeys = Object.keys(elemNext.attributes);
                const joinKeys = new Set([...previousKeys, ...nextKeys]);
                for (let key of joinKeys) {
                	if (previousKeys.includes(key)) {
                		Object.is(elemPrev.attributes[key], elemNext.attributes[key]) 
                		|| (diff.attributes[key] = elemNext.attributes[key]);
                	} else {
                		diff.attributes[key] = elemNext.attributes[key];
                	}
                }
                */

              }

              return diff;
            };

            var diffs = findDiff(previousVDOM, nextVDOM, -1);

            var applyDiffs = function applyDiffs(diffElem, htmlElem) {
              var isEmptyDiff = Object.is(_typeof(diffElem), 'undefined'),
                  isEmptyHtmlEl = Object.is(_typeof(htmlElem), 'undefined');

              if (isEmptyDiff && isEmptyHtmlEl) {
                console.log('no diffs to apply');
                return;
              } else if (diffElem.textContent !== htmlElem.textContent || diffElem.newContent !== htmlElem.firstChild.nodeValue) {
                if (diffElem.newContent) {
                  if (diffElem.oldContent) {
                    //parentNode.replaceChild(newChild, oldChild);
                    htmlElem.firstChild.nodeValue = diffElem.newContent;
                    console.log('content updating');
                  } else {
                    var newElem = document.createElement(diffElem.tagName);
                    var textNode = document.createTextNode(diffElem.newContent);
                    newElem.appendChild(textNode);
                    htmlElem.appendChild(newElem);
                  }
                } else if (diffElem.oldContent) {
                  htmlElem.remove();
                } //Element.attributes 


                var children = diffElem.children;

                if (children.length > 0) {
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var elDf = _step.value;
                      var htmlCh = htmlElem.children;
                      var elHT = elDf.index < htmlCh.length ? htmlCh[elDf.index] : htmlElem;
                      applyDiffs(elDf, elHT);
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }
                }
              }
            };

            applyDiffs(diffs, _this);
          }; //const nullify = () => {};


          searchDiffs(previousMarkup, nextMarkup);
          this.vdom = nextMarkup;
        } else {
          this.innerHTML = result;
          this.vdom = HTMLtoJSON(result, this);
          console.log(this.vdom);
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = elemEvents[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var event = _step2.value;
              var calqueID = event.calqueID,
                  calqueIDValue = event.calqueIDValue,
                  eventHandler = event.eventHandler,
                  eventType = event.eventType,
                  handlerBody = event.handlerBody;
              var elem = this.querySelector("[".concat(calqueID, "=\"").concat(calqueIDValue, "\"]"));

              if (elem != null && typeof eventHandler === 'function') {
                if (!eventHandler.name && handlerBody.startsWith('function')) {
                  debugger;
                  console.error(handlerBody, 'function expression must have a name');
                  throw new TypeError('function expression must have a name');
                }

                elem[eventType] && elem.addEventListener(eventType, eventHandler);
                elem.removeAttribute(calqueID);
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      },
      enumerable: true,
      configurable: true
    });
  }());
})();

var _default = Calque;
exports.default = _default;