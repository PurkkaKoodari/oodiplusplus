[In English](README.en.md)

# Oodi++

Oodi++ on [userscript][userscript] WebOodiin. Se lisää tehokkaan lukujärjestysnäkymän, jossa voit valita luentoja
ja muita opetustapahtumia ja seurata reaaliajassa lukujärjestyksen täyttymistä.

Mahdollisia ominaisuuksia tulevaisuudessa:

- Valmiin lukujärjestyksen vienti kalenterisovelluksiin ICAL-muodossa
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

## Buildaus

Alkuperäinen lähdekoodi on saatavilla [GitLabissa][gitlab]. Se käyttää buildaukseen Webpackia ja TypeScriptiä, mutta konfiguraation
tavoitteena on maksimoida lopputuloksen luettavuus.

Buildataksesi userscriptit suorita komennot `npm install` ja `make` (vaatii normaalin *nix-ympäristön sekä suhteellisen tuoreen Node.js:n).

[userscript]: https://en.wikipedia.org/wiki/Userscript
[tm-ff]: https://addons.mozilla.org/fi/firefox/addon/tampermonkey/
[tm-chrome]: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
[gitlab]: https://gitlab.com/PurkkaKoodari/oodiplusplus
