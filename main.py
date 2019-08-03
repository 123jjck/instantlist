import parse
import math
import generator
import jsonpickle
import settings

def main():
	output_folder = settings.output_folder
	goods_file = settings.goods_file
	resources_file = settings.resources_file
	per_page = settings.per_page

	version = "1.0"

	print('===========')
	print('InstantList')
	print('===========')
	print('')
	print('Parsing files')

	goods = parse.parse(resources_file, goods_file)

	pages_count = math.floor(len(goods) / per_page)

	print("Generating json for search")

	f = open(output_folder + "/data.json", "w")
	f.write(jsonpickle.encode(goods))
	f.close()

	print("Generating pages")

	generator.tpl_to_html("search", {
			"version": version
		}, "output", "search")

	for i in range(0, pages_count):
		name = i
		if i == 0:
			name = "index"
		else:
			name = name + 1
		print('Generating ' + str(name) + '.html')
		
		offset = i
		page = goods[offset * per_page:(offset + 1) * per_page]
		current_page = i

		generator.tpl_to_html("page", {
				"goods": page,
				"current_page": current_page,
				"pages": range(0, pages_count),
				"version": version
			}, "output", name)

	print("Done")

if __name__ == "__main__":
	main()