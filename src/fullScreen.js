(function ($) {
    //判断当前浏览器所支持的transition前缀
    var _prefix = (function (temp) {
        var aPrefix = ["webkit", "Moz", "o", "ms"];
        var props = "";
        for (var i in aPrefix) {
            props = aPrefix[i] + "Transition";
            if (temp.style[props]!==undefined) {
                return "-"+aPrefix[i].toLowerCase()+"-";
            }
        }
        return false;
    })(document.createElement(FullScreen));
    //闭包方式，赋值给fullScreen
    var FullScreen = (function () {
        function FullScreen(element, options) {
            this.settings = $.extend(true, $.fn.FullScreen.default, options || {});
            this.element = element;
            this.init();
        }

        //实例对象可访问的函数
        FullScreen.prototype = {
            //初始化插件
            init: function () {
                //初始化dom结构，布局，分页，绑定事件
                var me = this;//避免this混淆
                //获取选择器
                me.selectors = me.settings.selectors;
                me.sections = me.element.find(me.selectors.sections);
                me.section = me.sections.find(me.selectors.section);
                //获取屏幕方向属性
                me.direction = me.settings.direction === "vertical";
                //获取屏幕页数
                me.pagesCount = me.pagesCount();
                //获取开始的页数
                me.index = (me.settings.index >= 0 && me.settings.index < me.pagesCount) ? me.settings.index : 0;


                //判断是否进行横屏设置
                if (!me.direction) {
                    me._initLayout();
                }
                //判断是否进行圆点栏的设置
                if (me.settings.pagination) {
                    me._initPaging();
                }
                //初始化绑定事件
                me._initEvent();


            },

            //返回屏幕页数
            pagesCount: function () {
                return this.section.length;
            },

            //获取当前页面的长度参数，用于界面大小改变时，适应界面
            switchLength: function () {
                return this.direction ? this.element.height() : this.element.width();
            },

            //对横屏的情况进行页面设置
            _initLayout: function () {
                var me = this;
                var width = (me.pagesCount * 100) + "%";
                var cellWidth = (100 / me.pagesCount) + "%";
                me.sections.width(width);
                me.section.width(cellWidth).css("float", "left");
            },
            //对圆点栏进行设置
            _initPaging: function () {
                var me = this;
                var pagesClass = "pages";
                me.activeClass = me.selectors.active.substr(1);
                var pageHtml = "<ul class=" + pagesClass + ">";
                for (var i = 0; i < me.pagesCount; i++) {
                    pageHtml += "<li></li>"
                }
                pageHtml += "</ul>";
                me.element.append(pageHtml);
                var pages = me.element.find("."+pagesClass);
                me.pageItem = pages.find("li");
                me.pageItem.eq(me.index).addClass(me.activeClass);

                if (me.direction) {
                    pages.addClass("vertical");
                } else {
                    pages.addClass("horizontal");
                }
            },

            //设置相关事件
            _initEvent: function () {
                var me = this;
                //代理圆点栏点击事件
                me.element.on('click', me.selectors.page + " li", function () {
                    me.index = $(this).index();
                    me._scrollPage();
                });
                //绑定鼠标滚轮事件
                if (me.settings.scroll) {
                    me.element.on("mousewheel DOMMouseScroll", function (e) {
                        e.preventDefault();
                        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
                        if (delta > 0) {
                            me.prev();
                        } else {
                            me.next();
                        }
                    });
                }
                //绑定键盘点击事件
                if (me.settings.keyboard) {
                    $(window).on("keydown", function (e) {
                        if (e.which === 37 || e.which === 38) {
                            me.prev();
                        } else if (e.which === 39 || e.which === 40) {
                            me.next();
                        }
                    });
                }
                //绑定界面大小改变事件
                $(window).on("resize", function () {
                    var currentLength = me.switchLength();
                    var offset = me.direction ? me.section.eq(me.index).offset().top : me.section.eq(me.index).offset().left;
                    if (Math.abs(offset) > currentLength) {
                        console.log('ojbk');
                    }
                });
                //为section绑定设置的回调函数
                me.section.on("transitionend webkitTransitionEnd oTransitionEnd", function () {
                    if (me.settings.callback && $.type(me.settings.callback) === "function") {
                        me.settings.callback();
                    }
                })
            },

            prev: function () {
                var me = this;
                if (me.index > 0) {
                    me.index--;
                } else {
                    if (me.settings.loop) {
                        me.index = me.pagesCount-1;
                    }
                }
                me._scrollPage();
            },

            next: function () {
                var me = this;

                if (me.index < me.pagesCount - 1) {
                    me.index++;
                } else {
                    if (me.settings.loop) {
                        me.index = 0;
                    }
                }
                me._scrollPage();
            },

            _scrollPage: function () {
                var me=this;
                var dest=me.section.eq(me.index).position();
                if(!dest) return;
                if(_prefix){
                    me.sections.css(_prefix+"transition","all "+me.settings.duration+"ms "+me.settings.easing);
                    var translate=me.direction?"translateY(-"+dest.top+"px)":"translateX(-"+dest.left+"px)";
                    me.sections.css(_prefix+"transform",translate);
                }
                else
                {
                    var animateCss=me.direction?{top:-dest.top}:{left:-dest.left};
                    me.sections.animate(animateCss,me.settings.duration,function () {
                        if (me.settings.callback && $.type(me.settings.callback) === "function") {
                            me.settings.callback();
                        }
                    });
                }
                if(me.settings.pagination){
                    me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
                }
            }
        };
        return FullScreen;
    })();

    $.fn.FullScreen = function (options) {
        //each遍历jquery对象
        return this.each(function () {
            //有就不重复创建实例
            var me = $(this);
            var instance = me.data("FullScreen");
            if (!instance) {
                instance = new FullScreen(me, options);
                me.data("FullScreen", instance);
            }
            //使实例对象实现调用init初始化
            if ($.type(options) === "string") return instance[options]();
        })
    };
    //默认配置
    $.fn.FullScreen.default = {
        selectors: {
            sections: ".sections",
            section: ".section",
            active: ".active"
        },
        index: 0,//初始化首次显示的页面索引
        easing: "ease",//滑动的速度变化
        duration: 1000,//滑动的事件
        loop: false,//是否可以循环滑动
        pagination: true,
        scroll: true,//是否支持滚动事件
        keyboard: true,//是否支持键盘事件
        direction: "vertical",
        callback: ""
    };


})(jQuery);