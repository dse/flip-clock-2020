CSS = flip-clock.css
SCSS = flip-clock.scss

default: $(CSS)

publish:
	ssh dse@webonastick.com "bash -c 'cd /www/webonastick.com/htdocs/c && git checkout -- . && git pull && npm install'"

test:
	rsync -r -l -v -c -C --exclude=node_modules ./ dse@webonastick.com:/www/webonastick.com/htdocs/c/

%.css: scss/%.scss Makefile
	sassc $< > $@.tmp.css
	mv $@.tmp.css $@
