FROM postgres

COPY init_user_db.sql /docker-entrypoint-initdb.d/0-init_user_db.sql
COPY . /code/
CMD ["postgres"]
