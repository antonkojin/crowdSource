#!/usr/bin/env python3

from datetime import datetime
from datetime import timedelta

config = {
    'majority_threshold': 1,
    'workers_per_task': 2,
    'apply_end': (datetime.today() + timedelta(days=30)).isoformat()[:-7],
    'start': datetime.today().isoformat()[:-7],
    'end': (datetime.today() + timedelta(days=30)).isoformat()[:-7],
    'tasks_number': 20,
    'keyword_length': 6,
    'keywords_number': 100,
    'default_keyword': 'music'
  }

import requests
from pyquery import PyQuery as pq
session = requests.Session()

def random_string(n, spaces=False):
  import random
  import string
  domain = string.ascii_lowercase
  if spaces:
    domain = domain + ' '
  return ''.join(random.choice(domain) for _ in range(n))

def request(method, url, data=None, json=None):
  res = session.request(method, 'http://localhost/' + url, data=data, json=json)
  res.raise_for_status()
  return res

def signup():
  request('POST', 'signup', {
    'email': email,
    'password':password,
    'user':'requester'
  })

def login():
  request('POST', 'requester/login', {
    'email': email,
    'password':password
  })

def create_campaign():
  import random
  campaign = {
    'name': random_string(9),
    'majority_threshold': config['majority_threshold'],
    'workers_per_task': config['workers_per_task'],
    'apply_end': config['apply_end'],
    'start': config['start'],
    'end': config['end'],
    'tasks': [
      {
        'title': random_string(10, True),
        'context': random_string(40, True),
        'choices': [
          {
            'name': random_string(4),
            'value': random_string(3)
          } for _ in range(random.randint(2,4))
        ],
        'keywords': list(set([random_string(config['keyword_length']) for _ in range(config['keywords_number'])])) + [config['default_keyword']]
      }
      for _ in range(config['tasks_number'])
    ]
  }
  start_time = datetime.now()
  print('request start')
  request('POST', 'requester/new-campaign', json=campaign)
  print('request time:', datetime.now() - start_time)

email = random_string(9) + '@' + random_string(9) + '.' + random_string(3)
print('email:', email)
password = '0'
print('password:', password)
from pprint import pprint as pp
# pp(confisg)

signup()
login()
create_campaign()
