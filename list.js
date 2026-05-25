/*
    InstantList JS
        by Jjck
            2026
*/

const INSTANTLIST_LAST_UPDATE = '202605251536';

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

const goodTypeMap = {
    1: 'Одежда',
    4: 'Шапки/Причёски',
    10: 'Еда (крошки)',
    14: 'Очки',
    16: 'Одежда (крошки)',
    17: 'Игры (крошки)',
    18: 'Сон (крошки)',
    19: 'Шапки/Причёски (крошки)',
    20: 'Мебель (домик)',
    22: 'На стену (домик)',
    23: 'Полы (домик)',
    32: 'Обувь',
    34: 'Домики',
    36: 'Аксессуары',
    37: 'Шарафоны',
    40: 'Костюмы',
    41: 'Фоны',
    43: 'Тело',
    44: 'Уши',
    45: 'Глаза',
    46: 'Рога',
    47: 'Ноги',
    48: 'Рты',
    49: 'Клювы',
    50: 'Носы',
    52: 'Крошки',
    57: 'Визы',
    58: 'Клубы',
    59: 'Мебель (клуб)',
    60: 'На стену (клуб)',
    61: 'Полы (клуб)',
    62: 'Обои (клуб)',
    63: 'Фасады (клуб)',
    64: 'Магия',
    65: 'Десерты (клуб)',
    66: 'Напитки (клуб)',
    67: 'Еда (клуб)',
    68: 'Техника (клуб)',
    69: 'Сцены',
    70: 'Шоу',
    72: 'Обтекатель (авто)',
    73: 'Фары (авто)',
    74: 'Решётка радиатора (авто)',
    75: 'Задний бампер (авто)',
    76: 'Боковой спойлер/обвес (авто)',
    77: 'Ручки (авто)',
    78: 'Зеркала (авто)',
    79: 'Детали на крышу (авто)',
    80: 'Задний спойлер (авто)',
    81: 'Колёса (авто)',
    82: 'Детали на двери (авто)',
    90: 'Наклейки (авто)',
    94: 'Спутники',
    103: 'Машины',
    107: 'Игровые автоматы (клуб)',
    111: 'Смайлы',
    113: 'Эликсир (питомец)',
    117: 'Питомцы',
    119: 'Наклейки'
};

const tagsMap = {
    1: "acces",
    4: "dinosaur",
    5: "zyabr",
    6: "inhome",
    7: "beast",
    8: "screw",
    9: "table",
    10: "22c",
    11: "costume",
    12: "dress",
    13: "farm",
    14: "club",
    15: "clubhouse",
    16: "desert",
    17: "man",
    18: "drink",
    19: "facade",
    20: "food",
    21: "woman",
    22: "ground",
    23: "instrument",
    24: "menu",
    25: "cloth",
    26: "scene",
    27: "slotmachine",
    28: "wallpaper",
    33: "back",
    34: "boot",
    35: "cap",
    36: "smile",
    37: "phone",
    38: "body_parts",
    42: "sugar",
    43: "movie",
    44: "turn",
    45: "home",
    46: "house",
    47: "furniture",
    48: "soft",
    50: "cabinet",
    51: "light",
    52: "tech",
    53: "decor",
    54: "tropical",
    55: "magic",
    56: "transform",
    57: "mage",
    58: "super",
    59: "forces",
    60: "pet_game",
    61: "pet_clothes",
    62: "pet_food",
    63: "pet_sleep",
    64: "pets",
    65: "pet_elixir",
    66: "pet_egg",
    67: "pet_rays",
    68: "pet_battle",
    69: "pet_babies",
    70: "rolyjoke",
    71: "powder",
    72: "heroes",
    73: "insects",
    74: "smiles/stickers",
    75: "stickers"
};

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

        if (effectiveTheme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
        }
    }
}

