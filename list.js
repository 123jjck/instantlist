/*
    InstantList JS
        by Jjck
            2026
*/

const INSTANTLIST_LAST_UPDATE = '202608251240';

function formatLastUpdateDate(dateString) {
    if (!dateString || dateString.length !== 12) {
        return null;
    }
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    return `${day}.${month}.${year} в ${hour}:${minute}`;
}

class CookieManager {
    static get(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(';').shift();
            try {
                return decodeURIComponent(cookieValue);
            } catch (e) {
                return cookieValue;
            }
        }
        return null;
    }

    static set(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    static delete(name) {
        this.set(name, '', -1);
    }
}

class StringNormalizer {
    static normalize(str) {
        return str.toLowerCase().replace(/ё/g, 'е').replace(/'/g, "").replace(/"/g, '').trim();
    }

    static normalizeKeepQuotes(str) {
        return str.toLowerCase().replace(/ё/g, 'е').trim();
    }
}

class SettingsManager {
    constructor() {
        this.columnSettings = this.getDefaultColumnSettings();
        this.generalSettings = this.getDefaultGeneralSettings();
    }

    getDefaultColumnSettings() {
        return {
            colType: true,
            colPreview: true,
            colSwf: true,
            colPublishDate: true,
            colTags: false,
            colUsualTickets: false,
            colMagicTickets: false
        };
    }

    getDefaultGeneralSettings() {
        return {
            itemsPerPage: 25,
            showOnlyStoreItems: false,
            theme: 'system'
        };
    }

    loadFromCookies() {
        const columnSettings = CookieManager.get('columnSettings');
        const generalSettings = CookieManager.get('generalSettings');

        if (columnSettings) {
            try {
                this.columnSettings = JSON.parse(columnSettings);
            } catch (e) {
                console.warn('Ошибка при загрузке настроек столбцов:', e);
            }
        }

        if (generalSettings) {
            try {
                this.generalSettings = JSON.parse(generalSettings);
            } catch (e) {
                console.warn('Ошибка при загрузке общих настроек:', e);
            }
        }

        this.applyTheme();
        this.setupThemeListener();

        return this;
    }

    setupThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.generalSettings.theme === 'system') {
                this.applyTheme();
            }
        });
    }

    saveToCookies() {
        CookieManager.set('columnSettings', JSON.stringify(this.columnSettings));
        CookieManager.set('generalSettings', JSON.stringify(this.generalSettings));
    }

    reset() {
        this.columnSettings = this.getDefaultColumnSettings();
        this.generalSettings = this.getDefaultGeneralSettings();
        CookieManager.delete('columnSettings');
        CookieManager.delete('generalSettings');
    }

    updateFromDOM() {
        this.columnSettings = {
            colType: document.getElementById('colType').checked,
            colPreview: document.getElementById('colPreview').checked,
            colSwf: document.getElementById('colSwf').checked,
            colPublishDate: document.getElementById('colPublishDate').checked,
            colTags: document.getElementById('colTags').checked,
            colUsualTickets: document.getElementById('colUsualTickets').checked,
            colMagicTickets: document.getElementById('colMagicTickets').checked
        };

        const themeSelect = document.getElementById('themeSelect');
        this.generalSettings = {
            itemsPerPage: parseInt(document.getElementById('itemsPerPageSelect').value),
            showOnlyStoreItems: document.getElementById('showOnlyStoreItems').checked,
            theme: themeSelect ? themeSelect.value : 'system'
        };
    }

    applyToDOM() {
        const colTypeEl = document.getElementById('colType');
        const colPreviewEl = document.getElementById('colPreview');
        const colSwfEl = document.getElementById('colSwf');
        const colPublishDateEl = document.getElementById('colPublishDate');
        const colTagsEl = document.getElementById('colTags');
        const colUsualTicketsEl = document.getElementById('colUsualTickets');
        const colMagicTicketsEl = document.getElementById('colMagicTickets');
        const itemsPerPageEl = document.getElementById('itemsPerPageSelect');
        const showOnlyStoreItemsEl = document.getElementById('showOnlyStoreItems');

        if (colTypeEl) colTypeEl.checked = this.columnSettings.colType !== false;
        if (colPreviewEl) colPreviewEl.checked = this.columnSettings.colPreview !== false;
        if (colSwfEl) colSwfEl.checked = this.columnSettings.colSwf !== false;
        if (colPublishDateEl) colPublishDateEl.checked = this.columnSettings.colPublishDate !== false;
        if (colTagsEl) colTagsEl.checked = this.columnSettings.colTags !== false;
        if (colUsualTicketsEl) colUsualTicketsEl.checked = this.columnSettings.colUsualTickets !== false;
        if (colMagicTicketsEl) colMagicTicketsEl.checked = this.columnSettings.colMagicTickets !== false;

        if (itemsPerPageEl && this.generalSettings.itemsPerPage) {
            itemsPerPageEl.value = this.generalSettings.itemsPerPage;
        }

        if (showOnlyStoreItemsEl) {
            showOnlyStoreItemsEl.checked = this.generalSettings.showOnlyStoreItems === true;
        }

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect && this.generalSettings.theme) {
            themeSelect.value = this.generalSettings.theme;
        }

        this.applyTheme();
    }

    applyTheme() {
        const theme = this.generalSettings.theme || 'system';
        let effectiveTheme;

        if (theme === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            effectiveTheme = theme;
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }
}

