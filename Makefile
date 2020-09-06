SOURCES=$(wildcard src/*.ts src/*.tsx)
OUTPUTS=oodiplusplus.autoupdate.user.js oodiplusplus.autocheck.user.js oodiplusplus.folio.user.js
WEBPACK=node_modules/.bin/webpack

userscripts: $(OUTPUTS)

$(OUTPUTS) &: $(SOURCES) tsconfig.json webpack.config.js
	$(WEBPACK)

website: userscripts index.html index.en.html

index.html: README.md.html index.header.html index.footer.html
	cat index.header.html $< index.footer.html > $@
	sed -i -e s/README.en.md/index.en.html/ $@

index.en.html: README.en.md.html
	cat index.header.html $< index.footer.html > $@
	sed -i -e s/README.md/index.html/ $@

%.md.html: %.md
	markdown $< > $@

clean:
	rm -f *.user.js index.html index.en.html *.md.html

.PHONY: clean userscripts website
