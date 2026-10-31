# Crypto Oefenlab

Een statische Nederlandstalige crypto-oefenapp. Je gebruikt uitsluitend fictief saldo en willekeurig gegenereerde koersen.

## Functies
- Start met €300 fictief saldo.
- Fictieve koersen voor BTC, ETH, SOL, ADA en SUI.
- Koop- en verkoopsimulatie met 0,2% oefentransactiekosten.
- Automatische nep-live koersbewegingen.
- Tijd vooruitspoelen met 1, 7 of 30 dagen (maximaal dag 30).
- Portefeuilleoverzicht, resultaat, transactielogboek en groeimijlpalen.
- Opslag in de lokale browser (`localStorage`).

## Lokaal openen
Download en pak de ZIP uit. Open `index.html` in een moderne browser. Er is geen installatie, server of API-sleutel nodig.

## Publiceren via GitHub Pages
1. Maak op GitHub een nieuwe repository, bijvoorbeeld `crypto-oefenlab`.
2. Upload de bestanden uit deze map naar de hoofdmap van de repository.
3. Open **Settings → Pages**.
4. Kies **Deploy from a branch**, selecteer `main` en `/ (root)`, en sla op.
5. GitHub geeft je een publieke website-URL.

## Publiceren via Cloudflare Pages
1. Maak een Cloudflare-account en open **Workers & Pages → Create → Pages**.
2. Koppel je GitHub-account en kies deze repository.
3. Framework preset: **None**.
4. Build command: leeg laten.
5. Build output directory: `/` of `.` (de repository-root).
6. Klik op **Save and Deploy**.

## Eigen domein koppelen
- Voeg je domein toe aan Cloudflare en volg de DNS-instructies.
- Open je Pages-project → **Custom domains** → **Set up a custom domain**.
- Vul je domein of subdomein in, bijvoorbeeld `oefenlab.jouwdomein.nl`.
- Volg de DNS-stappen die Cloudflare toont.

## Belangrijk
Dit is nadrukkelijk een educatieve simulatie:
- Koersen zijn synthetisch en niet afkomstig van Bitvavo, exchanges of een live markt.
- Er worden geen echte crypto's gekocht of verkocht.
- De app geeft geen financieel advies.
- Gegevens worden alleen lokaal in de browser bewaard. Een andere browser of apparaat heeft een eigen lege portefeuille.
- Gebruik voor een openbare versie geen echte persoonsgegevens of betaalgegevens.

## Aanpassen
- Munten en startkoersen staan bovenaan in `app.js`, in de array `coins`.
- Startbedrag staat in `START`.
- Simulatiekosten staan in `FEE`.
- Kleuren, indeling en typografie staan in `style.css`.
