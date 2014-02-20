/**
 * @fileoverview  window.Widget是组件基类
 * window.Widget是基类的构造函数，有一个静态方法extend用于扩展组件，extend方法返回组件构造函数，window.Widget形如：
 * window.Widget = function(pageName) {
 * 		_init(pageName);
 * }
 * window.Widget.extend = function() {}
 * @author xiaole@baidu.com
 * @date 2013/1/25
 */
window.Widget = (function() {
	var self;
	var bindBrowserEventArray = [], bindChannelEventArray = [];
	var _init = function(pageName) {
		if (self.init && $.isFunction(self.init)) {
			self.init(pageName);
		}
		_bind();
	};
	var _bind = function() {
		var events = self.events,
			channels = self.channels;
		var bindEventSplitter = /^(\S+)\s*(.*)$/;
		var eventName, selector, channelName, match;
		if (events && events instanceof Object) {
			$.each(events, function(key, method) {
				if (!$.isFunction(method)) {
					method = self[method];
				}
				if(!method) {
					return true;//true类似continue,false类似break
				}
				match = key.match(bindEventSplitter);
				eventName = match[1];
				selector = match[2];
				_bindBrowserEvent(eventName, selector, method);
			});
		}
		if (channels && channels instanceof Object) {
			$.each(channels, function(key, method) {
				if (!$.isFunction(method)) {
					method = this[method];
				}
				if(!method) {
					return true; //true类似continue,false类似break
				}
				match = key.match(bindEventSplitter);
				channelName = match[1];
				eventName = match[2];
				_bindCustomerEvent(channelName, eventName, method);
			});
		}
		listener.on('common.page', 'switchend', $.proxy(_destroy, self));
	};
	/**
	 * 浏览器事件绑定
	 * @param  {String} eventName 事件名，如click等
	 * @param  {String} selector  出发事件的元素
	 * @param  {function} method  事件处理函数
	 */
	var _bindBrowserEvent = function(eventName, selector, method) {
		var el = self.el || 'body';
		if (selector) {
			$(el).on(eventName, selector, $.proxy(method, self));
		} else {
			$(el).on(eventName, $.proxy(method, self));
		}
		bindBrowserEventArray.push([eventName, selector, method]);
	};
	/**
	 * 绑定自定义事件
	 * @param  {string} eventName 事件触发的频道，如common.page
	 * @param  {string} selector  自定义事件名称，如switchstart等
	 * @param  {function} method  事件处理函数
	 */
	var _bindCustomerEvent = function(channelName, eventName, method) {
		listener.on(channelName, eventName, $.proxy(method, self));
		bindChannelEventArray.push([channelName, eventName, method]);
	};
	/**
	 * 解绑浏览器事件
	 */
	var _unbindBrowserEvent = function(eventName, selector, method) {
		var el = self.el || 'body';
		if (selector) {
			$(el).off(eventName, selector, method);
		} else {
			$(el).off(eventName, method);
		}
	};
	/**
	 * 解绑广播事件
	 */
	var _unbindChannelEvent = function(channelName, eventName, method) {
		listener.off(channelName, eventName, method);
	};
	/**
	 * 切页后的处理，包括调用组件自定义destroy方法,解绑事件，解除引用，利于垃圾回收
	 */
	var _destroy = function() {
		self.destroy();
		$.each(bindBrowserEventArray, function(index, arr) {
			_unbindBrowserEvent(arr[0], arr[1], arr[2]);
		});
		$.each(bindChannelEventArray, function(index, arr) {
			_unbindChannelEvent(arr[0], arr[1], arr[2]);
		});
		bindBrowserEventArray = null;
		bindChannelEventArray = null;
		self.destroy = null;
		self.el = undefined;
	};

	function Widget(pageName) {
		_init(pageName);
	}
	/**
	 * 根据传进来的对象实例扩展组件基类，会返回child而不是Widget是因为如果在Widget基类上直接扩展，多个组件会相互影响
	 * @param  {Object} obj 组件对象实例
	 * @return {function}  扩展Widget基类后的组件构造函数
	 */
	Widget.extend = function(obj) {
		var parent = this;
		var child = function() {
			self = this;
			return parent.apply(this, arguments);
		};
		var Surrogate = function() {
			this.constructor = child;
		};
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate();
		Surrogate = null;
		$.extend(child.prototype, obj);
		child.createWidget = function(pageName) {
			new child(pageName);
		}
		return child;
	};
	return Widget;
})();