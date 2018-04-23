const onLoad = (() => {
  var tasks = [];

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
    const htmlTasksList = document.getElementById('tasks-list');
    htmlTasksList.innerHTML = tasks.map(task => `
      <li>
        <p>${task.title}</p>
      </li>
    `).join('\n');
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
        }
      })
      .catch(error => console.log(error));
    event.preventDefault();
  };

  const init = () => {
    const addTaskButton = document.getElementById('add-task-button');
    addTaskButton.onclick = addTask;
    const createCampaignButton = document.getElementById('create-campaign-button');
    createCampaignButton.onclick = createCampaign;
  };

  return init;
})();

document.addEventListener('DOMContentLoaded', onLoad, false);