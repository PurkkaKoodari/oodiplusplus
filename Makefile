MAINFILES=src/classes.js src/locales.js src/init.js src/styles.js src/ical.js src/sidebar.js src/schedule.js src/opettaptied.js src/settings.js src/footer.js
VERSION=0.2.2

userscripts: oodiplusplus.autoupdate.user.js oodiplusplus.autocheck.user.js oodiplusplus.folio.user.js

website: userscripts index.html index.en.html

index.html: README.md.html index.header.html index.footer.html
	cat index.header.html $< index.footer.html > $@
	sed -i -e s/README.en.md/index.en.html/ $@

index.en.html: README.en.md.html
	cat index.header.html $< index.footer.html > $@
	sed -i -e s/README.md/index.html/ $@

%.md.html: %.md
	markdown $< > $@

oodiplusplus.%.user.js: $(MAINFILES) src/header.%.js
	cat src/header.$*.js $(MAINFILES) > $@
	sed -i -e s/__VERSION__/$(VERSION)/ $@

clean:
	rm -f *.user.js index.html index.en.html *.md.html

.PHONY: clean userscripts website
