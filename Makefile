MAINFILES=src/init.js src/classes.js src/styles.js src/locales.js src/sidebar.js src/schedule.js src/opettaptied.js
VERSION=0.1

all: oodiplusplus.autoupdate.user.js oodiplusplus.autocheck.user.js oodiplusplus.folio.user.js

oodiplusplus.%.user.js: $(MAINFILES) src/header.%.js
	cat src/header.$*.js $(MAINFILES) > $@
	sed -i -e s/__VERSION__/$(VERSION)/ $@

clean:
	rm *.user.js

.PHONY: clean
