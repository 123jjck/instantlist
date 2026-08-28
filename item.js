/*
    InstantList JS - Страница вещи
        by Jjck
            2026
*/

const HISTORY_DIR = './history';

const eventTitles = {
    added: 'Появилась в базе',
    removed: 'Удалена из базы',
    name: 'Название',
    desc: 'Описание',
    swf: 'Обновлён SWF-файл',
    pic: 'Обновлено превью',
    icon: 'Обновлена иконка'
};

const eventGroups = {
    added: 'meta', removed: 'meta',
    name: 'params', desc: 'params', field: 'params',
    swf: 'files', pic: 'files', icon: 'files'
};

// 0 — вещь не продаётся (обе цены выставлены в -1), 1 и 2 — валюта, в которой
// задана цена; во второй валюте при этом стоит 0.
const currencyMap = { 0: 'не продаётся', 1: 'Смешинки', 2: 'Румбики' };

// Служебные идентификаторы не занимают отдельную строку таблицы, а идут
// приглушённой подписью к тому полю, к которому относятся.
function withId(html, value) {
    if (value === undefined || value === null) return html;
    return `${html} <span class="muted small">(${escapeHtml(value)})</span>`;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function renderTags(tagsString) {
    if (!tagsString) return '—';
    const tags = tagsString.split(',').map((tag) => {
        const id = tag.trim();
        if (!id) return '';
        return `<span class="tag">${escapeHtml(tagsMap[id] || id)}</span>`;
    }).join('');
    return `<span class="tags">${tags}</span>`;
}

// Значения полей вещи в человекочитаемом виде — используется и в карточке,
// и в колонках «До»/«После» таблицы истории.
function formatFieldValue(field, value) {
    if (value === undefined || value === null || value === '') return '—';
    switch (field) {
        case 'GoodTypeId': return goodTypeMap[value]
            ? `${escapeHtml(goodTypeMap[value])} <span class="muted">(${escapeHtml(value)})</span>`
            : escapeHtml(value);
        case 'Tags': return renderTags(value);
        case 'IsActive': return value ? 'Да' : 'Нет';
        case 'DefCurrency': return escapeHtml(currencyMap[value] || value);
        case 'PublishDate': return escapeHtml(formatDate(value));
        case 'UsualTickets':
        case 'MagicTickets': return value < 0 ? '—' : escapeHtml(value);
        default: return escapeHtml(value);
    }
}

function plain(value) {
    return value === undefined || value === null ? '—' : escapeHtml(value);
}

// В игровых текстах перевод строки закодирован вертикальной чертой.
function textHtml(value) {
    return escapeHtml(value).replace(/\|/g, '<br>');
}

// Ссылка на текст в истории: сама надпись плюс её trid мелким шрифтом.
function withText(id, text) {
    if (id === undefined || id === null) return '—';
    // Часть DescTRId/TRId в игровой базе ссылается на несуществующие строки.
    const label = text ? textHtml(text) : '<span class="muted">нет в базе текстов</span>';
    return withId(label, id);
}

class ItemPage {
    constructor(config) {
        this.config = config;
        this.id = this.readId();
        this.fields = {};
        this.dates = [];
    }

    readId() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('id') || window.location.hash.replace('#', '');
        const id = parseInt(raw, 10);
        return isNaN(id) ? null : id;
    }

    // Данные подключаем обычными <script>, а не fetch: так страница работает
    // и при открытии по file://, где fetch блокируется политикой CORS.
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const el = document.createElement('script');
            el.src = src;
            el.onload = resolve;
            el.onerror = () => reject(new Error(src));
            document.head.appendChild(el);
        });
    }

    async start() {
        if (this.id === null) {
            this.fail('Не указан идентификатор вещи.');
            return;
        }
        this.item = (typeof g !== 'undefined') ? g[this.id] : undefined;
        if (this.item === undefined) {
            this.fail(`Вещь с ID ${this.id} не найдена.`);
            return;
        }
        this.renderCard();
        this.renderRelated();
        await this.renderHistory();
    }

    fail(message) {
        document.getElementById('itemContent').innerHTML =
            `<div class="callout warning"><p>${escapeHtml(message)}</p></div>`;
        document.getElementById('relatedBlock').classList.add('hidden');
        document.getElementById('historyBlock').classList.add('hidden');
    }

    name() {
        const t = (typeof tr !== 'undefined') ? tr[this.item.TRId] : undefined;
        return t ? t.H : 'Без названия';
    }

    description() {
        const t = (typeof tr !== 'undefined' && this.item.DescTRId !== undefined)
            ? tr[this.item.DescTRId] : undefined;
        return t ? t.H : null;
    }

    resourceUrl(mrid) {
        const res = (typeof mr !== 'undefined') ? mr[mrid] : undefined;
        return res && res.Url ? `${this.config.domain}/${this.config.fsPath}/${res.Url}` : null;
    }

    // Ссылка на файл ресурса; у части вещей ресурса в базе нет.
    resourceLink(mrid) {
        const url = this.resourceUrl(mrid);
        return url
            ? `<a href="${url}" target="_blank" class="link"><code>${escapeHtml(mr[mrid].Url)}</code></a>`
            : '—';
    }

    renderCard() {
        const item = this.item;
        const name = this.name();
        document.title = `${name} — InstantList`;
        document.getElementById('itemTitle').textContent = name;

        const picUrl = this.resourceUrl(-item.MRId);
        const desc = this.description();

        const rows = [
            ['ID', plain(item.Id)],
            ['Название', withId(escapeHtml(name), item.TRId)],
        ];
        // Описание есть примерно у 8% вещей (магия, шоу, домики, клубы,
        // спутники) — у остальных строку не показываем.
        if (desc) rows.push(['Описание', withId(textHtml(desc), item.DescTRId)]);

        rows.push(['Тип', formatFieldValue('GoodTypeId', item.GoodTypeId)],
                  ['Теги', renderTags(item.Tags)]);

        // Цену показываем только в той валюте, в которой она реально задана:
        // -1 означает «не продаётся», 0 — «продаётся, но за другую валюту».
        if (item.UsualTickets > 0) rows.push(['Смешинки', plain(item.UsualTickets)]);
        if (item.MagicTickets > 0) rows.push(['Румбики', plain(item.MagicTickets)]);

        rows.push(['Дата добавления', escapeHtml(formatDate(item.PublishDate))],
                  ['RoleFlags', plain(item.RoleFlags)],
                  ['Активна', formatFieldValue('IsActive', item.IsActive)],
                  ['Требуемый уровень', plain(item.LevelThreshold)]);

        if (item.ItemCount > 0) rows.push(['Количество в наборе', plain(item.ItemCount)]);

        // Иконка лежит по положительному IconMRId — в отличие от превью,
        // которое хранится по отрицательному MRId.
        rows.push(['Слой (LayerId)', plain(item.LayerId)],
                  ['SWF-файл', withId(this.resourceLink(item.MRId), item.MRId)],
                  ['Превью', this.resourceLink(-item.MRId)]);
        if (item.IconMRId !== undefined) {
            rows.push(['Иконка', withId(this.resourceLink(item.IconMRId), item.IconMRId)]);
        }

        document.getElementById('itemContent').innerHTML = `
            <div class="item-layout">
                <div class="item-figure">
                    ${picUrl ? `<img src="${picUrl}" alt="${escapeHtml(name)}">`
                             : '<span class="muted small">Нет превью</span>'}
                </div>
                <div class="item-facts table-wrap">
                    <table class="table table-kv">
                        <tbody>
                            ${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td class="break">${v}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    // Один и тот же ресурс делят разные вещи: варианты одной магии, наборы
    // из нескольких предметов, одинаковые вещи для мальчиков и девочек.
    findRelated() {
        const mrid = this.item.MRId;
        if (mrid === undefined) return [];
        const related = [];
        for (const other of Object.values(g)) {
            if (other.MRId === mrid && other.Id !== this.item.Id) {
                related.push(other);
            }
        }
        return related.sort((a, b) => a.Id - b.Id);
    }

    renderRelated() {
        const related = this.findRelated();
        if (related.length === 0) return;

        const rows = related.map((other) => {
            const t = tr[other.TRId];
            const pic = this.resourceUrl(-other.MRId);
            return `<tr>
                <td>${pic ? `<img src="${pic}" class="related-preview" alt="">` : ''}</td>
                <td class="nowrap mono muted">${escapeHtml(other.Id)}</td>
                <td><a href="./item.html?id=${other.Id}" class="link">${escapeHtml(t ? t.H : 'Без названия')}</a></td>
                <td>${formatFieldValue('GoodTypeId', other.GoodTypeId)}</td>
                <td class="nowrap muted">${escapeHtml(formatDate(other.PublishDate))}</td>
            </tr>`;
        }).join('');

        document.getElementById('relatedHolder').innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th></th><th>ID</th><th>Название</th><th>Тип</th><th>Дата добавления</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        document.getElementById('relatedBlock').classList.remove('hidden');
    }

    async renderHistory() {
        const holder = document.getElementById('historyHolder');
        let index, bucket;
        try {
            await this.loadScript(`${HISTORY_DIR}/index.js`);
            index = window.INSTANTLIST_HISTORY_INDEX;
            const b = ((this.id % index.buckets) + index.buckets) % index.buckets;
            await this.loadScript(`${HISTORY_DIR}/h${b}.js`);
            bucket = (window.INSTANTLIST_HISTORY || {})[b] || {};
        } catch (e) {
            holder.innerHTML = '<div class="callout"><p>История правок недоступна: не удалось загрузить файлы истории.</p></div>';
            return;
        }

        this.dates = index.dates;
        this.fields = index.fields || {};
        this.events = (bucket[this.id] || []).slice().reverse();

        if (this.events.length === 0) {
            holder.innerHTML = '<div class="callout"><p>Правок в архиве не найдено.</p></div>';
            return;
        }

        document.getElementById('historyFilter').addEventListener('change', () => this.drawHistory());
        this.drawHistory();
    }

    drawHistory() {
        const filter = document.getElementById('historyFilter').value;
        const holder = document.getElementById('historyHolder');
        const rows = this.events.filter((e) => filter === 'all' || eventGroups[e[1]] === filter);

        if (rows.length === 0) {
            holder.innerHTML = '<div class="callout"><p>Для выбранного фильтра правок нет.</p></div>';
            return;
        }

        const body = rows.map((e) => {
            const [dateIdx, type, key, before, after] = e;
            const isFirst = dateIdx === 0 && type === 'added';
            let what;
            let hint = '';

            if (type === 'field') {
                what = this.fields[key] || key;
                hint = escapeHtml(key);
            } else {
                what = isFirst ? 'Первое известное состояние' : (eventTitles[type] || type);
                // Служебное имя поля есть только у названия и описания;
                // у файловых событий подписывать нечего.
                if (type === 'name') hint = 'TRId';
                else if (type === 'desc') hint = 'DescTRId';
            }

            let beforeCell = '—';
            let afterCell = '—';
            if (type === 'field' && (key === 'TRId' || key === 'DescTRId')) {
                // Шестым элементом лежат надписи на момент правки: один и тот
                // же trid со временем мог указывать на разный текст.
                const texts = e[5] || [];
                beforeCell = withText(before, texts[0]);
                afterCell = withText(after, texts[1]);
            } else if (type === 'field') {
                beforeCell = formatFieldValue(key, before);
                afterCell = formatFieldValue(key, after);
            } else if (type === 'name' || type === 'desc') {
                beforeCell = before ? withId(textHtml(before), key) : '—';
                afterCell = after ? withId(textHtml(after), key) : '—';
            } else if (type === 'swf' || type === 'pic' || type === 'icon') {
                beforeCell = before ? `<code>${escapeHtml(before)}</code>` : '<span class="muted">не было</span>';
                afterCell = after ? `<code>${escapeHtml(after)}</code>` : '—';
            }

            return `<tr>
                <td class="nowrap muted">${escapeHtml(formatDate(this.dates[dateIdx]))}</td>
                <td>${escapeHtml(what)}${hint ? `<div class="small muted break mono">${hint}</div>` : ''}</td>
                <td class="break">${beforeCell}</td>
                <td class="break">${afterCell}</td>
            </tr>`;
        }).join('');

        holder.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Дата</th><th>Изменение</th><th>До</th><th>После</th></tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ItemPage(window.config).start();
});