// sashimi UI не приносит с собой JS, поэтому модальные окна — нативный
// <dialog>: showModal() сам даёт фокус-ловушку, ::backdrop и закрытие по Esc.
const Dialogs = {
    open(id) {
        const dialog = document.getElementById(id);
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
        return dialog;
    },

    close(id) {
        const dialog = document.getElementById(id);
        if (dialog && dialog.open) {
            dialog.close();
        }
    },

    // Клик по затемнению приходит на сам <dialog>, а не на его содержимое.
    setup() {
        for (const dialog of document.querySelectorAll('dialog.dialog')) {
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) {
                    dialog.close();
                }
            });
        }
        for (const button of document.querySelectorAll('[data-close-dialog]')) {
            button.addEventListener('click', () => button.closest('dialog').close());
        }
    }
};

const EMPTY_RESULT = `
    <div class="empty">
        <p><strong>К сожалению, мы ничего не нашли.</strong></p>
    </div>`;

const EMPTY_RESULT_FILTERED = `
    <div class="empty">
        <p><strong>К сожалению, мы ничего не нашли.</strong></p>
        <p class="muted">Попробуйте изменить критерии поиска или убрать некоторые фильтры.</p>
    </div>`;

// Единый источник правды по колонкам таблицы: заголовок, ячейка и видимость.
// Колонки с key: null показываются всегда; остальные управляются columnSettings.
const COLUMNS = [
    { key: null, cls: 'col-id', title: 'ID', cell: (item) => item['Id'] },
    { key: null, cls: 'col-name', title: 'Название', cell: (item) => `<a href="./item.html?id=${item['RawId']}" class="link">${item['Name']}</a>` },
    { key: 'colType', cls: 'col-type', title: 'Тип', cell: (item) => item['Type'] },
    { key: 'colPreview', cls: 'col-preview', title: 'Превью', cell: (item, r) => `<img src="${r.domain}/${r.fsPath}/${item['PicUrl']}" alt="" loading="lazy"/>` },
    { key: 'colSwf', cls: 'col-swf', title: 'SWF файл', cell: (item, r) => `<a href="${r.domain}/${r.fsPath}/${item['SwfUrl']}" class="link passive" target="_blank">${item['SwfUrl']}</a>` },
    { key: 'colPublishDate', cls: 'col-publish-date', title: 'Дата добавления', cell: (item) => item['PublishDate'] },
    { key: 'colTags', cls: 'col-tags', title: 'Теги', cell: (item, r) => r.renderTags(item) },
    { key: 'colUsualTickets', cls: 'col-usual-tickets', title: 'Смешинки', cell: (item) => item['UsualTickets'] >= 0 ? item['UsualTickets'] : '—' },
    { key: 'colMagicTickets', cls: 'col-magic-tickets', title: 'Румбики', cell: (item) => item['MagicTickets'] >= 0 ? item['MagicTickets'] : '—' },
];

class ItemRenderer {
    constructor(domain, fsPath, columnSettings) {
        this.domain = domain;
        this.fsPath = fsPath;
        this.columnSettings = columnSettings;
    }

