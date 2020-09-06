[In English](README.en.md)

# Oodi++

Oodi++ on [userscript][userscript] WebOodiin. Se lisää tehokkaan lukujärjestysnäkymän, jossa voit valita luentoja
ja muita opetustapahtumia ja seurata reaaliajassa lukujärjestyksen täyttymistä. Valmiin lukujärjestyksen voit viedä
iCalendar-muodossa useimpiin kalenterisovelluksiin.

Mahdollisia ominaisuuksia tulevaisuudessa:

- Valmiin lukujärjestyksen tulostaminen
- Kurssivalintojen synkronointi: voit muokata valintoja eri laitteilla ja ne päivittyvät automaattisesti myös kalenterisovelluksiin

## Asennus

Oodi++:n käyttöön tarvitset userscript-lisäosan kuten Tampermonkey. Lataa se ensin [Firefoxille][tm-ff] tai [Chromelle][tm-chrome].

Tämän jälkeen lataa itse userscript. Se on saatavilla kolmena versiona:

- [Automaattipäivittyvä versio](oodiplusplus.autoupdate.user.js) päivittyy itsestään Tampermonkeyn kautta.
- [Automaattitarkistava versio](oodiplusplus.autocheck.user.js) tarkistaa automaattisesti päivitykset,
  mutta ei suorita koodia verkosta. Valitse tämä vaihtoehto, jos haluat lukea koodin läpi ja varmistua, ettei
  koodiin tehdä muutoksia huomaamattasi.
- [Foliohattuversio](oodiplusplus.folio.user.js) ei tee mitään verkkopyyntöjä. Koska joku kuitenkin pyytää tätä.

Skriptin dependencyinä ovat [Preact][preact] ja [jQuery][jquery], jotka sisältyvät tiedostoon. Jos haluat tarkistaa
niiden minifioidut lähdekoodit, kyseiset tiedostot ovat [preact.module.js], [hooks.module.js] ja [jquery.slim.min.js].

## Buildaus

Alkuperäinen lähdekoodi on saatavilla [GitLabissa][gitlab] MIT-lisenssillä. Se käyttää buildaukseen Webpackia ja TypeScriptiä,
mutta konfiguraation tavoitteena on maksimoida lopputuloksen luettavuus.

Vakaa versio löytyy branchista `stable`. Branchissa `master` on uusin kehitysversio, joka saattaa olla epävakaa.
Buildataksesi userscriptit suorita komennot `npm install` ja `make` (vaatii normaalin *nix-ympäristön sekä suhteellisen tuoreen Node.js:n).

[userscript]: https://en.wikipedia.org/wiki/Userscript
[tm-ff]: https://addons.mozilla.org/fi/firefox/addon/tampermonkey/
[tm-chrome]: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
[gitlab]: https://gitlab.com/PurkkaKoodari/oodiplusplus
[preact]: https://preactjs.com/
[jquery]: https://jquery.com/
[preact.module.js]: https://unpkg.com/preact@latest?module
[hooks.module.js]: https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module
[jquery.slim.min.js]: https://code.jquery.com/jquery-3.5.1.slim.min.js
