#!/usr/bin/env python3

import requests
from pyquery import PyQuery as pq
session = requests.Session()

def random_string(n):
  import random
  import string
  return ''.join(random.choice(string.ascii_lowercase) for _ in range(n))

def request(method, url, data=None):
  res = session.request(method, 'http://localhost/' + url, data=data)
  res.raise_for_status()
  return res

def signup():
  request('POST', 'signup', {
    'email': email,
    'password':password,
    'user':'worker'
  })

def login():
  request('POST', 'worker/login', {
    'email': email,
    'password':password,
    'user':'worker'
  })

def applyCampaignsAndAnswerTasks():
  appliable_campaigns = [b.get('data-campaign-id') for b in pq(request('GET', 'worker/campaigns').text)('#appliable-campaigns button')]
  if len(appliable_campaigns) == 0:
    print('no appliable campaigns')
    return
  counter = 0
  for campaign_id in appliable_campaigns:
    request('post', 'worker/campaigns/apply/{}'.format(campaign_id))
    print('applied to campaign {}'.format(campaign_id))
    q2 = pq(request('GET', 'worker/campaign/{}/task'.format(campaign_id)).text)
    while(q2('#body form')):
      action = q2('#body form')[0].get('action')
      start = action.find('task')
      task_id = action[start+5:-7]
      choices = [r.get('value') for r in q2('#task-choices input')]
      from random import choice as random_choice
      choice = random_choice(choices)
      request(
        'POST',
        'worker/campaign/{}/task/{}/choice'.format(campaign_id, task_id),
        {'choice': choice}
      )
      q2 = pq(request('GET', 'worker/campaign/{}/task'.format(campaign_id)).text)
      counter = counter + 1
      print('worker: {} count: {} campaign: {} task: {}'.format(email, counter, campaign_id, task_id))
    print('no more tasks for campaign {}'.format(campaign_id))
      

  
email = random_string(9) + '@' + random_string(9) + '.' + random_string(3)
print('email:', email)
password = '0'
print('password:', password)

signup()
login()
applyCampaignsAndAnswerTasks()
