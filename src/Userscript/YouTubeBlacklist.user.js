// ==UserScript==
// @version         0.1.3
// @name            Block YouTube Videos
// @namespace       https://github.com/ParticleCore
// @description     YouTube less annoying
// @icon            https://raw.githubusercontent.com/ParticleCore/Ebony/gh-pages/images/YTBV%2Bicon.png
// @match           *://www.youtube.com/*
// @exclude         *://www.youtube.com/tv*
// @exclude         *://www.youtube.com/embed/*
// @exclude         *://www.youtube.com/live_chat*
// @run-at          document-start
// @downloadURL     https://github.com/ParticleCore/Ebony/raw/master/src/Userscript/YouTubeBlacklist.user.js
// @homepageURL     https://github.com/ParticleCore/Ebony
// @supportURL      https://github.com/ParticleCore/Ebony/wiki
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UMVQJJFG4BFHW
// @grant           GM_getValue
// @grant           GM_setValue
// @noframes
// ==/UserScript==
(function () {
    "use strict";
    function inject(is_userscript) {

        function iterator2(main, list, tags) {
            var i;
            var del;
            var obj;
            var prop;
            var browseId;
            var different;
            var canonicalBaseUrl;

            if (main instanceof Array) {
                for (i = 0; i < main.length; i++) {
                    del = iterator2(main[i], list, tags);
                    
                    if (del === true) {
                        main.splice(i--, 1);
                    }
                }
            } else {
                for (prop in main) {
                    if (tags.indexOf(prop) > -1) {
                        obj = JSON.stringify(main);
                        browseId = obj && obj.match(/browseId":"([a-z0-9-_]{24})"/i);
                        canonicalBaseUrl = obj && obj.match(/canonicalBaseUrl":"([a-z0-9-_/]+)"/i);

                        if (prop === "shelfRenderer") {
                            console.log(main, obj && obj.match(/browseId":"([a-z0-9-_]{24})"/i));

                            if (!browseId) {
                                return true;
                            }
                        } else if (prop === "itemSectionRenderer") {

                            if (window.location.pathname !== "/results" && browseId && browseId[1] in list) {
                                browseId = obj && obj.match(/browseId":"([a-z0-9-_]{24})"/ig);
                                different = false;

                                for (i = 0; i < browseId.length; i++) {
                                    if (browseId[i] !== browseId[0]) {
                                        different = true;
                                        break;
                                    }
                                }

                                if (!different) {
                                    return true;
                                }

                                console.log(main, browseId);
                            }
                        } else {

                            if (browseId && browseId[1] in list) {
                                console.log(browseId[1], canonicalBaseUrl && canonicalBaseUrl[1]);
                                return true;
                            } else {
                                break;
                            }

                        }
                    } else if (main[prop] instanceof Object || main[prop] instanceof Array) {
                        iterator2(main[prop], list, tags);
                    }
                }
            }
        }

        function iterator(obj, stack) {
            var i, j, k, temp, tags, match, found, property;
            tags = [
                "channelRenderer",
                "playlistRenderer",
                "radioRenderer",
                "showRenderer",
                "videoRenderer",
                "shelfRenderer",
                "gridChannelRenderer",
                "gridMoviePlaylistRenderer",
                "gridMovieRenderer",
                "gridPlaylistRenderer",
                "gridRadioRenderer",
                "gridShowRenderer",
                "gridVideoRenderer"
            ];
            if (Array.isArray(obj)) {
            // if (obj.constructor === Array) {
                for (i = 0; i < obj.length; i++) {
                    if (typeof obj[i] == "object") {
                        if (obj[i].itemSectionRenderer) {
                            temp = obj[i].itemSectionRenderer && obj[i].itemSectionRenderer.contents && obj[i].itemSectionRenderer.contents[0].shelfRenderer && obj[i].itemSectionRenderer.contents[0].shelfRenderer.endpoint;
                            if (temp && blocked_channels[temp.browseEndpoint.browseId]) {
                                obj.splice(i--, 1);
                            } else {
                                iterator(obj[i], stack + '[' + i + ']');
                                //if (window.location.pathname === "/" && empty === 0) {
                                if (!obj[i].itemSectionRenderer.continuations && empty === 0) {
                                    obj.splice(i--, 1);
                                }
                                empty = null;
                            }
                        } else {
                            for (j = 0; j < tags.length; j++) {
                                if (obj[i][tags[j]]) {
                                    temp = obj[i][tags[j]].shortBylineText || obj[i][tags[j]].longBylineText;
                                    temp = temp && temp.runs && temp.runs[0];
                                    temp = temp && (temp.navigationEndpoint && temp.navigationEndpoint.browseEndpoint && temp.navigationEndpoint.browseEndpoint.browseId || temp.text);
                                    if (tags[j] === "shelfRenderer") {
                                        temp = obj[i][tags[j]].content;
                                        temp = temp && temp.verticalListRenderer;
                                        temp = temp && temp.items;
                                        if (temp) {
                                            for (k = 0; k < temp.length; k++) {
                                                match = JSON.stringify(temp[i]);
                                                match = match && match.match(/browseId":"([a-zA-Z0-9-_]{24})"/i);
                                                if (match && match[1] && blocked_channels[match[1]]) {
                                                    temp.splice(k--, 1);
                                                }
                                            }
                                            if (temp.length === 0) {
                                                console.log("iterator", obj[i]);
                                                obj.splice(i--, 1);
                                            }
                                        }
                                    } else if (temp && blocked_channels[temp]) {
                                        obj.splice(i--, 1);
                                        empty = obj.length;
                                    } else {
                                        iterator(obj[i], stack + '[' + i + ']');
                                    }
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                found = false;
                                iterator(obj[i], stack + '[' + i + ']');
                            }
                        }
                    }
                }
            } else {
                for (property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        if (typeof obj[property] == "object") {
                            iterator(obj[property], stack + '.' + property);
                        }
                    }
                }
            }
        }
        function checkParse(original) {
            return function(text, reviver) {
                var temp = original.apply(this, arguments);
                // iterator(temp, "temp");
                iterator2(temp, blocked_channels, tags_section);
                iterator2(temp, blocked_channels, tags);
                iterator2(temp, blocked_channels, tags_shelf);
                return temp;
            };
        }
        function getEmptyContainers() {
            var i, temp, container;
            container = document.querySelectorAll(container_nodes);
            for (i = 0; i < container.length; i++) {
                if (ignore.containers.indexOf(container[i]) < 0) {
                    shelf = container[i].querySelector("yt-horizontal-list-renderer");
                    if (shelf && (shelf.hasAttribute("at-start") || shelf.hasAttribute("at-end"))) {
                        shelf.fillRemainingListItems();
                    }
                    temp = container[i].querySelector(video_nodes);
                    if (!temp) {
                        container[i].outerHTML = "";
                    } else {
                        ignore.containers.push(container[i]);
                    }
                }
            }
            window.dispatchEvent(new Event("resize"));
            console.log("getEmptyContainers");
        }
        function getContainers() {
            var i, temp, ucid, container;
            container = document.querySelectorAll(container_nodes);
            //console.info(container);
            for (i = 0; i < container.length; i++) {
                temp = container[i].data;
                temp = temp && temp.contents && temp.contents[0];
                temp = temp && temp.shelfRenderer;
                if (temp && temp.endpoint && temp.endpoint.browseEndpoint) {
                    ucid = temp.endpoint.browseEndpoint.browseId;
                    if (blocked_channels[ucid]) {
                        //console.log(ucid);
                        container[i].outerHTML = "";
                    }
                }
            }
            console.log("getContainers");
        }
        function getVideos(nodes) {
            var i, temp, text, ucid, child, parent, videos, button, remove, up_next;
            remove = [];
            up_next = document.querySelector(
                ".autoplay-bar," +
                "ytd-compact-autoplay-renderer" // material
            );
            videos = nodes || document.querySelectorAll(video_nodes);
            for (i = 0; i < videos.length; i++) {
                if (ignore.videos.indexOf(videos[i]) < 0) {
                    if (videos[i].data) { // material
                        temp = videos[i];
                    } else {
                        temp = videos[i].querySelector(
                            ".content-wrapper [data-ytid]," +
                            ".yt-lockup-content [data-ytid]"
                        );
                    }
                    if (temp) {
                        if (temp.data) {
                            ucid = temp.data.longBylineText || temp.data.shortBylineText;
                            ucid = ucid && ucid.runs[0];
                            text = ucid && ucid.text;
                            if (ucid) {
                                if (ucid.navigationEndpoint) {
                                    ucid = ucid.navigationEndpoint.browseEndpoint.browseId;
                                } else {
                                    ucid = "YouTube";
                                }
                            }
                        } else if (temp.dataset && temp.dataset.ytid) {
                            ucid = temp.dataset.ytid;
                        }
                    } else {
                        ucid = "YouTube";
                    }
                    if (ucid) {
                        if (blocked_channels[ucid]) {
                            if (up_next && up_next.contains(videos[i])) {
                                if (up_next.tagName === "YTD-COMPACT-AUTOPLAY-RENDERER") {
                                    up_next.outerHTML = "";
                                } else {
                                    up_next.parentNode.outerHTML = "";
                                    up_next = document.querySelector(".watch-sidebar-separation-line");
                                    if (up_next) {
                                        up_next.outerHTML = "";
                                    }
                                }
                            } else {
                                remove.push(videos[i]);
                            }
                        } else {
                            ignore.videos.push(videos[i]);
                        }
                    }
                }
            }
            if (remove.length) {
                //console.info(remove);
                for (i = 0; i < remove.length; i++) {
                    child = remove[i];
                    for (;child;) {
                        parent = child.parentNode;
                        if (parent.childElementCount > 1 || parent.id === "contents" || parent.id === "items") {
                            child.outerHTML = "";
                            break;
                        }
                        child = parent;
                    }
                }
                if (globals.hasContainers) {
                    ignore.containers = [];
                } else {
                    window.dispatchEvent(new Event("resize"));
                }
            }
            console.log("getVideos");
        }
        function blacklist(event, observer) {
            var i;
            //console.log(event && event.type);
            if (!/^\/($|feed\/(?!subscriptions)|watch|results|shared)/.test(window.location.pathname)) {
                return;
            }
            if (!ignore || !event || event.type === "spfdone" || event.type === "yt-navigate-finish") {
                ignore = {
                    videos: [],
                    containers: []
                };
                globals = {
                    hasContainers: window.location.pathname === "/" || window.location.pathname === "/results"
                };
                window.c = ignore;
            }
            if (globals.hasContainers) {
                getContainers();
            }
            getVideos();
            if (globals.hasContainers) {
                getEmptyContainers();
            }
            console.log("blacklist");
        }
        function addToBlacklist(event) {
            var ucid, brand, parent, base_url;
            if (event.target.tagName === "BYTV") {
                event.preventDefault();
                parent = event.target.parentNode;
                for (;parent;) {
                    if (tag_list.indexOf(parent.tagName) > -1) {
                        if (parent.data) {
                            ucid = parent.data.longBylineText || parent.data.shortBylineText;
                            ucid = ucid.runs[0];
                            brand = ucid.text;
                            if (ucid.navigationEndpoint) {
                                base_url = ucid.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
                                ucid = ucid.navigationEndpoint.browseEndpoint.browseId;
                            } else {
                                ucid = "YouTube";
                                base_url = "/user/youtube";
                            }
                        }
                        break;
                    }
                    parent = parent.parentNode;
                }
                if (ucid && brand) {
                    blocked_channels[ucid] = brand;
                    if (base_url) {
                        blocked_channels_canonical[base_url] = brand;
                    }
                    blacklist();
                }
            }
            console.log("addToBlacklist");
        }
        function interceptImportNode(original) {
            var node;

            node = document.createElement("bytv");
            node.title = "Add to blacklist";
            node.className = "bytc-add-to-blacklist";
            node.innerHTML = //
                "<svg viewBox='0 0 24 24'>" +
                "    <polygon points='24,2.1 21.9,0 12,9.9 2.1,0 0,2.1 9.9,12 0,21.9 2.1,24 12,14.1 21.9,24 24,21.9 14.1,12'/>" +
                "</svg>";

            return function(externalNode, deep) {
                var temp = externalNode.querySelector("*");

                if (temp && (temp.id === "thumbnail" || temp.id === "img")) {
                    if (!temp.parentNode.querySelector(".bytc-add-to-blacklist")) {
                        if (temp.id === "img") {
                            temp.parentNode.appendChild(node.cloneNode(true));
                        } else {
                            temp.appendChild(node.cloneNode(true));
                        }
                    }
                }

                return original.apply(this, arguments);
            };
        }
        function ini(event, polymer) {
            var i, j, temp, node, main_doc;
            /*if (document.readyState !== "interactive") {
                return;
            }*/
            console.log("ini", document.readyState, window.ytInitialData);
            // iterator(window.ytInitialData, "ytInitialData");
            /*if (!(main_doc = polymer)) {
                main_doc = document;
            } else {
                main_doc = main_doc.import.documentElement;
            }
            console.log(1, main_doc, main_doc.querySelectorAll(
                "#ytd-thumbnail template," +
                "#ytd-channel-renderer template," +
                "#ytd-playlist-thumbnail template"
            ));
            if (main_doc) {
                node = document.createElement("bytv");
                node.title = "Add to blacklist";
                node.className = "bytc-add-to-blacklist";
                node.innerHTML = //
                    "<svg viewBox='0 0 24 24'>" +
                    "    <polygon points='24,2.1 21.9,0 12,9.9 2.1,0 0,2.1 9.9,12 0,21.9 2.1,24 12,14.1 21.9,24 24,21.9 14.1,12'/>" +
                    "</svg>";
                temp = main_doc.querySelectorAll(
                    "#ytd-thumbnail template," +
                    "#ytd-channel-renderer template," +
                    "#ytd-playlist-thumbnail template"
                );
                i = temp.length;
                while (i--) {
                    j = temp[i].content.querySelector(
                        "#avatar," +
                        "#thumbnail"
                    );
                    if (j) {
                        j.appendChild(node.cloneNode(true));
                    }
                }
                iterator(window.ytInitialData, "ytInitialData");
            }*/
        }

        var empty, ignore, globals, tag_list, video_nodes, container_nodes, blocked_channels, blocked_channels_canonical;

        tag_list = [
            "YTD-COMPACT-LINK-RENDERER",
            "YTD-COMPACT-PLAYLIST-RENDERER",
            "YTD-COMPACT-PROMOTED-VIDEO-RENDERER",
            "YTD-COMPACT-RADIO-RENDERER",
            "YTD-COMPACT-VIDEO-RENDERER",
            "YTD-GRID-CHANNEL-RENDERER",
            "YTD-GRID-MOVIE-PLAYLIST-RENDERER",
            "YTD-GRID-MOVIE-RENDERER",
            "YTD-GRID-PLAYLIST-RENDERER",
            "YTD-GRID-RADIO-RENDERER",
            "YTD-GRID-RENDERER",
            "YTD-GRID-SHOW-RENDERER",
            "YTD-GRID-VIDEO-RENDERER",
            "YTD-CHANNEL-RENDERER",
            "YTD-MOVIE-RENDERER",
            "YTD-PLAYLIST-RENDERER",
            "YTD-RADIO-RENDERER",
            "YTD-SHOW-RENDERER",
            "YTD-VIDEO-RENDERER"
        ];

        var tags_section = [
            "itemSectionRenderer"
        ];

        var tags = [
            "channelRenderer",
            "playlistRenderer",
            "radioRenderer",
            "showRenderer",
            "videoRenderer",
            "gridChannelRenderer",
            "gridMoviePlaylistRenderer",
            "gridMovieRenderer",
            "gridPlaylistRenderer",
            "gridRadioRenderer",
            "gridShowRenderer",
            "gridVideoRenderer"
        ];

        var tags_shelf = [
            "shelfRenderer"
        ];

        video_nodes = tag_list.join(",");

        container_nodes = [
            "#contents ytd-item-section-renderer",
            "#contents ytd-shelf-renderer"
        ].join(",");

        blocked_channels = {
        };

        blocked_channels_canonical = {};

        window.b = blocked_channels;
        window.b_c = blocked_channels_canonical;

        JSON.parse = checkParse(JSON.parse);

        /*window.ytInitialData = {};

        window.ytInitialData.set = function(data) {
            this._data = this.data;
            iterator(this._data, "data");
        };
        window.ytInitialData.get = function() {
            return this._data;
        };*/

        /*window.ytInitialData = {
            set: function(data) {
                console.log(99, data);
                this._data = {};
                // this._data = this.data;
            },
            get: function() {
                return this._data;
            }
        };*/

        /*window.ytInitialData = {};

        Object.defineProperty(window, "ytInitialData", {
            get: function() {
                // return this._data;
                return this._data;
            },
            set: function(data) {
                // this._data = {};
                // this._data = this.data;
                this._data = this.data;
                iterator(this._data, "data");
            }
        });*/

        /*function detourLoadDataHook(original) {
            return function(endpoint, data) {
                var args = arguments;
                iterator(args, "args");
                return original.apply(this, args);
            };
        }*/

        Object.defineProperty(Window.prototype, "ytInitialData",{
            set: function(data){
                console.log("property", data);
                this._data = data;
                // iterator(this._data, "_data");
                iterator2(this._data, blocked_channels, tags_section);
                iterator2(this._data, blocked_channels, tags);
                iterator2(this._data, blocked_channels, tags_shelf);
            },
            get: function(){
                return this._data;
            }
        });

        /*function detourLoadData(original) {
            return function(endpoint, data) {
                // console.log("detourLoadData", endpoint, data);
                // iterator(data, "data");
                return original.apply(this, arguments);
            };
        }*/

        document.addEventListener("click", addToBlacklist, true);
        /*document.addEventListener("load", function listener(event) {
            // the script can run a bit late some times, best to patch both load methods
            if (!listener.app) {
                listener.app = document.querySelector("ytd-app");
            }
            if (listener.app && listener.app.loadData) {
                listener.app.loadData = detourLoadData(listener.app.loadData);
                document.removeEventListener("load", listener, true);
                console.info("hooked", document.readyState);
            }
        }, true);*/
        // document.addEventListener("readystatechange", ini);
        //document.addEventListener("readystatechange", blacklist);
        //document.addEventListener("spfdone", blacklist);
        //yt-visibility-updated
        //document.addEventListener("yt-navigate-finish", blacklist); // material
        //document.addEventListener("yt-page-data-fetched", blacklist); // material

        // HTMLDocument.prototype.querySelector = test(HTMLDocument.prototype.querySelector);
        // HTMLDocument.prototype.querySelectorAll = test(HTMLDocument.prototype.querySelectorAll);
        HTMLDocument.prototype.importNode = interceptImportNode(HTMLDocument.prototype.importNode);

    }
    function contentScriptMessages() {
        var key1, key2, gate, sets, locs, observer;
        key1 = "ebonysend";
        key2 = "getlocale";
        gate = document.documentElement;
        sets = gate.dataset[key1] || null;
        locs = gate.dataset[key2] || null;
        if (!gate.contentscript) {
            gate.contentscript = true;
            observer = new MutationObserver(contentScriptMessages);
            return observer.observe(gate, {
                attributes: true,
                attributeFilter: ["data-" + key1, "data-" + key2]
            });
        }
        if (sets) {
            if (ebony.is_userscript) {
                ebony.GM_setValue(ebony.id, sets);
            } else {
                chrome.storage.local.set({ebonySettings: JSON.parse(sets)});
            }
            document.documentElement.removeAttribute("data-ebonysend");
        } else if (locs) {
            document.documentElement.dataset.setlocale = chrome.i18n.getMessage(locs);
        }
    }
    function filterChromeKeys(keys) {
        if (keys[ebony.id] && keys[ebony.id].new_value) {
            document.documentElement.dataset.ebonyreceive = JSON.stringify(
                (keys[ebony.id].new_value && keys[ebony.id].new_value[ebony.id]) || keys[ebony.id].new_value || {}
            );
        }
    }
    function main(event) {
        var holder;
        if (!event && ebony.is_userscript) {
            event = JSON.parse(ebony.GM_getValue(ebony.id, "{}"));
        }
        if (event) {
            event = JSON.stringify(event[ebony.id] || event);
            document.documentElement.dataset.user_settings = event;
            /*if (ebony.is_userscript) {
                holder = document.createElement("link");
                holder.rel = "stylesheet";
                holder.type = "text/css";
                holder.href = "https://particlecore.github.io/Ebony/stylesheets/YouTubeBlacklist.css";
                document.documentElement.appendChild(holder);
            }*/
            holder = document.createElement("style");
            holder.textContent = //
`.bytc-add-to-blacklist {
    background-color: #000;
    border-radius: 2px;
    color: #fff;
    cursor: pointer;
    height: 0;
    left: 0;
    margin: 4px;
    opacity: 0;
    padding: 14px;
    position: absolute;
    top: 0;
    transition: opacity .3s;
    width: 0;
    z-index: 1;
}
#avatar:not(:hover) .bytc-add-to-blacklist,
#thumbnail:not(:hover) .bytc-add-to-blacklist,
.ytd-thumbnail-0:not(:hover) .bytc-add-to-blacklist,
.ytd-playlist-thumbnail-0:not(:hover) .bytc-add-to-blacklist {
    user-select: none;
}
#avatar:hover .bytc-add-to-blacklist,
#thumbnail:hover .bytc-add-to-blacklist,
.ytd-thumbnail-0:hover .bytc-add-to-blacklist,
.ytd-playlist-thumbnail-0:hover .bytc-add-to-blacklist {
    opacity: .8;
}
.bytc-add-to-blacklist svg {
    fill: #fff;
    pointer-events: none;
    transform: translate(-50%, -50%);
    width: 16px;
}
#avatar,
#thumbnail {
    position: relative;
}
#avatar .bytc-add-to-blacklist {
    /*top: 32px*/
}
yt-img-shadow.ytd-channel-renderer {
    border-radius: 0;
    position: relative;
}
yt-img-shadow:not(.ytd-channel-renderer) .bytc-add-to-blacklist {
    display: none;
}`;
            document.documentElement.appendChild(holder);
            holder = document.createElement("script");
            holder.textContent = "(" + inject + "(" + ebony.is_userscript + "))";
            document.documentElement.appendChild(holder);
            holder.remove();
            if (!ebony.is_userscript) {
                chrome.storage.onChanged.addListener(filterChromeKeys);
            }
        }
    }
    var ebony = {
        id: "ebonySettings",
        is_userscript: typeof GM_info === "object"
    };
    if (ebony.is_userscript) {
        ebony.GM_getValue = GM_getValue;
        ebony.GM_setValue = GM_setValue;
        main();
    } else {
        chrome.storage.local.get(ebony.id, main);
    }
    contentScriptMessages();
}());

// reaction channels list
// buzzfeed channels list

// include verified tick in blacklist lists
// material "dom-change" "yt-page-data-updated" "yt-page-data-fetched" "viewport-load" event? this.fire('yt-load-next-continuation', this.getContinuationUrl.bind(this))

// whitelist mode - blocks all channels except the ones added to the whitelist

/*
list structure
lista = {
    UCID: [
        channel_brand, :: string  :: default brand :: /channel/UCID .branded-page-header-title-link
        username,      :: string  :: default empty :: /user/name
        avatar,        :: string  :: default empty :: channel image url
        disabled       :: boolean :: default false :: block ads on this channel
    ]
};
*/

/*
"<svg viewBox='0 0 24 24'>" +
"    <polygon points='24,2.1 21.9,0 12,9.9 2.1,0 0,2.1 9.9,12 0,21.9 2.1,24 12,14.1 21.9,24 24,21.9 14.1,12'/>" +
"</svg>";
"<svg class='bytc-add-to-blacklist-icon' viewBox='0 0 24 24'>" +
"    <polygon points='24,1.4 22.6,0 12,10.6 1.4,0 0,1.4 10.6,12 0,22.6 1.4,24 12,13.4 22.6,24 24,22.6 13.4,12'/>" +
"</svg>";
"<svg class='bytc-add-to-blacklist-icon' viewBox='0 0 24 24'>" +
"    <polygon points='24,2.8 21.2,0 12,9.2 2.8,0 0,2.8 9.2,12 0,21.2 2.8,24 12,14.8 21.2,24 24,21.2 14.8,12'/>" +
"</svg>";
*/