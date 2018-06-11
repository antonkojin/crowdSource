#!/usr/bin/env python3

inputKeyword = 'mus'

import requests
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

def suggestions():
  response = request('GET', 'requester/keywords/suggestions/{}'.format(inputKeyword))
  from pprint import pprint as pp
  pp(response.json())

email = random_string(9) + '@' + random_string(9) + '.' + random_string(3)
print('email:', email)
password = '0'
print('password:', password)

signup()
login()
suggestions()
