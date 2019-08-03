$("#instantlist_search").keypress(function(e) {
	if (e.which == 13) {
		location.href = "./search.html#" + encodeURIComponent($("#instantlist_search").val());
	}
});


if (location.pathname.indexOf("search") > -1)  {
	$.getJSON("data.json", function(data){
		window['instantlist_data'] = data;
		rerender();
		window.onhashchange = rerender;	
	});
}

function rerender() {
	var html = "";
	var query = decodeURIComponent(location.hash.replace("#", ""));
	$("#instantlist_search").val(query);
	console.log(query)
	var data = window['instantlist_data'];
		for (var i in data) {
			if (data[i].text.toLowerCase().replace('ё', 'е').replace("'", "\"").indexOf(query.toLowerCase().replace('ё', 'е').replace("'", "\"")) > -1) {
				var id = data[i].id
				var text = data[i].text
				var pic = data[i].pic
				var swf = data[i].swf
				console.log(text)
				html += "<tr><td>" + id + "</td>" +
				"<td>" + text + "</td>" + 
				"<td><img width=\"130\" src=\"" + pic + "\"/> </td>" + 
				"<td><a href=\"https://sharaball.ru/fs/" + swf + "\">" + swf + "</a></td></tr>"; 
			}
		}
		if (html == "") {
			html = "<h1> К сожалению, мы ничего не нашли! </h1>";
		}
	$("tbody").html(html);
}