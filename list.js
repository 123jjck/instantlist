/*
    InstantList JS
        by Jjck
            2022
*/
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
        this.items = this.buildItemsArray(resources[0], resources[1], resources[2]);

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
    buildItemsArray(g, mr, tr) {
        let items = [];
        for (let item of Object.values(g)) {
            if (this.config['layerIds'] !== '*' && !this.config['layerIds'].includes(item['LayerId'])) continue;
            items.push({
                Id: item['Id'],
                SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined,
                PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '',
                Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия'
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
        html += '<th>Превью</th>';
        html += '<th>SWF файл</th>';

        html += '</thead><tbody>';

        if (query.trim().length >= 2) {
            query = this.normalizeString(query);
            for (let i in items) {
                let normalizedName = this.normalizeString(items[i].Name);
                if (normalizedName.indexOf(query) !== -1) {
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
                        itemToRender["Name"] += items[i]['Name'][letterIndex];
                    }
                    html += this.renderElement(itemToRender);
                }
            }
        }

        if (html === '<table class="table table-striped table-borderless"><thead><th>ID</th><th>Название</th><th>Превью</th><th>SWF файл</th></thead><tbody>') {
            html = "<h2> К сожалению, мы ничего не нашли! </h2>";
        } else {
            html += '</tbody></table>';
        }

        this.pageHolder.innerHTML = '';
        this.titleHolder.innerHTML = "Результаты поиска";
        this.holder.innerHTML = html;
    }
}

window.onload = () => new InstantList(document.getElementById('instantlist_search'), [g, mr, tr], window.config);