class ItemRenderer {
    constructor(domain, fsPath, columnSettings) {
        this.domain = domain;
        this.fsPath = fsPath;
        this.columnSettings = columnSettings;
    }

    parseTags(tagsString) {
        return tagsString.split(',').map(tag => tag.trim());
    }

    render(item) {
        let html = '<tr>';
        html += `<td>${item['Id']}</td>`;
        html += `<td>${item['Name']}</td>`;

        if (this.columnSettings.colType) {
            html += `<td class="col-type">${item['Type']}</td>`;
        }

        if (this.columnSettings.colPreview) {
            html += `<td class="col-preview"><img style="width: 8.1rem" class="img-fluid" src="${this.domain}/${this.fsPath}/${item['PicUrl']}" alt=""/></td>`;
        }

        if (this.columnSettings.colSwf) {
            html += `<td class="col-swf"><a href="${this.domain}/${this.fsPath}/${item['SwfUrl']}" class="text-decoration-none" target="_blank">${item['SwfUrl']}</a></td>`;
        }

        if (this.columnSettings.colPublishDate) {
            html += `<td class="col-publish-date">${item['PublishDate']}</td>`;
        }

        if (this.columnSettings.colTags) {
            let tagsHtml = '';

            if (item['Tags']) {
                const tags = this.parseTags(item['Tags']);
                tagsHtml = tags.map(tagId => {
                    const tagName = tagsMap[tagId.trim()] || tagId.trim();
                    return `<span class="badge bg-secondary me-1 mb-1">${tagName}</span>`;
                }).join('');
            } else {
                tagsHtml = '—';
            }

            html += `<td class="col-tags">${tagsHtml}</td>`;
        }

        if (this.columnSettings.colUsualTickets) {
            html += `<td class="col-usual-tickets">${item['UsualTickets'] >= 0 ? item['UsualTickets'] : '—'}</td>`;
        }

        if (this.columnSettings.colMagicTickets) {
            html += `<td class="col-magic-tickets">${item['MagicTickets'] >= 0 ? item['MagicTickets'] : '—'}</td>`;
        }

        html += `</tr>`;
        return html;
    }
}

