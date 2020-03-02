/*
    InstantList JS
        by Jjck
            2020
*/


var pages;

/* Конфиг */

var itemsPerPage = 20; // Количество вещей на страницу

var layerIds = [36,45,31,11,56,27,57,85]; // Разрешённые LayerId

/* InstantList */

function makeItemsArray(g, mr, tr) {
    let items = [];
    for (let item in g) {
        item = g[item];
        if(!layerIds.includes(item['LayerId'])) continue;
        items.push({
            Id: item['Id'],
            SwfUrl: mr[item['MRId']] !== undefined ? mr[item['MRId']]['Url'] : undefined,
            PicUrl: mr[-item['MRId']] !== undefined ? mr[-item['MRId']]['Url'] : '" alt=\"',
            Name: tr[item['TRId']] !== undefined ? tr[item['TRId']]['H'] : 'Без названия'
        });
    }
    return items;
}

function addItemsToHtml(items, from, to) {
    let html = '';
    for (let i = from - 1; i < to; i++) {
        let item = items[i];
        html += `<tr>`;
        html += `<td> ${item['Id']} </td>`;
        html += `<td> ${item['Name']}</td>`;
        html += `<td> <img width="130" src="https://sharaball.ru/fs/${item['PicUrl']}"/> </td>`;
        html += `<td> <a href="https://sharaball.ru/fs/${item['SwfUrl']}">${item['SwfUrl']}</a></td>`;
        html += `</tr>`;
    }
    return html;
}

function initTable(items, page = 1, from = 1, to = itemsPerPage) {

    /* Table */
    html = '<table>';
    html += '<thead>';
    html += '<th>ID</th>';
    html += '<th>Название</th>';
    html += '<th>Превью</th>';
    html += '<th>SWF файл</th>';
    html += '</thead>';
    html += '<tbody>';

    html += addItemsToHtml(items, from, to);

    html += '</tbody>';
    html += '</table>';

    let targetForHtml = document.getElementById('table-holder');

    targetForHtml.innerHTML = html;

    /* Pagination */
    pages = Math.ceil(items.length / itemsPerPage);

    let htmlPages = '';
    let targetForPagesHtml = document.getElementById('pages-holder');
    for (let i = 1; i < pages; i++) {
        htmlPages += i === page ? `<a href='#${i}' style="color: #6e6e6e">${i}</a> ` : `<a href='#${i}'>${i}</a> `;
    }

    targetForPagesHtml.innerHTML = htmlPages;

}



window.items = makeItemsArray(g, mr, tr);

function handleHashChange() {


    if(!window.location.hash.includes('#search_')) {
        /* Change page */
        goToPage(+window.location.hash.replace('#', ''));
        return;
    }

    /* Render search results */
    let html = '<table>';
    html += '<thead>';
    html += '<th>ID</th>';
    html += '<th>Название</th>';
    html += '<th>Превью</th>';
    html += '<th>SWF файл</th>';
    html += '</thead>';
    html += '<tbody>';
    let query = decodeURIComponent(location.hash.replace("#search_", "")).trim();
    if(query.length >= 3) {
        for (let i in window.items) {
            if (window.items[i].Name.toLowerCase().replace(/ё/g, 'е').replace(/'/g, "").replace(/"/g, '').indexOf(query.toLowerCase().replace(/ё/g, 'е').replace(/"/g, "").replace(/'/g, '')) > -1) {
                let item = window.items[i];
                html += `<tr>`;
                html += `<td> ${item['Id']} </td>`;
                html += `<td> ${item['Name']}</td>`;
                html += `<td> <img width="130" src="https://sharaball.ru/fs/${item['PicUrl']}"/> </td>`;
                html += `<td> <a href="https://sharaball.ru/fs/${item['SwfUrl']}">${item['SwfUrl']}</a></td>`;
                html += `</tr>`;
            }
        }
    }
    if (html === "<table><thead><th>ID</th><th>Название</th><th>Превью</th><th>SWF файл</th></thead><tbody>") {
        html = "<h2> К сожалению, мы ничего не нашли! </h2>";
    } else {
        html += '</tbody>';
        html += '</table>';
    }

    document.getElementById('pages-holder').innerHTML = '';

    document.getElementById('table-holder').innerHTML = html;
}

function goToPage(page) {

    let from = ((page - 1) * itemsPerPage) + 1;
    let to = page * itemsPerPage;
    window.scrollTo({ top: 0 });
    initTable(items, page, from, to);

}


function init() {

    if(window.location.hash !== '' && !window.location.hash.includes('#search_')) { // If page in hash
        handleHashChange();
    } else if(window.location.hash.includes('#search_')) { // If search
        search.value =
            decodeURIComponent(window.location.hash.replace('#search_', ''));
        handleHashChange();
    } else { // Without page in hash
        initTable(items);
    }

}

window.onload = () => {

    window.search = document.getElementById('instantlist_search');

    init();

    window.onhashchange = handleHashChange;

    search.addEventListener('keydown', function(e) {
        if (e.key === "Enter") {
            location.href = "#search_" + encodeURIComponent(this.value);
        }
    });

};