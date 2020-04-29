CSS = flip-clock.css
SCSS = flip-clock.scss

default: $(CSS)

publish:
	ssh dse@webonastick.com "bash -c 'cd /www/webonastick.com/htdocs/c && git checkout -- . && git pull && npm install'"

test:
	rsync -r -l -v -c -C --exclude=node_modules ./ dse@webonastick.com:/www/webonastick.com/htdocs/c/

%.css: scss/%.scss scss/_*.scss Makefile
	sassc $< > $@.tmp.css
	mv $@.tmp.css $@

images/grain.png:
	~/git/dse.d/pnggrain/bin/pnggrain -m 0 -M 63 -T 43 -W 256 -H 256 images/grain.png
.PHONY: images/grain.png
