curl -X POST \
  http://localhost/login \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=a%40b.c&password=a'