//     Cocktail.js 0.3.0
//     (c) 2012 Onsi Fakhouri
//     Cocktail.js may be freely distributed under the MIT license.
//     http://github.com/onsi/cocktail

(function(root, factory) {
	// Set up Cocktail appropriately for the environment.
	if (typeof exports !== 'undefined') {
		// Node/CommonJS.
		factory(root, exports, require('backbone'));
	} else if (typeof define === 'function' && define.amd) {
		// AMD
		define(['backbone', 'exports'], function(Backbone, exports) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global Cocktail.
			exports = root.Cocktail = factory(root, exports, Backbone);
			return exports;
		});
	} else {
		// Browser globals
		root.Cocktail = factory(root, Backbone);
	}
}(this, function(root, exports, Backbone) {
	var Cocktail = {},
		originalExtend = Backbone.Model.extend;

	Cocktail.mixins = {};

	Cocktail.mixin = function mixin(klass) {
		var mixins = _.chain(arguments).toArray().rest().flatten().value();

		var collisions = {};

		_(mixins).each(function(mixin) {
			if (_.isString(mixin)) {
				mixin = Cocktail.mixins[mixin];
			}
			_(mixin).each(function(value, key) {
				if (_.isFunction(value)) {
					if (klass.prototype[key]) {
						collisions[key] = collisions[key] || [klass.prototype[key]];
						collisions[key].push(value);
					}
					klass.prototype[key] = value;
				} else if (_.isArray(value)) {
                    klass.prototype[key] = [].concat(value);
                } else if (_.isObject(value)) {
					klass.prototype[key] = _.extend({}, value, klass.prototype[key] || {});
				} else if (!(key in klass.prototype)) {
					klass.prototype[key] = value;
				}
			});
		});

		_(collisions).each(function(propertyValues, propertyName) {
			klass.prototype[propertyName] = function() {
				var that = this,
					args = arguments,
					returnValue = undefined;

				_(propertyValues).each(function(value) {
					var returnedValue = _.isFunction(value) ? value.apply(that, args) : value;
					returnValue = (returnedValue === undefined ? returnValue : returnedValue);
				});

				return returnValue;
			};
		});
	};

	Cocktail.patch = function patch(Backbone, classesToPatch) {
		classesToPatch = classesToPatch || [Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View];

		var extend = function(protoProps, classProps) {
			var klass = originalExtend.call(this, protoProps, classProps);

			var mixins = klass.prototype.mixins;
			if (mixins && klass.prototype.hasOwnProperty('mixins')) {
				Cocktail.mixin(klass, mixins);
			}

			return klass;
		};

		_(classesToPatch).each(function(klass) {
			if (klass) {
				klass.mixin = function mixin() {
					Cocktail.mixin(this, _.toArray(arguments));
				};

				klass.extend = extend;
			}
		});
	};

	Cocktail.unpatch = function unpatch(classesToPatch, Backbone) {
		classesToPatch = classesToPatch || [Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View];
		_(classesToPatch).each(function(klass) {
			if (klass) {
				klass.mixin = undefined;
				klass.extend = originalExtend;
			}
		});
	};

	return Cocktail;
}));