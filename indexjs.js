(function($){
	/*说明:获取浏览器前缀*/
	/*实现：判断某个元素的css样式中是否存在transition属性*/
	/*参数：dom元素*/
	/*返回值：boolean，有则返回浏览器样式前缀，否则返回false*/
	var _prefix=(function(temp){
		var aPrefix = ["webkit", "Moz", "o", "ms"],
			props = "";
		for(var i in aPrefix){
			props = aPrefix[i] + "Transition";
			if(temp.style[ props ] !== undefined){
				return "-"+aPrefix[i].toLowerCase()+"-";
			}
		}
		return false;
	})(document.createElement(pageswitch));

	//定义pageswitch对象
	var pageswitch = (function(){
		function pageswitch(element, options){
			this.settings = $.extend(true, $.fn.pageswitch.defaults, options||{});
			this.element = element;
			this.init();
		}
		pageswitch.prototype={
			/*说明：初始化插件*/
			/*实现：初始化dom结构，布局，分页及绑定事件*/
			init : function(){
				var me = this;
				me.selectors = me.settings.selectors;
				me.sections = me.element.find(me.selectors.sections);
				me.section = me.sections.find(me.selectors.section);

				me.direction = me.settings.direction == "vertical" ? true : false;
				me.pagesCount = me.pagesCount();
				me.index = (me.settings.index >= 0 && me.settings.index < pagesCount) ? me.settings.index : 0;

				me.canScroll = true;

				if(!me.direction){
					me._initLayout();
				}

				if(me.settings.pagination){
					me._initPaging();
				}

				me._initEvent();
			},
			/*说明：获取滑动页面数量*/
			pagesCount : function(){
				return this.section.length;
			},

			/*说明：获取滑动的宽度（横屏滑动）或高度（竖屏滑动）*/
			switchLength : function(){
				return this.direction ? this.element.height() : this.element.width();
			},

			/*说明：向前滑动即上一页*/
			prve : function(){
				var me = this;
				if(me.index > 0){
					me.index--;
				}else if(me.settings.loop){
					me.index = me.pagesCount - 1;
				}
				me._scrollPage();
			},
			/*说明：向后滑动即下一页*/
			next : function(){
				var me = this;
				if(me.index < me.pagesCount){
					me.index ++;
				}else if(me.settings.loop){
					me.index = 0;
				}
				me._scrollPage();
			},

			/*说明：主要针对横屏情况进行页面布局*/
			_initLayout : function(){
				// var me = this;
				// var width=(me.pagesCount*100)+"%";
    //             var cellWidth=(100/me.pagesCount).toFixed(2)+"%";//保持两位小数toFixed(2)
    //             me.sections.width(width);
    //             me.section.width(cellWidth).css("float", "left");		
               	var me = this;
				if(!me.direction){
					var width = (me.pagesCount * 100) + "%",
						cellWidth = (100 / me.pagesCount).toFixed(2) + "%";
					me.sections.width(width);
					me.section.width(cellWidth).css("float", "left");
				}
				if(me.index){
					me._scrollPage(true);
				}	
			},

            /*说明：实现分页的dom结构及其css样式*/
			_initPaging : function(){
				var me = this,
				pagesClass = me.selectors.page.substring(1);//截取字符串从1开始到结尾
				me.activeClass = me.selectors.active.substring(1);

				var pageHtml = "<ul class="+pagesClass+">";
				for(var i = 0 ; i < me.pagesCount; i++){
					pageHtml += "<li></li>";
				}
				pageHtml+="</ul>";
				me.element.append(pageHtml);//动态插入分页结构
				var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find("li");
				me.pageItem.eq(me.index).addClass(me.activeClass);

				if(me.direction){
					pages.addClass("vertical");
				}else{
					pages.addClass("horizontal");
				}
			},


			/*说明：初始化插件事件*/
			_initEvent : function(){
				var me = this;
				/*绑定分页click事件*/
				me.element.on("click", me.selectors.pages + " li", function(){
					me.index = $(this).index();
					me._scrollPage();
				});
				/*绑定鼠标滚轮事件*/
				me.element.on("mousewheel DOMMouseScroll", function(e){					
					if(me.canScroll){
						var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
						if(delta > 0 && (me.index && !me.settings.loop || me.settings.loop)){
							me.prve();
						}else if(delta < 0 && (me.index < (me.pagesCount-1) && !me.settings.loop ||me.settings.loop)){
							me.next();
						}										
				  }
			    });

                //绑定键盘事件
				if(me.settings.keyboard){
					$(window).on("keydown",function(e){
						var keyCode = e.keyCode;
						if(keyCode == 37 || keyCode == 38){//左键上键
							me.prve();
						}else if(keyCode == 39 || keyCode == 40){//右键下键
							me.next();
						}
					});
				}

				/*绑定窗口改变事件*/
				/*为了不频繁调用resize的回调方法，做了延迟*/
				$(window).resize(function(){

					var currentLength=me.switchLength();//获取当前页面的高度
					var offset = me.settings.direction ? me.section.eq(me.index).offset().top : 
					   me.section.eq(me.index).offset().left;//当前页面距离文档的坐标值
					
						if(Math.abs(offset) > currentLength/2 && me.index < (me.pagesCount - 1)){
							me.index++;
						}
						if(me.index){
							me._scrollPage();
						}					
				});

				/*支持CSS3动画的浏览器，绑定transitionend事件(即在动画结束后调用起回调函数)*/
				// if(_prefix){
					me.sections.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend", function(){
						me.canScroll = true;
						if(me.settings.callback && $.type(me.settings.callback) == "function"){
							me.settings.callback();
						}
					});
				},

				/*滑动动画*/
			_scrollPage : function(){
				var me = this;
				var dest = me.section.eq(me.index).position();
				if(!dest) return;

				me.canScroll = false;

				if(_prefix){
					var translate = me.direction ? "translateY(-"+dest.top+"px)" : "translateX(-"+dest.left+"px)";
					me.sections.css(_prefix+"transition", "all" + me.settings.duration + "ms " + me.settings.easing);
					me.sections.css(_prefix+"transform" , translate);
				}else{
					var animateCss = me.direction ? {top : -dest.top} : {left : -dest.left};
					me.sections.animate(animateCss, me.settings.duration, function(){
						me.canScroll = true;
						if(me.settings.callback && $.type(me.settings.callback) == "function"){
							me.settings.callback();

						}
					});
				}
				if(me.settings.pagination){
					me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
				}
			},
		};
		return pageswitch;
    })();


    //单例模式
	$.fn.pageswitch=function(options){//传入参数
		return this.each(function(){//
			var me=$(this),
			     instance=me.data("pageswitch");//存放插件实例
			     if(!instance){//判断实例是为为空，空则创一个实例存放在me.data
				instance=new pageswitch(me,options);
				me.data("pageswitch",instance);
			}	
			if($.type(options)==="string") return instance[options]();	
			// $("div").pageswitch("init");//这样就可以调用init方法
      });
	};

	$.fn.pageswitch.defaults = {
		selectors : {
			sections : ".sections",
			section : ".section",
			page : ".pages",
			active : ".active",
		},
		index : 0,		//页面开始的索引
		easing : "ease",		//动画效果
		duration : 500,		//动画执行时间
		loop : false,		//是否循环切换
		pagination : true,		//是否进行分页
		keyboard : true,		//是否触发键盘事件
		direction : "vertical",		//滑动方向vertical竖屏,horizontal横向
		callback : ""		//回调函数
	};

	$(function(){
		$("[data-PageSwitch]").pageswitch();//配置插件

	});

})(jQuery);