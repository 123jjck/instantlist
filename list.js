/*
    InstantList JS
        by Jjck
            2021
*/

class InstantList {
    constructor(searchInput, resources, config) {
        /* Init search */
        
        this.search = searchInput;
        this.search.addEventListener('keydown', function(e) {
            if (e.key === "Enter") {
                location.href = "#search_" + encodeURIComponent(this.value);
            }
        });

        this.config = config;
        
        this.table = new Table(document.getElementById('table-holder'), document.getElementById('pages-holder'), this.config.itemsPerPage);

        /* Init items, table */
        this.items = this.makeItemsArray(resources[0], resources[1], resources[2]);

        this.init();
    }

    init() {

        window.onhashchange = this.handleHashChange.bind(this);

        if(window.location.hash == '') {
            this.table.renderTable(this.items, 1, 1, this.config.itemsPerPage);
        } else {
            this.handleHashChange();
        }
    
    }

    goToPage(page) {
        if(page <= 0) page = 1;
        let from = ((page - 1) * this.config.itemsPerPage) + 1;

        let to = page * this.config.itemsPerPage;
        window.scrollTo({ top: 0 });
        this.table.renderTable(this.items, page, from, to);
    }

    handleHashChange() {
        if(!window.location.hash.includes('#search_')) { /* Change page */
            this.search.value = '';
            this.goToPage(+window.location.hash.replace('#', ''));
            return;
        }
        this.search.value = decodeURIComponent(window.location.hash.replace('#search_', ''));
        let query = decodeURIComponent(window.location.hash.replace("#search_", "")).trim();
        this.table.renderSearchResults(query, this.items);
    
    }

    makeItemsArray(g, mr, tr) {
        let items = [];
        for (let item in g) {
            item = g[item];
            if(this.config['layerids'] !== '*') {
                if(!this.config['layerIds'].includes(item['LayerId'])) continue;
            }
            items.push({
                Id: item['Id'],
                SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined,
                PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '" alt=\"', // TODO: Normal "no img"
                Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия'
            });
        }
        return items;
    }
    
}

class Table {
    constructor(tableHolder, pageHolder, itemsPerPage) {
        this.holder = tableHolder;
        this.pageHolder = pageHolder;
        this.itemsPerPage = itemsPerPage;
    }
    renderTable(items, page, from, to) {
        
        /* Table */
        let html = '<table>';
        html += '<thead>';
        html += '<th>ID</th>';
        html += '<th>Название</th>';
        html += '<th>Превью</th>';
        html += '<th>SWF файл</th>';
        html += '</thead>';
        html += '<tbody>';

        html += this.renderItems(items, from, to);

        html += '</tbody>';
        html += '</table>';


        this.holder.innerHTML = html;
        
        /* Pagination */
        let pages = Math.ceil(items.length / this.itemsPerPage);

        let htmlPages = '';
        for (let i = 1; i < pages; i++) {
            htmlPages += i === page ? `<a href='#${i}' style="color: #6e6e6e">${i}</a> ` : `<a href='#${i}'>${i}</a> `;
        }

        this.pageHolder.innerHTML = htmlPages;

    }
    renderItems(items, from, to) {
        let html = '';
        for (let i = from - 1; i < to; i++) {
            let item = items[i];
            html += this.renderElement(item);
        }
        return html;
    }
    renderElement(item) {
        let html = '<tr>';
        html += `<td>${item['Id']}</td>`;
        html += `<td>${item['Name']}</td>`;
        html += `<td><img width="130" src="https://sharaball.ru/fs/${item['PicUrl']}"/></td>`;
        html += `<td><a href="https://sharaball.ru/fs/${item['SwfUrl']}">${item['SwfUrl']}</a></td>`;
        html += `</tr>`;
        return html;
    }
    renderSearchResults(query, items) {
        /* Render search results */
        let html = '<table>';
        html += '<thead>';
        html += '<th>ID</th>';
        html += '<th>Название</th>';
        html += '<th>Превью</th>';
        html += '<th>SWF файл</th>';
        html += '</thead>';
        html += '<tbody>';
        
        if(query.length >= 3) {
            for (let i in items) {
                if (items[i].Name.toLowerCase().replace(/ё/g, 'е').replace(/'/g, "").replace(/"/g, '').indexOf(query.toLowerCase().replace(/ё/g, 'е').replace(/"/g, "").replace(/'/g, '')) > -1) {
                    let item = items[i];
                    html += this.renderElement(item);
                }
            }
        }
        if (html === "<table><thead><th>ID</th><th>Название</th><th>Превью</th><th>SWF файл</th></thead><tbody>") {
            html = "<h2> К сожалению, мы ничего не нашли! </h2>";
        } else {
            html += '</tbody>';
            html += '</table>';
        }
    
        this.pageHolder.innerHTML = '';
    
        this.holder.innerHTML = html;
    }
}

window.onload = () => {
    let list = new InstantList(document.getElementById('instantlist_search'), [g, mr, tr], window.config);
};