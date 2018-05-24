#!/usr/bin/env python3

import requests
from pyquery import PyQuery as pq
session = requests.Session()

def random_string(n):
  import random
  import string
  return ''.join(random.choice(string.ascii_lowercase) for _ in range(n))

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
  from datetime import datetime
  import random
  campaign = {
    'name': random_string(9),
    'majority_threshold': 9,
    'workers_per_task': 99,
    'apply_end': datetime.today().isoformat()[:-7],
    'start': datetime.today().isoformat()[:-7],
    'end': datetime.today().isoformat()[:-7],
    'tasks': [
      {
        'title': random_string(10),
        'context': random_string(40),
        'choices': [
          {
            'name': random_string(4),
            'value': random_string(3)
          } for _ in range(random.randint(2,4))
        ],
        'keywords': [random_string(3) for _ in range(20)]
      }
      for _ in range(50)
    ]
  }
  request('POST', 'requester/new-campaign', json=campaign)

email = random_string(9) + '@' + random_string(9) + '.' + random_string(3)
print('email:', email)
password = random_string(10)
print('password:', password)

signup()
login()
create_campaign()
