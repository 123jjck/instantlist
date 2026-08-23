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
    return `${html} <span class="text-muted small">(${escapeHtml(value)})</span>`;
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
    return tagsString.split(',').map((tag) => {
        const id = tag.trim();
        if (!id) return '';
        return `<span class="badge bg-secondary me-1">${escapeHtml(tagsMap[id] || id)}</span>`;
    }).join('');
}

// Значения полей вещи в человекочитаемом виде — используется и в карточке,
// и в колонках «До»/«После» таблицы истории.
function formatFieldValue(field, value) {
    if (value === undefined || value === null || value === '') return '—';
    switch (field) {
        case 'GoodTypeId': return goodTypeMap[value]
            ? `${escapeHtml(goodTypeMap[value])} <span class="text-muted">(${escapeHtml(value)})</span>`
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
    const label = text ? textHtml(text) : '<span class="text-muted">нет в базе текстов</span>';
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
            `<div class="alert alert-warning">${escapeHtml(message)}</div>`;
        document.getElementById('relatedBlock').classList.add('d-none');
        document.getElementById('historyBlock').classList.add('d-none');
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
            ? `<a href="${url}" target="_blank" class="text-decoration-none">${escapeHtml(mr[mrid].Url)}</a>`
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
            <div class="row g-4">
                <div class="col-12 col-md-4 col-lg-3 text-center">
                    ${picUrl ? `<img src="${picUrl}" class="img-fluid item-preview" alt="${escapeHtml(name)}">`
                             : '<div class="text-muted">Нет превью</div>'}
                </div>
                <div class="col-12 col-md-8 col-lg-9">
                    <table class="table table-striped table-borderless mb-0 item-details">
                        <tbody>
                            ${rows.map(([k, v]) => `<tr><th class="w-25">${k}</th><td>${v}</td></tr>`).join('')}
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
                <td class="text-nowrap">${escapeHtml(other.Id)}</td>
                <td><a href="./item.html?id=${other.Id}" class="text-decoration-none">${escapeHtml(t ? t.H : 'Без названия')}</a></td>
                <td>${formatFieldValue('GoodTypeId', other.GoodTypeId)}</td>
                <td class="text-nowrap">${escapeHtml(formatDate(other.PublishDate))}</td>
            </tr>`;
        }).join('');

        document.getElementById('relatedHolder').innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-borderless align-middle">
                    <thead><tr><th></th><th>ID</th><th>Название</th><th>Тип</th><th>Дата добавления</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        document.getElementById('relatedBlock').classList.remove('d-none');
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
            holder.innerHTML = '<div class="alert alert-secondary mb-0">История правок недоступна: не удалось загрузить файлы истории.</div>';
            return;
        }

        this.dates = index.dates;
        this.fields = index.fields || {};
        this.events = (bucket[this.id] || []).slice().reverse();

        if (this.events.length === 0) {
            holder.innerHTML = '<div class="alert alert-secondary mb-0">Правок в архиве не найдено.</div>';
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
            holder.innerHTML = '<div class="alert alert-secondary mb-0">Для выбранного фильтра правок нет.</div>';
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
                beforeCell = before ? `<code>${escapeHtml(before)}</code>` : '<span class="text-muted">не было</span>';
                afterCell = after ? `<code>${escapeHtml(after)}</code>` : '—';
            }

            return `<tr>
                <td class="text-nowrap">${escapeHtml(formatDate(this.dates[dateIdx]))}</td>
                <td>${escapeHtml(what)}${hint ? `<div class="small text-muted text-break">${hint}</div>` : ''}</td>
                <td class="text-break">${beforeCell}</td>
                <td class="text-break">${afterCell}</td>
            </tr>`;
        }).join('');

        holder.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-borderless align-middle">
                    <thead><tr><th>Дата</th><th>Изменение</th><th>До</th><th>После</th></tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ItemPage(window.config).start();
});