class SearchEngine {
    highlightText(text, query) {
        const normalizedText = StringNormalizer.normalizeKeepQuotes(text);
        const normalizedQuery = StringNormalizer.normalize(query);
        let result = '';
        let queryWords = normalizedQuery.split(' ');

        for (let letterIndex = 0; letterIndex < text.length; letterIndex++) {
            for (let word of queryWords) {
                if (letterIndex === normalizedText.lastIndexOf(word)) {
                    result += '<mark>';
                }
                if (letterIndex === (normalizedText.lastIndexOf(word) + word.length)) {
                    result += '</mark>';
                }
            }
            result += text[letterIndex];
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
        head += '<th>ID</th>';
        head += '<th>Название</th>';
        if (settings.colType) head += '<th class="col-type">Тип</th>';
        if (settings.colPreview) head += '<th class="col-preview">Превью</th>';
        if (settings.colSwf) head += '<th class="col-swf">SWF файл</th>';
        if (settings.colPublishDate) head += '<th class="col-publish-date">Дата добавления</th>';
        if (settings.colTags) head += '<th class="col-tags">Теги</th>';
        if (settings.colUsualTickets) head += '<th class="col-usual-tickets">Смешинки</th>';
        if (settings.colMagicTickets) head += '<th class="col-magic-tickets">Румбики</th>';
        head += '</tr></thead>';
        return head;
    }

    applyColumnVisibility() {
        const settings = this.settingsManager.columnSettings;
        const style = document.getElementById('columnStyles') || document.createElement('style');
        style.id = 'columnStyles';

        let css = '';
        if (!settings.colType) css += '.col-type { display: none !important; } ';
        if (!settings.colPreview) css += '.col-preview { display: none !important; } ';
        if (!settings.colSwf) css += '.col-swf { display: none !important; } ';
        if (!settings.colPublishDate) css += '.col-publish-date { display: none !important; } ';
        if (!settings.colTags) css += '.col-tags { display: none !important; } ';
        if (!settings.colUsualTickets) css += '.col-usual-tickets { display: none !important; } ';
        if (!settings.colMagicTickets) css += '.col-magic-tickets { display: none !important; } ';

        style.textContent = css;
        document.head.appendChild(style);
    }

    renderPagination(pagesCount, currentPage) {
        let paginationHTML = '<nav aria-label="..."><ul class="pagination pagination-sm flex-wrap">';
        for (let i = 1; i <= pagesCount; i++) {
            if (i === currentPage) {
                paginationHTML += `<li class="page-item active" aria-current="page"><span class="page-link">${i}</span><li>`;
            } else {
                paginationHTML += `<li class="page-item"><a class="page-link" href="#${i}">${i}</a></li> `;
            }
        }
        paginationHTML += '</ul></nav>';
        return paginationHTML;
    }

    renderTable(items, page, from, to) {
        this.itemRenderer.columnSettings = this.settingsManager.columnSettings;

        let html = '<table class="table table-striped table-borderless">';
        html += this.getTableHead();
        html += '<tbody>';

        for (let i = from - 1; i < to; i++) {
            const item = items[i];
            if (item !== undefined) {
                html += this.itemRenderer.render(item);
            }
        }

        html += '</tbody></table>';

        this.holder.innerHTML = html;
        this.applyColumnVisibility();
        this.pageHolder.innerHTML = this.renderPagination(Math.ceil(items.length / this.config.itemsPerPage), page);
    }

    renderSearchResults(results) {
        this.itemRenderer.columnSettings = this.settingsManager.columnSettings;

        let html = '<table class="table table-striped table-borderless">';
        html += this.getTableHead();
        html += '<tbody>';

        for (let item of results) {
            html += this.itemRenderer.render(item);
        }

        html += '</tbody></table>';

        if (results.length === 0) {
            html = '<p class="fs-3"> К сожалению, мы ничего не нашли! </p>';
        }

        this.pageHolder.innerHTML = '';
        this.setTitle("Результаты поиска");
        this.holder.innerHTML = html;
        this.applyColumnVisibility();
    }

    renderAdvancedSearchResults(results, query, selectedCategories, selectedTags, dateFrom, dateTo) {
        this.itemRenderer.columnSettings = this.settingsManager.columnSettings;

        let html = '<table class="table table-striped table-borderless">';
        html += this.getTableHead();
        html += '<tbody>';

        for (let item of results) {
            html += this.itemRenderer.render(item);
        }

        html += '</tbody></table>';

        if (results.length === 0) {
            html = '<p class="fs-3"> К сожалению, мы ничего не нашли! </p>';
            if (selectedCategories.length > 0 || selectedTags.length > 0 || dateFrom || dateTo) {
                html += '<p class="text-muted">Попробуйте изменить критерии поиска или убрать некоторые фильтры.</p>';
            }
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
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    }

    apply() {
        this.instantList.applySettings();
        this.close();
        this.showNotification('Настройки успешно применены!', 'success');
    }

    reset() {
        this.instantList.resetSettings();

        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (settingsModal) {
            settingsModal.hide();
        }

        this.showNotification('Настройки успешно сброшены!', 'success');
    }

    close() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) {
            modal.hide();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
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
        const modal = new bootstrap.Modal(document.getElementById('advancedSearchModal'));
        modal.show();
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
                dropdownItem: function(item) {
                    return `<div ${this.getAttributes(item)}
                                class='${this.settings.classNames.dropdownItem} ${item.class ? item.class : ""}'
                                tabindex="0"
                                role="option">
                                ${item.label || item.value}
                            </div>`;
                }
            }
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

        const modal = bootstrap.Modal.getInstance(document.getElementById('advancedSearchModal'));
        modal.hide();
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
};