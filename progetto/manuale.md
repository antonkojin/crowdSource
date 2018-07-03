# Dipendenze
Installare i seguenti software seguendo le relative guide
- [Docker](https://www.docker.com/community-edition)
- [Docker compose](https://docs.docker.com/compose/install)

# Struttura
```
- docker-compose.yml: startup directives
- db
  - sql: schema, funzioni e dati
  - Dockerfile
- web
  - webapp
    - routes: endpoints
    - lib/db.js: interfaccia database
    - views: mustache views
    - scss: scss files
    - keys: SSL keys
    - public
      - js: client side javascript
      - css: librerie esterne
      - img: risorse grafiche
  - Dockerfile
```

# Avvio
## Configurazione
Dopo esservi procurato un certificato SSL/TLS, copiatelo nella cartella `[application_folder]/web/webapp/keys`. E' necessario per una comunicazione sicura attraverso HTTPS.

## Avvio
All'interno della cartella contenente l'applicazione eseguire il seguente comando:
```sh
docker-compose up
```
## Account amministratore
Per confermare la registrazione dei requester, e' necessario collegarsi alla pagina `[domain]/admin` ed eseguire il login con la password predefinita `0`. Successivamente al login sara' possibile cambiare la password dell'amministratore.