    parseTags(tagsString) {
        return tagsString.split(',').map(tag => tag.trim());
    }

    renderTags(item) {
        if (!item['Tags']) {
            return '—';
        }
        const tags = this.parseTags(item['Tags']).map(tagId => {
            const tagName = tagsMap[tagId.trim()] || tagId.trim();
            return `<span class="tag">${tagName}</span>`;
        }).join('');
        return `<span class="tags">${tags}</span>`;
    }

    render(item) {
        let html = '<tr>';
        for (const col of COLUMNS) {
            if (col.key && !this.columnSettings[col.key]) continue;
            const clsAttr = col.cls ? ` class="${col.cls}"` : '';
            html += `<td${clsAttr}>${col.cell(item, this)}</td>`;
        }
        html += '</tr>';
        return html;
    }
}

class SearchEngine {
    highlightText(text, query) {
        const normalizedText = StringNormalizer.normalizeKeepQuotes(text);
        const normalizedQuery = StringNormalizer.normalize(query);
        const words = normalizedQuery.split(' ').filter(word => word.length > 0);

        // Подсветка работает по позициям, поэтому нужна посимвольная
        // соответствие нормализованного и исходного текста. Если trim сдвинул
        // длину — возвращаем текст как есть, без разметки.
        if (words.length === 0 || normalizedText.length !== text.length) {
            return text;
        }

        // Отмечаем все вхождения каждого слова; пересечения сливаются в один <mark>.
        const marked = new Array(text.length).fill(false);
        for (const word of words) {
            let from = normalizedText.indexOf(word);
            while (from !== -1) {
                for (let i = from; i < from + word.length; i++) {
                    marked[i] = true;
                }
                from = normalizedText.indexOf(word, from + 1);
            }
        }

        let result = '';
        for (let i = 0; i < text.length; i++) {
            if (marked[i] && (i === 0 || !marked[i - 1])) {
                result += '<mark>';
            }
            result += text[i];
            if (marked[i] && (i === text.length - 1 || !marked[i + 1])) {
                result += '</mark>';
            }
        }

        return result;
    }

    search(query, items) {
        const results = [];
        query = query.trim();

        if (query.length < 2 && isNaN(query)) {
            return results;
        }

        const normalizedQuery = StringNormalizer.normalize(query);

        for (let item of items) {
            const normalizedName = StringNormalizer.normalize(item.Name);
            if (normalizedName.indexOf(normalizedQuery) !== -1 || item.Id == query) {
                const itemCopy = Object.assign({}, item);
                itemCopy.Name = this.highlightText(item.Name, query);
                if (item.Id == query) {
                    itemCopy.Id = '<mark>' + itemCopy.Id + '</mark>';
                }
                results.push(itemCopy);
            }
        }

        return results;
    }

    advancedSearch(query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo, items) {
        const results = [];

        for (let item of items) {
            let matches = true;

            if (query) {
                const normalizedQuery = StringNormalizer.normalize(query);
                const normalizedName = StringNormalizer.normalize(item.Name);

                if (exactMatch) {
                    matches = normalizedName === normalizedQuery;
                } else {
                    matches = normalizedName.indexOf(normalizedQuery) !== -1 || item.Id == query;
                }
            }

            if (matches && selectedCategories.length > 0) {
                matches = selectedCategories.includes(item.Type);
            }

            if (matches && selectedTags.length > 0) {
                if (!item.Tags) {
                    matches = false;
                } else {
                    const itemTags = item.Tags.split(',').map(tag => {
                        const tagId = tag.trim();
                        return tagsMap[tagId] || tagId;
                    });

                    matches = selectedTags.some(selectedTag => {
                        return itemTags.some(itemTag =>
                            StringNormalizer.normalize(itemTag).indexOf(StringNormalizer.normalize(selectedTag)) !== -1
                        );
                    });
                }
            }

            if (matches && (dateFrom || dateTo)) {
                const itemDateParts = item.PublishDate.split('.');
                if (itemDateParts.length === 3) {
                    const itemDate = new Date(itemDateParts[2], itemDateParts[1] - 1, itemDateParts[0]);

                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        if (itemDate < fromDate) {
                            matches = false;
                        }
                    }

                    if (dateTo && matches) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (itemDate > toDate) {
                            matches = false;
                        }
                    }
                } else {
                    matches = false;
                }
            }

