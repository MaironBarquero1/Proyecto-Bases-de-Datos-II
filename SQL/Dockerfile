FROM mysql:8.4

ENV MYSQL_ROOT_PASSWORD=MiClaveSegura123*
ENV MYSQL_DATABASE=SGID_LogiChain

COPY SQL.sql /docker-entrypoint-initdb.d/01_SQL.sql
