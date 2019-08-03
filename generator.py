from jinja2 import Environment, PackageLoader, select_autoescape

env = Environment(
		loader=PackageLoader('__main__', 'templates'),
		autoescape=select_autoescape(['html'])
	)

def tpl_to_html(tpl_name, data, output_folder, output_file):
	tpl = env.get_template('{}.html'.format(tpl_name))
	rendered = tpl.render(data)

	f = open("{}/{}.html".format(output_folder, output_file), "wb")
	f.write(rendered.encode('utf-8'))
	f.close()

