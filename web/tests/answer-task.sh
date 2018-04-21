curl --include -X POST \
  http://localhost/worker/campaign/1/task/1/choice \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'choice=0'
echo