            if (matches) {
                const itemCopy = Object.assign({}, item);

                if (query && !exactMatch) {
                    itemCopy.Name = this.highlightText(item.Name, query);
                }

                if (query && item.Id == query) {
                    itemCopy.Id = '<mark>' + itemCopy.Id + '</mark>';
                }

                results.push(itemCopy);
            }
        }

        return results;
    }
}

class InstantList {
    constructor(searchInput, resources, config) {
        this.search = searchInput;
        this.config = config;

        this.settingsManager = new SettingsManager().loadFromCookies();
        this.searchEngine = new SearchEngine();

        this.config.itemsPerPage = this.settingsManager.generalSettings.itemsPerPage;

        this.table = new Table(
            document.getElementById(this.config.tableHolderId),
            document.getElementById(this.config.pagesHolderId),
            this.config,
            this.settingsManager
        );

        this.items = this.buildItemsArray(resources[0], resources[1], resources[2], resources[3]);
        this.allItems = [...this.items];

        this.settingsManager.applyToDOM();

        this.initEventListeners();
        this.init();
    }

    initEventListeners() {
        this.search.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                const query = e.target.value.trim();
                if (query) {
                    window.location.hash = `#?q=${encodeURIComponent(query)}`;
                } else {
                    window.location.hash = '#1';
                }
            }
        });
    }

    init() {
        window.onhashchange = this.handleHashChange.bind(this);
        this.handleHashChange();
    }

    goToPage(page = 1) {
        if (page <= 0) page = 1;
        const from = ((page - 1) * this.config.itemsPerPage) + 1;
        const to = page * this.config.itemsPerPage;

        window.scrollTo({ top: 0 });
        this.table.renderTable(this.items, page, from, to);
    }

    handleHashChange() {
        this.applyStoreFilter();

        const hash = window.location.hash;

        if (hash.startsWith('#?')) {
            this.handleSearchWithParams();
            return;
        }

        this.table.setTitle("Вещи");
        this.search.value = '';
        const page = parseInt(hash.replace('#', '')) || 1;
        this.goToPage(page);
    }

    handleSearchWithParams() {
        const paramsString = window.location.hash.replace('#?', '');
        const params = new URLSearchParams(paramsString);

        const query = params.get('q') || '';
        const exactMatch = params.get('exact') === 'true';
        const selectedCategories = params.get('cats') ? params.get('cats').split(',') : [];
        const selectedTags = params.get('tags') ? params.get('tags').split(',') : [];
        const dateFrom = params.get('from') || '';
        const dateTo = params.get('to') || '';

        this.search.value = query;

        const isAdvancedSearch = exactMatch || selectedCategories.length > 0 ||
                                  selectedTags.length > 0 || dateFrom || dateTo;

        if (isAdvancedSearch) {
            const results = this.searchEngine.advancedSearch(
                query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo, this.items
            );
            this.table.renderAdvancedSearchResults(
                results, query, selectedCategories, selectedTags, dateFrom, dateTo
            );
        } else {
            const results = this.searchEngine.search(query, this.items);
            this.table.renderSearchResults(results);
        }
    }

    getItemType(goodTypeId) {
        return goodTypeMap[goodTypeId] || goodTypeId;
    }

    buildItemsArray(t, g, mr, tr) {
        const items = [];
        for (const item of Object.values(g)) {
            if (this.config['layerIds'] !== '*' && !this.config['layerIds'].includes(item['LayerId'])) {
                continue;
            }
            items.push({
                Id: item['Id'],
                // Id может прийти в поиск обёрнутым в <mark>, поэтому для ссылок
                // держим неизменный идентификатор отдельно.
                RawId: item['Id'],
                Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия',
                Type: this.getItemType(item['GoodTypeId']),
                PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '',
                SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined,
                PublishDate: item['PublishDate'] ? new Date(item['PublishDate']).toLocaleDateString('ru-RU') : 'Не указана',
                Tags: item['Tags'],
                UsualTickets: item['UsualTickets'] !== undefined ? item['UsualTickets'] : 0,
                MagicTickets: item['MagicTickets'] !== undefined ? item['MagicTickets'] : 0
            });
        }
        return items;
    }

    applyStoreFilter() {
        const showOnlyStoreItemsEl = document.getElementById('showOnlyStoreItems');
        if (showOnlyStoreItemsEl && showOnlyStoreItemsEl.checked) {
            this.items = this.allItems.filter(item => item.Tags && item.Tags.trim() !== '');
        } else {
            this.items = [...this.allItems];
        }
    }

    applySettings() {
        this.settingsManager.updateFromDOM();
        this.settingsManager.saveToCookies();
        this.settingsManager.applyTheme();

        this.config.itemsPerPage = this.settingsManager.generalSettings.itemsPerPage;
        this.table.updateItemsPerPage(this.config.itemsPerPage);

        this.applyStoreFilter();
        this.handleHashChange();
    }

    resetSettings() {
        this.settingsManager.reset();
        this.settingsManager.applyToDOM();

        this.config.itemsPerPage = this.settingsManager.generalSettings.itemsPerPage;
        this.table.updateItemsPerPage(this.config.itemsPerPage);

        this.items = [...this.allItems];
        this.handleHashChange();
    }

    performAdvancedSearch(query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo) {
        const params = new URLSearchParams();

        if (query) params.set('q', query);
        if (exactMatch) params.set('exact', 'true');
        if (selectedCategories.length > 0) params.set('cats', selectedCategories.join(','));
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);

        const paramsString = params.toString();
        if (paramsString) {
            window.location.hash = `#?${paramsString}`;
        } else {
            window.location.hash = '#1';
        }
    }
}

