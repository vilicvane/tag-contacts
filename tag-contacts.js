/*
    Tag Contacts
    https://github.com/vilic/tag-contacts

    by VILIC VANE
    https://github.com/vilic

    MIT License
*/

(function (window, $) {
    var hop = Object.prototype.hasOwnProperty;

    $.fn.tagContacts = function (dataSource, options) {
        var tagContacts = new $.TagContacts(dataSource, options);
        tagContacts.appendTo(this);
        return tagContacts;
    };

    // constructor
    $.TagContacts = function (dataSource, options) {
        var that = this;

        var dataReq;
        var dataUrl;
        var requestedKeyHash = {};

        options = fillDefault(options, {
            minInputWidth: 60,
            minDropdownWidth: 300,
            maxItemNumber: 5,
            minLength: 1,
            selectedContacts: null,
            beforeAdd: null,
            beforeRemove: null,
            afterRemoved: null,
            supportMultiple: true
        });

        var data = [];

        if (typeof dataSource == 'string') {
            dataReq = $.getJSON(dataUrl = dataSource, { q: '' }, function (d) {
                mergeData(data, d);
                renderDropdown(true, true, false, true);
            });
        } else if ($.isArray(dataSource)) {
            data = dataSource;
        }

        var $ul = $(document.createElement('ul'))
            .addClass('tag-contacts-wrapper');
        
        var $inputWrapper = $(document.createElement('li'))
            .addClass('tag-contacts-input-wrapper')
            .appendTo($ul);
        
        var $input = $(document.createElement('input'))
            .appendTo($inputWrapper);

        var $dropdownUl = $(document.createElement('ul'))
            .addClass('tag-contacts-dropdown contacts-dropdown-menu')
            .css('min-width', options.minDropdownWidth + 'px')
            .hide()
            .delegate('li', 'mouseenter', function () {
                var $prev = $('.active', $dropdownUl);
                if ($prev[0] == this) {
                    return;
                }

                $prev.removeClass('active');
                $(this).addClass('active');
            })
            .delegate('li', 'mousedown', function (e) {
                $(this).addClass('active');
                triggerCreateTag();
                e.preventDefault();
            });

        var tagRemoveHandlers = [];
        var tagHash = {};

        var inputTimeout;
        var isPaste = false;

        $input.on('input', function () {
            if (isPaste) {
                isPaste = false;

                var text = $input.val();

                console.log('here', text);

                var emails = text.match(/[a-z0-9._%-]+@([a-z0-9-]+\.)+[a-z]{2,}/ig);

                if (emails) {
                    for (var i = 0; i < emails.length; i++) {
                        var value = emails[i];
                        createTag(value, value, value);
                    }

                    $input.val('');
                    setInputSize();
                    renderDropdown(true);
                    return;
                }

            }

            if (dataUrl) {
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(function () {
                    var q = $.trim($input.val());

                    if (!q || hop.call(requestedKeyHash, q)) {
                        return;
                    }

                    if (dataReq) {
                        dataReq.abort();
                    }

                    dataReq = $.getJSON(dataUrl, { q: q }, function (d) {
                        mergeData(data, d);
                        requestedKeyHash[q] = true;
                        renderDropdown(true, true, false, true);
                    });
                }, 200);
            }
            renderDropdown(true);
        });

        $input.on('paste', function() {
            if (!$input.val()) {
                isPaste = true;
            }
        });

        $input.focus(function () {
            renderDropdown(true, true, true);
        });

        $input.blur(function () {
            $dropdownUl.fadeOut(100);
        });

        var delToggle = true;

        $input.keyup(function (e) {
            if (e.keyCode == 8) {
                delToggle = true;
            }
        });

        $input.keydown(function (e) {
            if (options.supportMultiple == false && Object.keys(tagHash).length > 0 && e.keyCode != 8) {
                e.preventDefault();
                return;
            }
            
            switch (e.keyCode) {
                case 186: // ;
                case 13: // enter
                    triggerCreateTag();
                    e.preventDefault();
                    break;
                case 9: // tab
                    if (triggerCreateTag()) {
                        e.preventDefault();
                    }
                    break;
                case 8: // backspace
                    if (!$input.val() && tagRemoveHandlers.length) {
                        if (delToggle) {
                            tagRemoveHandlers[tagRemoveHandlers.length - 1]();
                            delToggle = false;
                        }
                    }
                    break;
                case 32: // space
                    var value = $.trim($input.val());
                    if (/^[a-z0-9._%-]+@([a-z0-9-]+\.)+[a-z]{2,}$/i.test(value)) {
                        triggerCreateTag();
                        e.preventDefault();
                    }
                    break;
                case 38: // up
                    var $cur = $('.active', $dropdownUl);
                    var index = $cur.index();
                    var $prev;
                    if (index < 0) {
                        $prev = $('li:last', $dropdownUl);
                        $prev.addClass('active');
                    } else {
                        $prev = $cur.prev();
                        if ($prev.length) {
                            $cur.removeClass('active');
                            $prev.addClass('active');
                        } else {
                            $prev = $cur;
                        }
                    }
                    e.preventDefault();
                    break;
                case 40: // down
                    var $cur = $('.active', $dropdownUl);
                    var index = $cur.index();
                    var $next;
                    if (index < 0) {
                        $next = $('li:first', $dropdownUl);
                        $next.addClass('active');
                    } else {
                        $next = $cur.next();
                        if ($next.length) {
                            $cur.removeClass('active');
                            $next.addClass('active');
                        } else {
                            $next = $cur;
                        }
                    }
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        });

        this.add = function (contacts) {
            $.each(contacts, function (i, item) {
                createTag(item.id, item.displayName, item.email);
            });
        };

        if (options.selectedContacts) {
            this.add(options.selectedContacts);
            mergeData(data, options.selectedContacts);
        }

        this.appendTo = function (selector) {
            $ul.appendTo(selector);
            $dropdownUl.appendTo('body');
            setInputSize();
        };

        this.resize = function () {
            setInputSize();
        };

        this.getContacts = function () {
            var ids = [];

            $('.tag-contacts-tag', $ul).each(function () {
                ids.push($(this).attr('data-id'));
            });

            return ids;
        };

        this.beforeAdd = options.beforeAdd;
        this.beforeRemove = options.beforeRemove;
        this.afterRemoved = options.afterRemoved;

        $(window).on('resize', this.resize);

        function setInputSize(doNotRenderDropdown) {
            $inputWrapper.css({
                display: 'block',
                width: 'auto'
            });

            var width = $inputWrapper.prop('offsetWidth');
            var left = $inputWrapper.offset().left;

            $inputWrapper.css({
                display: 'inline-block'
            });

            $input.css({
                position: 'absolute'
            });

            var w = width - ($inputWrapper.offset().left - left);

            if (w < options.minInputWidth) {
                w = width;
                $inputWrapper.css({
                    display: 'block'
                });
            }

            $inputWrapper.css({
                width: '0px'
            });

            $input.css({
                position: 'static',
                width: w - 2 + 'px' // padding-left: 2
            });

            if (!doNotRenderDropdown) {
                renderDropdown(false);
            }
        }

        function triggerCreateTag() {
            var value = $.trim($input.val());
            var $active = $('.active', $dropdownUl);
            if ($active.length) {
                createTag($active.attr('data-id'), $active.attr('data-display-name'), $active.attr('data-email'));
                $input.val('');
                setInputSize();
                renderDropdown(true);
                return true;
            } else if (value) {
                createTag(value, value, value);
                $input.val('');
                setInputSize();
                renderDropdown(true);
                return true;
            } else {
                renderDropdown(true);
                return false;
            }
        }

        function createTag(id, name, email) {
            if (options.supportMultiple === false && Object.keys(tagHash).length > 0) {
                return;
            }

            if (hop.call(tagHash, id)) {
                return;
            }

            if (typeof that.beforeAdd == 'function') {
                if (that.beforeAdd(id) === false) {
                    return;
                }
            }

            tagHash[id] = true;

            var removed = false;
            var $li = $(document.createElement('li'))
                .addClass('tag-contacts-tag')
                .append($(document.createElement('span')).text(name))
                .append(
                    $(document.createElement('i'))
                        .addClass('icon-remove')
                        .mousedown(function (e) {
                            tagRemoveHandler();
                            e.preventDefault();
                        })
                )
                .css({
                    opacity: 0.5
                });

            $li.attr({
                "data-id": id,
                "data-email": email,
                "data-display-name": name
            });

            $li.insertBefore($inputWrapper);
            setInputSize();
            $li.animate({ opacity: 1 }, 200);

            tagRemoveHandlers.push(tagRemoveHandler);

            function tagRemoveHandler() {
                if (removed) {
                    return;
                }

                if (typeof that.beforeRemove == 'function') {
                    if (that.beforeRemove(id) === false) {
                        return;
                    }
                }

                removed = true;
                delete tagHash[id];

                for (var i = 0; i < tagRemoveHandlers.length; i++) {
                    if (tagRemoveHandlers[i] == tagRemoveHandler) {
                        tagRemoveHandlers.splice(i, 1);
                        break;
                    }
                }

                if (typeof that.afterRemoved == 'function') {
                    that.afterRemoved(id);
                }

                renderDropdown(true);

                $li.animate({
                    width: '0px',
                    marginRight: '-12px', // padding-left + padding-right
                    opacity: 0
                }, {
                    duration: 200,
                    complete: function () {
                        $li.remove();
                        setInputSize();
                    },
                    progress: function () {
                        setInputSize(true);
                        renderDropdown(false, false);
                    }
                });
            }
        }

        var dropdownLiMap = {};

        function renderDropdown(inputChanged, animate, focusing, keepActive) {
            var matchKeys = ['displayName', 'email'];

            if (inputChanged) {
                var texts = $input.val().toLowerCase().match(/\S+/g);

                var hasMatch = false;

                if ($input.val().length >= options.minLength) {
                    var activeId = null;
                    if (keepActive) {
                        activeId = $('.active', $dropdownUl).attr('data-id');
                    }

                    $.each(data, function (i, item) {
                        if (hop.call(tagHash, item.id)) {
                            item.score = 0;
                        } else {
                            if (!texts) {
                                item.score = 1;
                            } else {
                                item.score = 0;
                                $.each(texts, function (i, text) {
                                    var hasText = false;
                                    $.each(matchKeys, function (i, name) {
                                        var value = item[name].toLowerCase();
                                        var index = value.indexOf(text);
                                        if (index >= 0) {
                                            if (text == value) {
                                                item.score += 10;
                                            } else if (index == 0) {
                                                item.score += 5;
                                            } else if (/[^a-z0-9]/i.test(value[index - 1] || '')) {
                                                item.score += 3;
                                            } else {
                                                item.score += 1;
                                            }
                                            hasText = true;
                                        }
                                    });
                                    if (!hasText) {
                                        item.score = 0;
                                        return false;
                                    }
                                });
                            }

                            if (item.score > 0 && item.id == activeId) {
                                item.score = Infinity;
                            }
                        }

                        if (item.score > 0) {
                            hasMatch = true;
                        }
                    });

                    data.sort(function (a, b) {
                        return b.score - a.score;
                    });
                }

                $dropdownUl.empty();

                if (hasMatch) {
                    $.each(data, function (i, item) {
                        if (i >= options.maxItemNumber) {
                            return false;
                        }

                        if (item.score == 0) {
                            return false;
                        }

                        var id = item.id;

                        var displayName = item.displayName;
                        var $li = hop.call(dropdownLiMap, id) ?
                            dropdownLiMap[id] :
                            dropdownLiMap[id] = $(document.createElement('li'))
                                .append(
                                    $(document.createElement('a'))
                                        .append($(document.createElement('img')).attr('src', item.avatar))
                                        .append($(document.createElement('div')).addClass('display-name'))
                                        .append($(document.createElement('div')).addClass('email'))
                                )
                                .attr({
                                    "data-id": id,
                                    "data-email": item.email,
                                    "data-display-name": displayName
                                });

                        $li.toggleClass('active', i == 0 && !!texts);

                        $('.display-name', $li).html(boldMatch(displayName, texts));
                        $('.email', $li).html(boldMatch(item.email, texts));

                        $dropdownUl.append($li);
                    });

                    if (focusing || $input.is(':focus')) {
                        $dropdownUl.fadeIn(200);
                    }
                } else {
                    $dropdownUl.hide();
                }
            }

            var p = $input.offset();
            var top = p.top + 34;
            var left = Math.min(p.left - 4, p.left + $input.width() - $dropdownUl.width() + 4);

            var targetStyle = {
                top: top + 'px',
                left: left + 'px'
            };
            
            if (animate == false) {
                $dropdownUl.css(targetStyle);
            } else {
                $dropdownUl.animate(targetStyle, {
                    duration: 100,
                    queue: false
                });
            }
        }
    };

    function boldMatch(text, matches) {
        if (matches) {
            var reStrs = [];

            $.each(matches, function (i, m) {
                reStrs.push(encodeHtml(m).replace(/([^a-z0-9])/ig, '\\$1'));
            });

            var re = new RegExp('(' + reStrs.join('|') + ')', 'ig');
            return encodeHtml(text).replace(re, '<b>$1</b>');
        } else {
            return encodeHtml(text);
        }
    }

    function encodeHtml(html) {
        return $(document.createElement('div')).text(html).html();
    }

    var dataHash = {};

    function mergeData(target, source) {
        $.each(source, function (i, item) {
            if (!hop.call(dataHash, item.id)) {
                dataHash[item.id] = true;
                target.push(item);
            }
        });
    }

    function fillDefault(options, d) {
        var o = options || {};
        $.each(d, function (i, value) {
            if (!hop.call(o, i)) {
                o[i] = value;
            }
        });
        return o;
    }
})(window, jQuery);