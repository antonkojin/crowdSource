FROM postgres

COPY sql/ /docker-entrypoint-initdb.d/
COPY . /code/
CMD ["postgres"]
