import re
import settings

class Good:
    def __init__(self, id, text, swf, pic):
        self.id = id
        self.text = text.replace("\"", "")
        self.swf = swf
        self.pic = pic

def parse(resource_file, goods_file):

    goods = []

    item = re.compile('g\[(.*)\] = {Id:(.*)};')
    resOpen = open(settings.goods_file, "r+")
    resRead = resOpen.read()
    resOpen.close()
    mrOpen = open(settings.resource_file, encoding="utf8")
    mrRead = mrOpen.read()
    mrOpen.close()
    resStrings = resRead.split("\n")

    for strs in resStrings:

        text = "Без названия"
        swf = ""
        pic = ""

        dwnlfile = re.findall(item, strs)
        damn = dwnlfile[0][1].split(",")
        _id = dwnlfile[0][0]
        if 'TRId:' in dwnlfile[0][1]:
            resTr = re.compile('tr\['+damn[2].replace("TRId:", "")+'\] = {H:(.*)};')
            dwnlfile1 = re.findall(resTr, mrRead)
            if (len(dwnlfile1) != 0):
                    text = dwnlfile1[0]

        if 'MRId:' in dwnlfile[0][1]:
            resMr = re.compile('mr\[-'+damn[1].replace("MRId:", "")+'\] = {TId:(.*),Url:"(.*)",V:(.*)};')
            dwnlfile2 = re.findall(resMr, mrRead)
            if (len(dwnlfile2) != 0):
                pic = "http://sharaball.ru/fs/" + dwnlfile2[0][1]

        if 'MRId:' in dwnlfile[0][1]:
            resMr = re.compile('mr\['+damn[1].replace("MRId:", "")+'\] = {TId:(.*),Url:"(.*)",V:(.*)};')
            dwnlfile2 = re.findall(resMr, mrRead)
            if (len(dwnlfile2) != 0):
                swf = dwnlfile2[0][1]

        g = Good(_id, text, swf, pic)
        goods.append(g)

    return goods

