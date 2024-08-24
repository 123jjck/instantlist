/*
    InstantList JS
        by Jjck
            2023
*/

const goodTypeMap = { // TODO add more types
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

class InstantList {
    constructor(searchInput, resources, config) {
        this.search = searchInput;
        this.search.addEventListener('keydown', function(e) {
            if (e.key === "Enter") {
                location.href = "#search_" + encodeURIComponent(this.value);
            }
        });
        
        this.config = config;
        this.table = new Table(document.getElementById(this.config.tableHolderId), document.getElementById(this.config.pagesHolderId), this.config.itemsPerPage, this.config.domain, this.config.fsPath);
        this.items = this.buildItemsArray(resources[0], resources[1], resources[2], resources[3]);

        this.init();
    }

    init() {
        window.onhashchange = this.handleHashChange.bind(this);
        this.handleHashChange();
    }

    goToPage(page = 1) {
        if (page <= 0) page = 1;
        let from = ((page - 1) * this.config.itemsPerPage) + 1;
        let to = page * this.config.itemsPerPage;
        window.scrollTo({
            top: 0
        });
        this.table.renderTable(this.items, page, from, to);
    }

    handleHashChange() {
        if (!window.location.hash.includes('#search_')) {
            this.table.titleHolder.innerHTML = "Вещи";
            this.search.value = '';
            this.goToPage(+window.location.hash.replace('#', ''));
            return;
        }
        let query = this.search.value = decodeURIComponent(window.location.hash.replace("#search_", ""));
        this.table.renderSearchResults(query, this.items);
    }

    getItemType(goodTypeId) {
        return goodTypeMap[goodTypeId] || goodTypeId;
    }

    buildItemsArray(t, g, mr, tr) {
        // TODO tags
        let items = [];
        for (let item of Object.values(g)) {
            if (this.config['layerIds'] !== '*' && !this.config['layerIds'].includes(item['LayerId'])) continue;
            items.push({
                Id: item['Id'],
                Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия',
                Type: this.getItemType(item['GoodTypeId']),
                PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '',
                SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined
            });
        }
        return items;
    }
}

class Table {
    constructor(tableHolder, pageHolder, itemsPerPage, domain, fsPath) {
        this.holder = tableHolder;
        this.pageHolder = pageHolder;
        this.titleHolder = document.getElementById('title');
        this.itemsPerPage = itemsPerPage;

        this.domain = domain;
        this.fsPath = fsPath;
    }

    renderTable(items, page, from, to) {
        /* Table */
        let html = '<table class="table table-striped table-borderless"><thead>';

        html += '<th>ID</th>';
        html += '<th>Название</th>';
        html += '<th>Тип</th>';
        html += '<th>Превью</th>';
        html += '<th>SWF файл</th>';

        html += '</thead><tbody>';
        html += this.renderItems(items, from, to);
        html += '</tbody></table>';

        this.holder.innerHTML = html;

        /* Pagination */
        let pages = Math.ceil(items.length / this.itemsPerPage);
        let paginationHtml = '<nav aria-label="..."><ul class="pagination pagination-sm d-flex flex-wrap">';
        for (let i = 1; i <= pages; i++) {
            paginationHtml += i === page ? `<li class="page-item active" aria-current="page"><span class="page-link">${i}</span><li>` : `<li class="page-item"><a class="page-link" href="#${i}">${i}</a></li> `;
        }
        paginationHtml += '</ul></nav>';
        this.pageHolder.innerHTML = paginationHtml;
    }

    renderItems(items, from, to) {
        let html = '';
        for (let i = from - 1; i < to; i++) {
            let item = items[i];
            if(item == undefined) continue;
            html += this.renderElement(item);
        }
        return html;
    }

    renderElement(item) {
        let html = '<tr>';
        html += `<td>${item['Id']}</td>`;
        html += `<td>${item['Name']}</td>`;
        html += `<td>${item['Type']}</td>`;
        html += `<td><img style="width: 8.1rem" class="img-fluid" src="${this.domain}/${this.fsPath}/${item['PicUrl']}" alt=""/></td>`;
        html += `<td><a href="${this.domain}/${this.fsPath}/${item['SwfUrl']}" target="_blank">${item['SwfUrl']}</a></td>`;
        html += `</tr>`;
        return html;
    }

    normalizeString(str) {
        return str.toLowerCase().replace(/ё/g, 'е').replace(/'/g, "").replace(/"/g, '').trim();
    }

    normalizeStringKeepQuotes(str) {
        return str.toLowerCase().replace(/ё/g, 'е').trim();
    }
    
    renderSearchResults(query, items) {
        let html = '<table class="table table-striped table-borderless"><thead>';

        html += '<th>ID</th>';
        html += '<th>Название</th>';
        html += '<th>Тип</th>';
        html += '<th>Превью</th>';
        html += '<th>SWF файл</th>';

        html += '</thead><tbody>';

        query = query.trim();
        if (query.length >= 2 || !isNaN(query)) {
            query = this.normalizeString(query);
            for (let i in items) {
                let normalizedName = this.normalizeString(items[i].Name);
                if (normalizedName.indexOf(query) !== -1 || items[i].Id == query) {
                    let itemToRender = Object.assign({}, items[i]); // copy item
                    let normalizedNameWithQuotes = this.normalizeStringKeepQuotes(items[i].Name);

                    // Highlight found words
                    itemToRender["Name"] = '';
                    let queryWords = query.split(' ');

                    for(let letterIndex = 0; letterIndex < items[i]["Name"].length; letterIndex++) {
                        for(let word of queryWords) {
                            if(letterIndex == normalizedNameWithQuotes.lastIndexOf(word)) {
                                itemToRender["Name"] += '<mark>';
                            }
                            if(letterIndex == (normalizedNameWithQuotes.lastIndexOf(word) + word.length)) {
                                itemToRender["Name"] += '</mark>';
                            }
                        }
                        itemToRender["Name"] += items[i]["Name"][letterIndex];
                    }
                    if(items[i].Id == query) itemToRender["Id"] = '<mark>' + itemToRender['Id'] + '</mark>';
                    html += this.renderElement(itemToRender);
                }
            }
        }

        if (html === '<table class="table table-striped table-borderless"><thead><th>ID</th><th>Название</th><th>Тип</th><th>Превью</th><th>SWF файл</th></thead><tbody>') {
            html = "<h2> К сожалению, мы ничего не нашли! </h2>";
        } else {
            html += '</tbody></table>';
        }

        this.pageHolder.innerHTML = '';
        this.titleHolder.innerHTML = "Результаты поиска";
        this.holder.innerHTML = html;
    }
}

window.onload = () => new InstantList(document.getElementById('instantlist_search'), [[], g, mr, tr], window.config);
