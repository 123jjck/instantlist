/*
    InstantList JS
        by Jjck
            2026
*/

const INSTANTLIST_LAST_UPDATE = '202609241707';

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
                this.columnSettings = { ...this.getDefaultColumnSettings(), ...JSON.parse(columnSettings) };
            } catch (e) {
                console.warn('Ошибка при загрузке настроек столбцов:', e);
            }
        }

        if (generalSettings) {
            try {
                this.generalSettings = { ...this.getDefaultGeneralSettings(), ...JSON.parse(generalSettings) };
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
        this.columnSettings = {};
        for (const { key } of COLUMNS) {
            if (key) this.columnSettings[key] = document.getElementById(key).checked;
        }

        const themeSelect = document.getElementById('themeSelect');
        this.generalSettings = {
            itemsPerPage: parseInt(document.getElementById('itemsPerPageSelect').value),
            showOnlyStoreItems: document.getElementById('showOnlyStoreItems').checked,
            theme: themeSelect ? themeSelect.value : 'system'
        };
    }

    applyToDOM() {
        const defaults = this.getDefaultColumnSettings();
        for (const { key } of COLUMNS) {
            if (!key) continue;
            const checkbox = document.getElementById(key);
            if (checkbox) checkbox.checked = this.columnSettings[key] ?? defaults[key];
        }

        const itemsPerPageEl = document.getElementById('itemsPerPageSelect');
        const showOnlyStoreItemsEl = document.getElementById('showOnlyStoreItems');

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
    { key: null, cls: 'col-id', title: 'ID', cell: (item, r) => r.renderId(item) },
    { key: null, cls: 'col-name', title: 'Название', cell: (item, r) => r.renderName(item) },
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
        this.filters = readSearchFilters('');
    }

    highlightText(text, query) {
        text = String(text);
        const normalizedText = StringNormalizer.normalizeKeepQuotes(text);
        const normalizedQuery = StringNormalizer.normalize(query);
        const words = normalizedQuery.split(' ').filter(word => word.length > 0);

        // Подсветка работает по позициям, поэтому нужно посимвольное
        // соответствие нормализованного и исходного текста. Если trim сдвинул
        // длину — возвращаем текст как есть, без разметки.
        if (words.length === 0 || normalizedText.length !== text.length) {
            return escapeHtml(text);
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
            result += escapeHtml(text[i]);
            if (marked[i] && (i === text.length - 1 || !marked[i + 1])) {
                result += '</mark>';
            }
        }

        return result;
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

    renderId(item) {
        const id = escapeHtml(item.Id);
        return this.filters.query && item.Id == this.filters.query ? `<mark>${id}</mark>` : id;
    }

    renderName(item) {
        const { query, exactMatch } = this.filters;
        const name = query && !exactMatch ? this.highlightText(item.Name, query) : escapeHtml(item.Name);
        return `<a href="./item.html?id=${item.Id}" class="link">${name}</a>`;
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

// Категория поиска объединяет подтипы, сохраняя точный тип в таблице.
const FURNITURE_GOOD_TYPE_IDS = new Set([20, 22, 23, 59, 60, 61, 62, 63, 68, 107]);

function readSearchFilters(hash = window.location.hash) {
    const params = new URLSearchParams(hash.startsWith('#?') ? hash.slice(2) : '');
    return {
        query: (params.get('q') || '').trim(),
        exactMatch: params.get('exact') === 'true',
        selectedCategories: (params.get('cats') || '').split(',').filter(Boolean),
        selectedTags: (params.get('tags') || '').split(',').filter(Boolean),
        dateFrom: params.get('from') || '',
        dateTo: params.get('to') || '',
        mrid: params.get('mrid') || ''
    };
}

function isAdvancedSearch(filters) {
    return Boolean(filters.exactMatch || filters.selectedCategories.length ||
        filters.selectedTags.length || filters.dateFrom || filters.dateTo || filters.mrid);
}

function escapeHtml(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, character => entities[character]);
}

class SearchEngine {
    search(filters, items) {
        const { query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo, mrid } = filters;
        if (!isAdvancedSearch(filters) && query.length < 2 && isNaN(query)) return [];

        const normalizedQuery = StringNormalizer.normalize(query);
        const normalizedTags = selectedTags.map(tag => StringNormalizer.normalize(tag));
        const resourceId = Number(mrid);

        return items.filter(item => {
            if (query) {
                const name = StringNormalizer.normalize(item.Name);
                const matches = exactMatch
                    ? name === normalizedQuery
                    : name.includes(normalizedQuery) || item.Id == query;
                if (!matches) return false;
            }

            if (mrid !== '' && (!Number.isInteger(resourceId) || Number(item.MRId) !== resourceId)) {
                return false;
            }

            if (selectedCategories.length > 0) {
                const matches = selectedCategories.some(category => category === 'Мебель'
                    ? FURNITURE_GOOD_TYPE_IDS.has(Number(item.GoodTypeId))
                    : category === item.Type);
                if (!matches) return false;
            }

            if (normalizedTags.length > 0) {
                const itemTags = (item.Tags || '').split(',').map(tag => {
                    const id = tag.trim();
                    return StringNormalizer.normalize(tagsMap[id] || id);
                });
                if (!normalizedTags.some(tag => itemTags.some(itemTag => itemTag.includes(tag)))) {
                    return false;
                }
            }

            // ISO-даты сравниваем как календарные дни, без часовых поясов.
            if (dateFrom || dateTo) {
                if (!item.PublishDay) return false;
                if (dateFrom && item.PublishDay < dateFrom) return false;
                if (dateTo && item.PublishDay > dateTo) return false;
            }
            return true;
        });
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

        this.items = this.buildItemsArray(resources.g, resources.mr, resources.tr);
        this.allItems = this.items;

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
        const filters = readSearchFilters();
        this.search.value = filters.query;
        const results = this.searchEngine.search(filters, this.items);
        this.table.renderSearchResults(results, filters);
    }

    getItemType(goodTypeId) {
        return goodTypeMap[goodTypeId] || goodTypeId;
    }

    buildItemsArray(g, mr, tr) {
        const items = [];
        for (const item of Object.values(g)) {
            if (this.config['layerIds'] !== '*' && !this.config['layerIds'].includes(item['LayerId'])) {
                continue;
            }
            items.push({
                Id: item['Id'],
                MRId: item['MRId'],
                GoodTypeId: item['GoodTypeId'],
                Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия',
                Type: this.getItemType(item['GoodTypeId']),
                PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '',
                SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined,
                PublishDay: item.PublishDate ? item.PublishDate.slice(0, 10) : '',
                PublishDate: item.PublishDate ? item.PublishDate.slice(0, 10).split('-').reverse().join('.') : 'Не указана',
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
            this.items = this.allItems;
        }
    }

    applySettings() {
        this.settingsManager.updateFromDOM();
        this.settingsManager.saveToCookies();
        this.settingsManager.applyTheme();

        this.config.itemsPerPage = this.settingsManager.generalSettings.itemsPerPage;

        this.handleHashChange();
    }

    resetSettings() {
        this.settingsManager.reset();
        this.settingsManager.applyToDOM();

        this.config.itemsPerPage = this.settingsManager.generalSettings.itemsPerPage;

        this.handleHashChange();
    }

    performAdvancedSearch(filters) {
        const { query, exactMatch, selectedCategories, selectedTags, dateFrom, dateTo, mrid } = filters;
        const params = new URLSearchParams();

        if (mrid !== '') params.set('mrid', mrid);
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

    setTitle(title) {
        this.titleHolder.textContent = title;
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

    buildTableHtml(items, filters = readSearchFilters('')) {
        this.itemRenderer.filters = filters;
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
        this.pageHolder.innerHTML = this.renderPagination(Math.ceil(items.length / this.config.itemsPerPage), page);
    }

    renderSearchResults(results, filters) {
        const advanced = isAdvancedSearch(filters);
        const emptyResult = advanced ? EMPTY_RESULT_FILTERED : EMPTY_RESULT;
        this.pageHolder.innerHTML = '';
        this.holder.innerHTML = results.length ? this.buildTableHtml(results, filters) : emptyResult;

        if (!advanced) {
            this.setTitle('Результаты поиска');
            return;
        }

        const { query, selectedCategories, selectedTags, dateFrom, dateTo, mrid } = filters;
        const titleParts = [];
        if (mrid !== '') titleParts.push(`MRId: ${mrid}`);
        if (query) titleParts.push(`"${query}"`);
        if (selectedCategories.length > 0) titleParts.push(`категории: ${selectedCategories.join(', ')}`);
        if (selectedTags.length > 0) titleParts.push(`теги: ${selectedTags.join(', ')}`);
        if (dateFrom && dateTo) titleParts.push(`даты: ${dateFrom} - ${dateTo}`);
        else if (dateFrom) titleParts.push(`с даты: ${dateFrom}`);
        else if (dateTo) titleParts.push(`по дату: ${dateTo}`);

        const pluralForm = results.length === 1 ? '' : results.length < 5 ? 'а' : 'ов';
        this.setTitle(`Расширенный поиск${titleParts.length > 0 ? ' — ' + titleParts.join(' | ') : ''} (${results.length} результат${pluralForm})`);
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
        this.updateCategoryAvailability();
        this.restoreFromHash();
        Dialogs.open('advancedSearchModal');
    }

    updateCategoryAvailability() {
        // Берём весь список режима, независимо от поиска и фильтра магазина.
        const available = new Set(this.instantList.allItems.map(item =>
            FURNITURE_GOOD_TYPE_IDS.has(Number(item.GoodTypeId)) ? 'Мебель' : item.Type
        ));
        const clothingOnly = this.instantList.config.layerIds !== '*';

        for (const checkbox of document.querySelectorAll('#advancedSearchModal input[id^="cat_"]')) {
            checkbox.disabled = clothingOnly && !available.has(checkbox.value);
            checkbox.closest('label').classList.toggle('is-disabled', checkbox.disabled);
        }
    }

    restoreFromHash() {
        this.applyFilters(readSearchFilters());
    }

    applyFilters(filters) {
        document.getElementById('advancedSearchQuery').value = filters.query;
        document.getElementById('advancedSearchMRId').value = filters.mrid;
        document.getElementById('exactMatchSearch').checked = filters.exactMatch;
        document.getElementById('dateFrom').value = filters.dateFrom;
        document.getElementById('dateTo').value = filters.dateTo;

        for (const checkbox of document.querySelectorAll('#advancedSearchModal input[id^="cat_"]')) {
            checkbox.checked = !checkbox.disabled && filters.selectedCategories.includes(checkbox.value);
        }
        if (this.tagsTagify) {
            this.tagsTagify.removeAllTags();
            this.tagsTagify.addTags(filters.selectedTags);
        }
    }

    populateTagsSelect() {
        if (this.tagsTagify) return;
        const tagsInput = document.getElementById('tags');

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
        this.applyFilters(readSearchFilters(''));
    }

    perform() {
        const mridInput = document.getElementById('advancedSearchMRId');
        if (!mridInput.reportValidity()) return;

        const categories = document.querySelectorAll('#advancedSearchModal input[id^="cat_"]:checked');
        const filters = {
            query: document.getElementById('advancedSearchQuery').value.trim(),
            exactMatch: document.getElementById('exactMatchSearch').checked,
            selectedCategories: Array.from(categories).filter(checkbox => !checkbox.disabled).map(checkbox => checkbox.value).filter(Boolean),
            selectedTags: this.tagsTagify ? this.tagsTagify.value.map(tag => tag.value).filter(Boolean) : [],
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            mrid: mridInput.value.trim()
        };
        this.instantList.performAdvancedSearch(filters);
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
        { g, mr, tr },
        window.config
    );

    settingsModal = new SettingsModal(instantListInstance);
    advancedSearchModal = new AdvancedSearchModal(instantListInstance);
    Dialogs.setup();
};