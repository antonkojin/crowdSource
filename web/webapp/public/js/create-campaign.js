const createCampaign = (() => {
  var tasks = [];

  const removeTask = (tableRow) => {
    const removeTaskName = tableRow.children[0].innerText;
    console.log({removeTaskName});
    tasks = tasks.filter(t => !(t.title == removeTaskName));
    renderTasks(tasks);
  };

  const renderTasks = (tasks) => {
    const htmlTasksList = document.querySelector('table#tasks-list > tbody');
    htmlTasksList.innerHTML = tasks.map(task => `
      <tr>
        <td>${task.title}</td>
        <td style="text-align: right"><button onclick="createCampaign.removeTask(this.parentNode.parentNode)" class="button-remove-task">Remove</button></td>
      </tr>
    `).join('\n');
  }; 

  const addTask = (event) => {
    const taskFormValid = document.getElementById('new-task-form').reportValidity();
    if (!taskFormValid) return;
    const taskChoices = document.getElementById('new-task-choices')
      .value
      .replace(/\s/g, '')
      .split(',')
      .map(choiceString => {
        const nameValue = choiceString.split(':');
        return {
          name: nameValue[0],
          value: nameValue[1]
        };
      });
    const taskKeywords = document.getElementById('new-task-keywords')
      .value
      .replace(/\s/g, '')
      .split(',');
    const task = {
      title: document.getElementById('new-task-title').value,
      context: document.getElementById('new-task-context').value,
      choices: taskChoices,
      keywords: taskKeywords,
    };
    console.log(task);
    tasks.push(task);
    document.getElementById('new-task-form').reset();
    document.querySelector('#new-task-modal-background').style.display = 'none';
    renderTasks(tasks);
    event.preventDefault();
  };

  const createCampaign = (event) => {
    const formValid = document.getElementById('campaign-form').reportValidity();
    if (!formValid) return;
    if (tasks.length <= 0) {
      window.alert('Insert tasks');
      return;
    }
    const campaign = {
      name: document.getElementById('campaign-name').value,
      majority_threshold: document.getElementById('campaign-majority-threshold').value,
      workers_per_task: document.getElementById('campaign-workers-per-task').value,
      apply_end: document.getElementById('campaign-apply-end').value,
      start: document.getElementById('campaign-start').value,
      end: document.getElementById('campaign-end').value,
      tasks: tasks
    };
    console.log(campaign);

    fetch('/requester/new-campaign', {
      body: JSON.stringify(campaign),
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST'
    })
      .then(response => {
        if (response.status == 200) {
          window.location = 'campaigns';
        } else {
          window.alert('You did a mistake');
        }
      })
      .catch(error => console.log(error));
    event.preventDefault();
  };

  const newTaskModalOpen = (event) => {
    document.querySelector('#new-task-modal-background').style.display = 'block';
    document.querySelector('#new-task-title').focus();
    event.preventDefault();
  };

  const init = () => {
    const addTaskButton = document.getElementById('add-task-button');
    addTaskButton.onclick = addTask;
    const newTaskButton = document.getElementById('new-task-button');
    newTaskButton.onclick = newTaskModalOpen;
    document.getElementById('close-new-task-button').onclick = (e) => {
      document.getElementById('new-task-form').reset();
      document.querySelector('#new-task-modal-background').style.display = 'none';
      e.preventDefault();
    };
    
    const start = new Date().toISOString().slice(0, -8);
    const end = new Date(new Date().getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString().slice(0, -8);
    document.querySelector('#campaign-start').value = start;
    document.querySelector('#campaign-end').value = end;
    document.querySelector('#campaign-apply-end').value = end;
    const createCampaignButton = document.getElementById('create-campaign-button');
    createCampaignButton.onclick = createCampaign;

    const keywordsInput = document.querySelector('#new-task-keywords');
    const awesomelete = new Awesomplete(keywordsInput, {
      filter: (text, input) => {
        return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
      },
      item: (text, input) => {
        return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
      },
      replace: function(text) {
        var before = this.input.value.match(/^.+,\s*|/)[0];
        this.input.value = before + text + ', ';
      }
    });
    keywordsInput.addEventListener('input', () => {
      const item = keywordsInput.value.match(/[^,]*$/)[0].trim();
      fetch(`/keywords/suggestions/${item}`, {
        method: 'GET',
      }).then(resp => resp.json())
        .then(keywords => {
          awesomelete.list = keywords;
          awesomelete.evaluate();
        });
    }, false);
    
  };

  return {
    init,
    renderTasks,
    removeTask
  };
})();

document.addEventListener('DOMContentLoaded', createCampaign.init, false);