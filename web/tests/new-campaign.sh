curl --include -X POST \
  http://localhost/requester/new-campaign \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -d '{
	"name": "campaign_test",
	"majority_threshold": 1,
	"workers_per_task": 1,
	"start": "2018-10-10 00:00",
	"end": "2018-10-30 00:000",
	"apply_end": "2018-10-05 00:00",
	"tasks":[
		{
			"name": "task test",
			"context": "task context",
			"keywords": ["sentiment analisys, games"],
			"choices": [
				{"name": "positive", "val": 1},
				{"name": "negative", "val": -1},
				{"name": "neutral", "val": 0}
			]
		},
		{
			"name": "task test 2",
			"context": "task context 2",
			"keywords": ["sentiment analysis, music"],
			"choices": [
				{"name": "positive", "val": 1},
				{"name": "negative", "val": -1},
				{"name": "neutral", "val": 0}
			]
		}
	]
}';
echo
