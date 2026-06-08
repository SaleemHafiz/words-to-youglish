// ==UserScript==
// @name         YouGlish Sidebar - FIA Vocabulary
// @namespace    https://github.com/SaleemHafiz/words-to-youglish
// @version      1.1
// @description  Right sidebar with FIA vocabulary words. Click a word to open on YouGlish.
// @author       SaleemHafiz
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const SIDEBAR_W = 260;
    const DATA_URL = 'https://raw.githubusercontent.com/SaleemHafiz/words-to-youglish/main/words-data.json';
    const STORAGE_KEY = 'youglish_sidebar_history';

    // ---- inject styles ----
    GM_addStyle(`
        #yg-sidebar {
            position: fixed;
            top: 0;
            right: 0;
            width: ${SIDEBAR_W}px;
            height: 100vh;
            background: #1e1e2e;
            color: #cdd6f4;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 14px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            box-shadow: -2px 0 12px rgba(0,0,0,0.4);
        }
        #yg-sidebar * {
            box-sizing: border-box;
        }

        #yg-sidebar .yg-header {
            padding: 12px 14px;
            font-weight: 700;
            font-size: 15px;
            background: #181825;
            border-bottom: 1px solid #313244;
        }

        #yg-sidebar .yg-search {
            padding: 8px 14px;
            border-bottom: 1px solid #313244;
        }
        #yg-sidebar .yg-search input {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid #45475a;
            border-radius: 6px;
            background: #313244;
            color: #cdd6f4;
            font-size: 13px;
            outline: none;
        }
        #yg-sidebar .yg-search input::placeholder { color: #6c7086; }
        #yg-sidebar .yg-search input:focus { border-color: #89b4fa; }

        #yg-sidebar .yg-list {
            flex: 1;
            overflow-y: auto;
            padding: 6px 0;
        }
        #yg-sidebar .yg-list::-webkit-scrollbar { width: 5px; }
        #yg-sidebar .yg-list::-webkit-scrollbar-track { background: transparent; }
        #yg-sidebar .yg-list::-webkit-scrollbar-thumb { background: #45475a; border-radius: 4px; }

        #yg-sidebar .yg-word {
            padding: 7px 14px;
            cursor: pointer;
            transition: background 0.15s;
            user-select: none;
            border-left: 3px solid transparent;
        }
        #yg-sidebar .yg-word:hover { background: #313244; }
        #yg-sidebar .yg-word.prominent {
            background: #2a2820;
            border-left-color: #f9e2af;
            font-weight: 700;
            color: #f9e2af;
        }
        #yg-sidebar .yg-word.medium {
            border-left-color: #89b4fa;
            color: #89b4fa;
        }
        #yg-sidebar .yg-word.subtle {
            border-left-color: #cba6f7;
            color: #cba6f7;
        }

        #yg-sidebar .yg-info {
            padding: 12px 14px;
            border-top: 1px solid #313244;
            background: #181825;
            font-size: 13px;
            line-height: 1.6;
            min-height: 80px;
        }
        #yg-sidebar .yg-info .yg-label { color: #6c7086; margin-right: 4px; }
        #yg-sidebar .yg-info .yg-val { color: #cdd6f4; }
        #yg-sidebar .yg-info .yg-empty { color: #585b70; font-style: italic; }
    `);

    // ---- push page content left ----
    document.documentElement.style.marginRight = SIDEBAR_W + 'px';

    // ---- build sidebar ----
    const sidebar = document.createElement('div');
    sidebar.id = 'yg-sidebar';
    sidebar.innerHTML = `
        <div class="yg-header">FIA Vocabulary</div>
        <div class="yg-search"><input type="text" placeholder="Search words..." id="yg-search-input"></div>
        <div class="yg-list" id="yg-word-list"></div>
        <div class="yg-info" id="yg-info">
            <div class="yg-empty">Click a word to see details</div>
        </div>
    `;
    document.body.appendChild(sidebar);

    // ---- fetch data ----
    let wordsData = {};

    GM_xmlhttpRequest({
        method: 'GET',
        url: DATA_URL,
        onload: function(res) {
            try {
                wordsData = JSON.parse(res.responseText);
                renderList(Object.keys(wordsData));
                applyHistory();
            } catch(e) {
                sidebar.querySelector('.yg-list').innerHTML = '<div class="yg-word" style="cursor:default;color:#f38ba8;">Failed to load data</div>';
            }
        },
        onerror: function() {
            sidebar.querySelector('.yg-list').innerHTML = '<div class="yg-word" style="cursor:default;color:#f38ba8;">Failed to load data</div>';
        }
    });

    // ---- render ----
    function renderList(words) {
        const list = document.getElementById('yg-word-list');
        list.innerHTML = '';
        words.forEach(w => {
            const div = document.createElement('div');
            div.className = 'yg-word';
            div.textContent = w;
            div.dataset.word = w;

            div.onclick = function(e) {
                e.stopPropagation();
                const word = this.dataset.word;
                showInfo(word);
                saveHistory(word);
                window.location.href = 'https://youglish.com/pronounce/' + encodeURIComponent(word) + '/english';
            };

            list.appendChild(div);
        });
    }

    // ---- search filter ----
    document.getElementById('yg-search-input').addEventListener('input', function() {
        const q = this.value.toLowerCase();
        const all = Object.keys(wordsData);
        const filtered = q ? all.filter(w => w.toLowerCase().includes(q)) : all;
        renderList(filtered);
        applyHistory();
    });

    // ---- info display ----
    function showInfo(word) {
        const d = wordsData[word];
        if (!d) return;
        document.getElementById('yg-info').innerHTML = `
            <div><span class="yg-label">Synonym:</span> <span class="yg-val">${d.synonym}</span></div>
            <div><span class="yg-label">Antonym:</span> <span class="yg-val">${d.antonym}</span></div>
            <div><span class="yg-label">Urdu:</span> <span class="yg-val">${d.urdu}</span></div>
        `;
    }

    // ---- history ----
    function getHistory() {
        try { return GM_getValue(STORAGE_KEY, []); }
        catch { return []; }
    }

    function saveHistory(word) {
        let h = getHistory();
        h = h.filter(w => w !== word);
        h.push(word);
        if (h.length > 3) h.shift();
        GM_setValue(STORAGE_KEY, h);
        applyHistory();
    }

    function applyHistory() {
        document.querySelectorAll('#yg-word-list .yg-word').forEach(el => {
            el.classList.remove('prominent', 'medium', 'subtle');
        });
        const h = getHistory();
        const classes = ['subtle', 'medium', 'prominent'];
        h.forEach((word, i) => {
            const el = document.querySelector(`#yg-word-list .yg-word[data-word="${word}"]`);
            if (el) el.classList.add(classes[i]);
        });
    }

})();
