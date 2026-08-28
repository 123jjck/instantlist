# InstantList JS
Быстрый, удобный и простой в установке список вещей для вашего сайта. Теперь на [sashimi UI](https://yuto-hasegawa.github.io/sashimi-ui/)!

## Демо:
* [Только одежда](https://123jjck.github.io/instantlist "Только одежда")
* [Все вещи](https://123jjck.github.io/instantlist/all_items.html "Все вещи")

## Установка:
 1. Переместите файлы репозитория в папку /items/ на вашем веб-сервере
 2. Готово!

## Стили
Интерфейс собран на [sashimi UI](https://github.com/yuto-hasegawa/sashimi-ui) 2.1.0 (MIT) —
минимальном CSS-фреймворке без JavaScript, который стилизует нативные HTML-элементы.

* `static/sashimi.css` — сборка `dist/css/bundle.css` из npm-пакета `sashimi-ui`,
  подключается как есть; обновляется заменой файла.
* `static/style.css` — всё наше: токены темы (включая ручное переключение
  светлая/тёмная через `<html data-theme>`), шапка, пагинация, тосты и мелочи
  страниц. Фреймворк не трогаем, чтобы его можно было обновлять.

Модальные окна — нативный `<dialog>`, никакого JS-фреймворка не требуется.