class Table {
    constructor(tableHolder, pageHolder, config, settingsManager) {
        this.holder = tableHolder;
        this.pageHolder = pageHolder;
        this.titleHolder = document.getElementById('title');
        this.config = config;
        this.settingsManager = settingsManager;
        this.itemRenderer = new ItemRenderer(config.domain, config.fsPath, settingsManager.columnSettings);
    }

    updateItemsPerPage(itemsPerPage) {
        this.config.itemsPerPage = itemsPerPage;
    }

    setTitle(title) {
        this.titleHolder.innerHTML = title;
    }

    getTableHead() {
        const settings = this.settingsManager.columnSettings;
        let head = '<thead><tr>';
        for (const col of COLUMNS) {
            if (col.key && !settings[col.key]) continue;
            const clsAttr = col.cls ? ` class="${col.cls}"` : '';
            head += `<th${clsAttr}>${col.title}</th>`;
        }
        head += '</tr></thead>';
        return head;
    }

    applyColumnVisibility() {
        const settings = this.settingsManager.columnSettings;
        const style = document.getElementById('columnStyles') || document.createElement('style');
        style.id = 'columnStyles';

        let css = '';
        for (const col of COLUMNS) {
            if (col.key && col.cls && !settings[col.key]) {
                css += `.${col.cls} { display: none !important; } `;
            }
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    renderPagination(pagesCount, currentPage) {
        if (pagesCount <= 1) {
            return '';
        }
        let paginationHTML = '<nav aria-label="Страницы"><ul class="pagination">';
        for (let i = 1; i <= pagesCount; i++) {
            if (i === currentPage) {
                paginationHTML += `<li><span class="current" aria-current="page">${i}</span></li>`;
            } else {
                paginationHTML += `<li><a href="#${i}">${i}</a></li>`;
            }
        }
        paginationHTML += '</ul></nav>';
        return paginationHTML;
    }

    buildTableHtml(items) {
        this.itemRenderer.columnSettings = this.settingsManager.columnSettings;

        let html = '<div class="table-wrap"><table class="table">';
        html += this.getTableHead();
        html += '<tbody>';
        for (const item of items) {
            html += this.itemRenderer.render(item);
        }
        html += '</tbody></table></div>';
        return html;
    }

    renderTable(items, page, from, to) {
        this.holder.innerHTML = this.buildTableHtml(items.slice(from - 1, to));
        this.applyColumnVisibility();
        this.pageHolder.innerHTML = this.renderPagination(Math.ceil(items.length / this.config.itemsPerPage), page);
    }

    renderSearchResults(results) {
        const html = results.length === 0
            ? EMPTY_RESULT
            : this.buildTableHtml(results);

        this.pageHolder.innerHTML = '';
        this.setTitle("Результаты поиска");
        this.holder.innerHTML = html;
        this.applyColumnVisibility();
    }

    renderAdvancedSearchResults(results, query, selectedCategories, selectedTags, dateFrom, dateTo) {
        let html;
        if (results.length === 0) {
            html = selectedCategories.length > 0 || selectedTags.length > 0 || dateFrom || dateTo
                ? EMPTY_RESULT_FILTERED
                : EMPTY_RESULT;
        } else {
            html = this.buildTableHtml(results);
        }

        this.pageHolder.innerHTML = '';

        const titleParts = [];
        if (query) titleParts.push(`"${query}"`);
        if (selectedCategories.length > 0) titleParts.push(`категории: ${selectedCategories.join(', ')}`);
        if (selectedTags.length > 0) titleParts.push(`теги: ${selectedTags.join(', ')}`);
        if (dateFrom && dateTo) titleParts.push(`даты: ${dateFrom} - ${dateTo}`);
        else if (dateFrom) titleParts.push(`с даты: ${dateFrom}`);
        else if (dateTo) titleParts.push(`по дату: ${dateTo}`);

        const pluralForm = results.length === 1 ? '' : results.length < 5 ? 'а' : 'ов';
        this.setTitle(`Расширенный поиск${titleParts.length > 0 ? ' — ' + titleParts.join(' | ') : ''} (${results.length} результат${pluralForm})`);
        this.holder.innerHTML = html;
        this.applyColumnVisibility();
    }
}

class SettingsModal {
    constructor(instantList) {
        this.instantList = instantList;
    }

    open() {
        const lastUpdateEl = document.getElementById('lastUpdateInfo');
        if (lastUpdateEl && typeof INSTANTLIST_LAST_UPDATE !== 'undefined') {
            const formattedDate = formatLastUpdateDate(INSTANTLIST_LAST_UPDATE);
            if (formattedDate) {
                lastUpdateEl.textContent = `Последнее обновление: ${formattedDate}`;
            }
        }
        Dialogs.open('settingsModal');
    }

    apply() {
        this.instantList.applySettings();
        this.close();
        this.showNotification('Настройки успешно применены!', 'success');
    }

    // Сброс необратим, поэтому сначала спрашиваем подтверждение.
    reset() {
        Dialogs.open('resetConfirmModal');
    }

    confirmReset() {
        this.instantList.resetSettings();
        Dialogs.close('resetConfirmModal');
        this.close();
        this.showNotification('Настройки успешно сброшены!', 'success');
    }

    close() {
        Dialogs.close('settingsModal');
    }

    showNotification(message, type = 'info') {
        const holder = document.getElementById('toast-holder');
        if (!holder) return;

        const notification = document.createElement('div');
        notification.className = `callout ${type}`;
        notification.innerHTML = `<p></p>`;
        notification.firstChild.textContent = message;

        holder.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }
}

class AdvancedSearchModal {
    constructor(instantList) {
        this.instantList = instantList;
        this.tagsTagify = null;
    }

    open() {
        this.populateTagsSelect();
        this.restoreFromHash();
        Dialogs.open('advancedSearchModal');
    }

    restoreFromHash() {
        const hash = window.location.hash;

        if (!hash.startsWith('#?')) {
            return;
        }

        const paramsString = hash.replace('#?', '');
        const params = new URLSearchParams(paramsString);

        const query = params.get('q') || '';
        if (query) {
            document.getElementById('advancedSearchQuery').value = query;
        }

        const exactMatch = params.get('exact') === 'true';
        document.getElementById('exactMatchSearch').checked = exactMatch;

        const categories = params.get('cats') ? params.get('cats').split(',') : [];
        categories.forEach(cat => {
            const checkbox = Array.from(document.querySelectorAll('#advancedSearchModal input[type="checkbox"][id^="cat_"]'))
                .find(cb => cb.value === cat);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        const tags = params.get('tags') ? params.get('tags').split(',') : [];
        if (tags.length > 0 && this.tagsTagify) {
            this.tagsTagify.addTags(tags);
        }

        const dateFrom = params.get('from') || '';
        const dateTo = params.get('to') || '';
        if (dateFrom) {
            document.getElementById('dateFrom').value = dateFrom;
        }
        if (dateTo) {
            document.getElementById('dateTo').value = dateTo;
        }
    }

    populateTagsSelect() {
        const tagsInput = document.getElementById('tags');

        if (this.tagsTagify) {
            this.tagsTagify.destroy();
        }

        const whitelist = Object.entries(tagsMap).map(([tagId, tagValue]) => ({
            value: tagValue,
            id: tagId,
            label: `${tagValue} (${tagId})`
        }));

        this.tagsTagify = new Tagify(tagsInput, {
            whitelist: whitelist,
            enforceWhitelist: true,
            editTags: false,
            dropdown: {
                maxItems: 20,
                enabled: 0,
                closeOnSelect: false,
                searchKeys: ['value', 'id', 'label']
            },
            templates: {
                // Без переносов строк: у пунктов выпадашки white-space:pre-wrap,
                // и отступы шаблона превращаются в пустые строки внутри пункта.
                dropdownItem: function(item) {
                    const cls = `${this.settings.classNames.dropdownItem} ${item.class ? item.class : ""}`;
                    return `<div ${this.getAttributes(item)} class='${cls}' tabindex="0" role="option">${item.label || item.value}</div>`;
                }
            }
        });

        // По умолчанию Tagify вешает выпадашку на document.body и считает её
        // координаты как документные. Внутри модального <dialog> это не
        // работает дважды: содержимое вне диалога инертно и лежит под
        // затемнением, а точка отсчёта у диалога своя. Поэтому переносим
        // выпадашку в саму обёртку поля, а позицию задаём в CSS.
        this.tagsTagify.settings.dropdown.appendTarget = this.tagsTagify.DOM.scope;

        // Выпадашка раскрывается вниз и может уйти за нижний край
        // прокручиваемого тела диалога — подтягиваем поле в видимую область.
        this.tagsTagify.on('dropdown:show', () => {
            this.tagsTagify.DOM.scope.scrollIntoView({ block: 'nearest' });
        });
    }

    clear() {
        document.getElementById('advancedSearchQuery').value = '';
        document.getElementById('exactMatchSearch').checked = false;

        const categoryCheckboxes = document.querySelectorAll('#advancedSearchModal input[type="checkbox"][id^="cat_"]');
        categoryCheckboxes.forEach(checkbox => checkbox.checked = false);

        if (this.tagsTagify) {
            this.tagsTagify.removeAllTags();
        }

        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
    }

    clearAndResetView() {
        this.clear();
        window.location.hash = '#1';
    }

    perform() {
        const query = document.getElementById('advancedSearchQuery').value.trim();
        const exactMatch = document.getElementById('exactMatchSearch').checked;

        const selectedCategories = [];
        const categoryCheckboxes = document.querySelectorAll('#advancedSearchModal input[type="checkbox"][id^="cat_"]:checked');
        categoryCheckboxes.forEach(checkbox => {
            if (checkbox.value) {
                selectedCategories.push(checkbox.value);
            }
        });

        const selectedTags = [];
        if (this.tagsTagify) {
            const tagifyValue = this.tagsTagify.value;
            tagifyValue.forEach(tag => {
                if (tag.value) {
                    selectedTags.push(tag.value);
                }
            });
        }

        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        this.instantList.performAdvancedSearch(query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo);

        Dialogs.close('advancedSearchModal');
    }
}

let instantListInstance;
let settingsModal;
let advancedSearchModal;

function openSettingsModal() {
    settingsModal.open();
}

function applyColumnSettings() {
    settingsModal.apply();
}

function resetSettings() {
    settingsModal.reset();
}

function confirmResetSettings() {
    settingsModal.confirmReset();
}

function showNotification(message, type = 'info') {
    settingsModal.showNotification(message, type);
}

function openAdvancedSearchModal() {
    advancedSearchModal.open();
}

function clearAdvancedSearch() {
    advancedSearchModal.clear();
}

function performAdvancedSearch() {
    advancedSearchModal.perform();
}

window.onload = () => {
    instantListInstance = new InstantList(
        document.getElementById('instantlist_search'),
        [[], g, mr, tr],
        window.config
    );

    settingsModal = new SettingsModal(instantListInstance);
    advancedSearchModal = new AdvancedSearchModal(instantListInstance);
    Dialogs.setup();
};