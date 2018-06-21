# Dipendenze
Installare i seguenti software seguendo le relative guide
- [Docker](https://www.docker.com/community-edition)
- [Docker compose](https://docs.docker.com/compose/install)

# Avvio
## Configurazione
Dopo esservi procurato un certificato SSL/TLS, copiatelo nella cartella `[application_folder]/web/webapp/keys`. E' necessario per una comunicazione sicura attraverso HTTPS.

## Avvio
All'interno della cartella contenente l'applicazione eseguire il seguente comando:
```sh
docker-compose up
```

